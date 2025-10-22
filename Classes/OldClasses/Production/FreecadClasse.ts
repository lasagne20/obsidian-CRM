import { Classe } from "Classes/Classe";
import { SubClass } from "Classes/SubClasses/SubClass";
import { App, Notice, TFile, TFolder } from "obsidian";
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
import { FreecadSubclasse } from "./PieceSubclasses/FreecadSubClasse";


export class FreecadClasse extends Classe {

    public static className : string = "FreecadClasse";
    public static classIcon : string = "";

    public static parentProperty : any = new FileProperty("Parent", ["Famille", "Assemblage"], {icon: "folder-tree"});

    public static Properties : { [key: string]: Property } ={
      classe : new ClasseProperty("Classe", this.classIcon),
      description : new HearderProperty("Description", {icon: "text"}),
      parent: FreecadClasse.parentProperty,
      code : new FormulaProperty(
        "Code",
        `let code = name.split(" - ")[0];
         let parent = vault.getFromLink(Parent);
         if (parent) {
            let parentCode = parent.getCode();
            return parentCode ? "" + parentCode + "-" + code : code;
          }
          return code;
        `,
        {icon: "code", static: true, write: true}),
      model : new MediaProperty("Modele3D", {icon: "cube3d", create: "freecad"}),
    }

    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return FreecadClasse
    }

    static getConstructor(){
      return FreecadClasse
    }


    getPrettyName(forExport = false): string {
      if (this.getMetadataValue(FreecadClasse.Properties.description.name)){
        if (forExport) {
          return `${this.getMetadataValue(FreecadClasse.Properties.code.name)} : ${this.getMetadataValue(FreecadClasse.Properties.description.name).trim()}`;
        }
        return `${this.getName(false).split(" - ")[0]} : ${this.getMetadataValue(FreecadClasse.Properties.code.name)} : ${this.getMetadataValue(FreecadClasse.Properties.description.name).trim()}`;
      }
      return `${this.getName(false)}`;
    }

    async getTopDisplayContent() {
      const container =  document.createElement("div");

      container.appendChild(FreecadClasse.Properties.description.getDisplay(this))

      let firstContainer = document.createElement("div");
      firstContainer.classList.add("metadata-line")
      firstContainer.appendChild(FreecadClasse.Properties.classe.getDisplay(this))
      firstContainer.appendChild(FreecadClasse.parentProperty.getDisplay(this, {title: "Parent : "}))
      firstContainer.appendChild(FreecadClasse.Properties.code.getDisplay(this, {staticMode: true,title: "Code :"}))
      container.appendChild(firstContainer)

      return container
    }

    async createFreecadFile(subFolder: string, name: string, subName: string): Promise<string> {
        let subfolderPath = this.getFolderFilePath() + "/" + subFolder;
        this.addSubFolder(subfolderPath);
        let mediaPath = subfolderPath +"/" + name + ".FCStd"

        await FreecadFile.createFreecadFileWithAssembly(this.vault, mediaPath, subName);
        // Met à jour le champ avec le lien vers le fichier FreeCAD créé
        
        new Notice("Fichier FreeCAD créé avec succès ! Ouverture dans 1 secondes...");
        return mediaPath;
    }

    async getFreecadFile() : Promise<FreecadFile | null> {
        const name = this.getMetadataValue(FreecadClasse.Properties.model.name);
        if (name) {
            const fileData = await this.vault.getAsyncFileData(this, name);
            if (fileData instanceof FreecadFile) {
                return fileData;
             }
        }
        return null;
    }

    async populate(args : {parent : Classe | null} = {parent : null}){
      //get the parent
      if (args["parent"]) {
        await this.updateMetadata(FreecadClasse.parentProperty.name, args["parent"].getLink())
        // use the same freecad file as the parent
        let freecadFile =  args["parent"].getMetadataValue(FreecadClasse.Properties.model.name);
        if (freecadFile) {
          await this.updateMetadata(FreecadClasse.Properties.model.name, freecadFile);
        }
      }
      else {
        let parent = await selectFile(this.vault, FreecadClasse.parentProperty.classes, {hint:"Selectionner l'assemblage ou la famille parent"})
        if (parent){
          await this.updateMetadata(FreecadClasse.parentProperty.name, parent.getLink())
        }
      }
      await this.update()
    }

    getCode() : string {
      let parent = this.getMetadataValue(FreecadClasse.Properties.parent.name)
      if (this.vault.getFromLink(parent) != this) {
        return FreecadClasse.Properties.code.read(this);
      }
      return ""
    }

    getCount(elementName: string = "", list : {classe : Classe, count: number, level: number}[] = [], lastNumber : number = 0, level: number = 0)
        : {classe : Classe, count: number, level: number}[] {
        for (const classe of this.getIncomingLinks()) {
          if (classe instanceof FreecadClasse && !classe.getParentValue().contains(this.getName(false)) && classe.getName(false) !== this.getName(false)) {
              classe.getCount(this.getName(false), list, lastNumber, level + 1);
          }
        }
        return list;
    }

    async getData(name?: string){
      let freecadFile = await this.getFreecadFile()
      if (freecadFile) {
        return freecadFile.getData(name);
      }
      return [];
    }

    getFromCode(code: string): FreecadClasse | null {
      let mdFile = this.vault.app.vault.getFiles().find((file: any) => {
                      const metadata: Record<string, any> | undefined = this.app.metadataCache.getFileCache(file)?.frontmatter;
                      return file.extension === "md"
                        && typeof metadata?.["Code"] === "string"
                        && metadata["Code"] === code;
                    });
      if (mdFile) {
        return this.vault.getFromFile(mdFile) as FreecadClasse;
      }
      return null;
    }

    produceByClasses(): Classe[] {
      return [];
    }

    getChildFolderPath(child : Classe){
      if (child.getClasse() === "Procédure") {
        return super.getChildFolderPath(child) + "/Procédures";
      }
      return super.getChildFolderPath(child)
    }

    async getListOfSubElements(assemblyName?: string) {
      let freecadFile = await this.getFreecadFile()
      if (freecadFile) {
        return freecadFile.getAllElementsData(assemblyName).map(data => {
                  if (data.type == "Assembly::AssemblyLink" || data.type == "App::Link") {
                    // Search for the class by name
                    let existing = this.vault.getFromLink(data.name + ".md");
                    if (existing) {return existing}
                    // Search for the class by code
                    let existingCode = this.getFromCode(data.name);
                    if (existingCode){ return existingCode;}
                  }
                  
                  // Find the parent of the element
                  let code = data.code.split("-")
                  for (let i = code.length-1; i >0; i--) {
                    console.log("Searching for parent with code:", code.slice(0, i).join("-"));
                    let parentFiles = this.vault.app.vault.getFiles().filter(
                      (file : any) => {
                        return file.extension === "md"
                      && code.slice(0, i).every((part : string) => file.path.includes(part))
                      && !file.name.startsWith(code[code.length-1])
                    }
                    )
                    console.log("Parent files found:", parentFiles, parentFiles.map((f: TFile) => f.name), data.code);
                    if (parentFiles.length === 0) {
                      continue;
                    }
                    // Sélectionne le parent qui a le code le plus court
                    let parentFile = parentFiles.map((f: TFile) => this.vault.getFromFile(f))
                    .filter((f) => f && (code.slice(0, i).every((part : string) => f.getMetadataValue("Code") && f.getMetadataValue("Code").includes(part))))
                    .reduce((prev, curr) => {
                      if (prev instanceof Classe && curr instanceof Classe) {
                        return prev.getMetadataValue("Code").length <= curr.getMetadataValue("Code").length ? prev : curr;
                      }
                      return prev;
                    });
                    console.log("Selected parent file:", parentFile);
                    if (parentFile) {
                      if (parent) {
                        data.parent = parent;
                        break;
                      }
                    }
                  }
                  if (!(data.parent instanceof Classe)) {
                    data.parent = this;
                  }

                  console.log("Data type is:", data.type, "for", data.name, "with parent", data.parent.getName(false));
                  if (!data.name.startsWith("ISO")) {
                    console.log("Data name is:", data.name, "with parent", data.parent.getName(false), "and code", data.parent.getMetadataValue("Code"));
                    let prettyName = data.name.replace(data.parent.getMetadataValue("Code") + "-","") + " - " + data.name;
                    let existing = this.vault.getFromLink(prettyName + ".md")
                    if (existing){ return existing;}
                    data.name = prettyName;
                  }

                  // Convert data name to freecad class
                  let parentModel = data.parent.getMetadataValue(FreecadClasse.Properties.model.name)
                  data.Modele3D =  data.model ?  data.model : parentModel  || "";
                  data.Code = data.code
                  data.Nombre = data.number
                  
                  let classe;
                  if (this.getCode().startsWith("F-")){classe = this.vault.getClasseFromName("Fourniture");}
                  else if (data.type.startsWith("Assembly")){classe = this.vault.getClasseFromName("Assemblage");}
                  else if (["PartDesign::Body", "App::Link", "VIS", "Part::Feature"].includes(data.type)){classe = this.vault.getClasseFromName("Piece");}
                  else {classe = FreecadClasse;}

                  let subclass = new FreecadSubclasse(classe, data)
                  subclass.updateParent(this.vault);
                  return subclass;
                });
      }
      return [];
    }

    // Validate that the file content is standart
    async check(){
    
      let parent = await this.getParent()
      let parentModel = parent?.getMetadataValue(FreecadClasse.Properties.model.name)
      let model = this.getMetadataValue(FreecadClasse.Properties.model.name)
      if (model && parentModel && parentModel !== model) {
        this.moveMediaToFolder(FreecadClasse.Properties.model, "3D", [".stl", ".obj", ".glb", ".FCBak",".FCStd1", ".fcstd1"])
      }
      this.getCode()
      await this.update()
      await super.check()
      
      
      
    }
     
  }
