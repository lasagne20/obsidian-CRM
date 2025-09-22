import {TFile, App, TAbstractFile, TFolder} from 'obsidian';
import { MyVault } from '../../Utils/MyVault';
import { Property } from '../../Utils/Properties/Property';
import { Classe } from 'Classes/Classe';
import { Data } from 'Utils/Data/Data';
import { v4 as uuidv4 } from 'uuid';


export class SubClass {
    public subClassName : string = "";
    public subClassIcon : string = "box";

    public app: App;
    public vault: MyVault;
    public classe: typeof Classe;
    
    public static Properties: {[key: string]: Property} = {};
    public data : Data | null;
    public id : string;

    constructor(classe : typeof Classe, data : Data | null = null) {
      this.data = data
      this.classe = classe
      this.id = uuidv4()
    }

    getConstructor(){
      return SubClass
    }

    getsubClassName(): string{ 
      return this.subClassName;
    }

    getName(): string{
      if (this.data instanceof Data){
        return this.data.getName()
      }
      else if (this.data && this.data["name"]){
        return this.data["name"]
      }
      return "";
    }
    getLink(): string{
      return `[[${this.getName()}]]`
    }

    getID(): string{
      return this.id
    }

    getMetadata(){
      if (this.data){
        return this.data
      }
    }

    getParent(){
      if (this.data && (this.data["parent"] instanceof SubClass || this.data["parent"] instanceof Classe)){
        return this.data["parent"]
      }
      return null
    }

    getProperty(name : string) : [SubClass, Property | null]{
      if (Object.keys(this.getAllProperties()).contains(name)){
        return [this, this.getAllProperties()[name]]
      }
      if (name.startsWith("parent.")){
        let propertyName = name.split(".").slice(1).join(".")
        if (this.data && this.data["parent"] instanceof SubClass){
          let parent = this.data["parent"]
          return parent.getProperty(propertyName)
        }
      }
      return [this, null]
    }

    async populate(...args : any[]){
    }

    updateParent(vault: MyVault){
      this.vault = vault;
      if (this.data && (this.data["parent"] instanceof Data)){
        const parentClassName = this.data["parent"].getClasse();
        if (typeof parentClassName !== 'string') {
            throw new Error('Parent class name must be a string');
        }
        let [parentClass, parentSubClass] = vault.getSubClasseFromName(parentClassName);
        this.data["parent"] =  new parentSubClass(parentClass.getConstructor(), this.data["parent"])
        this.data["parent"].updateParent(vault)
      }
    }

    getMetadataValue(name : string): any{
        let metadata = this.getMetadata()
        if (metadata && metadata[name]){
          return metadata[name]
        }
        return undefined;
      }

    getAllProperties(){
      return {...this.getConstructor().Properties, ...this.classe.Properties}
    }

    getProperties(){
      return this.getConstructor().Properties
    }

    async update(){
       
    }

    getTopDisplayContent(classe: Classe) : any{
      const container =  document.createElement("div");
      return container
    }

    async check(){

    }
  }
  