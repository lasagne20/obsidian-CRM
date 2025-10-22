import { Classe } from "Classes/Classe";
import { SubClass } from "Classes/SubClasses/SubClass";
import { App, TFile } from "obsidian";
import { promptTextInput, selectFile, selectSubClasses } from "Utils/Modals/Modals";
import { MyVault } from "Utils/MyVault";
import { ClasseProperty } from "Utils/Properties/ClasseProperty";
import { FileProperty } from "Utils/Properties/FileProperty";
import { LinkProperty } from "Utils/Properties/LinkProperty";
import { MediaProperty } from "Utils/Properties/MediaProperty";
import { NumberProperty } from "Utils/Properties/NumberProperty";
import { Property } from "Utils/Properties/Property";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { Assemblage } from "./Assemblage";
import { EmailProperty } from "Utils/Properties/EmailProperty";
import { Fournisseur } from "./Fournisseur";
import { DateProperty } from "Utils/Properties/DateProperty";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";


export class Commande extends Classe {

    public static className : string = "Commande";
    public static classIcon : string = "shopping-cart";

    public static parentProperty : any = new FileProperty("Fournisseur", ["Fournisseur"], {icon: "store"});
    
    public static Properties : { [key: string]: Property } = {
      classe : new ClasseProperty("Classe", this.classIcon),
      fournisseur : Commande.parentProperty,
      date : new DateProperty("Date", ["today"],{icon: "calendar"}),
      facture : new MediaProperty("Facture", {icon: "file-check"}),
      etat : new SelectProperty("État", [
        {name: "A commandé", color: "orange"},
        {name: "Commandé", color: "blue"},
        {name: "Livrée", color: "green"}, 
        {name: "Annulée", color: "red"},
      ]),
      port : new NumberProperty("Port", "€", {icon: "coin"}),
      taxes : new NumberProperty("Taxes", "€", {icon: "coin"}),
      founitures : new ObjectProperty("Fournitures",{
         fourniture : new FileProperty("Fourniture", ["Fourniture"], {icon: "file"}),
         quantite : new NumberProperty("Quantité", "", {icon: "hashtag"}),
         prixUnit : new NumberProperty("PrixUnit", "€", {icon: "coin"}),
         prix : new NumberProperty("Prix", "€", {icon: "coin"}),
      }, {icon: "box"}),
      prixTTC : new NumberProperty("PrixTTC", "€ (TTC)", {formula : 
        "(Fournitures?.reduce((acc, f) => acc + (f.Prix ? Number(f.Prix || 0) : (Number(f.Quantité || 0) * Number(f.PrixUnit || 0))), 0)+ Number(Port ||0) + Number(Taxes || 0)).toFixed(2)", icon: "calculator"}),
    }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Commande
    }

    getParentValue(): string {
      return "";
    }

    static getConstructor(){
      return Commande
    }

    async populate(args : {parent : Classe | null, type : SubClass |null, code: string| null} = {parent : null, type : null, code: null}){
        //get the parent
        let parent
        if (args.parent){
          parent = args.parent
        }
        else {
           parent = await selectFile(this.vault, ["Fournisseur"], {hint:"Selectionner un fournisseur"})
        }
        await this.updateMetadata(Commande.Properties.fournisseur.name, parent?.getLink())
        await this.update()
    }


    getTopDisplayContent() : any{
      const container =  document.createElement("div");

      let firstContainer = document.createElement("div");
      firstContainer.classList.add("metadata-line")
      firstContainer.appendChild(Commande.Properties.classe.getDisplay(this))
      firstContainer.appendChild(Commande.Properties.fournisseur.getDisplay(this))
      firstContainer.appendChild(Commande.Properties.date.getDisplay(this, {title: "Date :"}))
      firstContainer.appendChild(Commande.Properties.etat.getDisplay(this, {title: "État :"}))
      container.appendChild(firstContainer)

      const secondContainer = document.createElement("div");
      secondContainer.classList.add("metadata-line")
      secondContainer.appendChild(Commande.Properties.port.getDisplay(this, {title: "Port :"}))
      secondContainer.appendChild(Commande.Properties.taxes.getDisplay(this, {title: "Taxes :"}))
      secondContainer.appendChild(Commande.Properties.prixTTC.getDisplay(this, {title: "Total :"}))
      secondContainer.appendChild((Commande.Properties.facture as MediaProperty).getDisplay(this))
      container.appendChild(secondContainer)

      const thirdContainer = document.createElement("div");
      thirdContainer.classList.add("metadata-line")
      thirdContainer.appendChild(Commande.Properties.founitures.getDisplay(this, {title: "Fournitures :"}))
      container.appendChild(thirdContainer)

      return container
    }

    // Validate that the file content is standart
    async check(){
      this.startWith(Commande.Properties.date)
      await super.check()
    }
     
  }
