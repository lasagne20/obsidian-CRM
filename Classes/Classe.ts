import {TFile, App, TAbstractFile, TFolder, FrontMatterCache} from 'obsidian';
import { MyVault } from '../Utils/MyVault';
import { File } from '../Utils/File';
import { Property } from '../Utils/Properties/Property';
import { FileProperty } from '../Utils/Properties/FileProperty';
import { MultiFileProperty } from '../Utils/Properties/MultiFileProperty';
import { SubClassProperty } from 'Utils/Properties/SubClassProperty';
import { SubClass } from './SubClasses/SubClass';

interface Data {
  [key: string]: any;
}

export class Classe extends File {
    public static className : string = "";
    public static classIcon : string = "box";
    
    public static parentProperty : FileProperty|MultiFileProperty ;
    public static subClassesProperty : SubClassProperty;
    public static get Properties(): { [key: string]: Property } { return {}};

    public static async getItems(): Promise<string[]> { return []}

    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }
    
    getConstructor(){
      return Classe
    }

    getClasse() : string{
      return this.getConstructor().className
    }

    readProperty(name : string){
      return this.getProperties()[name].read(this)
    }

    static getClasse(): string{ 
      return this.className
    }

    getparentProperties() : FileProperty| MultiFileProperty{
      return this.getConstructor().parentProperty
    }

    getParentValue() : string{
      let value = this.getparentProperties().read(this)
      if (value && value.length){
        return value
      }
      return ""
    }

    static getparentProperties(){
      return this.parentProperty;
    }

    async populate(...args : any[]){
      throw Error("Need to define the Classes")
    }

    static getProperties(){
      return Classe.Properties
    }

    getMetadataValue(name : string): FrontMatterCache | undefined {
      let metadata = super.getMetadata()

      let data : Data | null = this.vault.getFileData(this)
      
      let value = metadata ? metadata[name] : undefined
      if (!value && data && Object.keys(data).contains(name)){
        return data[name]
      }
      return value;
    }


    getProperties(){
      return this.getConstructor().Properties
    }

    getSubProperties(){
      let subProperties: { [key: string]: Property } = {};
      for (const prop of Object.values(this.getProperties())) {
        if (prop instanceof SubClassProperty) {
          const subClass = prop.getSubClass(this);
          if (subClass) {
            Object.assign(subProperties, subClass.getProperties());
          }
        }
      }
      return subProperties;
    }

    getSelectedSubClasses() : SubClass[]{
      let subClasses : SubClass[]= []
      for (const prop of Object.values(this.getProperties())) {
        if (prop instanceof SubClassProperty) {
          let subclass = prop.getSubClass(this)
          if (subclass) {subClasses.push(subclass)}
        }
      }
      return subClasses;
    }

    getSubPropertiesValues() {
      let subPropertiesValues: { [key: string]: any } = {};
      for (const [key, prop] of Object.entries(this.getSubProperties())) {
        subPropertiesValues[key] = prop.read(this);
      }
      return subPropertiesValues;
    }

    getAllProperties(){
      let properties: { [key: string]: any } = {};
      for (const prop of Object.values(this.getProperties())) {
        if (prop instanceof SubClassProperty) {
          for (const subClass of prop.subClasses){
            Object.assign(properties, (subClass as unknown as SubClass).getProperties());
          }
          
        }
      }
      return {...properties, ...this.getProperties()};
    }

    findPropertyFromValue(content : string, link = false){
      for (const prop of Object.values((this.constructor as typeof Classe).Properties)) {
        if (link && !(prop instanceof FileProperty)){
           continue;
        }
        let value = prop.read(this)
        if (value && JSON.stringify(value).contains(content)){
          return prop
        }
      };    
      return null; 
    }

    async getParent() : Promise<Classe |undefined>{
      return this.getparentProperties().getFile(this)
    }

    async updateLocation(){
        // Check if the file are right place, move it if needed
        console.log("Update Location")
        let parent = await this.getParent()
        if (!parent || parent === undefined){
          // Le fichier n'existe pas
          console.error("Le parent n'existe pas")
        } 
        else if(this.getparentProperties().getClasses() && !this.getparentProperties().getClasses().includes(parent.getClasse())){
          // ce n'est pas la bonne classe
          console.error("Mauvaise classe pour cette propiété: " + parent.getClasse() + " au lieu de "+ this.getparentProperties().getClasses())
        }
        else {
          // Check if the path is correct, else move it
          let correctPath = parent.getChildFolderPath(this)
          if (this.getParentFolderPath() != correctPath){
            await parent.checkChildFolder(this)
            // Move the child to the childFolder
            await this.move(correctPath)
          }
        }
    }

    
    async checkChildFolder(child : Classe){
      console.log("Add child")
      // Create the folder parent if doesn't exist
      const parentFolderPath = this.getFolderFilePath()
      const parentfolder = this.app.vault.getAbstractFileByPath(parentFolderPath);
      if (!parentfolder) {
          // If the folder doesn't exist create it and move the file into it
          console.log("Create Parent Folder Path : " + parentFolderPath)
          try {
            await this.app.vault.createFolder(parentFolderPath);
            await this.move(parentFolderPath)
          }
          catch (e){
            console.error(e)
          }
          
      }

      // Create the Child folder if doesn't exist
      const childFolderPath = this.getChildFolderPath(child);
      const childFolder = this.app.vault.getAbstractFileByPath(childFolderPath);
      if (!childFolder) {
          // If the folder doesn't exist create it and move the file into it
          console.log("Create child Folder Path : " + childFolderPath)
          try {
            await this.app.vault.createFolder(childFolderPath);
          }
          catch (e){
            console.error(e)
          }
      }
    }


    getChildFolderPath(child : Classe){
      return this.getFolderFilePath()
    }

    async updatePropertyParent(){
      // Find the parent from the above folders
      console.log("Update parent property : ", this.getFilePath())
      let path = this.getFolderPath()

       // check 3 times
      for (let i in [0,1,2]){
          let parentPath = path + "/" + path.split("/")[path.split("/").length-1] + ".md"
          const parentfile = this.app.vault.getAbstractFileByPath(parentPath);

          // Update the parent from the current folder
          if (parentfile && parentfile instanceof TFile) {
            let parent = this.vault.getFromFile(parentfile)
            await this.updateMetadata(this.getparentProperties().name, parent?.getLink())
            await this.update() // To move it if it is not the right subfolder
            return
          }
          path = path.substring(0, path.lastIndexOf("/")) // Get the next parent
      }
      console.log("No parent found for : " + this.getFolderPath())
    }

    async update(){
       await this.updateLocation()
    }

    
  getChildren(file: TFolder | TFile | null = null)  : Classe[] {
    let children: Classe[] = [];
    if (!file && this.isFolderFile()){
      file = this.file.parent
    }
    if (file instanceof TFolder) {
        for (const child of file.children) {
            if (child instanceof TFile) {
              let classe = this.vault.getFromFile(child)
              if (classe) {children.push(classe);}
            } else if (child instanceof TFolder) {
                children.push(...this.getChildren(child)); // Récursion sur les sous-dossiers
            }
        }
      }
      return children;
    }

    getTopDisplayContent() : any{
      const container =  document.createElement("div");
      const properties = document.createElement("div");
      //Display the properties
      for (let property of Object.values(this.getProperties())){
        properties.appendChild(property.getDisplay(this))
      }
      container.appendChild(properties)
      return container
    }

    async check(){

    }
  }
  