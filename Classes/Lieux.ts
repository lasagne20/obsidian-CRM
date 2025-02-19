import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { selectFile } from "Utils/Modals/Modals";
import { FileProperty } from "Utils/Properties/FileProperty";


export class Lieu extends Classe {

    public static className : string = "Lieux";

    public static get Properties() : { [key: string]: FileProperty } {
      return {
        parent : new FileProperty("Parent", Lieu)
      }
    }

    constructor(app : App, vault:MyVault, file : File) {
      super(app, vault, file)
    }

    getClasse(){
      return Lieu.className
    }

    static getProperties(){
      return Lieu.Properties
    }

    async populate(...args : any[]){
       //get the parent
      let parent = await selectFile(this.vault, Lieu.Properties.parent.classe, "Selectionner le lieux parent")
      await this.file.updateMetadata(Lieu.Properties.parent.name, parent.getLink())
      
      if (Lieu.Properties.lieu instanceof FileProperty){
        await this.updateChildren(Lieu.Properties.parent)
      }

      this.update()
    }


    async update() {
        await this.updateChildren(Lieu.Properties.parent)
    }

    // Validate that the file content is standart
    async check(){

    }
  }
  