import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
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
import { Suivi } from "./GroupProperties/Suivi";
import { TextProperty } from "Utils/Properties/TextProperty";

export class Personne extends Classe {

    public static className : string = "Personne";
    public static classIcon : string = "circle-user-round";

    public static parentProperty = new ObjectProperty("Postes", 
      {institution : new FileProperty("Institution", ["Institution", "Lieu"], Institution.classIcon),
       poste : new Property("Poste", {icon:""})});

    
    public static Properties : { [key: string]: Property } ={
      classe : new ClasseProperty("Classe", this.classIcon),
      email : new EmailProperty("Email"),
      phone : new PhoneProperty("Téléphone"),
      portable : new PhoneProperty("Portable", {icon :"smartphone"}),
      linkedin : new LinkProperty("Linkedin", {icon :"linkedin"}),
      postes : this.parentProperty,
      relation : new MultiSelectProperty("Type de relation", [
      { name: "client", color: "" },
      { name: "vecteur", color: "" },
      { name: "expert", color: "" },
      { name: "Ambassadeur", color: "" },
      { name: "Animateur", color: "" },
      { name: "Partenaire", color: "" }
      ]),
      etat:  new SelectProperty("Etat", [
      { name: "Pas encore contacté", color: "" },
      { name: "Prospection", color: "" },
      { name: "Intéressé", color: "" },
      { name: "Définition d'une action", color: "" },
      { name: "Organisation d'action", color: "" },
      { name: "En attente de soliciation", color: "" }
      ]),
      interlocuteur : new MultiSelectProperty("Interlocuteur", [ 
      { name: "Sylvie", color: "blue" },
      { name: "Léo", color: "red" }
      ]),
      tache : new SelectProperty("Prochaine tache", [
      { name: "Prospection", color: "" },
      { name: "Relance", color: "" },
      { name: "Planification", color: "" },
      { name: "Organisation", color: "" }
      ]),
      lastContact: new DateProperty("Dernier contact", ["today"]),
      nextContact : new DateProperty("Prochain contact", ["next-week"]),
      introduit : new FileProperty("Introduit par", ["Personne"], {icon :Personne.classIcon}),
      adresse : new AdressProperty("Adresse", {icon :"house"}),
      codePostal : new Property("Code postale", ),
      lieu : new FileProperty("Lieux", ["Lieu"], {icon :Lieu.classIcon}),
      prioriété : new RatingProperty("Priorité"),
      liens : new ObjectProperty("Liens", 
      { lien : new MultiFileProperty("Lien", ["Lieu", "Personne", "Institution", "Partenariat"], {icon :"link"}),
        description: new TextProperty("Description")}),
      ...Suivi.SuiviProperties,
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
      let parent = await selectFile(this.vault, [Institution.getClasse(), Lieu.getClasse()], {hint:"Selectionner une institution"})
      if (!parent){
         // try with the lieu
         parent = await selectFile(this.vault, (Personne.Properties.lieu as FileProperty).classes, {hint:"Selectionner un lieu"})
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

      const fourthContainer = document.createElement("div");
      fourthContainer.classList.add("metadata-line");
      fourthContainer.appendChild(Personne.Properties.lieu.getDisplay(this, {title: "Lieu : " }))
      fourthContainer.appendChild(Personne.Properties.adresse.getDisplay(this,{title:"Adresse : "}))
      fourthContainer.appendChild(Personne.Properties.codePostal.getDisplay(this, {title:"Code postal : "}))
      fourthContainer.appendChild(Personne.Properties.introduit.getDisplay(this, {title: "Introduit par : "}))
      container.appendChild(fourthContainer)

      const thirdContainer = document.createElement("div");
      thirdContainer.classList.add("metadata-line");
      thirdContainer.appendChild(Personne.Properties.etat.getDisplay(this, {title: "Etat : "}))
      thirdContainer.appendChild(Personne.Properties.interlocuteur.getDisplay(this))
      thirdContainer.appendChild(Personne.Properties.tache.getDisplay(this, {title: "Prochaine tache : " }))
      thirdContainer.appendChild(Personne.Properties.lastContact.getDisplay(this, {title: "Dernier contact : "}))
      thirdContainer.appendChild(Personne.Properties.nextContact.getDisplay(this, {title:"Prochain contact : "}))
      container.appendChild(thirdContainer)

      

      let liensContainer = Personne.Properties.liens.getDisplay(this)
      container.appendChild(liensContainer)

      container.appendChild(Suivi.getDisplay(this))

      
      return container
    }

    // Validate that the file content is standart
    async check(){
      await super.check()
    }
    
  }
