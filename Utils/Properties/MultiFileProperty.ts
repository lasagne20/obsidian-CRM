import { File } from "Utils/File";
import { Property } from "./Property";
import { App, Notice } from "obsidian";
import { FileProperty } from "./FileProperty";
import { Classe } from "Classes/Classe";


export class MultiFileProperty extends FileProperty{
    // Used for property with a single file
    constructor(name : string, classes : typeof Classe[], icon : string = "", staticProperty : boolean=false) {
      super(name, classes, icon, staticProperty)
    }

      // Fonction pour créer le conteneur principal pour l'field
      createFieldContainerContent(update: (value: string) => Promise<void>, value: string) {
        const fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container");
        if (!value) {
            return fieldContainer;
        }
        const currentField = value[0]?.slice(2, -2);
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