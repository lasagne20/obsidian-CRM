import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { FileProperty } from "Utils/Properties/FileProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { Institution } from "./Institution";
import { Lieu } from "./Lieux";
import { selectFile } from "Utils/Modals/Modals";

export class Personne extends Classe {

    public static className : string = "Personnes";

    public static parentProperty: FileProperty  = new MultiFileProperty("Institutions", Institution);

    public static get Properties() {
      return {
      classe : new Property("Classe"),
      mail : new Property("Email"),
      telephone : new Property("Téléphone"),
      poste : new Property("Poste"),
      linkedin : new Property("Linkedin"),
      institutions : this.parentProperty,
      relation : new Property("Type de relation"),
      etat:  new Property("Etat"),
      interlocuteur : new Property("Interlocuteur"),
      tache : new Property("Prochaine tache"),
      lastContact: new Property("Dernier contact"),
      nextContact : new Property("Prochain contact"),
      introduit : new Property("Introduit par"),
      adresse : new Property("Adresse"),
      codePostal : new Property("Code postale"),
      Lieu : new FileProperty("Lieux", Lieu),
      prioriété : new Property("Priorité"),
      liens : new Property("Liens")
    }
  }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getClasse(){
      return Personne.className
    }

    getPoste(){
      return Personne.Properties.poste.read(this)
    }

    getparentProperties() : FileProperty| MultiFileProperty{
      // If we have a lieu and no Institution, parent is the lieu
      if (!Personne.parentProperty.read(this) && Personne.Properties.Lieu.read(this)){
           return Personne.Properties.Lieu
      }
      return Personne.parentProperty
    }

    static getProperties(){
      return Personne.Properties
    }

    async populate(...args : any[]){
        //get the parent
      let parent = await selectFile(this.vault, Personne.parentProperty.classe, "Selectionner une institution")
      if (!parent){
         // try with the lieu
         parent = await selectFile(this.vault, Personne.Properties.Lieu.classe, "Selectionner un lieu")
         if (!parent) {return}
         await this.updateMetadata(Personne.Properties.Lieu.name, parent.getLink())
      }
      else {
        await this.updateMetadata(Personne.parentProperty.name, parent.getLink())
      }
      await this.update()
    }

    // Validate that the file content is standart
    async check(){
      // Check si le l'institution est correct
      await Personne.Properties.institutions.check(this)
      await this.reorderMetadata(Object.values(Personne.Properties).map(p => p.name));

    }
  }
  