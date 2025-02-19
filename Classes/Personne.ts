import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App} from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { FileProperty } from "Utils/Properties/FileProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { Institution } from "./Institution";

export class Personne extends Classe {

    public static className : string = "Personnes";

    public static get Properties() {
      return {
      classe : new Property("Classe"),
      mail : new Property("Email"),
      telephone : new Property("Téléphone"),
      poste : new Property("Poste"),
      linkedin : new Property("Linkedin"),
      institutions : new MultiFileProperty("Institutions", Institution),
      relation : new Property("Type de relation"),
      etat:  new Property("Etat"),
      interlocuteur : new Property("Interlocuteur"),
      tache : new Property("Prochaine tache"),
      lastContact: new Property("Dernier contact"),
      nextContact : new Property("Prochain contact"),
      introduit : new Property("Introduit par"),
      addresse : new Property("Addresse"),
      prioriété : new Property("Priorité"),
      liens : new Property("Liens")
    }
  }
    
    constructor(app : App, vault:MyVault, file : File) {
      super(app, vault, file)
    }

    getClasse(){
      return Personne.className
    }

    static getProperties(){
      return Personne.Properties
    }

    async update(){
      await this.check()
      await this.updateChildren(Personne.Properties.institutions)
    }

    // Validate that the file content is standart
    async check(){
      // Check si le l'institution est correct
      await Personne.Properties.institutions.check(this.file)

    }
  }
  