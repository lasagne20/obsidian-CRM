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

export class Action extends Classe {

    public static className : string = "Action";
    public static classIcon : string = "smile";

    public static parentProperty = new ObjectProperty("Clients", "", {
                    client : new FileProperty("Client", ["Institution", "Lieu"], "hand"),
                    contacts : new MultiFileProperty("Contact", ["Personne"], "link"),
                    nombre: new NumberProperty("Nombre de participants", "number"),
                  })

      public static Properties: { [key: string]: Property } = {
      classe : new Property("Classe"),
      clients : Action.parentProperty,
      financeurs : new ObjectProperty("Financeurs", "", {
        financeurs : new FileProperty("Financeurs", ["Institution", "Evenement", "Lieu"], "badge-euro"),
        contacts : new MultiFileProperty("Contacts", ["Personne"]),
        montant: new NumberProperty("Montant", "euro-sign", false, "€"),
        devis : new MediaProperty("Devis envoyé", "file-pen"),
        devisSigne : new MediaProperty("Devis signé", "file-check"),
        facture : new MediaProperty("Facture", "file-clock"),
      }),
      partenariats : new ObjectProperty("Partenariats", "", {
        partenariats : new FileProperty("Partenariat", ["Partenariat"], "handshake"),
        montant: new NumberProperty("Montant", "euro-sign", false, "€"),
      }),
      date : new RangeDateProperty("Date"),
      event : new FileProperty("Evénement", ["Evenement"], "ticket-check"),
      priority : new RatingProperty("Priorité"),
      etat : new SelectProperty("Etat", ["Piste", "Réflexion", "Devis envoyé", "Devis signé", "Réalisé", "Facturé", "Payé", "Annulé"]),
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
      let parent = await selectFile(this.vault, Action.parentProperty.getClasses(), "Selectionner un client")
      if (!parent) {return}


      let values = (Action.parentProperty as ObjectProperty).formatParentValue(parent.getLink())
      await this.updateMetadata(Action.parentProperty.name, values)
    }

    getTopDisplayContent() : any{
      const container =  document.createElement("div");

      let firstContainer = document.createElement("div");
      firstContainer.classList.add("metadata-line")
      firstContainer.appendChild(Action.Properties.classe.getDisplay(this))
      firstContainer.appendChild(Action.Properties.date.getDisplay(this))
      firstContainer.appendChild(Action.Properties.etat.getDisplay(this))
      firstContainer.appendChild(Action.Properties.priority.getDisplay(this))
      container.appendChild(firstContainer)

      
      container.appendChild(Action.Properties.clients.getDisplay(this))
      container.appendChild(Action.Properties.financeurs.getDisplay(this))
      container.appendChild(Action.Properties.partenariats.getDisplay(this))

      
      return container
    }


    async check(){
      // Ajust properties metadata
      await super.check()
      await this.reorderMetadata(Object.values(Action.Properties).map(prop => prop.name))
    }
  }
  