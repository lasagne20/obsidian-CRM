import {TFile, App, TAbstractFile, TFolder} from 'obsidian';
import { MyVault } from '../Utils/MyVault';
import { File } from '../Utils/File';
import { Property } from '../Utils/Properties/Property';
import { FileProperty } from '../Utils/Properties/FileProperty';
import { MultiFileProperty } from '../Utils/Properties/MultiFileProperty';

export class Classe extends File {
    public static className : string = "";
    
    public static parentProperty : FileProperty|MultiFileProperty ;
    public static get Properties(): { [key: string]: Property } { return {}};

    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getClasse() : string{
      throw Error("Need to define the subClasses")
    }

    static getClasse(): string{
      return this.className
    }

    getparentProperties() : FileProperty| MultiFileProperty{
      throw Error("Need to define the subClasses")
    }

    static getparentProperties(){
      return this.parentProperty;
    }

    async populate(...args : any[]){
      throw Error("Need to define the subClasses")
    }

    static getProperties(){
      return Classe.Properties
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

    async updateLocation(){
        // Check if the file are right place, move it if needed
        console.log("Update Location")
        let property = this.getparentProperties()
        let parent = property.getLink(this)
        if (!parent || parent === undefined){
          // Le fichier n'existe pas
          console.error("Le parent n'existe pas")
        } 
        else if(property.getClasse() && parent.getClasse() != property.getClasse()){
          // ce n'est pas la bonne classe
          console.error("Mauvaise classe pour cette propiété: " + parent.getClasse() + " au lieu de "+ property.getClasse())
        }
        else {
          // Check if the path is correct, else move it
          let correctPath = parent.getChildFolderPath(this)
          if (this.getParentFolderPath() != correctPath){
            await parent.checkChildFolder(this)
            // Move the child to the childFolder
            console.log("folder path : " + this.getFolderPath())
            console.log("correctPath : " + correctPath)
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
          await this.app.vault.createFolder(parentFolderPath);
          await this.move(parentFolderPath)
      }

      // Create the Child folder if doesn't exist
      const childFolderPath = this.getChildFolderPath(child);
      console.log(childFolderPath)
      const childFolder = this.app.vault.getAbstractFileByPath(childFolderPath);
      if (!childFolder) {
          // If the folder doesn't exist create it and move the file into it
          console.log("Create child Folder Path : " + childFolderPath)
          await this.app.vault.createFolder(childFolderPath);
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

    getTopDisplayContent(){
    }

    async check(){

    }
  }
  