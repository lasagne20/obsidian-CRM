import { File } from "Utils/File";
import { Property } from "./Property";
import { Classe } from "Classes/Classe";
import { MyVault } from "Utils/MyVault";
import { Notice, setIcon, TFile } from "obsidian";
import { selectFile } from "Utils/Modals/Modals";
import { LinkProperty } from "./LinkProperty";
import { val } from "cheerio/dist/commonjs/api/attributes";


export class FileProperty extends LinkProperty{

    public classes : typeof Classe[];
    // Used for property with a single file
    constructor(name : string, classes: typeof Classe[], icon: string = "file", staticProperty : boolean=false) {
      super(name, icon, staticProperty);
      this.classes = classes;
    }

    async check(file: File){
        // Check if it is a file link
        let value = this.read(file)
        if (value && value.length && !file.linkRegex.test(value)) {
          // rajoute les [[ ]]
          if (value.length){
              value = `"[[${value}]]"`
          }
          await file.updateMetadata(this.name, value);
        }
    }

    getClasses(){
      return this.classes.map((classe: typeof Classe) => classe.getClasse())
    }

    getFile(file : File){
      const fileName = this.read(file)?.slice(2, -2); // Enlève les [[ et ]]
      // Rechercher le fichier dans la vault
      return file.getFromLink(fileName)
    }

    validate(value: string): string {
      // Expression régulière pour détecter les liens Obsidian au format [[...]]
      const regex = /\[\[([^\]]+)\]\]/;
      const match = value.match(regex);
      if (match && match[1]) {
          return `[[${match[1]}]]`;
      }
      return "";
   }

   getLink(value: string): string {
      return `obsidian://open?vault=${this.vault.app.vault.getName()}&file=${encodeURIComponent(value.replace("[[","").replace("]]",""))}`
   }
  
   createIconContainer(update: (value: string) => Promise<void>) {
    const iconContainer = document.createElement("div");
    iconContainer.classList.add("icon-container");

    const icon = document.createElement("div");
    setIcon(icon, this.icon);
    iconContainer.appendChild(icon);

    if (!this.static) {
      icon.style.cursor = "pointer";
      iconContainer.addEventListener("click", async (event) => await this.handleIconClick(update, event));
    }
    

    return iconContainer;
    }

    // Fonction pour gérer le clic sur l'icône
    async handleIconClick(update: (value: string) => Promise<void>, event: Event) {
        let selectedFile = await selectFile(this.vault, this.classes, "Choisissez un fichier " + this.getClasses())
        if (selectedFile){
          await update(selectedFile.getLink())
        }
    }

    // Fonction pour gérer le clic sur l'icône
    async modifyField(event: Event) {
      const link = (event.target as HTMLElement).closest('.metadata-field')?.querySelector('.field-link') as HTMLElement;
      let currentField = link.textContent
      if (!currentField){return}
      event.preventDefault();
      console.log("currentField", currentField)
      const classe = this.vault.getFromLink(currentField);
      if (classe) {
          const leaf = this.vault.app.workspace.getLeaf();
          await leaf.openFile(classe.file);
      } else {
        new Notice(`Le fichier ${currentField}.md n'existe pas`)
      }
    }



    // Fonction pour créer le conteneur principal pour l'field
    createFieldContainerContent(update: (value: string) => Promise<void>, value: string) {
        const fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container");
        const currentField = value?.slice(2, -2)
        const link = document.createElement("a");
        link.href = "#";
        link.addEventListener("click", async (event) => await this.modifyField(event));
        link.textContent = currentField || "";
        link.classList.add("field-link");
        link.style.display = "block"
        fieldContainer.appendChild(link);

        return fieldContainer;
    }

}