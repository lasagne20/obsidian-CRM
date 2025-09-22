import { File } from "Utils/File";
import { FileProperty } from "./FileProperty";
import { Notice, setIcon } from "obsidian";
import { selectMedia } from "Utils/Modals/Modals";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FreecadFile } from "Utils/3D/FreecadFile";
const { shell } = require('electron');


export class MediaProperty extends FileProperty{

  public display : string;
  public createOption : string;

  public type : string = "media";
    // Used for property with a single file
    constructor(name: string, args: { icon?: string; display?: string; create?: string} = {icon: "media", create: ""}) {
      super(name, [], args);
      this.createOption = args.create || "";
    }

    getDisplay(file: any, args: {staticMode? : boolean, title?: string, display?: string;
          createOptions? : {createFunction? : () => Promise<string>, title?: string}
          updateOptions? : {icon: string, updateFunction? : () => Promise<string>}} = 
          {staticMode : false, title:"", display: "name"}): HTMLDivElement {
        this.display = args.display || "name";
        if (!this.read(file) && this.createOption){
          // If the file is not set, we return a container with a button to create a new file
          const container = document.createElement("div");
          container.classList.add("create-freecad-container");

          const button = document.createElement("button");
          button.classList.add("mod-cta");
          if (args.createOptions && args.createOptions.createFunction) {
              button.textContent = args.createOptions.title || "Créer un fichier";
              button.addEventListener("click", async () => {
                  if (args.createOptions && typeof args.createOptions.createFunction === "function") {
                    let path = await args.createOptions.createFunction();
                     await file.updateMetadata(this.name, `[[${path}|${path.split("/").pop()}]]`);
                    setTimeout(() => {
                      // On attend 2 secondes pour que le fichier soit créé et déplacer dans le bon dossier avant de l'ouvrir
                      path = file.vault.getMediaFromLink(path)?.path || path;
                      const vaultPath = file.vault.app.vault.adapter.basePath || file.vault.adapter.getBasePath?.();
                      const absoluteMediaPath = vaultPath ? require('path').join(vaultPath, path) : path;
                      shell.openPath(absoluteMediaPath);
                    }, 1000);
                    await file.check();
                  }
              }); 
              container.appendChild(button);
              return container;
          }}

        let value = this.read(file);
        let container = this.fillDisplay(file.vault, value, async (value) => await file.updateMetadata(this.name, value), file);
        if (args.updateOptions && args.updateOptions.updateFunction) {
          const refreshButton = document.createElement("button");
          refreshButton.classList.add("mod-cta");
            setIcon(refreshButton, args.updateOptions.icon || "refresh-ccw");
          refreshButton.addEventListener("click", async () => {
            if (args.updateOptions && typeof args.updateOptions.updateFunction === "function") {
              let path = await args.updateOptions.updateFunction();
              await file.updateMetadata(this.name, `[[${path}|${path.split("/").pop()}]]`);
            }
          });
          container.appendChild(refreshButton);
        }

        
        return container
    }

    getLink(value: string, vault?: any): string {
      if (!value){
        return "";
      }
      return this.vault.getMediaFromLink(value)?.name || "";
    }

    openFile(value: string) {
          const { shell } = require('electron');
          // Get the absolute path to the file in the vault
          const vaultPath = (this.vault.app.vault.adapter as any).basePath;
          let mediaPath = this.vault.getMediaFromLink(value)?.path;
          const absoluteMediaPath = vaultPath ? require('path').join(vaultPath, mediaPath) : mediaPath;
          shell.openPath(absoluteMediaPath);
    }

    fillDisplay(vault: any, value: any, update: (value: any) => Promise<void>, file: any = null): HTMLDivElement {
      this.vault = vault;
      if (value && value.startsWith("[[") && value.endsWith("]]")) {
        if (this.display === "embed") {
          // If it is an image : 
          let mediaPath = this.vault.getMediaFromLink(value)?.path;
          let container = document.createElement("div");
          if (mediaPath) {
            const ext = mediaPath.toLowerCase().split('.').pop();
            if (ext && ["png", "jpg", "jpeg", "gif"].includes(ext)) {
              container = this.createEmbedImageContainer(mediaPath, update);
            } else if (ext && ["glb", "gltf", "fcstd"].includes(ext)) {
              if (ext === "fcstd") {
                    // try with the name of the file 
                    // Récupère le dossier du fichier courant et construit le chemin GLB relatif
                    const folder = mediaPath.substring(0, mediaPath.lastIndexOf("/"));
                    const testList = [file.getName(false), file.getMetadataValue("Code"), mediaPath.replace(/\.fcstd$/i, ".glb")];
                    if (typeof file.getCode === "function") {
                      testList.push(file.getCode());
                    }
                    for (const testName of testList) {
                      mediaPath = folder ? `${folder}/${testName}.glb` : `${testName}.glb`;
                      if (this.vault.app.vault.getFiles().find(f => f.path === mediaPath)) {
                        break;
                      }
                }
              }
              container = this.createEmbed3DContainer(mediaPath, update);
            }
            container.style.position = "relative";
            container.appendChild(this.createEmbedOpenContainer(update, value));
            container.appendChild(this.createEmbedEditContainer(update, value));
          }
          return container
        }
        else if (this.display === "icon") {
          const container = document.createElement("div");
          container.classList.add("metadata-field", "media-field");

          const iconDiv = document.createElement("div");
          iconDiv.classList.add("big-icon-div");
          setIcon(iconDiv, this.getFileIcon(value));

          const fileName = document.createElement("div");
          fileName.classList.add("media-field-file-name");
          fileName.textContent = this.vault.getMediaFromLink(value)?.name || "Fichier non trouvé";

          container.appendChild(iconDiv);
          container.appendChild(fileName);


          container.appendChild(iconDiv);
          container.appendChild(fileName);

          // 🔗 Ouvrir le fichier au clic (sur tout le conteneur)
          container.style.cursor = "pointer";
          container.addEventListener("click", () => {
            this.openFile(value)
          });
          return container;
        }
        else if (this.display === "button") {
          const container = document.createElement("div");
          container.classList.add("create-freecad-container");

          const button = document.createElement("button");
          button.classList.add("mod-cta");
          button.textContent = this.title || "Ouvrir le fichier";
          button.addEventListener("click",() => {
            this.openFile(value)
          });
          container.appendChild(button);
          return container;
        }
      }
      return super.fillDisplay(vault, value, update);
    }

    getFileIcon(value: string): string {
      if (value && value.startsWith("[[") && value.endsWith("]]")) {
        const mediaPath = this.vault.getMediaFromLink(value)?.path;
        if (mediaPath) {
          const ext = mediaPath.toLowerCase().split('.').pop();
          if (ext && ["png", "jpg", "jpeg", "gif"].includes(ext)) {
            return "image";
          } else if (ext && ["glb", "gltf", "fcstd"].includes(ext)) {
            return "cube3d";
          } else if (ext && ["pdf", "docx", "txt"].includes(ext)) {
            return "file";
          } else if (ext && ["mp4", "webm", "ogg"].includes(ext)) {
            return "video";
          } else if (ext && ["mp3", "wav"].includes(ext)) {
            return "audio";
          }
          else if (ext && ["zip", "rar"].includes(ext)) {
            return "archive";
          }
          else if (ext && ["sla"].includes(ext)) {
            return "square-pen";
          }
          else if (ext && ["lbrn2"].includes(ext)) {
            return "flame";
          }
          
        }
      }
      return this.icon || "media";
    }

    createEmbedEditContainer(update: (value: string) => Promise<void>, value: string): HTMLDivElement {
      const container = document.createElement("div");
      container.classList.add("embed-edit-container");
      container.style.position = "absolute"; // Position the icon container absolutely
      container.style.top = "5px"; // Adjust the top position
      container.style.left = "5px"; // Adjust the right position
      container.style.cursor = "pointer"; // Change cursor to pointer

      const iconContainer = document.createElement("div");
      iconContainer.classList.add("icon-container");

      const icon = document.createElement("i");
      setIcon(icon, "link");

      icon.addEventListener("click", async (event) => await this.handleIconClick(update, event));

      iconContainer.appendChild(icon);
      container.appendChild(iconContainer);

      return container;
    }

    createEmbedOpenContainer(update: (value: string) => Promise<void>, value: string): HTMLDivElement {
      const container = document.createElement("div");
      container.classList.add("embed-open-container");
      container.style.position = "absolute"; // Position the icon container absolutely
      container.style.top = "5px"; // Adjust the top position
      container.style.right = "5px"; // Adjust the right position
      container.style.cursor = "pointer"; // Change cursor to pointer

      const iconContainer = document.createElement("div");
      iconContainer.classList.add("icon-container");
      

      const icon = document.createElement("i");
      setIcon(icon, "external-link");

      icon.addEventListener("click", (event) => {
      event.preventDefault();
      if (value) {
        this.openFile(value)
      } else {
        new Notice("Unable to generate link for the media.");
      }
      });

      iconContainer.appendChild(icon);
      container.appendChild(iconContainer);

      return container;
    }


    createEmbed3DContainer(mediaPath: string, update: (value: string) => Promise<void>): HTMLDivElement {
      const container = document.createElement("div");
      container.classList.add("embed-container");

      
      // Check if the file exists in the vault before trying to load it
      const fileExists = this.vault.app.vault.getFiles().find(f => f.path === mediaPath);
      if (!fileExists) {
        const errorDiv = document.createElement("div");
        errorDiv.textContent = `Rendu 3D introuvable.Ouvrer le fichier dans FreeCAD pour le créer.`;
        console.error("3D model file not found:", mediaPath);
        errorDiv.style.textAlign = "center";
        errorDiv.style.margin = "40px auto";
        errorDiv.style.color = "#c00";
        container.appendChild(errorDiv);
        return container;
      }
      const embed = document.createElement("canvas");
      embed.classList.add("embed-media");
      container.appendChild(embed);
      
      const renderer = new THREE.WebGLRenderer({ canvas: embed, alpha: true, antialias: true });
      renderer.setSize(300, 300);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
      // Position the camera directly above, looking down the -Z axis
      camera.position.set(0, 10, 0);
      camera.up.set(0, 0, -1); // Make Z axis "up" for the camera
      camera.lookAt(0, 0, 0);

      // Add multiple directional lights from different directions for even illumination
      const directions = [
        [0, 10, 0],    // Top
        [0, -10, 0],   // Bottom
        [10, 0, 0],    // Right
        [-10, 0, 0],   // Left
        [0, 0, 10],    // Front
        [0, 0, -10],   // Back
      ];
      directions.forEach(dir => {
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(dir[0], dir[1], dir[2]);
        light.target.position.set(0, 0, 0);
        scene.add(light);
        scene.add(light.target);
      });
      // Optionally add a soft ambient light for subtle fill
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      const loader = new GLTFLoader();

      let model: THREE.Group;
      let animationActive = true; // Track animation state
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; // Smooth rotation
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;
      controls.minPolarAngle = 0; // Permet toutes les rotations verticales
      controls.maxPolarAngle = Math.PI; // Permet toutes les rotations verticales
      controls.target.set(0, 0, 0);

      loader.load(
      this.vault.app.vault.adapter.getResourcePath(mediaPath),
      
      (gltf) => {
        model = gltf.scene;
        model.traverse((child: any) => {
          if (child.isMesh && child.material) {
            // Handle both array and single material
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            for (const mat of materials) {
              if (mat.transparent || mat.opacity < 0.5) {
                // Set mesh to be fully visible (opaque)
                mat.opacity = 1;
                mat.transparent = false;
              }
            }
          }
        });

        // Automatically center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        // Center the model at the origin
        model.position.sub(center);

        // Scale model to fill 80% of the 300x300 area
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetFill = 0.8;
        const viewHeight = 2 * camera.position.y * Math.tan((camera.fov * Math.PI) / 360);
        const desiredSize = viewHeight * targetFill;
        const scale = desiredSize / maxDim;
        model.scale.setScalar(scale);

        // Trouver la face la plus grande (dans le plan XZ ou YZ ou XY)
        // On va chercher la direction où la surface projetée est la plus grande
        // et placer la caméra en face de cette direction

        // Calculer les surfaces projetées sur chaque plan
        const sx = size.y * size.z; // surface sur le plan YZ (vue selon X)
        const sy = size.x * size.z; // surface sur le plan XZ (vue selon Y)
        const sz = size.x * size.y; // surface sur le plan XY (vue selon Z)

        // Trouver la plus grande surface et ajuster la caméra
        if (sx >= sy && sx >= sz) {
        // Vue selon X (face YZ)
        camera.position.set(center.x + 10, center.y, center.z);
        camera.up.set(0, 1, 0);
        camera.lookAt(center.x, center.y, center.z);
        controls.target.set(center.x, center.y, center.z);
        } else if (sy >= sx && sy >= sz) {
        // Vue selon Y (face XZ)
        camera.position.set(center.x, center.y + 10, center.z);
        camera.up.set(0, 0, -1);
        camera.lookAt(center.x, center.y, center.z);
        controls.target.set(center.x, center.y, center.z);
        } else {
        // Vue selon Z (face XY)
        camera.position.set(center.x, center.y, center.z + 10);
        camera.up.set(0, 1, 0);
        camera.lookAt(center.x, center.y, center.z);
        controls.target.set(center.x, center.y, center.z);
        }

        // No rotation: keep model flat for top-down view
        model.rotation.set(0, 0, 0);

        // Ensure model is centered after scaling
        const newBox = new THREE.Box3().setFromObject(model);
        const newCenter = new THREE.Vector3();
        newBox.getCenter(newCenter);
        model.position.sub(newCenter);

        scene.add(model);
        animate();
      },
      undefined,
      (error) => {
        console.error("An error occurred while loading the 3D model:", error);
      }
      );

      function animate() {
      requestAnimationFrame(animate);

      controls.update(); // Update controls for smooth interaction
      renderer.render(scene, camera);
      }

      // Stop animation on click
      embed.addEventListener("mousedown", () => {
      animationActive = false;
      });

      const iconContainer = document.createElement("div");
      iconContainer.classList.add("icon-container");

      const icon = document.createElement("i");
      icon.classList.add("icon", this.icon);
      icon.addEventListener("click", async (event) => await this.handleIconClick(update, event));

      iconContainer.appendChild(icon);
      container.appendChild(iconContainer);

      return container;
    }

    createEmbedImageContainer(mediaPath: string, update: (value: string) => Promise<void>): HTMLDivElement {
      const container = document.createElement("div");
      container.classList.add("metadata-field", "media-field", "embed-container");

      const embed = document.createElement("img");
      
      embed.src = this.vault.app.vault.adapter.getResourcePath(mediaPath);
      embed.alt = "Media";

      embed.classList.add("embed-media");

      const iconContainer = document.createElement("div");
      iconContainer.classList.add("icon-container");

      const icon = document.createElement("i");
      icon.classList.add("icon", this.icon);
      icon.addEventListener("click", async (event) => await this.handleIconClick(update, event));

      iconContainer.appendChild(icon);
      container.appendChild(embed);
      container.appendChild(iconContainer);

      return container;
    }

    // Fonction pour gérer le clic sur l'icône
    async handleIconClick(update: (value: string) => Promise<void>, event: Event) {
        let selectedFile = await selectMedia(this.vault, "Choisissez un document" )
        if (selectedFile){
          await update(`[[${selectedFile.path}|${selectedFile.name}]]`)
          const link = (event.target as HTMLElement).closest('.metadata-field')?.querySelector('.field-link') as HTMLElement;
            if (link) {
              link.textContent = selectedFile.name;
            }
        }
    }

    // Override the createFieldContainerContent function to truncate the link
    createFieldContainerContent(update: (value: string) => Promise<void>, value: string) {
      const fieldContainer = document.createElement("div");
      fieldContainer.classList.add("field-container");
      const currentField = this.getLink(value);
      const link = document.createElement("a");
      link.href = "#";
      const truncatedField = currentField?.length > 12 ? currentField.slice(0, 12) + "..." : currentField;
      link.textContent = truncatedField || "";
      link.setAttribute("full-text", currentField || "");
      link.addEventListener("click", async (event) => await this.modifyField(event));
      link.classList.add("field-link");
      link.style.display = "block";

      fieldContainer.appendChild(link);

      return fieldContainer;
    }

     // Fonction pour gérer le clic sur l'icône
    async modifyField(event: Event) {
      const link = (event.target as HTMLElement).closest('.metadata-field')?.querySelector('.field-link') as HTMLElement;
      let currentField = link.getAttribute("full-text")
      if (!currentField){return}
      event.preventDefault();
      
      const file = this.vault.app.vault.getFiles().find(f => f.name === currentField);
      if (file) {
          const leaf = this.vault.app.workspace.getLeaf();
          await leaf.openFile(file);
      } else {
        new Notice(`Le fichier ${currentField} n'existe pas`)
      }
    }

}


