import { File } from "Utils/File";
import { Property } from "./Property";
import { App, setIcon, TFile } from "obsidian";
import { Classe } from "Classes/Classe";


export class ClasseProperty extends Property{

     public type : string = "class";

    // Used for property hidden for the user
    constructor(name : string, icon: string = "") {
      super(name, {icon: icon});
    }

    fillDisplay(vault : any,value: any, update: (value: any) => Promise<void>)  {
          this.vault = vault;
          const field = document.createElement("div");
          field.classList.add("metadata-field");
      
          const label = document.createElement("label");
          label.textContent = value;

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