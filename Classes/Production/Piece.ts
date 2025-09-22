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
import { FormulaProperty } from "Utils/Properties/FormulaProperty";
import { HearderProperty } from "Utils/Properties/HeaderProperty";
import { FreecadClasse } from "./FreecadClasse";
import { DynamicTable } from "Utils/Display/DynamicTable";
import { Pi } from "lucide";
import { Tabs } from "Utils/Display/Tabs";
import { MultiMediaProperty } from "Utils/Properties/MultiMediaProperty";
import { TextProperty } from "Utils/Properties/TextProperty";


export class Piece extends FreecadClasse {

    public static className : string = "Piece";
    public static classIcon : string = "puzzle";
    
    public static Properties : { [key: string]: Property } ={
      ...FreecadClasse.Properties,
      stock : new NumberProperty("Stock", "", {icon: "layers"}),
      temps : new NumberProperty("Temps de production", "h", {icon: "clock"}),
      prix : new NumberProperty("Prix", "€", {icon: "euro-sign"}),
      materiau : new FileProperty("Matériau",  ["Famille"],{icon: "inspection-panel"}),
      dimension : new TextProperty("Dimensions", {icon: "ruler-combined"}),
      images : new MultiMediaProperty("Images", {icon: "image", display: "icon"}),
    }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Piece
    }

    static getConstructor(){
      return Piece
    }

    async update(): Promise<void> {
      await super.update()
      let infos = await this.getData(this.getCode())
      console.log("Infos", infos)
      if (infos && infos.material) {
          let classe = this.getFromCode(infos.material)
          let material = classe ? `[[${classe.getFilePath()}|${(classe as FreecadClasse).getCode()}]]` : infos.material;
          console.log(this.getMetadataValue(Piece.Properties.materiau.name), material)
          if (material && material !== this.getMetadataValue(Piece.Properties.materiau.name)  ) {
            this.updateMetadata(Piece.Properties.materiau.name, material);
        }
      }
      if (infos && infos.svg) {
        let images = this.getMetadataValue(Piece.Properties.images.name)
        if (!images || !Array.isArray(images)) {
          images = [];
        }
        if (images.filter((image : string) => this.vault.readLinkFile(image) == this.vault.readLinkFile(infos.svg)).length === 0) {
          images.push(infos.svg)
          this.updateMetadata(Piece.Properties.images.name, images);
        }
      }

      if (infos && infos.dimensions) {
        if (infos.dimensions !== this.getMetadataValue(Piece.Properties.dimension.name)  ) {
          this.updateMetadata(Piece.Properties.dimension.name, infos.dimensions);
      }
      }
    }

    produceByClasses(): Classe[] {
      let material = this.vault.getFromLink(this.getMetadataValue(Piece.Properties.materiau.name))
      if (material && material.file) {
        return [material];
      }
      return [];
    }

    getSurfaceArea(): number {
      // Get les dimensions et calcule la surface (en m²)
      let dimension = this.getMetadataValue(Piece.Properties.dimension.name)
      if (dimension) {
        let dims = dimension.split("x").map((d: string) => parseFloat(d.trim().replace(",", ".")).valueOf());
        if (dims.length >= 2) {
          // Prend les deux plus grands côtés
            dims.sort((a: number, b: number): number => b - a);
          if (!isNaN(dims[0]) && !isNaN(dims[1])) {
            // Convertit les mm² en m²
            return (dims[0] * dims[1]) / 1_000_000;
          }
        }
      }
      return 0
    }

    async getTopDisplayContent() {
      const container = await super.getTopDisplayContent()

      let secondContainer = document.createElement("div");
      secondContainer.classList.add("metadata-line")
      secondContainer.appendChild(Piece.Properties.stock.getDisplay(this, {title: "Stock :"}))
      secondContainer.appendChild(Piece.Properties.dimension.getDisplay(this, {title: "Dimensions :"}))
      secondContainer.appendChild(Piece.Properties.prix.getDisplay(this, {title: "Prix :"}))
      secondContainer.appendChild(Piece.Properties.materiau.getDisplay(this, {title: "Matériau :"}))
      container.appendChild(secondContainer)
      
      container.appendChild((Piece.Properties.model as MediaProperty).getDisplay(this, {staticMode:true, display : "embed",
        createOptions: {title: "Crée fichier freecad",
          createFunction: () => this.createFreecadFile("3D",this.getCode() + " - " + this.getMetadataValue("Description"),this.getCode())}}))
          
      container.appendChild((Piece.Properties.images as MultiMediaProperty).getDisplay(this, {staticMode:true}))

      let tabs = new Tabs()
      let countInfos =  this.getCount()
      let countTable = new DynamicTable(this.vault, countInfos.map(info => info.classe))
      countTable.addDisplayPropertyColumn("Nombre", countInfos.map(info => {
        const span = document.createElement("span");
        span.textContent = info.count.toString();
        return {classe: info.classe, display: span};
      }))
      tabs.addTab("Nombre d'occurence", countTable.getTable())

      container.appendChild(tabs.getContainer());


      return container
    }

   async check(){
      await super.check()
      await this.moveMediaToFolder(Piece.Properties.images, "Images")
    }
  }
