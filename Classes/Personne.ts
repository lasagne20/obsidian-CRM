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
import { ClasseProperty } from "Utils/Properties/ClasseProperty";
import { EmailProperty } from "Utils/Properties/EmailProperty";
import { PhoneProperty } from "Utils/Properties/PhoneProperty";
import { LinkProperty } from "Utils/Properties/LinkProperty";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";
import { RatingProperty } from "Utils/Properties/RatingProperty";
import { MultiSelectProperty } from "Utils/Properties/MultiSelectProperty";
import { DateProperty } from "Utils/Properties/DateProperty";
import { AdressProperty } from "Utils/Properties/AdressProperty";
import { isArray } from "util";

export class Personne extends Classe {

    public static className : string = "Personnes";
    public static classIcon : string = "circle-user-round";

    public static parentProperty: FileProperty  = new FileProperty("Institution", [Institution, Lieu], Institution.classIcon);

    public static get Properties() : { [key: string]: Property } {
      return {
      classe : new ClasseProperty("Classe", this.classIcon),
      email : new EmailProperty("Email"),
      phone : new PhoneProperty("Téléphone"),
      portable : new PhoneProperty("Portable", "smartphone"),
      linkedin : new LinkProperty("Linkedin", "linkedin"),
      postes : new ObjectProperty("Postes", "", 
        {institution : this.parentProperty,
         poste : new Property("Poste", "")}),
      relation : new MultiSelectProperty("Type de relation", ["client", "vecteur", "expert", "soutien"]),
      etat:  new SelectProperty("Etat", ["Pas encore contacté", "Prise de contact en cours", "Suivie d'affaire", "En attente de soliciation"]),
      interlocuteur : new MultiSelectProperty("Interlocuteur", ["Sylvie", "Léo"]),
      tache : new SelectProperty("Prochaine tache", ["Prise de contact", "Relance 1", "Relance 2", "Faire le point", "Valider point"]),
      lastContact: new DateProperty("Dernier contact", ["today"]),
      nextContact : new DateProperty("Prochain contact", ["next-week"]),
      introduit : new Property("Introduit par"),
      adresse : new AdressProperty("Adresse", "map-pin-house"),
      codePostal : new Property("Code postale"),
      lieu : new FileProperty("Lieux", [Lieu], Lieu.classIcon),
      prioriété : new RatingProperty("Priorité"),
      liens : new Property("Liens")
    }
  }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Personne
    }

    getparentProperties() : FileProperty| MultiFileProperty{
      // If we have a lieu and no Institution, parent is the lieu
      if (!Personne.parentProperty.read(this) && Personne.Properties.lieu.read(this)){
           return (Personne.Properties.lieu as FileProperty)
      }
      return Personne.parentProperty
    }

    async getParent() : Promise<Classe |undefined>{
      return this.getparentProperties().getFile(this)
    }

    getParentValue() : string{
      let parent = this.getparentProperties()
      let value = parent.read(this)
      if (value) {
        if (typeof value === "string") {
          return value.slice(2, -2)
        } else {
          return value[0].slice(2, -2)
        }
      }
      return ""
      


    }


    static getProperties(){
      return Personne.Properties
    }

    async populate(...args : any[]){
        //get the parent
      let parent = await selectFile(this.vault, Personne.parentProperty.classes, "Selectionner une institution")
      if (!parent){
         // try with the lieu
         parent = await selectFile(this.vault, (Personne.Properties.lieu as FileProperty).classes, "Selectionner un lieu")
         if (!parent) {return}
         await this.updateMetadata(Personne.Properties.lieu.name, parent.getLink())
      }
      else {
        await (Personne.Properties.postes as ObjectProperty).updateObject(this, 0, Personne.parentProperty, parent.getLink())
      }
      await this.update()
    }


    getTopDisplayContent() : any{
      const container =  document.createElement("div");

      container.appendChild(Personne.Properties.classe.getDisplay(this))
      
      const firstContainer = document.createElement("div");
      firstContainer.classList.add("metadata-line");
      firstContainer.appendChild(Personne.Properties.email.getDisplay(this))
      firstContainer.appendChild(Personne.Properties.phone.getDisplay(this))
      firstContainer.appendChild(Personne.Properties.portable.getDisplay(this))
      firstContainer.appendChild(Personne.Properties.linkedin.getDisplay(this))
      container.appendChild(firstContainer)

      const secondContainer = document.createElement("div");
      secondContainer.classList.add("metadata-line");
      secondContainer.appendChild(Personne.Properties.postes.getDisplay(this))
      const leftContainer = document.createElement("div");
      leftContainer.classList.add("metadata-column");
      leftContainer.appendChild(Personne.Properties.prioriété.getDisplay(this))
      leftContainer.appendChild(Personne.Properties.relation.getDisplay(this))
      secondContainer.appendChild(leftContainer)
      container.appendChild(secondContainer)

      const thirdContainer = document.createElement("div");
      thirdContainer.classList.add("metadata-line");
      thirdContainer.appendChild(Personne.Properties.etat.getDisplay(this))
      thirdContainer.appendChild(Personne.Properties.interlocuteur.getDisplay(this))
      thirdContainer.appendChild(Personne.Properties.tache.getDisplay(this))
      thirdContainer.appendChild(Personne.Properties.lastContact.getDisplay(this))
      thirdContainer.appendChild(Personne.Properties.nextContact.getDisplay(this))
      container.appendChild(thirdContainer)

      const fourthContainer = document.createElement("div");
      fourthContainer.classList.add("metadata-line");
      fourthContainer.appendChild(Personne.Properties.lieu.getDisplay(this))
      fourthContainer.appendChild(Personne.Properties.adresse.getDisplay(this))
      fourthContainer.appendChild(Personne.Properties.codePostal.getDisplay(this))
      container.appendChild(fourthContainer)

      
      return container
    }

    // Validate that the file content is standart
    async check(){
      // Ajust properties metadata
      const metadata = this.getMetadata();
      if (metadata && "Institutions" in metadata){
        if (metadata["Institutions"]){
          let instit = metadata["Institutions"]
          if (!Array.isArray(instit)){
            instit = [instit]
          }
          let object = instit.map((instit : any, index: any) => {
            let poste = ""
            if (metadata["Poste"]?.length > index){
              poste = metadata["Poste"][index]
            }
              return {"Institution" : instit, "Poste" : poste}
           });
           await this.updateMetadata(Personne.Properties.postes.name, object)
        }
        else {
          await this.updateMetadata(Personne.Properties.postes.name, [])
        }
         await this.removeMetadata("Institutions")
         await this.removeMetadata("Poste")
      }
      if (metadata && !(Personne.Properties.prioriété.name in metadata)){
        await this.updateMetadata(Personne.Properties.prioriété.name, "")
      }
      await this.reorderMetadata(Object.values(Personne.Properties).map(prop => prop.name))
    }
    
  }
