import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { selectFile } from "Utils/Modals/Modals";
import { FileProperty } from "Utils/Properties/FileProperty";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { Institution } from "./Institution";
import { ClasseProperty } from "Utils/Properties/ClasseProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { SubClassProperty } from "Utils/Properties/SubClassProperty";
import { Commune } from "./SubClasses/Lieux/Commune";
import { EPCI } from "./SubClasses/Lieux/EPCI";
import { Departement } from "./SubClasses/Lieux/Departement";
import { Region } from "./SubClasses/Lieux/Region";
import { National } from "./SubClasses/Lieux/National";
import { stat } from "fs";

export class Lieu extends Classe {

    public static className : string = "Lieu";
    public static classIcon : string = "map-pin";
    public data : any = null;

    public static parentProperty : FileProperty  = new FileProperty("Parent", ["Lieu"],{ icon: "map-pin", static : true});
    public static subClassesProperty: SubClassProperty = 
        new SubClassProperty("Type", [
                        new Commune(Lieu),
                        new EPCI(Lieu),
                        new Departement(Lieu),
                        new Region(Lieu),
                        new National(Lieu)
                      ],{icon : "landmark", static : true});
    public static Properties : { [key: string]: Property } = {
        classe : new ClasseProperty("Classe", this.classIcon),
        type : this.subClassesProperty,
        parent : this.parentProperty,
      }

    public static async getItems(){
      return MyVault.geoData.getAllNames()
    }

    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }


    static getConstructor(){
      return Lieu
    }

    getConstructor(){
      return Lieu
    }

    getChildFolderPath(child : Classe) : string{
      // check if the file is also a folder
      if (child instanceof Lieu){
        if (this.getSelectedSubClasse() instanceof Departement && child.getSelectedSubClasse() instanceof EPCI){
          return super.getChildFolderPath(child) + "/Communautés de communes" 
        }
        return super.getChildFolderPath(child)
      }
      return super.getChildFolderPath(child) + "/" + child.getClasse() +"s"
    }


    async getParent(): Promise<Classe | undefined> {
      const parent = await this.vault.getGeoParent(this);
      if (!parent) {
        return
      }
      if (this.getParentValue() != parent?.getLink())
      {
        await this.updateMetadata(Lieu.Properties.parent.name, parent.getLink());
      } 
      return parent;
    }

    async getSubClass(){
      let subclasse = MyVault.geoData.getClassName(this.getName(false));
      if (!subclasse || Lieu.Properties.type.read(this) == subclasse){
        return
      }
      await this.updateMetadata(Lieu.Properties.type.name, subclasse);
      return subclasse;
    }

    async populate(...args : any[]){
       //get the parent
      await this.getParent()
      await this.getSubClass()
      await this.check()
      await this.update()
    }

    getTopDisplayContent() {
      const container =  document.createElement("div");
      const firstContainer = document.createElement("div");
      firstContainer.classList.add("metadata-line");
      firstContainer.appendChild(Lieu.Properties.classe.getDisplay(this))
      firstContainer.appendChild(Lieu.Properties.parent.getDisplay(this))
      firstContainer.appendChild(Lieu.Properties.type.getDisplay(this))
      container.appendChild(firstContainer)

      container.appendChild((Lieu.Properties.type as SubClassProperty).getTopDisplayContent(this))

      return container
    }

    // Validate that the file content is standart
    async check(){
      await super.check()
      await this.getParent()
      await this.getSubClass()
      await this.reorderMetadata([
      ...Object.values(Lieu.Properties).map(prop => prop.name),
      ...(Lieu.Properties.type as SubClassProperty).getSubClassProperty(this).map(prop => prop.name)
      ])
    }
  }
  