import { Classe } from "Classes/Classe";
import { SubClass } from "Classes/SubClasses/SubClass";
import { App, TFile } from "obsidian";
import { promptTextInput, selectFile, selectSubClasses } from "Utils/Modals/Modals";
import { MyVault } from "Utils/MyVault";
import { ClasseProperty } from "Utils/Properties/ClasseProperty";
import { FileProperty } from "Utils/Properties/FileProperty";
import { LinkProperty } from "Utils/Properties/LinkProperty";
import { MediaProperty } from "Utils/Properties/MediaProperty";
import { NumberProperty } from "Utils/Properties/NumberProperty";
import { Property } from "Utils/Properties/Property";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { Assemblage } from "./Assemblage";
import { EmailProperty } from "Utils/Properties/EmailProperty";
import { Fournisseur } from "./Fournisseur";
import { DateProperty } from "Utils/Properties/DateProperty";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";
import { TextProperty } from "Utils/Properties/TextProperty";


export class Machine extends Classe {

    public static className : string = "Machine";
    public static classIcon : string = "server-cog";
    
    public static Properties : { [key: string]: Property } = {
      classe : new ClasseProperty("Classe", this.classIcon),
      type : new SelectProperty("Type", [
        {name: "CNC", color: "blue"},
        {name: "Imprimante 3D", color: "green"},
        {name: "Découpeuse laser", color: "red"},
        {name: "Autre", color: "grey"},
      ]),
      parameters : new ObjectProperty("Paramètres", {
        paramName : new Property("Nom du paramètre", {icon: "tag"}),
        paramValue : new Property("Valeur du paramètre", {icon: "hashtag"}),
      }, {icon: "settings"}),

    }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Machine
    }

    getParentValue(): string {
      return "";
    }

    static getConstructor(){
      return Machine
    }

    async updateLocation() {
      const targetFolder = "Machines";
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
      firstContainer.appendChild(Machine.Properties.classe.getDisplay(this))
      firstContainer.appendChild(Machine.Properties.type.getDisplay(this))
      container.appendChild(firstContainer)

      let secondContainer = document.createElement("div");
      secondContainer.classList.add("metadata-line")
      secondContainer.appendChild(Machine.Properties.parameters.getDisplay(this))
      container.appendChild(secondContainer)

      return container
    }

    // Validate that the file content is standart
    async check(){
      await super.check()
    }
     
  }
