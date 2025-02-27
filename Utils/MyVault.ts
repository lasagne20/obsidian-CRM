import { Institution } from "Classes/Institution";
import { App, MarkdownView, Notice, Setting, TAbstractFile, TFile, TFolder } from "obsidian";
import { File } from "./File";
import { Classe } from "Classes/Classe";
import { Lieu } from "Classes/Lieux";
import { Personne } from "Classes/Personne";
import { FileProperty } from "./Properties/FileProperty";
import {FileSearchModal} from "Utils/Modals/FileSearchModal"
import { SelectModal } from "./Modals/SelectModal";
import { selectClass, selectFile } from "./Modals/Modals";
import { waitForMetaDataCacheUpdate } from "./Utils";
import { Action } from "Classes/Action";


export class MyVault {
    /*
    Global Vault, with all informations
    */
    public app : App;
    public files: { [key: string]: Classe };
    public settings : Settings;

    public static classes : { [key: string]: any } = {
      [Institution.getClasse()] : Institution,
      [Personne.getClasse()] : Personne,
      [Lieu.getClasse()] : Lieu,
      [Action.getClasse()] : Action
    }

    constructor(app: App, settings : Settings) {
      this.app = app;
      this.settings = settings;
      this.files = {}; // Contains all classes files for quick search
    }

    getFromLink(name : string){
      const file = this.app.vault.getFiles().find(f => f.name === `${name}.md`);
      if (file) {
        if (file.path in Object.keys(this.files)){
          return this.files[file.path]
        }
        return this.createClasse(file);
      } else {
        console.error("Fichier non trouvé : "+name);
        return null;
      }
    }

    getFromFolder(folder : TFolder){
      let name = folder.path.split("/")[folder.path.split("/").length-1]
      for (let file of folder.children){
        if (file instanceof TFile && file.name.contains(name)){
          return this.getFromFile(file)
        }
      }
      console.error("Le dossier n'a pas de fichier classe : " + folder.path)
    }

    getFromFile(file : TAbstractFile) : Classe | undefined{
      if (file instanceof TFile){
        let existingClass = this.files[file.path]
        if (existingClass) {return existingClass}
        let classe = this.createClasse(file)
        if (classe){
          this.files[file.path] = classe;
        }
        return classe
      }
      else if (file instanceof TFolder) {
        let filePath = file.path + "/" + file.name + ".md"
        const existingFile = this.app.vault.getAbstractFileByPath(filePath);
        if (existingFile){
          return this.getFromFile(existingFile)
        }
      }
    }
  
    async updateFile(file: TFile){
      // The file as an update, update it in the classes
      await this.getFromFile(file)?.update()
    }

    async checkFile(file: TFile) {
      // The file as an update, update it in the classes
      await this.getFromFile(file)?.check()
    }

    async createLinkFile(parentFile: TFile, name : string) {
       let parent = this.getFromFile(parentFile);
       let property : any = parent?.findPropertyFromValue(name, true);
       if (property instanceof FileProperty){
          await this.createFile(property.classe, name)
          await parent?.update()
       }
    }

    async createFile(classeType : null | typeof Classe = null, name:string = "", ...args : any[]) : Promise<TFile |undefined>{
      // Create the new file from the className template
      if (!classeType){
        classeType = await selectClass(this, "Quelle classe pour se fichier ?")
        if (!classeType){return}
      }
      if (!name){
        let classe = await selectFile(this, classeType, "Entrer un nom pour ce fichier")
        // Select File call createFile if the file doesn't exist
        // No need to continue
        return classe?.file
      }
      let templatePath = this.settings.templateFolder + "/" + classeType.getClasse()+".md"
      const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
      if (templateFile instanceof TFile) {
        const templateContent = await this.app.vault.read(templateFile);
        const newFilePath = name.includes(".md") ? name : `${name}.md`;     
        try {
            await this.app.vault.create(newFilePath, templateContent);
            console.log("Nouveau fichier créer : " + newFilePath)
        } catch (error) {
            // modidy the file if it already exist
            let file = this.app.vault.getAbstractFileByPath(newFilePath);
            if (file instanceof TFile) {
              await this.app.vault.modify(file, templateContent); 
              console.log("Fichier modifier : " + newFilePath)
            }
            else {
              throw Error("La template n'a pas pu se créer : " + newFilePath)
            }
        }
        let file = this.app.vault.getFiles().find(f => f.name === newFilePath)
        if (!file){
          throw Error("Le fichier n'existe pas : " + newFilePath);
        }
        
        await waitForMetaDataCacheUpdate(this.app, async () => {
          let classe = this.getFromFile(file);
          await classe?.populate(...args);
        });
        return file

      } else {
        throw Error("Le fichier template n'existe pas :"+ templatePath);
      }
    }

    async refreshAll(){
      // Move all files 
      let watchedFiles: string[] = [];
      for (let file of this.app.vault.getFiles()) {
        if (watchedFiles.includes(file.name) || file.path.startsWith("Outils")){
          continue
        }
         await this.getFromFile(file)?.update()

         // Remove the duplicates
         for (let file2 of this.app.vault.getFiles()) {
            // Compare the name
            if (file.name === file2.name && file.path != file2.path) {
                console.error("Doublon de \n" + file.path + "\n"+ file2.path)
                // Keep the first by default
                await this.app.vault.delete(file2);
            }
         }
         watchedFiles.push(file.name)
      }

      // Remove empty folders 
      for (let folder of this.app.vault.getAllFolders()) {
        if (folder.children.length === 0){
          await this.app.vault.delete(folder);
        }
     }

     new Notice("Vault refresh")

    }
    createClasse(file : TFile){
      const metadata = this.app.metadataCache.getFileCache(file)?.frontmatter
      if (!metadata){
        console.error("Pas de metadata")
        return
      }
      let constructor = MyVault.classes[metadata["Classe"]]
      if (constructor) {
        return new constructor(this.app, this, file)
      }
      console.error("Type non connue : " + metadata["Classe"])
  }
}