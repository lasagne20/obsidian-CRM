import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
import { Property } from "Utils/Properties/Property";
import { FileProperty } from "Utils/Properties/FileProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { selectFile } from "Utils/Modals/Modals";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";
import { NumberProperty } from "Utils/Properties/NumberProperty";
import { MediaProperty } from "Utils/Properties/MediaProperty";
import { Partenariat } from "./Partenariat";
import { RangeDateProperty } from "Utils/Properties/RangeDateProperty";
import { Institution } from "./Institution";
import { Personne } from "./Personne";
import { Evenement } from "./Evenement";
import { RatingProperty } from "Utils/Properties/RatingProperty";
import { Suivi } from "Classes/GroupProperties/Suivi";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";
import { ClasseProperty } from "Utils/Properties/ClasseProperty";
import { AdressProperty } from "Utils/Properties/AdressProperty";
import { TextProperty } from "Utils/Properties/TextProperty";
import { LinkProperty } from "Utils/Properties/LinkProperty";
import { MultiSelectProperty } from "Utils/Properties/MultiSelectProperty";
import { Tabs } from "Utils/Display/Tabs";

export class Action extends Classe {

    public static className : string = "Action";
    public static classIcon : string = "smile";

    public static parentProperty = new ObjectProperty("Clients", {
                    client : new FileProperty("Client", ["Institution", "Lieu"], {icon : "hand"}),
                    contacts : new MultiFileProperty("Contact", ["Personne"], {icon :"link"}),
                    public : new SelectProperty("Public", [
                      {name: "Ecoliers", color: ""},
                      {name: "Collégiens", color: ""},
                      {name: "Lycéens", color: ""},
                      {name: "Collaborateurs", color: ""},
                      {name: "Grand public", color: ""},
                      {name: "Retraités", color: ""},
                      {name: "Autres", color: ""},
                    ], {icon: "users"}),
                    nombre: new NumberProperty("Participants", "", {icon: "users"}),
                  })

      public static Properties: { [key: string]: Property } = {
        classe : new ClasseProperty("Classe"),
        clients : Action.parentProperty,
        financeurs : new ObjectProperty("Financeurs", {
          financeur : new FileProperty("Financeur", ["Institution", "Evenement", "Lieu"], {icon : "badge-euro"}),
          contacts : new MultiFileProperty("Contacts", ["Personne"]),
          montant: new NumberProperty("Montant", "€", {icon: "euro-sign"}),
          devis : new MediaProperty("Devis envoyé", {icon : "file-pen"}),
          devisSigne : new MediaProperty("Devis signé", {icon :"file-check"}),
          facture : new MediaProperty("Facture", {icon :"file-clock"}),
        }),
        partenariats : new ObjectProperty("Partenariats", {
          partenariat : new FileProperty("Partenariat", ["Partenariat"], {icon :"handshake"}),
          montant: new NumberProperty("Montant", "€", {icon :"euro-sign"}),
        }),
        date : new RangeDateProperty("Date"),
        event : new FileProperty("Evénement", ["Evenement"], {icon :"ticket-check"}),
        priority : new RatingProperty("Priorité"),
        address : new AdressProperty("Adresse"),
        etat : new SelectProperty("Etat", [
          { name: "Piste", color: "gray" },
          { name: "Réflexion", color: "blue" },
          { name: "Devis envoyé", color: "orange" },
          { name: "Devis signé", color: "green" },
          { name: "Date validée", color: "green" },
          { name: "Réalisé", color: "purple" },
          { name: "Facturé", color: "red" },
          { name: "Payé", color: "gold" },
          { name: "Annulé", color: "black" }
        ]),
        montant : new FormulaProperty("Montant total", `
          return (Financeurs ? Financeurs.reduce((sum, f) => sum + Number(f.Montant || 0), 0) : 0) +
          (Partenariats ? Partenariats.reduce((sum, p) => sum + Number(p.Montant || 0), 0) : 0) + " €"`),
        participants : new FormulaProperty("Participants", `
          return (Clients ? Clients.reduce((sum, f) => sum + Number(f.Participants || 0), 0) : 0)`),
        animateurs : new ObjectProperty("Animateurs", {
          animateur : new FileProperty("Animateur", ["Animateur"], {icon: "contact-round"}),
          tarif : new NumberProperty("Tarif", "€", {icon: "euro-sign"}),
        }),
        animations : new ObjectProperty("Animations", {
          animation : new SelectProperty("Animation", [{name: "Atelier Energie", color: "blue"}], {icon: "lightning"}),
          type: new SelectProperty("Type", [{name: "L'energie de nos mains", color: "blue"}, {name: "Explorer nos énergies", color: "blue"}, {name: "Construire nos énergies", color: "green"}, {name: "Oser partager nos énergies", color: "purple"}], {icon: "book-open"}),
          description : new TextProperty("Description", {icon: "file-text"}),
        }),
        presse : new ObjectProperty("Presse", {
          media : new MediaProperty("Media", {icon: "newspaper"}),
          link : new LinkProperty("Lien", {icon: "link"}),
          description : new TextProperty("Description", {icon: "file-text"}),
        }),
        visibilité : new ObjectProperty("Visibilité", {
          type : new MultiSelectProperty("Type", [
            {name: "Parent", color: "blue"},
            {name: 'Elus', color: 'blue'}]),
          nombre : new NumberProperty("Nombre de personnes", "", {icon: "users"}),
          description : new TextProperty("Description", {icon: "file-text"}),
        }),
      }

    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Action
    }
    static getConstructor(){
      return Action
    }

    async populate(...args : any[]){
        //get the parent
      super.populate(...args)
      let parent = await selectFile(this.vault, Action.parentProperty.getClasses(), {hint: "Selectionner un client"})
      if (!parent) {return}


      let values = (Action.parentProperty as ObjectProperty).formatParentValue(parent.getLink())
      await this.updateMetadata(Action.parentProperty.name, values)
    }

    getTopDisplayContent() : any{
      const container =  document.createElement("div");

      let firstContainer = document.createElement("div");
      firstContainer.classList.add("metadata-line")
      firstContainer.appendChild(Action.Properties.classe.getDisplay(this))
      firstContainer.appendChild(Action.Properties.address.getDisplay(this))
      firstContainer.appendChild(Action.Properties.date.getDisplay(this))
      firstContainer.appendChild(Action.Properties.etat.getDisplay(this))
      //firstContainer.appendChild(Action.Properties.priority.getDisplay(this))
      firstContainer.appendChild(Action.Properties.montant.getDisplay(this))
      container.appendChild(firstContainer) 

      let tabs = new Tabs()

      let gestionContainer = document.createElement("div");
      gestionContainer.classList.add("metadata-line");
      gestionContainer.appendChild(Action.Properties.clients.getDisplay(this))
      gestionContainer.appendChild(Action.Properties.financeurs.getDisplay(this))
      gestionContainer.appendChild(Action.Properties.partenariats.getDisplay(this))
      gestionContainer.appendChild(Suivi.getLinkDisplay(this))
      
      tabs.addTab("Gestion", gestionContainer)

      let animationContainer = document.createElement("div");
      animationContainer.classList.add("metadata-line")
      animationContainer.appendChild(Action.Properties.animateurs.getDisplay(this))
      animationContainer.appendChild((Action.Properties.animations as ObjectProperty).getDisplay(this, {display: "table"}))
      animationContainer.appendChild(Action.Properties.presse.getDisplay(this))
      animationContainer.appendChild(Action.Properties.visibilité.getDisplay(this))
      
      tabs.addTab("Animations", animationContainer)

      container.appendChild(tabs.getContainer())
      
      
      
      
      return container
    }

    async check(){
      this.startWith(Action.Properties.date)
    }
  }
  