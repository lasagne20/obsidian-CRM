import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { FileProperty } from "Utils/Properties/FileProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { Institution } from "./Institution";
import { Lieu } from "./Lieu";
import { selectFile } from "Utils/Modals/Modals";
import { Personne } from "./Personne";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";

export class Action extends Classe {

    public static className : string = "Actions";

    public static parentProperty: FileProperty |MultiFileProperty = new MultiFileProperty("Clients", [Institution], "hand");

    public static get Properties() {
      return {
      classe : new Property("Classe"),
      clients : this.parentProperty,
      financeurs : new ObjectProperty("Financeurs", "receipt-euro", {
        institution : new FileProperty(Institution.className, [Institution]),
        montant: new Property("Montant")
      }),
      contacts : new MultiFileProperty("Contact",  [Personne]),
      date : new Property("Date"),
      etat : new Property("Etat"),
    }
  }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Action
    }

    static getProperties(){
      return Action.Properties
    }


    async populate(...args : any[]){
        //get the parent
      let parent = await selectFile(this.vault, Action.parentProperty.classes, "Selectionner un client")
      if (!parent) {return}


      await this.updateMetadata(Action.parentProperty.name, parent.getLink())
      await this.update()
    }

    // Validate that the file content is standart
    async check(){
      // Check si le l'institution est correct
      //await this.reorderMetadata(Object.values(Personne.Properties).map(p => p.name));

    }
  }
  