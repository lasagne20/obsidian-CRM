import { TFile } from "obsidian";
import { MyVault } from "Utils/MyVault";
import { parseSVG } from "svg-path-parser";
import * as fs from "fs/promises";
import * as path from "path";
import { XMLParser } from "fast-xml-parser";
import arcToCubic from "svg-arc-to-cubic-bezier";


type SVGShape =
  | { type: "path"; d: string }
  | { type: "circle" | "ellipse"; cx: number; cy: number; rx: number; ry: number };

// 🔍 Extraction de tous les éléments SVG (path, circle, ellipse)
function extractSVGElements(parsed: any): SVGShape[] {
  const shapes: (SVGShape & { color?: string })[] = [];

  function traverse(node: any, parentTag?: string) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(child => traverse(child, parentTag));
      return;
    }

    // Cas <path>
    if (node.d && typeof node.d === "string") {
      shapes.push({
        type: "path",
        d: node.d,
        color: node.stroke || "#000000"
      });
    }

    // Cas <circle>
    if ((node.tagName === "circle" || parentTag === "circle") && node.r && node.cx && node.cy) {
      shapes.push({
        type: "circle",
        cx: parseFloat(node.cx),
        cy: parseFloat(node.cy),
        rx: parseFloat(node.r),
        ry: parseFloat(node.r),
        color: node.stroke || "#000000"
      });
    }

    // Cas <ellipse>
    if ((node.tagName === "ellipse" || parentTag === "ellipse") && node.rx && node.ry && node.cx && node.cy) {
      shapes.push({
        type: "ellipse",
        cx: parseFloat(node.cx),
        cy: parseFloat(node.cy),
        rx: parseFloat(node.rx),
        ry: parseFloat(node.ry),
        color: node.stroke || "#000000"
      });
    }

    for (const key in node) {
      if (node.hasOwnProperty(key)) {
        const value = node[key];
        if (value && typeof value === "object") {
          if (Array.isArray(value)) {
            value.forEach((v) => {
              if (typeof v === "object") v.tagName = key;
            });
          } else {
            value.tagName = key;
          }
        }
        traverse(value, key);
      }
    }
  }

  traverse(parsed);
  return shapes;
}

// 🔁 Convertir un chemin SVG en Vertex/Primitive list (LightBurn)
function commandsToVertPrimLists(commands: any[]) {
  let vertListEntries: string[] = [];
  let primListEntries: string[] = [];

  let idx = 0;
  let firstPointIdx = 0;
  let lastX = 0, lastY = 0;

  const addVertex = (x: number, y: number) => {
    vertListEntries.push(`V${x.toFixed(6)} ${(-y).toFixed(6)}`);
    return idx++;
  };

  for (const cmd of commands) {
    if (cmd.code === "M") {
      firstPointIdx = addVertex(cmd.x, cmd.y);
      lastX = cmd.x;
      lastY = cmd.y;
    } else if (cmd.code === "L") {
      const newIdx = addVertex(cmd.x, cmd.y);
      primListEntries.push(`L${idx - 2} ${newIdx}`);
      lastX = cmd.x;
      lastY = cmd.y;
    } else if (cmd.code === "Z") {
      primListEntries.push(`L${idx - 1} ${firstPointIdx}`);
    } else if (cmd.code === "A") {
      // Approximation des arcs par segments de courbe de Bézier
      const curves = arcToCubic({
        px: lastX,
        py: lastY,
        cx: cmd.x,
        cy: cmd.y,
        rx: cmd.rx,
        ry: cmd.ry,
        xAxisRotation: cmd.xAxisRotation,
        largeArcFlag: cmd.largeArc ? 1 : 0,
        sweepFlag: cmd.sweep ? 1 : 0,
      });

      const steps = 200; // Segments par arc
      for (const curve of curves) {
        const p0 = { x: lastX, y: lastY };
        const p1 = { x: curve.x1, y: curve.y1 };
        const p2 = { x: curve.x2, y: curve.y2 };
        const p3 = { x: curve.x, y: curve.y };

        let prevIdx = addVertex(p0.x, p0.y); // Ajouter le point de départ

        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x = cubicAt(p0.x, p1.x, p2.x, p3.x, t);
            const y = cubicAt(p0.y, p1.y, p2.y, p3.y, t);
            const newIdx = addVertex(x, y);
            primListEntries.push(`L${prevIdx} ${newIdx}`);
            prevIdx = newIdx;
        }

        lastX = p3.x;
        lastY = p3.y;
        }
    }
  }

  return {
    vertList: vertListEntries.join(""),
    primList: primListEntries.join(""),
  };
}

// Bézier cubique - interpolation
function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * p1 +
    3 * mt * t * t * p2 +
    t * t * t * p3
  );
}

function normalizeShapes(shapes: SVGShape[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  // 1️⃣ Trouver la bounding box globale
  for (const shape of shapes) {
    if (shape.type === "path") {
      const commands = parseSVG(shape.d);
      for (const cmd of commands) {
        if ("x" in cmd && "y" in cmd) {
          minX = Math.min(minX, cmd.x);
          minY = Math.min(minY, cmd.y);
          maxX = Math.max(maxX, cmd.x);
          maxY = Math.max(maxY, cmd.y);
        }
      }
    } else if (shape.type === "circle" || shape.type === "ellipse") {
      minX = Math.min(minX, shape.cx - shape.rx);
      minY = Math.min(minY, shape.cy - shape.ry);
      maxX = Math.max(maxX, shape.cx + shape.rx);
      maxY = Math.max(maxY, shape.cy + shape.ry);
    }
  }

  // 2️⃣ Translation pour tout ramener à (0,0)
  const dx = -minX;
  const dy = -minY;

  function commandToString(cmd: any) {
    switch (cmd.code) {
      case 'M':
      case 'L':
      case 'T':
        return `${cmd.code} ${cmd.x} ${cmd.y}`;
      case 'H':
        return `${cmd.code} ${cmd.x}`;
      case 'V':
        return `${cmd.code} ${cmd.y}`;
      case 'C':
        return `${cmd.code} ${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`;
      case 'S':
      case 'Q':
        return `${cmd.code} ${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`;
      case 'A':
        return `${cmd.code} ${cmd.rx} ${cmd.ry} ${cmd.xAxisRotation} ${cmd.largeArc ? 1 : 0} ${cmd.sweep ? 1 : 0} ${cmd.x} ${cmd.y}`;
      case 'Z':
        return 'Z';
      default:
        return '';
    }
  }
  // 3️⃣ Appliquer la translation
  const translatedShapes = shapes.map(shape => {
    if (shape.type === "path") {
      let commands = parseSVG(shape.d);
      commands = commands.map((cmd : any)=> {
        if ("x" in cmd) cmd.x += dx;
        if ("y" in cmd) cmd.y += dy;
        if ("x1" in cmd) cmd.x1 += dx;
        if ("y1" in cmd) cmd.y1 += dy;
        if ("x2" in cmd) cmd.x2 += dx;
        if ("y2" in cmd) cmd.y2 += dy;
        return cmd;
      });
      return { ...shape, d: commands.map(commandToString).join(' ') };

    } else if (shape.type === "circle" || shape.type === "ellipse") {
      return { ...shape, cx: shape.cx + dx, cy: shape.cy -dy };
    }

    return shape;
  });

  return {
    shapes: translatedShapes,
    width: maxX - minX,
    height: maxY - minY
  };
}



// ------------------------------------------------------------------
//  LightBurn .lbrn2 export – GRID layout avec 5 mm spacing
//  – utilise la largeur/hauteur réelle du SVG
// ------------------------------------------------------------------
export async function generateLightBurnFile(
  vault: MyVault,
  filePath: string,
  svgFilePaths: string[],
  laserPower: number = 100,
  speed: number = 11.6667,
  passes: number = 1
): Promise<void> {
  const vaultBasePath = (vault.app.vault.adapter as any).basePath;
  const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

  const spacingMM = 5;      // espacement en mm
  const bedWidth = 600;     // largeur utile du lit en mm
  let groupIndex = 0;
  let allGroups = "";

  let cursorX = spacingMM;
  let rowY = spacingMM;
  let rowHeight = 0;

  for (let i = 0; i < svgFilePaths.length; i++) {
    const svgRelPath = svgFilePaths[i];
    const absolutePath = path.join(vaultBasePath, svgRelPath);
    const svgContent = await fs.readFile(absolutePath, "utf-8");

    const parsed = xmlParser.parse(svgContent);

    // ----------------- DIMENSIONS DU SVG -----------------
    const shapes = extractSVGElements(parsed);
    const { shapes: normShapes, width: svgW, height: svgH } = normalizeShapes(shapes);
    console.log(`SVG: ${svgRelPath} - Size: ${svgW}x${svgH}`);

    // Retour à la ligne si dépassement
    if (cursorX + svgW > bedWidth && cursorX > spacingMM) {
      rowY += rowHeight + spacingMM;
      cursorX = spacingMM;
      rowHeight = 0;
    }

    rowHeight = Math.max(rowHeight, svgH);

    // Placement du groupe (centré sur son point de référence)
    const groupX = cursorX ;
    const groupY = rowY + svgH ;


    let shapeGroup = "";
  let colors = ["#000000"]
  for (const shape of normShapes) {
    // Détection de la couleur (stroke ou fill) depuis le SVG original
    let color = "#000000";
    if ('color' in shape && shape.color && typeof shape.color === "string") {
      color = shape.color;
      if (typeof shape.color === "string" && !colors.includes(shape.color)) {
        colors.push(shape.color);
      }
    }

    if (shape.type === "path") {
      try {
       const commands = parseSVG(shape.d);
       const { vertList, primList } = commandsToVertPrimLists(commands);
       shapeGroup += `
          <Shape Type="Path" CutIndex="${colors.indexOf(color)-1}" VertID="${groupIndex * 10}" PrimID="1">
            <XForm>1 0 0 1 0 0</XForm>
            <VertList>${vertList}</VertList>
            ${primList ? `<PrimList>${primList}</PrimList>` : ""}
          </Shape>`;
       groupIndex++;
      } catch (err) {
       console.error(`Erreur de parsing du chemin SVG avec d='${shape.d}':`, err);
      }

    } else if (shape.type === "circle" || shape.type === "ellipse") {
      let cy = shape.cy
      console.log("Original cy:", cy, "svgH:", svgH, "groupY:", groupY);
      if (cy > 0){
         cy = cy - svgH + rowY
      }
      shapeGroup += `
   <Shape Type="Ellipse" CutIndex="${colors.indexOf(color)-1}" Rx="${shape.rx.toFixed(3)}" Ry="${shape.ry.toFixed(3)}">
    <XForm>1 0 0 1 ${shape.cx.toFixed(3)} ${cy.toFixed(3)}</XForm>
   </Shape>`;
      groupIndex++;
    }
   }



    const groupShape = `
  <Shape Type="Group">
    <XForm>1 0 0 1 ${groupX.toFixed(3)} ${groupY.toFixed(3)}</XForm>
    <Children>
    ${shapeGroup}
    </Children>
  </Shape>`;
    allGroups += groupShape;

    // Avance du curseur seulement si ce n’est pas la dernière pièce
    if (i < svgFilePaths.length - 1) {
      cursorX += svgW + spacingMM;
    } else {
      cursorX += svgW; // pas de spacing après la dernière
    }
  }

  const lbrn2Content = `<?xml version="1.0" encoding="UTF-8"?>
<LightBurnProject AppVersion="2.0.02" DeviceName="Mecpow X5 Pro" FormatVersion="1" MaterialHeight="0" MirrorX="False" MirrorY="False">
  <Thumbnail Source=""/>
  <VariableText>
    <Start Value="0"/>
    <End Value="999"/>
    <Current Value="0"/>
    <Increment Value="1"/>
    <AutoAdvance Value="0"/>
  </VariableText>
  <UIPrefs>
    <Optimize_ByLayer Value="0"/>
    <Optimize_ByGroup Value="-1"/>
    <Optimize_ByPriority Value="1"/>
    <Optimize_WhichDirection Value="0"/>
    <Optimize_InnerToOuter Value="1"/>
    <Optimize_ByDirection Value="0"/>
    <Optimize_ReduceTravel Value="1"/>
    <Optimize_HideBacklash Value="0"/>
    <Optimize_ReduceDirChanges Value="0"/>
    <Optimize_ChooseCorners Value="0"/>
    <Optimize_AllowReverse Value="1"/>
    <Optimize_RemoveOverlaps Value="0"/>
    <Optimize_OptimalEntryPoint Value="0"/>
    <Optimize_OverlapDist Value="0.025"/>
  </UIPrefs>
  <CutSetting type="Cut">
    <index Value="0"/>
    <name Value="C00"/>
    <maxPower Value="${laserPower}"/>
    <maxPower2 Value="${Math.round(laserPower * 0.2)}"/>
    <speed Value="${speed}"/>
    <priority Value="0"/>
    <tabCount Value="1"/>
    <tabCountMax Value="1"/>
  </CutSetting>
  ${allGroups}
</LightBurnProject>`;

  const existingFile = vault.app.vault.getAbstractFileByPath(filePath);
  if (existingFile instanceof TFile) {
    await vault.app.vault.modify(existingFile, lbrn2Content);
  } else {
    await vault.app.vault.create(filePath, lbrn2Content);
  }

  console.log(`✅ Fichier .lbrn2 généré avec succès : ${filePath}`);
}




export async function concatSVG(
    vault: MyVault,
    outputPath: string,
    svgFilePaths: string[],
): Promise<void> {
    const vaultBasePath = (vault.app.vault.adapter as any).basePath;
    let combinedSVGs = "";
    let xOffset = 0;
    const spacing = 37.7953; // 1cm in px (assuming 96dpi)

    let maxHeight = 0;
    let totalWidth = 0;
    const svgFragments: string[] = [];

    for (const svgRelPath of svgFilePaths) {
        const absolutePath = path.join(vaultBasePath, svgRelPath);
        const svgContent = await fs.readFile(absolutePath, "utf-8");

        // Extract width/height from <svg>
        const sizeMatch = svgContent.match(/<svg[^>]*width="([\d.]+)(\w*)"[^>]*height="([\d.]+)(\w*)"/i);
        let width = 0, height = 0;
        if (sizeMatch) {
            width = parseFloat(sizeMatch[1]);
            height = parseFloat(sizeMatch[3]);
            // If units are not px, you may want to convert (not handled here)
        } else {
            // fallback: try viewBox
            const viewBoxMatch = svgContent.match(/viewBox="([\d.\s]+)"/i);
            if (viewBoxMatch) {
                const vb = viewBoxMatch[1].split(/\s+/);
                width = parseFloat(vb[2]);
                height = parseFloat(vb[3]);
            } else {
                width = 100;
                height = 100;
            }
        }
        maxHeight = Math.max(maxHeight, height);

        // Extract the content inside <svg>...</svg>
        const match = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
        let inner = match ? match[1] : svgContent;

        // Wrap in <g> and translate
        svgFragments.push(`<g transform="translate(${xOffset},0)">${inner}</g>`);
        xOffset += width + spacing;
        totalWidth += width + spacing;
    }

    // Use the max height and total width for the final SVG size
    let header = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${maxHeight}" viewBox="0 0 ${totalWidth} ${maxHeight}">\n`;
    let finalSVG = `${header}${svgFragments.join("\n")}\n</svg>`;

    const existingFile = vault.app.vault.getAbstractFileByPath(outputPath);
    if (existingFile instanceof TFile) {
        await vault.app.vault.modify(existingFile, finalSVG);
    } else {
        await vault.app.vault.create(outputPath, finalSVG);
    }

    console.log(`✅ SVG concaténé enregistré : ${outputPath}`);
}