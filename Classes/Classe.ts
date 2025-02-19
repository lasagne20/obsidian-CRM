import {TFile, App} from 'obsidian';
import { MyVault } from '../Utils/MyVault';
import { File } from 'Utils/File';
import { Property } from 'Utils/Properties/Property';
import { FileProperty } from 'Utils/Properties/FileProperty';
import { MultiFileProperty } from 'Utils/Properties/MultiFileProperty';

export class Classe {
    public app : App;
    public vault : MyVault;
    public file : File;
    public static className : string = "";

    public static get Properties(): { [key: string]: Property } { return {}};

    constructor(app : App, vault:MyVault, file : File) {
      this.app = app;
      this.vault = vault;
      this.file = file;
    }

    getClasse() : string{
      throw Error("GetClasse Need to define the subClasses")
    }

    static getClasse(): string{
      return this.className
    }


    getLink(){
      return this.file.getLink()
    }

    async populate(...args : any[]){
      throw Error("Need to define the subClasses")
    }

    async move(folderPath : string){
      let subfolderPath = folderPath + "/" + this.file.getName().replace(".md","")
      const folder = this.app.vault.getAbstractFileByPath(subfolderPath);   
      if (folder) {
          await this.file.move(subfolderPath);
      }
      else {
          await this.file.move(folderPath);
      }

      
    }

    static getProperties(){
      return Classe.Properties
    }

    findPropertyFromValue(content : string){
      for (const prop of Object.values((this.constructor as typeof Classe).Properties)) {
        let value = prop.read(this.file)
        if (value && value.contains(content)){
          return prop
        }
      };    
      return null; 
    }

    getMetadata(){
      return this.file.getMetadata()
    }

    async updateChildren(property: FileProperty | MultiFileProperty){
        // Check if the file are right place, move it if needed
        let parent = property.getLink(this.file)
        if (!parent){
          // Le fichier n'existe pas
        } 
        else if(property.getClasse() && parent.getClasse() != property.getClasse()){
          // On supprime le lien car ce n'est pas la bonne classe
          await this.file.updateMetadata(property.name, "");
        }
        else if (this.getFolderPath() != parent.getChildFolderPath(this)){
          await parent.addChild(this)
        }
    }

    getChildFolderPath(child : Classe){
      return this.getParentFolderPath()
    }

    getParentFolderPath(){
      let folderPath = this.getFolderPath();
      let fileFolder = this.getName().replace(".md","")
      if (folderPath.endsWith(fileFolder)){
        return folderPath
      }
      return this.getFolderPath() + "/" + fileFolder
    }

    async addChild(child : Classe){
      console.log("Add child")
      // Create the folder parent if doesn't exist
      const parentFolderPath = this.getParentFolderPath();
      const parentfolder = this.app.vault.getAbstractFileByPath(parentFolderPath);
      if (!parentfolder) {
          // If the folder doesn't exist create it and move the file into it
          console.log("Create Parent Folder Path : " +parentFolderPath)
          await this.app.vault.createFolder(parentFolderPath);
          await this.move(parentFolderPath)
      }

      // Create the Child folder if doesn't exist
      const childFolderPath = this.getChildFolderPath(child);
      const childFolder = this.app.vault.getAbstractFileByPath(childFolderPath);
      if (!childFolder) {
          // If the folder doesn't exist create it and move the file into it
          console.log("Create child Folder Path : " + childFolderPath)
          await this.app.vault.createFolder(childFolderPath);
      }
      // Move the child to the childFolder
      child.move(childFolderPath)
    }

    getFolderPath(){
      let folderPath = this.getPath().substring(0, this.getPath().lastIndexOf("/"))
      return folderPath
    }

    getPath(){
      return this.file.getPath()
    }

    getName(){
      return this.file.getName()
    }

    async update(){

    }

    async check(){

    }
  }
  