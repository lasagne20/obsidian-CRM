import { App, parseYaml, TAbstractFile, TFile, TFolder } from "obsidian";
import { MyVault } from "./MyVault";
import { waitForFileMetaDataUpdate, waitForMetaDataCacheUpdate } from "./Utils";
import { dump } from 'js-yaml';

export class File {
    /*
    Allow to quickly use files methods
    */
    public vault : MyVault;
    public app : App;
    public file: TFile;
    private lock : boolean;
    
    public linkRegex = /^"?\[\[(.*?)\]\]"?$/;

    constructor(app : App, vault : MyVault, file: TFile) {
      this.app = app;
      this.vault = vault;
      this.file = file;
      this.lock = false
    }

    getFolderPath(){
      return this.file.path.substring(0, this.file.path.lastIndexOf("/"))
    }

    isFolderFile(){
      // Return true if the file is also a folder
      return this.file.path.substring(0, this.file.path.lastIndexOf("/")).endsWith(this.getName().replace(".md", ""))
    }

    getFolderFilePath(){
      // Return the folderFile path
      let path = this.getFolderPath()
      if (this.isFolderFile()){
        return path
      }
      return path + "/" + this.getName(false)
    }

    getParentFolderPath(){
      let path = this.getFolderPath()
      if (this.isFolderFile()){
        path = path.substring(0, path.lastIndexOf("/"))
      }
      return path
    }

    getName(md=true){
      if (md){
        return this.file.name
      }
      return this.file.name.replace(".md","")
    }

    getID(): string {
      let id = this.getMetadata()?.Id
      if (!id){
        id = require("uuid").v4()
        this.updateMetadata("Id", id)
      }
      return id
    }

    getFilePath(){
      // Return the file path
      return this.file.path
    }

    getLink(){
      return `[[${this.getFilePath()}|${this.getName(false)}]]`
    }

    async move(targetFolderPath: string, targetFileName?: string) {
      if (this.lock) {
        while (this.lock) {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log("Waiting for lock")
        }
      };
      this.lock = true;
      if (!targetFileName){
        targetFileName = this.getName();
      }
      try {
        // Check if the folder of the target pathname exist
        let subtargetPath = targetFolderPath + "/" + targetFileName
        const folder = this.app.vault.getAbstractFileByPath(subtargetPath);
        if (folder) {
          targetFolderPath = subtargetPath;
        }

        // Check if we need to move the file or the folder
        let moveFile : TAbstractFile = this.file
        let newFilePath = `${targetFolderPath}/${targetFileName}`;
        if (this.isFolderFile()){
          let folder = this.app.vault.getAbstractFileByPath(this.getFolderPath())
          if (folder){
            moveFile = folder
            newFilePath = newFilePath.replace(".md","")
          }
        }

        // Vérification si le fichier cible existe déjà
        const existingFile = this.app.vault.getAbstractFileByPath(newFilePath);
        if (existingFile) {
            console.log('Le fichier existe déjà, impossible de déplacer.');
            this.lock = false;
            return;
        }
    
        try {
            // Essayer de déplacer le fichier
            await this.app.vault.rename(moveFile, newFilePath);
            console.log(`Fichier déplacé vers ${newFilePath}`);
        } catch (error) {
            console.error('Erreur lors du déplacement du fichier :', error);
        }
      }
      finally {
          this.lock = false;
      }
  }
  getFromLink(name:  string) : any{
    return this.vault.getFromLink(name)
  }

    getMetadata(){
      let metadata = this.app.metadataCache.getFileCache(this.file)?.frontmatter;
      return metadata
    }

  
    async updateMetadata(key: string, value: any) {
      if (this.lock) {
        while (this.lock) {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log("Waiting for lock")
        }
      };
      this.lock = true;
      
      try {
        console.log("Update metadata on " + this.getName() +" : " + key + " --> " + value)
        const fileContent = await this.app.vault.read(this.file);
        const { body } = this.extractFrontmatter(fileContent);
      
        const { existingFrontmatter } = this.extractFrontmatter(fileContent);

        if (!existingFrontmatter) {this.lock = false; return;}

        try {
            let frontmatter = parseYaml(existingFrontmatter);

            if (!frontmatter) {this.lock = false; return;};
            frontmatter[key] = value;
            const newFrontmatter = dump(frontmatter);

            const newContent = `---\n${newFrontmatter}\n---\n${body}`; //${extraText}
            await this.app.vault.modify(this.file, newContent);
            await waitForFileMetaDataUpdate(this.app, this.getFilePath(), key, async () => { return; })
            console.log("Metdata updated")

        } catch (error) {
            console.error("❌ Erreur lors du parsing du frontmatter:", error);
        }
      }
      finally {
          this.lock = false;
      }
    }

    async removeMetadata(key: string) {
      console.log("Remove metadata " + key)
      const frontmatter = this.getMetadata();
      if (!frontmatter) return;
      delete frontmatter[key]
      await this.saveFrontmatter(frontmatter);
    }
    
    async reorderMetadata(propertiesOrder: string[]) {
        const frontmatter = this.getMetadata();
        if (!frontmatter) return;

        propertiesOrder.push("Id")

        if (JSON.stringify(propertiesOrder) === JSON.stringify(Object.keys(frontmatter))) return;

        console.log("Re-order metadata");
        // Sort properties and extract extra ones
        const { sortedFrontmatter, extraProperties } = this.sortFrontmatter(frontmatter, propertiesOrder);
        await this.saveFrontmatter(sortedFrontmatter, extraProperties);
    }
    
    async saveFrontmatter(frontmatter: Record<string, any>, extraProperties: string[] = []) {
        const fileContent = await this.app.vault.read(this.file);
        const { body } = this.extractFrontmatter(fileContent);
    
        // Reformater le frontmatter
        const newFrontmatter = dump(frontmatter);
        const filteredExtraProperties = extraProperties.filter(prop => prop && prop.trim() !== "");
        //const extraText = filteredExtraProperties.length > 0 ? `\n${filteredExtraProperties.join("\n")}` : "";

        
        // Sauvegarde du fichier
        const newContent = `---\n${newFrontmatter}\n---\n${body}`; //${extraText}
        await this.app.vault.modify(this.file, newContent);
        console.log("Updated file")
    }

    
    // Extraire le frontmatter et le reste du contenu
    extractFrontmatter(content: string) {
        const frontmatterRegex = /^---\n([\s\S]+?)\n---\n/;
        const match = content.match(frontmatterRegex);
        return {
            existingFrontmatter: match ? match[1] : "",
            body: match ? content.replace(match[0], "") : content,
        };
    }
    
    // Trier les propriétés et identifier celles en surplus
    sortFrontmatter(frontmatter: Record<string, any>, propertiesOrder: string[]) {
        let sortedFrontmatter: Record<string, any> = {};
        let extraProperties: string[] = [];
        
        propertiesOrder.forEach(prop => {
            if (prop in frontmatter) {
                sortedFrontmatter[prop] = frontmatter[prop];
            } else {
                sortedFrontmatter[prop] = null;
            }
        });
        
        Object.keys(frontmatter).forEach(prop => {
            if (!propertiesOrder.includes(prop)) {
                extraProperties.push(`${prop}: ${JSON.stringify(frontmatter[prop])}`);
            }
        });
        
        return { sortedFrontmatter, extraProperties };
    }
}