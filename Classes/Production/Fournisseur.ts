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


export class Fournisseur extends Classe {

    public static className : string = "Fournisseur";
    public static classIcon : string = "store";
    
    public static Properties : { [key: string]: Property } ={
      classe : new ClasseProperty("Classe", this.classIcon),
      site : new LinkProperty("Site web", {icon: "globe"}),
      email : new EmailProperty("Email", {icon: "envelope"}),
      type : new SelectProperty("Type", [
        {name: "E-commerce", color: ""},
        {name: "Boutique", color: ""},
      ]),

    }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Fournisseur
    }

    getParentValue(): string {
      return "";
    }

    getChildFolderPath(child : Classe){
      return super.getChildFolderPath(child) + "/" +  child.getClasse()
    }

    async updateLocation() {
      const targetFolder = "Fournisseurs";
      const filePath = this.file.path;
      if (!filePath.startsWith(targetFolder + "/")) {
        await this.move(targetFolder);
      }
    }

    static getConstructor(){
      return Fournisseur
    }

    async populate(args : {parent : Classe | null, type : SubClass |null, code: string| null} = {parent : null, type : null, code: null}){
    }


    getTopDisplayContent() : any{
      const container =  document.createElement("div");

      let firstContainer = document.createElement("div");
      firstContainer.classList.add("metadata-line")
      firstContainer.appendChild(Fournisseur.Properties.classe.getDisplay(this))
      firstContainer.appendChild(Fournisseur.Properties.site.getDisplay(this, {title:"Site :"}))
      firstContainer.appendChild(Fournisseur.Properties.email.getDisplay(this, {title: "Email :"}))
      firstContainer.appendChild(Fournisseur.Properties.type.getDisplay(this, {title: "Type :"}))

      container.appendChild(firstContainer)
      return container
    }

    // Validate that the file content is standart
    async check(){
      
      await super.check()
    }
     
  }
