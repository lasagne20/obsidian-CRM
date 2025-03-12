import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { FileProperty } from "Utils/Properties/FileProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { selectFile } from "Utils/Modals/Modals";


export class Evenement extends Classe {

    public static className : string = "Evenement";

    public static parentProperty: FileProperty = new FileProperty("Lieu", ["Lieu"], "map-pin");

    public static Properties = {
      classe : new Property("Classe"),
      parent : this.parentProperty,
      organisateurs : new MultiFileProperty("Organisateurs", ["Institution", "Partenariat"], "badge-euro")
   }

    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Evenement
    }
    static getConstructor(){
      return Evenement
    }


    async populate(...args : any[]){
      let parent = await selectFile(this.vault, Evenement.parentProperty.classes, "Selectionner le lieux parent")
      if (parent){
        await this.updateMetadata(Evenement.parentProperty.name, parent.getLink())
      }
      await this.update()
    }

    getTopDisplayContent() : any{
      const container =  document.createElement("div");
      container.classList.add("metadata-line");
      container.appendChild(Evenement.Properties.classe.getDisplay(this))
      container.appendChild(Evenement.Properties.parent.getDisplay(this))
      container.appendChild(Evenement.Properties.organisateurs.getDisplay(this))
      
      return container
    }


    async check(){
      await super.check()
      // Ajust properties metadata
    }
  }
  