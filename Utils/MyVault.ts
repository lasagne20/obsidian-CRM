import { Institution } from "Classes/Institution";
import { App, MarkdownView, Notice, Setting, TFile } from "obsidian";
import { File } from "./File";
import { Classe } from "Classes/Classe";
import { Lieu } from "Classes/Lieux";
import { Personne } from "Classes/Personne";
import { FileProperty } from "./Properties/FileProperty";
import {FileSearchModal} from "Utils/Modals/FileSearchModal"
import { SelectModal } from "./Modals/SelectModal";
import { selectClass, selectFile } from "./Modals/Modals";


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
      [Lieu.getClasse()] : Lieu
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
        console.log("Fichier non trouvé : "+name);
        return null;
      }
    }

    getFromFile(file : TFile){
       let existingClass = this.files[file.path]
       if (existingClass) {return existingClass}
       let classe = this.createClasse(file)
       if (classe){
         this.files[file.path] = classe;
       }
       classe.update()
       return classe
    }
  
    async updateFile(file: TFile) {
      // The file as an update, update it in the classes
      await this.getFromFile(file)?.update()
    }

    async checkFile(file: TFile) {
      // The file as an update, update it in the classes
      await this.getFromFile(file)?.check()
    }

    async createLinkFile(parentFile: TFile, name : string) {
       let parent = this.getFromFile(parentFile);
       let property : any = parent.findPropertyFromValue(name);
       if (property instanceof FileProperty){
          await this.createFile(property.classe, name)
       }
       parent.update()
    }

    async createFile(classeType : null | typeof Classe = null, name:string = "", ...args : any[]) : Promise<TFile>{
      // Create the new file from the className template
      if (!classeType){
        classeType = await selectClass(this, "Quelle classe pour se fichier ?")
      }
      let templatePath = this.settings.templateFolder + "/" + classeType.getClasse()+".md"
      const templateFile = this.app.vault.getAbstractFileByPath(templatePath);

      if (templateFile instanceof TFile) {
        const templateContent = await this.app.vault.read(templateFile);
        const newFilePath = `${name}.md`;
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
        }
        let file = this.app.vault.getFiles().find(f => f.name === `${name}.md`)
        if (!file){
          throw Error("Le fichier n'existe pas");
        }

        const onResolved = async () => {
          this.app.metadataCache.off('resolved', onResolved);
          let classe = this.getFromFile(file);
          console.log(classe);
          await classe.populate(...args);
        };

        this.app.metadataCache.on('resolved', onResolved);
        return file

      } else {
        throw Error("Le fichier template n'existe pas :"+ templatePath);
      }
    }

    createClasse(file : TFile){
      let currentFile = new File(this.app, this, file)
      const metadata = currentFile.getMetadata()
      
      if (!metadata){throw Error("Pas de metadata")}
      if (metadata["Classe"] == "Institutions") {
        return new Institution(this.app, this, currentFile)
      }
      if (metadata["Classe"] == "Lieux") {
        return new Lieu(this.app, this, currentFile)
      }
      if (metadata["Classe"] == "Personnes") {
        return new Personne(this.app, this, currentFile)
      }
      throw Error("Type non connue : " + metadata["Classe"])
  }
}