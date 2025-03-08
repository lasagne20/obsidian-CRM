import { File } from "Utils/File";
import { Property } from "./Property";
import { App, setIcon, TFile } from "obsidian";
import { Classe } from "Classes/Classe";


export class ClasseProperty extends Property{

    // Used for property hidden for the user
    constructor(name : string, icon: string = "") {
      super(name, icon)
    }

    getDisplay(file : File) {
          const field = document.createElement("div");
          field.classList.add("metadata-field");
      
          const label = document.createElement("label");
          label.textContent = this.read(file);

          if (this.icon){
            const icon = document.createElement("div"); 
            icon.classList.add("icon-container");
            setIcon(icon, this.icon);
            field.appendChild(icon);
          }
          
          field.appendChild(label);
          return field;
      }

}