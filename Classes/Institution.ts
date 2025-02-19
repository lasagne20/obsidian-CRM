import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { FileProperty } from "Utils/Properties/FileProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { Lieu } from "./Lieux";

export class Institution extends Classe {

  public static className : string = "Institutions";

  public static get Properties() : { [key: string]: Property } { 
    return {
      classe : new Property("Classe"),
      type: new Property("Type institution"),
      groupe: new FileProperty("Groupe", Institution),
      site: new Property("Site web"),
      mail : new Property("Email"),
      telephone : new Property("Telephone"),
      relation: new SelectProperty("Type de relation", ["financeurs", "vecteurs", "clients", "support"]),
      lieu: new FileProperty("Lieu", Lieu),
      domaine: new Property("Domaine"),
      addresse : new Property("Adresse"),
      prioriété : new Property("Priorité"),
      personnes : new Property("Personnes"),
      liens : new Property("Liens")
      }
    }
    
    constructor(app : App, vault:MyVault, file : File) {
      super(app, vault, file)
    }

    getClasse(){
      return Institution.className
    }

    static getProperties(){
      return Institution.Properties
    }

    /*
    static async createFile(vault : MyVault, templateFolderPath : string, name: string): Promise<TFile> {
      let templatePath = templateFolderPath + this.getClasse()+".md"
    }*/


    getChildFolderPath(child : Classe){
      // check if the file is also a folder
      return super.getChildFolderPath(child) + "/"+ child.getClasse()
    }



    async update() {
      if (Institution.Properties.lieu instanceof FileProperty){
        await this.updateChildren(Institution.Properties.lieu)
      }
    }

    // Validate that the file content is standart
    async check(){
      // Check si le lieu est correct
      await Institution.Properties.lieu.check(this.file)
      // Remet les propriétés dans l'ordre
      await this.file.reorderMetadata(Object.values(Institution.Properties).map(p => p.name));
    }
  }
  