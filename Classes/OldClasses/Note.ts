import { Classe } from "Classes/Classe";
import AppShim, { TFile } from "../Utils/App";
import { MyVault } from "Utils/MyVault";
import { ClasseProperty } from "Utils/Properties/ClasseProperty";
import { DateProperty } from "Utils/Properties/DateProperty";

import { Property } from "Utils/Properties/Property";
import { SelectProperty } from "Utils/Properties/SelectProperty";


export class Note extends Classe {

    public static className : string = "Note";
    public static classIcon : string = "notebook-pen";
    
    public static Properties : { [key: string]: Property } = {
      classe : new ClasseProperty("Classe", this.classIcon),
      date : new DateProperty("Date", ["today"], {icon: "calendar", defaultValue: new Date().toLocaleDateString("fr-FR")}),
      type : new SelectProperty("Type", [
        {name: "Note", color: "blue"},
        {name: "Rapport", color: "green"},
        {name: "Compte-rendu", color: "red"},
        {name: "Autre", color: "grey"},
      ]),
    }
    
    constructor(app : AppShim, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor() {
      return Note;
    }

    getParentValue(): string {
      return "";
    }

    static getConstructor(){
      return Note
    }

    async updateLocation() {
      const targetFolder = "Notes";
      const filePath = this.file.path;
      if (!filePath.startsWith(targetFolder + "/")) {
        console.log(`Moving file ${this.file.name} to ${targetFolder}`);
        await this.move(targetFolder);
      }
    }

    async populate(...args: any[]): Promise<void> {
      
    }

    getTopDisplayContent() : any{
      const container =  document.createElement("div");

      let firstContainer = document.createElement("div");
      firstContainer.classList.add("metadata-line")
      firstContainer.appendChild(Note.Properties.classe.getDisplay(this))
      firstContainer.appendChild(Note.Properties.date.getDisplay(this))
      firstContainer.appendChild(Note.Properties.type.getDisplay(this))
      container.appendChild(firstContainer)

      return container
    }

    // Validate that the file content is standart
    async check(){
      this.startWith(Note.Properties.date)
      await super.check()
    }
     
  }
