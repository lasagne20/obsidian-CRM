import { Classe } from "Classes/Classe";
import { App, TFile } from "obsidian";
import { selectFile, selectMultipleFile } from "Utils/Modals/Modals";
import { MyVault } from "Utils/MyVault";
import { ClasseProperty } from "Utils/Properties/ClasseProperty";
import { FileProperty } from "Utils/Properties/FileProperty";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { NumberProperty } from "Utils/Properties/NumberProperty";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";
import { Property } from "Utils/Properties/Property";
import { TextProperty } from "Utils/Properties/TextProperty";
import { TimeProperty } from "Utils/Properties/TimeProperty ";
import { Assemblage } from "./Assemblage";
import { Famille } from "./Famille";
import { FreecadClasse } from "./FreecadClasse";
import { Piece } from "./Piece";
import { Fourniture } from "./Fourniture";
import { SubClassProperty } from "Utils/Properties/SubClassProperty";
import { MultiStepProcedure } from "./ProcedureSubclasses/MultiStepsProcedure";
import { DecoupeLaserProcedure } from "./ProcedureSubclasses/DecoupeLaserProcedure";



export class Procedure extends Classe {

    public static className : string = "Procédure";
    public static classIcon : string = "layout-list";

    public static parentProperty : any = new FileProperty("Parent", ["Famille", "Assemblage", "Piece"], {icon: "folder-tree"});

    public static subClassesProperty : any = new SubClassProperty("Type de procédure", [
                            new MultiStepProcedure(Procedure),
                            new DecoupeLaserProcedure(Procedure)
                          ]);
    
    public static Properties : { [key: string]: Property } ={
      classe : new ClasseProperty("Classe", this.classIcon),
      parent: Procedure.parentProperty,
      subClasse : Procedure.subClassesProperty,
      inputs : new ObjectProperty("Entrées", {
        piece : new FileProperty("Pièce", ["Fourniture", "Piece", "Assemblage"], {icon: "puzzle"}),
        quantite : new NumberProperty("Quantité", "", {icon: "arrow-down"})}),
      outputs : new ObjectProperty("Sorties", {
        piece : new FileProperty("Pièce", ["Fourniture", "Piece", "Assemblage"], {icon: "puzzle"}),
        quantite : new NumberProperty("Quantité", "", {icon: "arrow-up"})}),
      step : new ObjectProperty("Étape", {
        name : new Property("Nom", {icon: "text"}),
        duration : new TimeProperty("Durée", {icon: "clock", format: "duration"}),
        ressources : new MultiFileProperty("Ressources", ["Ressource"], {icon: "layers"}),
        description : new TextProperty("Description", {flexSpan : 4,icon: "text"}),
      })
    }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Procedure
    }

    static getConstructor(){
      return Procedure
    }

    async populate(args : {parent? : Classe | null} = {parent : null}): Promise<void> {
      //get the parent
      console.log("Populating Procedure with args:", args);
      let parent = args["parent"] || null;
      if (!parent){parent = await selectFile(this.vault, Procedure.parentProperty.classes, {hint:"Selectionner l'assemblage ou la famille parent"}) || null}
      if (parent && parent instanceof FreecadClasse){
        await this.updateMetadata(Procedure.parentProperty.name, parent.getLink())
      }
      else {
        console.warn("No parent selected for Procedure, aborting populate.");
        return;
      }

      let outputItems = parent.produceByClasses().filter((classe : Classe) => !(classe instanceof Fourniture) && classe).map((classe: Classe) => classe.file);
      if (parent instanceof Piece || parent instanceof Assemblage){
        outputItems.push(parent.file);
      }
      
      //get the outputs
      let outputs = await selectMultipleFile(this.vault, ["Piece", "Assemblage"], {hint:"Sélectionner les pièces de sortie", optionnalGetItems : () => outputItems}) || [];
      console.log("Selected outputs:", outputs);
      if (outputs.length > 0) {
        let outputMapped = outputs.map((classe) => {
          let quantite = 1;
          if (parent instanceof Assemblage) {
            quantite = parent.getMetadataValue(Assemblage.Properties.pieces.name).find((piece: any) => piece.Piece === classe.getLink())?.Nombre || 1;
          }
          return {"Pièce": classe.getLink(), "Quantité": quantite};
        });
        console.log("Mapped outputs:", outputMapped);
        await this.updateMetadata(Procedure.Properties.outputs.name, outputMapped);
      }

      //get the inputs
      let inputItems = outputs
        .map((classe: FreecadClasse) => classe.produceByClasses()).flat()
        .map((classe: FreecadClasse) => {
          if (classe instanceof Famille) {
            return classe.produceByClasses();
          }
          return classe;
        }).flat()
        .filter((item, index, self) => (self.findIndex(i => i.file.path === item.file.path) === index) && !(item instanceof Famille))
        .map((classe: Classe) => classe.file)

      if (inputItems.length === 0) {
        console.warn("No input items found, using outputs as inputs.");
        return
      }
      let inputs = await selectMultipleFile(this.vault, ["Piece", "Assemblage", "Founiture"], {hint:"Sélectionner les pièces en entrée", optionnalGetItems : () => inputItems}) || [];
      if (inputs.length > 0) {
        let inputMapped = inputs.map((classe) => {
          let quantite = 1;
          return {"Pièce": classe.getLink(), "Quantité": quantite};
        });
        console.log("Mapped inputs:", inputMapped);
        await this.updateMetadata(Procedure.Properties.inputs.name, inputMapped);
      }
       
      await this.update()
    }


    async getTopDisplayContent() {
      const container = document.createElement("div");

      let firstContainer = document.createElement("div");
      firstContainer.classList.add("metadata-line");
      firstContainer.appendChild(Procedure.Properties.classe.getDisplay(this))
      firstContainer.appendChild(Procedure.Properties.subClasse.getDisplay(this, {title: "Type de procédure : "}));
      firstContainer.appendChild(Procedure.Properties.parent.getDisplay(this, {title: "Parent de la procédure : "}));
      container.appendChild(firstContainer);

      let secondContainer = document.createElement("div");
      secondContainer.classList.add("metadata-line")
      secondContainer.appendChild(Procedure.Properties.inputs.getDisplay(this, {title: "Entrées"}));
      secondContainer.appendChild(Procedure.Properties.outputs.getDisplay(this, {title: "Sorties"}));
      container.appendChild(secondContainer);

      container.appendChild((Procedure.Properties.subClasse as SubClassProperty).getTopDisplayContent(this));



      return container
    }

   async check(){
      let parent = await this.getParent();
      if (parent && parent instanceof FreecadClasse){
        await this.startWith(parent.getCode())
      }
      
      await super.check()
    }
  }
