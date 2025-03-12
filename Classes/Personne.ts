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
import { Partenariat } from "./Partenariat";

export class Personne extends Classe {

    public static className : string = "Personne";
    public static classIcon : string = "circle-user-round";

    public static parentProperty = new ObjectProperty("Postes", "", 
      {institution : new FileProperty("Institution", ["Institution", "Lieu"], Institution.classIcon),
       poste : new Property("Poste", "")});

    
    public static Properties : { [key: string]: Property } ={
      classe : new ClasseProperty("Classe", this.classIcon),
      email : new EmailProperty("Email"),
      phone : new PhoneProperty("Téléphone"),
      portable : new PhoneProperty("Portable", "smartphone"),
      linkedin : new LinkProperty("Linkedin", "linkedin"),
      postes : this.parentProperty,
      relation : new MultiSelectProperty("Type de relation", ["client", "vecteur", "expert", "Ambassadeur"]),
      etat:  new SelectProperty("Etat", ["Pas encore contacté", "Prise de contact en cours", "Suivie d'affaire", "En attente de soliciation"]),
      interlocuteur : new MultiSelectProperty("Interlocuteur", ["Sylvie", "Léo"]),
      tache : new SelectProperty("Prochaine tache", ["Prise de contact", "Relance 1", "Relance 2", "Faire le point", "Valider point"]),
      lastContact: new DateProperty("Dernier contact", ["today"]),
      nextContact : new DateProperty("Prochain contact", ["next-week"]),
      introduit : new FileProperty("Introduit par", ["Personne"], Personne.classIcon, false),
      adresse : new AdressProperty("Adresse", "house"),
      codePostal : new Property("Code postale", ),
      lieu : new FileProperty("Lieux", ["Lieu"], Lieu.classIcon),
      prioriété : new RatingProperty("Priorité"),
      liens : new ObjectProperty("Liens", "", 
        { lien : new MultiFileProperty("Lien", ["Lieu", "Personne", "Institution", "Partenariat"], "link"),
          description: new Property("Description")})
  }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Personne
    }

    static getConstructor(){
      return Personne
    }

    getparentProperty() : FileProperty | MultiFileProperty | ObjectProperty{
      // If we have a lieu and no Institution, parent is the lieu
      if (!Personne.parentProperty.read(this)&& Personne.Properties.lieu.read(this)){
        return (Personne.Properties.lieu as FileProperty)
      }
      if (Personne.parentProperty.read(this) && Personne.parentProperty.read(this).length === 0 && Personne.Properties.lieu.read(this)){
           return (Personne.Properties.lieu as FileProperty)
      }
      return Personne.parentProperty
    }
    
    async populate(...args : any[]){
        //get the parent
      let parent = await selectFile(this.vault, Personne.parentProperty.getClasses(), "Selectionner une institution")
      if (!parent){
         // try with the lieu
         parent = await selectFile(this.vault, (Personne.Properties.lieu as FileProperty).classes, "Selectionner un lieu")
         if (!parent) {return}
         await this.updateMetadata(Personne.Properties.lieu.name, parent.getLink())
      }
      else {
        let values = (Personne.Properties.postes as ObjectProperty).formatParentValue(parent.getLink())
        await this.updateMetadata(Personne.Properties.postes.name, values)
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
      thirdContainer.appendChild(Personne.Properties.lastContact.getDisplay(this, false, "Dernier contact : "))
      thirdContainer.appendChild(Personne.Properties.nextContact.getDisplay(this, false, "Prochain contact : "))
      container.appendChild(thirdContainer)

      const fourthContainer = document.createElement("div");
      fourthContainer.classList.add("metadata-line");
      fourthContainer.appendChild(Personne.Properties.lieu.getDisplay(this, false, "Lieu : "))
      fourthContainer.appendChild(Personne.Properties.adresse.getDisplay(this, false, "Adresse : "))
      fourthContainer.appendChild(Personne.Properties.codePostal.getDisplay(this, false, "Code postal : "))
      fourthContainer.appendChild(Personne.Properties.introduit.getDisplay(this, false, "Introduit par : "))
      container.appendChild(fourthContainer)

      let liensContainer = Personne.Properties.liens.getDisplay(this)

      container.appendChild(liensContainer)

      
      return container
    }

    // Validate that the file content is standart
    async check(){
      await super.check()
      // Ajust properties metadata
      const metadata = this.getMetadata();
      if (metadata && "Liens" in metadata){
        if (metadata["Liens"]){
          let liens= metadata["Liens"]
          if (liens)
            for (let lien of liens){
              console.log(lien)
              if ((JSON.stringify(lien["Lien"]).contains("link"))){
                liens[liens.indexOf(lien)] = {Lien: [lien["Lien"][0]["link"]], Description: ""}
              }
            }
            await this.updateMetadata(Personne.Properties.liens.name, liens)
        }
      }
      await this.reorderMetadata(Object.values(Personne.Properties).map(prop => prop.name))
    }
    
  }
