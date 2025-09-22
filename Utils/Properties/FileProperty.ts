import { File } from "Utils/File";
import { Property } from "./Property";
import { Classe } from "Classes/Classe";
import { MyVault } from "Utils/MyVault";
import { Notice, setIcon, TFile } from "obsidian";
import { selectFile } from "Utils/Modals/Modals";
import { LinkProperty } from "./LinkProperty";
import { val } from "cheerio/dist/commonjs/api/attributes";


export class FileProperty extends LinkProperty{

    public classes : string[];
    public type : string = "file";
    // Used for property with a single file
    constructor(name : string, classes: string[], args= {}){
      super(name, args);
      this.classes = classes;
    }

    getClasses() : string[] {
      return this.classes
    }

    // Used by the ClasseProperty to get the parent value
    getParentValue(values : any){
      return values; // Enlève les [[ et ]]
    }

    getPretty(value: string) {
      return this.vault.readLinkFile(value)
    }

    getClasse(read : Classe): Classe | undefined{
      let link = this.read(read);
      if (link) {
        let classe = this.vault.getFromLink(link);
        if (classe) {
          return classe;
        }
      }
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

   getLink(value: string, vault? : any): string {
    if (vault) {
      this.vault = vault;
    }
    return `obsidian://open?vault=${this.vault.app.vault.getName()}&file=${encodeURIComponent(this.vault.readLinkFile(value, true))}`
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
        let selectedFile = await selectFile(this.vault, this.classes, {hint:"Choisissez un fichier " + this.getClasses().join(" ou ")});
        if (selectedFile){
          await update(selectedFile.getLink())
          const link = (event.target as HTMLElement).closest('.metadata-field')?.querySelector('.field-link') as HTMLElement;
            if (link) {
              link.textContent = selectedFile.getLink().slice(2, -2);
            }
        }
    }

    // Fonction pour gérer le clic sur l'icône
    async modifyField(event: Event) {
      const link = (event.target as HTMLElement).closest('.metadata-field')?.querySelector('.field-link') as HTMLElement;
      let currentField = link.textContent
      if (!currentField){return}
      event.preventDefault();
     
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
        const currentField = this.getPretty(value);
        const link = document.createElement("a");
        link.href = this.getLink(value);
        link.textContent = currentField || "";
        link.classList.add("field-link");
        link.style.display = "block"
        fieldContainer.appendChild(link);

        return fieldContainer;
    }

}