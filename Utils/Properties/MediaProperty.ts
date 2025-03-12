import { File } from "Utils/File";
import { FileProperty } from "./FileProperty";
import { Notice } from "obsidian";
import { selectMedia } from "Utils/Modals/Modals";


export class MediaProperty extends FileProperty{

  public type : string = "media";
    // Used for property with a single file
    constructor(name : string, icon: string = "file") {
      super(name, [], icon)
    }

    // Fonction pour gérer le clic sur l'icône
    async handleIconClick(update: (value: string) => Promise<void>, event: Event) {
        let selectedFile = await selectMedia(this.vault, "Choisissez un document" )
        if (selectedFile){
          await update(`[[${selectedFile.name}]]`)
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
      const currentField = value?.slice(2, -2)
      const link = document.createElement("a");
      link.href = "#";
      link.addEventListener("click", async (event) => await this.modifyField(event));
      link.textContent = currentField || "";
      link.classList.add("field-link");
      link.style.display = "block";

      // Truncate the link text if it exceeds 30 characters


      fieldContainer.appendChild(link);

      return fieldContainer;
    }

     // Fonction pour gérer le clic sur l'icône
    async modifyField(event: Event) {
      const link = (event.target as HTMLElement).closest('.metadata-field')?.querySelector('.field-link') as HTMLElement;
      let currentField = link.textContent
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