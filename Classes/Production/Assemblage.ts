import { Classe } from "Classes/Classe";
import { App, TFile } from "obsidian";
import { MyVault } from "Utils/MyVault";
import { ClasseProperty } from "Utils/Properties/ClasseProperty";
import { FileProperty } from "Utils/Properties/FileProperty";
import { MediaProperty } from "Utils/Properties/MediaProperty";
import { NumberProperty } from "Utils/Properties/NumberProperty";
import { Property } from "Utils/Properties/Property";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";
import { SubClassProperty } from "Utils/Properties/SubClassProperty";
import { promptTextInput, selectClass, selectFile, selectSubClasses } from "Utils/Modals/Modals";
import { SubClass } from "Classes/SubClasses/SubClass";
import { MultiMediaProperty } from "Utils/Properties/MultiMediaProperty";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";
import { TextProperty } from "Utils/Properties/TextProperty";
import { HearderProperty } from "Utils/Properties/HeaderProperty";
import { FreecadFile } from "Utils/3D/FreecadFile";
import { FreecadClasse } from "./FreecadClasse";
import { DynamicTable } from "Utils/Display/DynamicTable";
import { stat } from "fs";
import { Fourniture } from "./Fourniture";
import { Tabs } from "Utils/Display/Tabs";
import { add } from "cheerio/dist/commonjs/api/traversing";
import { addButton } from "Utils/Display/Utils";
import { val } from "cheerio/dist/commonjs/api/attributes";
import { FreecadSubclasse } from "./PieceSubclasses/FreecadSubClasse";


export class Assemblage extends FreecadClasse {

    public static className : string = "Assemblage";
    public static classIcon : string = "blocks";

    public static parentProperty : any = new FileProperty("Parent", [Assemblage.className, "Famille"], {icon : "folder-tree"});


    
    public static Properties : { [key: string]: Property } ={
      ...FreecadClasse.Properties,
      stock : new NumberProperty("Stock", "", {icon: "layers"}),
      files : new MultiMediaProperty("Fichiers", {icon: "file", display: "icon"}),
      pieces : new ObjectProperty("Pieces", {
        piece : new FileProperty("Piece", ["Piece", Assemblage.className], {icon: "puzzle"}),
        quantite : new NumberProperty("Nombre", "", {icon: "arrow-up-0-1"}),
      }, {icon: "puzzle"}),
    }

    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Assemblage
    }

    static getConstructor(){
      return Assemblage
    }


    produceByClasses(): Classe[] {
      return this.getMetadataValue(Assemblage.Properties.pieces.name)
                .map((piece: any) => { return this.vault.getFromLink(piece.Piece);})
    }

    async getTopDisplayContent() {
      const container = await super.getTopDisplayContent()

      let secondContainer = document.createElement("div");
      secondContainer.classList.add("metadata-line")
      
      let secondcoloneContainer = document.createElement("div");
      secondcoloneContainer.classList.add("metadata-column")
      secondcoloneContainer.appendChild(Assemblage.Properties.stock.getDisplay(this, {title:"Stock : "}))
      secondcoloneContainer.appendChild(Assemblage.Properties.files.getDisplay(this))
      secondContainer.appendChild(secondcoloneContainer)
      secondContainer.appendChild((Assemblage.Properties.model as MediaProperty).getDisplay(this, {staticMode:true, display : "embed",
        createOptions: {title: "Crée fichier freecad",
          createFunction: () => this.createFreecadFile("3D",this.getCode() + (this.getMetadataValue("Description") ?  " - " + this.getMetadataValue("Description") : ""),this.getCode())}}))
 
      container.appendChild(secondContainer)

      let tabs = new Tabs()
      if (await this.getFreecadFile()){
              let subClasses = await this.getListOfSubElements(this.getCode())

              let container = document.createElement("div");


              let button = addButton("Créer les fichiers md", async () => {
                for (const cls of subClasses) {
                  if (cls instanceof FreecadSubclasse) {
                    const parent = cls.getParent();
                    await this.vault.createFile(
                      cls.classe,
                      cls.getName(),
                      { parent: parent instanceof Classe ? parent : this }
                    )
                  }
                }
                
              })
              container.appendChild(button);

              let table = new DynamicTable(this.vault, subClasses)
              table.addColumn("3D", "model", {args : {display: "embed"}})
              let displayProperties = (Assemblage.Properties.pieces as ObjectProperty).getDisplayProperties(this, "piece", "quantite");
              table.addDisplayPropertyColumn("Nombre", displayProperties)
              table.addTotalRow("Nombre", (values: any) => {
                return values.reduce((acc: number, item: any) => acc + (item || 0), 0);
              })
              table.addTotalRow("3D", (values: any) => {
                return values.reduce((acc: number, item: any) => acc + 1, 0);
              })
              container.appendChild(table.getTable());
              tabs.addTab("Composants", container);
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

      let countInfos =  this.getCount()
      let countTable = new DynamicTable(this.vault, countInfos.map(info => info.classe))
      countTable.addDisplayPropertyColumn("Nombre", countInfos.map(info => {
        const span = document.createElement("span");
        span.textContent = info.count.toString();
        return {classe: info.classe, display: span};
      }))
      tabs.addTab("Nombre d'occurence", countTable.getTable())


      container.appendChild(tabs.getContainer())

      return container
    }

    async update(){
       await super.update()
       await this.fillPieces();
    }

    getCount(elementName: string = "", list : {classe : Classe, count: number, level: number}[] = [], lastNumber : number = 0, level: number = 0)
        : {classe : Classe, count: number, level: number}[] {
        let partCount = (Assemblage.Properties.pieces as ObjectProperty).findValue(this, elementName ? elementName : this.getName(false), "Nombre") || 0;
        if (partCount > 0) {
          const existingItem = list.find(item => item.classe.getID() === this.getID());
          if (existingItem) {
            // If the class is already in the list, update its count
            existingItem.count += partCount * lastNumber;
          }
          else {
            list.push({classe: this, count: partCount*(lastNumber ? lastNumber : 1), level: level});
          }
          
        }
        super.getCount(elementName, list, partCount*(lastNumber ? lastNumber : 1), level);

        
        return list
    }

    async fillPieces(){
        let classes = await this.getListOfSubElements(this.getCode()) || [];
        let data = await this.getData(this.getCode())
        console.log("Liste des pièces FreeCAD :", classes);
        let pieces = []
        for (const classe of classes) {
           let number = classe.getMetadataValue("number")
           if (!number){
               let name = classe.getMetadataValue("Code");
               let objData = data?.filter((obj : any) => obj.name === name)[0];
                if (objData) {
                    number = objData.number || 1;
                }
           }

           pieces.push({ Piece: classe.getLink(), Nombre: number });
        }
        if (pieces.length > 0 && this.getMetadataValue(Assemblage.Properties.pieces.name) !== pieces) {
          await this.updateMetadata(Assemblage.Properties.pieces.name, pieces);
        }
        
    }

    // Validate that the file content is standart
    async check(){
      await super.check()
      await this.moveMediaToFolder(Assemblage.Properties.files, "Fichiers")
    }
  }
