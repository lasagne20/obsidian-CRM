import { App, parseYaml, TAbstractFile, TFile, TFolder } from "obsidian";
import { MyVault } from "./MyVault";
import { waitForMetaDataCacheUpdate } from "./Utils";

export class File {
    /*
    Allow to quickly use files methods
    */
    public vault : MyVault;
    public app : App;
    public file: TFile;
    
    public linkRegex = /^"?\[\[(.*?)\]\]"?$/;

    constructor(app : App, vault : MyVault, file: TFile) {
      this.app = app;
      this.vault = vault;
      this.file = file;
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

    getFilePath(){
      // Return the file path
      return this.file.path
    }

    getLink(){
      return `[[${this.getName(false)}]]`
    }

    async move(targetFolderPath: string) {
      // Check if the folder of the target pathname exist
      let subtargetPath = targetFolderPath + "/" + this.getName(false)
      const folder = this.app.vault.getAbstractFileByPath(subtargetPath);
      if (folder) {
        targetFolderPath = subtargetPath;
      }

      // Check if we need to move the file or the folder
      let moveFile : TAbstractFile = this.file
      let newFilePath = `${targetFolderPath}/${this.getName()}`;
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
  getFromLink(name:  string) : any{
    return this.vault.getFromLink(name)
  }

    getMetadata(){
      let metadata = this.app.metadataCache.getFileCache(this.file)?.frontmatter;
      return metadata
    }

  
    async updateMetadata(key: string, value: any) {
      console.log("Update metadata on " + this.getName() +" : " + key + " --> " + value)
      const fileContent = await this.app.vault.read(this.file);
      const { body } = this.extractFrontmatter(fileContent);
    
      const { existingFrontmatter } = this.extractFrontmatter(fileContent);

      if (!existingFrontmatter) return;

      try {
          let frontmatter = parseYaml(existingFrontmatter);

          if (!frontmatter) return;
          frontmatter[key] = value;
          const newFrontmatter = this.formatFrontmatter(frontmatter);

          const newContent = `---\n${newFrontmatter}\n---\n${body}`; //${extraText}
          await this.app.vault.modify(this.file, newContent);
          await waitForMetaDataCacheUpdate(this.app, () => {return})
          console.log("Metdata updated")

      } catch (error) {
          console.error("❌ Erreur lors du parsing du frontmatter:", error);
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
        const newFrontmatter = this.formatFrontmatter(frontmatter);
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
    
    // Convertir le frontmatter en string YAML
    formatFrontmatter(frontmatter: Record<string, any>): string {
      let frontmatterStr = '';  // Début du frontmatter YAML
  
      for (const [key, value] of Object.entries(frontmatter)) {
          if (Array.isArray(value)) {
              // Si la valeur est un tableau, on les affiche sous forme de liste
              frontmatterStr += `${key}:\n`;
              for (const item of value) {
                  if (typeof item === 'object') {
                      // Si l'élément est un objet, on le transforme en YAML
                      frontmatterStr += '  - ';
                      let indent = false;
                      for (const [objKey, objValue] of Object.entries(item)) {
                          frontmatterStr += `${indent ? "    " :"" }${objKey}: "${objValue}"\n`;
                          indent = true
                      }
                  } else {
                      // Sinon, l'élément est une valeur simple (chaîne, nombre, etc.)
                      frontmatterStr += `  - "${item}"\n`;
                  }
              }
          } else if (typeof value === 'object') {
              // Si la valeur est un objet, on la convertit en sous-bloc YAML
              frontmatterStr += `${key}:\n`;
              if (value){
                for (const [subKey, subValue] of Object.entries(value)) {
                  frontmatterStr += `  ${subKey}: "${subValue}"\n`;
              }
              }
          } else {
              // Sinon, on affiche la clé avec sa valeur
              frontmatterStr += `${key}: "${value}"\n`;
          }
      }
      return frontmatterStr;
  }
  
  
  
  
  
  

}