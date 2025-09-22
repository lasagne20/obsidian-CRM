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
import { Famille } from "./Famille";
import { HearderProperty } from "Utils/Properties/HeaderProperty";
import { FreecadClasse } from "./FreecadClasse";
import { DynamicTable } from "Utils/Display/DynamicTable";
import { count, info } from "console";
import { TextProperty } from "Utils/Properties/TextProperty";
import { FreecadFile } from "Utils/3D/FreecadFile";
import { SubClassProperty } from "Utils/Properties/SubClassProperty";
import { Unitaire } from "./FournitureSubclasses/Unitaire";
import { Surface } from "./FournitureSubclasses/Surface";
import { Lineaire } from "./FournitureSubclasses/Linéaire";


export class Fourniture extends FreecadClasse {

    public static className : string = "Fourniture";
    public static classIcon : string = "package-open";

    public static subClassesProperty : SubClassProperty = new SubClassProperty("Type", [
                                  new Unitaire(Assemblage),
                                  new Lineaire(Assemblage),
                                  new Surface(Assemblage)])


    public static Properties : { [key: string]: Property } ={
      ...FreecadClasse.Properties,
      stock : new NumberProperty("Stock", "", {icon: "layers"}),
      type : this.subClassesProperty,
      fournisseurs : new ObjectProperty("Fournisseurs", {
        fournisseur : new FileProperty("Fournisseur", [Fournisseur.className], {icon : "folder-tree"}),
        lien : new LinkProperty("Lien", {icon: "globe"}),
        prix : new NumberProperty("Prix", "€", {icon: "euro-sign"}),
      }, {icon: "coin"}),
      dimensions : new TextProperty("Dimensions", {icon: "ruler-combined"}),
      materiau : new FileProperty("Matériau", ["Famille"], {icon: "inspection-panel"}),
    }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Fourniture
    }

    static getConstructor(){
      return Fourniture
    }

    async update(): Promise<void> {
      await super.update()
      let infos = await this.getData(this.getCode())
      if (infos && infos.material) {
          let classe = this.getFromCode(infos.material)
          let material = classe ? `[[${classe.getFilePath()}|${(classe as FreecadClasse).getCode()}]]` : infos.material;
          if (material && material !== this.getMetadataValue(Fourniture.Properties.materiau.name)  ) {
            this.updateMetadata(Fourniture.Properties.materiau.name, material);
        }
      }
    }

    async getTopDisplayContent() {
     const container =  await super.getTopDisplayContent()

     let secondContainer = document.createElement("div");
      secondContainer.classList.add("metadata-line");
      secondContainer.appendChild(Fourniture.Properties.type.getDisplay(this))
      secondContainer.appendChild(Fourniture.Properties.materiau.getDisplay(this, {title: "Matériau : "}))
      secondContainer.appendChild(Fourniture.Properties.stock.getDisplay(this, {title:"Stock : "}))
      container.appendChild(secondContainer)

      container.appendChild((Fourniture.Properties.model as MediaProperty).getDisplay(this, {staticMode:true, display : "embed",
        createOptions: {title: "Crée fichier freecad", createFunction: () => this.createFreecadFile("3D",  this.getCode() + " - " + this.getMetadataValue("Description"), this.getCode())}}))

      container.appendChild((Fourniture.Properties.type as SubClassProperty).getTopDisplayContent(this))

      return container
    }


     
  }
