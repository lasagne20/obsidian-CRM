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
import { Personne } from "./Personne";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";
import { DynamicTable } from "Utils/Display/DynamicTable";
import { addButton } from "Utils/Display/Utils";


export class Animateur extends Classe {

    public static className : string = "Animateur";
    public static classIcon : string = "contact-round";

    public static parentProperty = new FileProperty("Departement", ["Lieu"], {icon: Lieu.classIcon});

    
    public static Properties : { [key: string]: Property } ={
      classe : new ClasseProperty("Classe", this.classIcon),
      personne : new FileProperty("Personne", ["Personne"], {icon : Personne.classIcon}),
    }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Animateur
    }

    static getConstructor(){
      return Animateur
    }
    
    async populate(args : {parent? : Classe | null} = {parent : null}): Promise<void>{
        //get the parent
      let parent = args["parent"] || null;
      if (!parent){parent = await selectFile(this.vault, Animateur.parentProperty.classes, {hint:"Selectionner l'assemblage ou la famille parent"}) || null}
      if (parent){
        await this.updateMetadata(Animateur.parentProperty.name, parent.getLink())
      }
      await this.update()
    }


    getTopDisplayContent() : any{
      const container =  document.createElement("div");

      container.appendChild(Personne.Properties.classe.getDisplay(this))
      
      const firstContainer = document.createElement("div");
      firstContainer.classList.add("metadata-line");
      firstContainer.appendChild(Animateur.parentProperty.getDisplay(this, {title: "Département : "}))
      firstContainer.appendChild(Animateur.Properties.personne.getDisplay(this, {title: "Personne : "}))
      container.appendChild(firstContainer)

      let button = addButton("Ajouter une animation", async () => {
        let action = await selectFile(this.vault, ["Action"], {hint: "Selectionner une action"})
        if (!action) {return}
        
        let animateurs = action.getMetadataValue("Animateurs") || [];
        animateurs.push({Animateur: this.getLink(), Tarif: ""})
        await action.updateMetadata("Animateurs", animateurs)
        await this.update()
      })
      container.appendChild(button)

      let data = this.getIncomingLinks().filter((link) => link.getClasse() == "Action" && link.getMetadataValue("Etat") != "Annulé")
      let table = new DynamicTable(this.vault, data)
      table.addColumn("Date", "date")
      table.addColumn("Etat", "etat", {filter: "multi-select"})
      table.addColumn("Montant", `
      if (!Animateurs) {return ""}
      for (let animateur of Animateurs){
        if (animateur.Animateur == "${this.getLink()}" && animateur.Tarif){
          return animateur.Tarif + ' €'
        }
     }
      `)
      table.addTotalRow("Montant", (values) => {
      return values.reduce((acc, value) => acc + value, 0) + ' €'
      })
      table.sortTableByColumn("Date");

      container.appendChild(table.getTable())
      
      return container
    }

    // Validate that the file content is standart
    async check(){
      await super.check()
    }
    
  }
