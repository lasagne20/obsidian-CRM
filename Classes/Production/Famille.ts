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
import { Fournisseur } from "./Fournisseur";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";
import { HearderProperty } from "Utils/Properties/HeaderProperty";
import { FreecadFile } from "Utils/3D/FreecadFile";
import { FreecadClasse } from "./FreecadClasse";
import { FreecadSubclasse } from "./PieceSubclasses/FreecadSubClasse";
import { DynamicTable } from "Utils/Display/DynamicTable";
import { Fourniture } from "./Fourniture";
import { MultiMediaProperty } from "Utils/Properties/MultiMediaProperty";
import { addButton } from "Utils/Display/Utils";
import { Tabs } from "Utils/Display/Tabs";


export class Famille extends FreecadClasse {

    public static className : string = "Famille";
    public static classIcon : string = "package-open";

    public static parentProperty : any = new FileProperty("Parent", [Famille.className, Assemblage.className], {icon: "folder-tree"});

    
    public static Properties : { [key: string]: Property } ={
      ...FreecadClasse.Properties,
      parent: Famille.parentProperty,
      files : new MultiMediaProperty("Fichiers", {icon: "file", display: "icon"}),
    }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Famille
    }

    static getConstructor(){
      return Famille
    }

    produceByClasses(): Classe[] {
      return this.getChildren().filter(classe => classe instanceof FreecadClasse);
    }
 

    async getTopDisplayContent(){
      const container =  await super.getTopDisplayContent()

      const secondContainer = document.createElement("div")
      secondContainer.classList.add("famille-top-display")
      secondContainer.appendChild(Famille.Properties.files.getDisplay(this))
      container.appendChild(secondContainer)

      let name = this.getCode() + (this.getMetadataValue("Description") ? (" - " + this.getMetadataValue("Description")) :"")
      container.appendChild((Famille.Properties.model as MediaProperty).getDisplay(this, {staticMode:true, title: "Ouvrir le modèle 3D", display : "button",
       createOptions: {title: "Crée fichier freecad", createFunction: () => this.createFreecadFile("3D", name, this.getCode())}}))

      let tabs = new Tabs()
      if (await this.getFreecadFile()){
        let subClasses = await this.getListOfSubElements()
        console.log("Liste des parties FreeCAD :", subClasses);
        let table = new DynamicTable(this.vault, subClasses)
        table.addColumn("3D", "model", {args : {display: "embed"}})

        let countInfos = subClasses.map((subClass: FreecadSubclasse | FreecadClasse) => {
          if (subClass instanceof FreecadClasse) {
            const counts = subClass.getCount();
            if (Array.isArray(counts) && counts.length > 0) {
              // Find the count with the max level 
              let countmax = counts.reduce((max, curr) => (curr.level > max.level ? curr : max), counts[0]);
              const span = document.createElement("span");
              span.textContent = countmax.count.toString();
              return {classe: subClass, display: span};
            }
            return;
          }
          return}).filter(info => info !== undefined);
        console.log("Count infos:", countInfos);

        table.addDisplayPropertyColumn("Nombre", countInfos)
        table.addTotalRow("Nombre",  (values) => {
            return values.reduce((acc, value) => acc + value, 0)
          })
        tabs.addTab("Composants", table.getTable());
      }

      let procedures = this.getChildren().filter((child: Classe) => child .getClasse() === "Procédure");
            let proceduresContainer = document.createElement("div");
            let button = addButton("Créer une procédure", async () => {
              let file = await this.vault.createFile(this.vault.getClasseFromName("Procédure"),"", {parent: this})
              if (file){
                const leaf = this.vault.app.workspace.getLeaf();
                await leaf.openFile(file);
              }
            })
            proceduresContainer.appendChild(button);
      
            if (procedures.length > 0){
              let table = new DynamicTable(this.vault, procedures)
              table.addColumn("Procédure", "name", {args : {display: "link"}})
              table.addColumn("Description", "description", {args : {display: "text"}})
              table.addColumn("Durée", "duration", {args : {display: "time"}})
              proceduresContainer.appendChild(table.getTable())
            }
            tabs.addTab("Procédures", proceduresContainer);

      container.appendChild(tabs.getContainer())

      let incomingLinks = this.getIncomingLinks().filter(link => 
        link.getClasse() === "Piece" && 
        link.getMetadataValue("Matériau") && link.getMetadataValue("Matériau").includes(this.getCode())
      );
      if (incomingLinks.length > 0) {
        let table = new DynamicTable(this.vault, incomingLinks)
        table.checkFiles()
        table.addColumn("Description", "description", {args : {size: "1em"}})
        table.addColumn("Dimension", "Dimensions")
        table.addColumn("Nombre", "file.getCount().reduce((max, curr) => (curr.count > max.count ? curr : max)).count", {args : {display: "number"}})
        table.addColumn("Surface (m²)", 
          "(file.getSurfaceArea()*file.getCount().reduce((max, curr) => (curr.count > max.count ? curr : max)).count).toFixed(3) || 0",
          {args : {display: "number"}})
          
        table.addTotalRow("Surface (m²)",  (values) => {
            return values.reduce((acc, value) => acc + value, 0).toFixed(3) + " m²"})

        tabs.addTab("Materiaux", table.getTable())

        let countInfos =  incomingLinks.map((piece: any) => {
          const counts = piece.getCount();
          if (Array.isArray(counts) && counts.length > 0) {
            // Find the count with the max level 
            let count = counts.reduce((max, curr) => (curr.count > max.count ? curr : max));
            console.log("Count for piece", piece.getCode(), ":", count);
            return {classe: count.classe, count: count.count*(piece.getSurfaceArea() || 1)};
          }
          return}).filter(info => info !== undefined)
            .reduce((acc: {classe: any, count: number}[], info) => {
            const existing = acc.find(i => i.classe === info.classe);
            if (existing) {
              existing.count += info.count;
            } else {
              acc.push({classe: info.classe, count: info.count});
            }
            return acc;
          } , []);
        let countTable = new DynamicTable(this.vault, countInfos.map(info => info.classe))
        countTable.addDisplayPropertyColumn("Surface necessaire (m²)", countInfos.map(info => {
          const span = document.createElement("span");
          span.textContent = info.count.toFixed(3).toString();
          return {classe: info.classe, display: span};
        }))
        countTable.addTotalRow("Surface necessaire (m²)", (values: any) => {
          return values.reduce((acc: number, item: any) => acc + parseFloat(item), 0).toFixed(3);
        })
        tabs.addTab("Surface necessaire", countTable.getTable());

      }


      return container
    }

    // Validate that the file content is standart
    async check(){
      await super.check()
      await this.moveMediaToFolder(Famille.Properties.files, "Fichiers")
    }
     
  }

