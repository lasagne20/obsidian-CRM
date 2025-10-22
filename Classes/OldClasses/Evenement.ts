import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { FileProperty } from "Utils/Properties/FileProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { selectFile } from "Utils/Modals/Modals";
import { DynamicTable } from "Utils/Display/DynamicTable";
import { Suivi } from "./GroupProperties/Suivi";


export class Evenement extends Classe {

    public static className : string = "Evenement";

    public static parentProperty: FileProperty = new FileProperty("Lieu", ["Lieu"], {icon :"map-pin"});

    public static Properties = {
      classe : new Property("Classe"),
      parent : this.parentProperty,
      organisateurs : new MultiFileProperty("Organisateurs", ["Institution", "Partenariat"], {icon :"badge-euro"})
   }

    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Evenement
    }
    static getConstructor(){
      return Evenement
    }


    async populate(...args : any[]){
      super.populate(...args)
      let parent = await selectFile(this.vault, Evenement.parentProperty.classes, {hint:"Selectionner le lieux parent"})
      if (parent){
        await this.updateMetadata(Evenement.parentProperty.name, parent.getLink())
      }
      await this.update()
    }

    getTopDisplayContent() : any{
      const container =  document.createElement("div");

      let metadataContainer = document.createElement("div");
      metadataContainer.classList.add("metadata-line");
      metadataContainer.appendChild(Evenement.Properties.classe.getDisplay(this))
      metadataContainer.appendChild(Evenement.Properties.parent.getDisplay(this))
      metadataContainer.appendChild(Evenement.Properties.organisateurs.getDisplay(this))
      container.appendChild(metadataContainer)


      let data = this.getIncomingLinks().filter((link) => link.getClasse() == "Action")
      let table = new DynamicTable(this.vault, data)
      table.addColumn("Date", "date")
      table.addColumn("Etat", "etat")
      table.addColumn("Montant", `
        for (let financeur of Financeurs){
          if (financeur.Financeur == "${this.getLink()}"){
            return financeur.Montant + ' €'
          }
        }
        `)
  
      table.addTotalRow("Montant", (values) => {
        return values.reduce((acc, value) => acc + value, 0) + ' €'
      })
      container.appendChild(table.getTable())

      container.appendChild(Suivi.getLinkDisplay(this))
      
      return container
    }


    async check(){
      await super.check()
      // Ajust properties metadata
    }
  }
  