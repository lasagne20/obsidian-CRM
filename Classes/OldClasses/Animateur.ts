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
import { MediaProperty } from "Utils/Properties/MediaProperty";
import { Tabs } from "Utils/Display/Tabs";


export class Animateur extends Classe {

    public static className : string = "Animateur";
    public static classIcon : string = "contact-round";

    public static parentProperty = new FileProperty("Departement", ["Lieu"], {icon: Lieu.classIcon});

    
    public static Properties : { [key: string]: Property } ={
      classe : new ClasseProperty("Classe", this.classIcon),
      personne : new FileProperty("Personne", ["Personne"], {icon : Personne.classIcon}),
      facturations : new ObjectProperty("Facturations", {
        Animations : new MultiFileProperty("Animations", ["Action"], {icon: "run"}),
        facture : new MediaProperty("Facture", {icon: "file"}),
        etat : new SelectProperty("Etat", [
          {name: "A facturer", color: "red"},
          {name: "Facturé", color: "green"},
          {name: "Payé", color: "blue"},
          {name: "Formation", color: "yellow"},
        ], {defaultValue: "A facturer"}),}),
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

      const secondContainer = document.createElement("div");
      secondContainer.classList.add("metadata-line");
      secondContainer.appendChild(Animateur.Properties.facturations.getDisplay(this))
      container.appendChild(secondContainer)

      let button = addButton("Ajouter une animation", async () => {
        let action = await selectFile(this.vault, ["Action"], {hint: "Selectionner une action"})
        if (!action) {return}
        
        let animateurs = action.getMetadataValue("Animateurs") || [];
        animateurs.push({Animateur: this.getLink(), Tarif: ""})
        await action.updateMetadata("Animateurs", animateurs)
        await this.update()
      })
      container.appendChild(button)

      let actions = this.getIncomingLinks().filter((link) => link.getClasse() == "Action" && link.getMetadataValue("Etat") != "Annulé")
      // Filtrer les actions qui sont dans la propriété Facturations.Animations
      let facturations = Animateur.Properties.facturations.read(this) || {};
      if (!facturations || !facturations.length) {facturations = []}
      let actions_facturé = actions.filter((action) => {
        return facturations.some((f : any) => f.Animations.some((a: string) => {
          console.log("Comparing:", a, action.getName(false));
          return a.contains(action.getName(false))}));
      });
      let actions_non_facturé = actions.filter((action) => {
        return !facturations.some((f : any) => f.Animations.some((a: string) => a.contains(action.getName(false))));
      });
      
      let tabs = new Tabs();
      
      let table_non_facturé = new DynamicTable(this.vault, actions_non_facturé);
      table_non_facturé.addColumn("Date", "date")
      table_non_facturé.addColumn("Etat", "etat", {filter: "multi-select"})
      table_non_facturé.addColumn("Montant", `
      if (!Animateurs) {return ""}
      for (let animateur of Animateurs){
        if (animateur.Animateur.includes("${this.getName(false)}") && animateur.Tarif){
          return animateur.Tarif + ' €'
        }
     }
      `) 
      table_non_facturé.addTotalRow("Montant", (values) => {
      return values.reduce((acc, value) => acc + value, 0) + ' €'
      })
      table_non_facturé.sortTableByColumn("Date");

      tabs.addTab("Animations non facturées", table_non_facturé.getTable())

      let table_facturé = new DynamicTable(this.vault, actions_facturé);
      table_facturé.addColumn("Date", "date")
      table_facturé.addColumn("Etat", "etat", {filter: "multi-select"})
      table_facturé.addColumn("Montant", `
      if (!Animateurs) {return ""}
      for (let animateur of Animateurs){
        if (animateur.Animateur.includes("${this.getName(false)}") && animateur.Tarif){
          return animateur.Tarif + ' €'
        }
      }
      `)
      table_facturé.addTotalRow("Montant", (values) => {
      return values.reduce((acc, value) => acc + value, 0) + ' €'
      })
      table_facturé.sortTableByColumn("Date");

      tabs.addTab("Animations facturées", table_facturé.getTable())


      container.appendChild(tabs.getContainer())
      
      return container
    }

    // Validate that the file content is standart
    async check(){

      await super.check()
    }
    
  }
