import { selectMedia } from "Utils/Modals/Modals";
import { XMLParser } from 'fast-xml-parser';
import { Notice } from "obsidian";

const JSZip = require("jszip");



/**
 * Crée un fichier FreeCAD (.FCStd) vide avec un élément Assembly.
 * @param filePath Chemin complet du fichier à créer (doit se terminer par .FCStd)
 * @param assemblyName Nom de l'élément Assembly à ajouter
 */
/**
 * Crée un fichier FreeCAD (.FCStd) vide avec un élément Assembly.
 * @param vault Instance du vault Obsidian
 * @param filePath Chemin complet du fichier à créer (doit se terminer par .FCStd)
 * @param assemblyName Nom de l'élément Assembly à ajouter
 */
export async function createFreecadFileWithAssembly(vault: any, filePath: string, assemblyName: string): Promise<void> {
    if (!filePath.endsWith('.FCStd')) {
        throw new Error('Le fichier doit avoir une extension .FCStd');
    }

    // Lire le fichier FreeCAD existant
    let templatPath = vault.settings.templateFolder + "/FreecadTemplate.FCStd";
    await selectMedia(vault, "Sélectionner le modèle FreeCAD", ["fcstd"], vault.settings.templateFolder).then((file) => {
        if (!file) {
            throw new Error("Aucun modèle FreeCAD sélectionné.");
        }
        templatPath = file.path;
    });
    const existingContent = await vault.app.vault.adapter.readBinary(templatPath);
    const zip = await JSZip.loadAsync(existingContent);

    // Modifier le Document.xml pour changer l'assembly
    const documentXml = await zip.file("Document.xml")?.async("string");
    if (!documentXml) throw new Error("Document.xml introuvable dans le fichier existant.");

    // Remplacer le nom de l'assembly (exemple simple, à adapter selon la structure XML)
    let updatedDocumentXml = documentXml.replace("$AssemblyName$", assemblyName)

    zip.file("Document.xml", updatedDocumentXml);

    // Générer le nouveau contenu
    const newContent = await zip.generateAsync({ type: "uint8array" });

    // Écrire le nouveau fichier (vous pouvez choisir un nouveau chemin si besoin)
    await vault.app.vault.adapter.writeBinary(filePath, newContent);
    return Promise.resolve();
}

/**
 * Ouvre un fichier FreeCAD (.FCStd) et liste les liens externes présents dans le fichier.
 * @param vault Instance du vault Obsidian
 * @param filePath Chemin complet du fichier FreeCAD (.FCStd)
 * @returns Liste des liens externes trouvés dans le fichier
 */
export async function listExternalLinksInFreecadFile(vault: any, filePath: string): Promise<Array<{ link: string; nbr: number }>> {
    if (!filePath.endsWith('.FCStd')) {
        throw new Error('Le fichier doit avoir une extension .FCStd');
    }

    try{
        const data = await this.app.vault.adapter.readBinary(filePath);
        // Charger le zip
        const zip = await JSZip.loadAsync(data);

        // Extraire le Document.xml
        const docXml = await zip.file('Document.xml')?.async('text');
        if (!docXml) {
            new Notice('Document.xml non trouvé dans le fichier FreeCAD.');
            return [];
        }

        // Parser le XML
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '',
        });
        const json = parser.parse(docXml);

        // Chercher les DataLink
        const datalinks: any[] = [];

        // Le format XML peut varier, il faut adapter selon structure.
        // Exemple générique : parcourir les objets et chercher les propriétés DataLink
        const objects = json?.Document?.ObjectData.Object;
        console.log('Objet JSON:', objects);
        if (Array.isArray(objects)) {
            for (const obj of objects) {
                const properties = obj.Properties.Property;
                if (Array.isArray(properties)) {
                    for (const prop of properties) {
                        if (prop.name === 'DataLink' && prop.Map?.Item) {
                            for (const link of prop.Map.Item) {
                                if (link["key"] == "DocumentPath") {
                                    datalinks.push(link["value"].split('/').pop()); // Extraire le nom du fichier
                                }
                            }
                        }
                    }
                }
            }
        }
        const groupedLinks: { link: string; nbr: number }[] = [];
        const linkCount: Record<string, number> = {};

        for (const link of datalinks) {
            linkCount[link] = (linkCount[link] || 0) + 1;
        }

        for (const link in linkCount) {
            groupedLinks.push({ link, nbr: linkCount[link] });
        }

        return groupedLinks;

    } catch (error) {
        console.error('Erreur lors de la lecture du fichier FreeCAD:', error);
        return [];
    }

    
}