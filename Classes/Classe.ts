import AppShim, {TFile, TFolder, isTFile, isTFolder} from '../Utils/App';
import { MyVault } from '../Utils/MyVault';
import { File } from '../Utils/File';
import { Property } from '../Utils/Properties/Property';
import { FileProperty } from '../Utils/Properties/FileProperty';
import { MultiFileProperty } from '../Utils/Properties/MultiFileProperty';
import { SubClassProperty } from '../Utils/Properties/SubClassProperty';
import { SubClass } from './SubClasses/SubClass';
import { ObjectProperty } from '../Utils/Properties/ObjectProperty';
import { DateProperty } from '../Utils/Properties/DateProperty';
import { RangeDateProperty } from '../Utils/Properties/RangeDateProperty';
import { IClasse } from '../Utils/interfaces';
import { DisplayManager } from '../Utils/Display/DisplayManager';
import { ClassConfig } from '../Utils/Config/interfaces';

interface Data {
  [key: string]: any;
}

export class Classe extends File implements IClasse {
    public static className : string = "";
    public static classIcon : string = "box";
    
    public static parentProperty : FileProperty | MultiFileProperty | ObjectProperty;
    public static subClassesProperty : SubClassProperty;
    public static Properties: { [key: string]: Property };
    public static async getItems(): Promise<string[]> { return []}
    
    // Configuration YAML pour l'affichage dynamique
    public displayConfig?: ClassConfig;

    constructor(app : AppShim, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }
    
    getConstructor() : typeof Classe{
      throw Error("Need to define the Classes")
    }

    getPrettyName() : string{
      return this.getName(false)
    }

    static getConstructor() : typeof Classe{
      throw Error("Need to define the Classes")
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

    getparentProperty() : FileProperty | MultiFileProperty | ObjectProperty{
      return this.getConstructor().parentProperty
    }

    getParentValue() : string{
      let value = this.getparentProperty().read(this)
      if (value && value.length){
        return value
      }
      return ""
    }

    static getparentProperty(){
      return this.parentProperty;
    }

    async populate(...args : any[]){
      throw Error("Need to define the Classes")
    }

    static getProperties(){
      return this.getConstructor().Properties
    }

    getSubClassFromName(name : string){
      return this.getConstructor().subClassesProperty.getSubClassFromName(name)
    }

    getMetadataValue(name : string): any {
      let metadata = super.getMetadata()
      let data : Data | null = this.vault.getFileData(this)
      let value = metadata ? metadata[name] : undefined
      if (!value && data && Object.keys(data).contains(name)){
        return data[name]
      }
      return value;
    }

    getProperties(): { [key: string]: Property } {
      return this.getConstructor().Properties
    }

    getAllProperties(){
      return {...this.getProperties(), ...this.getSelectedSubClasse()?.getProperties()}
    }

    getProperty(name : string) : [Classe, Property | null]{
      // Basic properties
      if (Object.keys(this.getAllProperties()).contains(name)){  
        return [this, this.getAllProperties()[name]]
      }
      if (Object.values(this.getAllProperties()).map(prop => prop.name).contains(name)){  
        return [this, this.getAllProperties()[name]]
      }

      // Parent property
      if (name.startsWith("parent.")){
        let parentProperty = this.getparentProperty()
        let fileName = parentProperty.getParentValue(parentProperty.read(this))
        let parent =  this.getFromLink(fileName)
        if (parent){
          return parent.getProperty(name.split(".").slice(1).join("."))
        }
      }

      // Object properties (only one level)
      //TODO : How to choose the right index ?
      /*let names = name.split(".")
      if (names.length > 1){
        let propParent = this.getAllProperties()[names[0]]
        if(propParent && propParent.type === "object"){
            let property = (propParent as any).properties[names[1]]
            if (property){
              return [propParent.read(this)[0], property]
          }
        }
      }*/

      return [this, null]
    }

    getIncomingLinks(): Classe[] {
      const incomingLinks: Classe[] = [];
      const files = this.app.vault.getFiles();
      
      for (const file of files) {
      const links = this.app.metadataCache.resolvedLinks[file.path];
      if (links && links[this.file.path]) {
        const linkedClasse = this.vault.getFromFile(file);
        if (linkedClasse) {
        incomingLinks.push(linkedClasse);
        }
      }
      }
      
      return incomingLinks;
    }

    getSelectedSubClasse() : SubClass | undefined{
      let subClassesProperty = this.getConstructor().subClassesProperty
      if (subClassesProperty){
        return subClassesProperty.getSubClass(this)
      }
      return undefined
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

    async getParent(): Promise<Classe | undefined>{
      let parentProperty = this.getparentProperty()
      let fileName = parentProperty.getParentValue(parentProperty.read(this))
      return this.getFromLink(fileName)
    }

    async updateLocation(){
        // Check if the file are right place, move it if needed
        console.log("Update Location")
        let parent = await this.getParent()
        if (!parent || parent === undefined){
          // Le fichier n'existe pas
          console.error("Le parent n'existe pas")
        } 
        else if(this.getparentProperty().getClasses() &&
          !this.getparentProperty().getClasses().includes(parent.getClasse())){
          // ce n'est pas la bonne classe
          console.error("Mauvaise classe pour cette propiété: " + parent.getClasse() + " au lieu de "+ this.getparentProperty().getClasses())
        }
        else {
          // Check if the path is correct, else move it
          let correctPath = parent.getChildFolderPath(this)
          if (this.getParentFolderPath() != correctPath){
            await parent.checkChildFolder(this)
            // Move the child to the childFolder
            console.log("Move to child folder : " + correctPath)
            await this.move(correctPath)
          }
        }
    }

    async checkChildFolder(child : Classe){
      const childFolderPath = this.getChildFolderPath(child)
      await this.addSubFolder(childFolderPath)
    }

    
    async addSubFolder(folderPath: string){
      console.log("Add child folder")
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

      // Create the Child folder if doesn't exist;
      const childFolder = this.app.vault.getAbstractFileByPath(folderPath);
      if (!childFolder) {
          // If the folder doesn't exist create it and move the file into it
          console.log("Create child Folder Path : " + folderPath)
          try {
            await this.app.vault.createFolder(folderPath);
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
      if (this.isFolderFile()){
        path = path.substring(0, path.lastIndexOf("/")) // Get the parent folder
      }

       // check 3 times
      for (let i in [0,1,2]){
          let parentPath = path + "/" + path.split("/")[path.split("/").length-1] + ".md"
          const parentfile = this.app.vault.getAbstractFileByPath(parentPath);

          // Update the parent from the current folder
          if (parentfile && isTFile(parentfile)) {
            let parent = this.vault.getFromFile(parentfile)
            let parentProperty = this.getparentProperty()
            if (parentProperty instanceof ObjectProperty && parent){
              let values = parentProperty.formatParentValue(parent.getLink())
              await this.updateMetadata(parentProperty.name, values)
            }
            else {
              await this.updateMetadata(parentProperty.name, parent?.getLink())
            }
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
    if (file && isTFolder(file)) {
        for (const child of file.children || []) {
            if (isTFile(child)) {
              let classe = this.vault.getFromFile(child)
              if (classe) {children.push(classe);}
            } else if (isTFolder(child)) {
                children.push(...this.getChildren(child)); // Récursion sur les sous-dossiers
            }
        }
      }
      return children;
    }

    async getTopDisplayContent(): Promise<HTMLElement> {
      // Utiliser DisplayManager si une configuration est disponible
      if (this.displayConfig && this.displayConfig.display) {
        return await DisplayManager.generateDisplayContent(this, this.displayConfig.display);
      }
      
      // Affichage par défaut
      const container = document.createElement("div");
      const properties = document.createElement("div");
      properties.classList.add("metadata-line");
      
      // Display the properties
      for (let property of Object.values(this.getProperties())){
        properties.appendChild(property.getDisplay(this))
      }
      container.appendChild(properties)
      return container
    }

    async reloadTopDisplayContent(){  
      for (let property of Object.values(this.getProperties())){
        await property.reloadDynamicContent(this)
      }
    }

    async moveMediaToFolder(property: Property, folder : string, othersExtensions : string[] = []){
      // Move the media to the folder of the file
      let path = this.getFolderFilePath()
      let mediaLinks = property.read(this)
      if (!mediaLinks || mediaLinks.length === 0){
        return;
      }
      if (!(mediaLinks instanceof Array)){
        mediaLinks = [mediaLinks]
      }
      for (let mediaLink of mediaLinks){
        let subfolderPath = path + "/" + folder ? path + "/" + folder : path
        console.log("Move media to folder : " + subfolderPath)
        this.addSubFolder(subfolderPath)

        let media = this.vault.getMediaFromLink(mediaLink)
        if (media && (media.path !== subfolderPath + "/" + media.name)){
          console.log("Move media to folder : " + subfolderPath + "/" + media.name)
         
          // If the file already exists at the destination, delete it before moving
          const existing = this.vault.app.vault.getAbstractFileByPath(subfolderPath + "/" + media.name);
          if (existing) {
            await this.vault.app.vault.delete(existing);
          }
          this.vault.app.vault.rename(media, subfolderPath + "/" + media.name)
          // Update the property
          await this.updateMetadata(property.name, `[[${subfolderPath}/${media.name}|${media.name}]]`)
          
          for (let extension of othersExtensions){
            let otherFileName = media.name.split(".")[0] + extension
            let otherMedia = this.vault.getMediaFromLink(otherFileName)
            if (otherMedia && (otherMedia.path !== subfolderPath + "/" + otherFileName)){
              console.log("Move other media " + otherFileName + " to folder : " + subfolderPath + "/" + otherFileName)
              const existing = this.vault.app.vault.getAbstractFileByPath(subfolderPath + "/" + otherFileName);
              if (existing) {
                await this.vault.app.vault.delete(existing);
              }
              this.vault.app.vault.rename(otherMedia, subfolderPath + "/" + otherFileName)
            }
          }
        }
      }
    }

  async startWith(property: Property | string) {
    let value: any;
    if (property instanceof Property) {
      value = property.read(this)
      if (property instanceof FileProperty) {
        value = this.vault.readLinkFile(value);
      }
    }
    else{
      value = property
    }

    if (!value) return;

    const file = this.file;
    const title = file.basename;

    // Nettoyage : retirer n'importe quel préfixe de type "xxx - "
    let cleanTitle = title ? title.replace(/^[^/\\:*?"<>|]{1,50}\s-\s/, "").trim() : "";

    // Gestion spéciale si la propriété est une date à formater
    let prefix = value;
    if (property instanceof Property && property.type.toLowerCase() === "daterange") {
      let rawDate = value.includes("to")
        ? value.split("to")[0].trim()
        : value;
      prefix = rawDate ? property.getPretty(rawDate) : "";
    }
    // Reconstruction du nouveau nom
    const newName = `${prefix} - ${cleanTitle}`;
    
    if (title !== newName) {
      console.log(`Renaming file from ${title} to ${newName}`);
      await this.move(this.getParentFolderPath(), newName+".md")
    }
  }

 
    async check(){
      this.getID()
    }
  }
  