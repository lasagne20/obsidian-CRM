import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { selectFile } from "Utils/Modals/Modals";
import { FileProperty } from "Utils/Properties/FileProperty";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { Institution } from "./Institution";


export class Lieu extends Classe {

    public static className : string = "Lieux";

    public static parentProperty : FileProperty| MultiFileProperty  = new FileProperty("Parent", Lieu);
    public static get Properties() : { [key: string]: Property } {
      return {
        parent : this.parentProperty
      }
    }

    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getClasse(){
      return Lieu.className
    }

    static getProperties(){
      return Lieu.Properties
    }

    getparentProperties(): FileProperty| MultiFileProperty{
      return Lieu.parentProperty
    }

    getChildFolderPath(child : Classe){
      // check if the file is also a folder
      if (child instanceof Lieu){
        return super.getChildFolderPath(child)
      }
      return super.getChildFolderPath(child) + "/" + child.getClasse()
    }

    async populate(...args : any[]){
       //get the parent
      let parent = await selectFile(this.vault, Lieu.parentProperty.classe, "Selectionner le lieux parent")
      if (!parent){return}
      await this.updateMetadata(Lieu.Properties.parent.name, parent.getLink())

      await this.update()
    }

    // Validate that the file content is standart
    async check(){

    }
  }
  