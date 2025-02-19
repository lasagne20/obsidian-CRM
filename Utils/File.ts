import { App, TFile } from "obsidian";
import { MyVault } from "./MyVault";

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

    getName(){
      return this.file.name
    }

    getPath(){
      return this.file.path
    }

    getLink(){
      return `[[${this.getName().replace(".md","")}]]`
    }

    async move(folderPath: string) {
      const newFilePath = `${folderPath}/${this.getName()}`;
      console.log(newFilePath);
      
      // Vérification si le fichier cible existe déjà
      const existingFile = await this.app.vault.getAbstractFileByPath(newFilePath);
      if (existingFile) {
          console.log('Le fichier existe déjà, impossible de déplacer.');
          return;
      }
  
      try {
          // Essayer de déplacer le fichier
          await this.app.vault.rename(this.file, newFilePath);
          console.log(`Fichier déplacé vers ${newFilePath}`);
      } catch (error) {
          console.error('Erreur lors du déplacement du fichier :', error);
      }
  }
  

    getMetadata(){
      return this.app.metadataCache.getFileCache(this.file)?.frontmatter;
    }

    getFromLink(name:  string){
      return this.vault.getFromLink(name)
    }

  
    async updateMetadata(key: string, value: any) {
      console.log("Update metadata : " + key + " --> " + value)
      const frontmatter = this.getMetadata();
      if (!frontmatter) return;
  
      // Mise à jour de la valeur
      frontmatter[key] = value;
      await this.saveFrontmatter(frontmatter);
    }
    
    async reorderMetadata(propertiesOrder: string[]) {
        
        const frontmatter = this.getMetadata();
        if (!frontmatter) return;

        if (JSON.stringify(propertiesOrder) === JSON.stringify(Object.keys(frontmatter))){return}
      
        console.log("Re-order metadata")
        // Trier les propriétés et extraire celles en plus
        const { sortedFrontmatter, extraProperties } = this.sortFrontmatter(frontmatter, propertiesOrder);
        await this.saveFrontmatter(sortedFrontmatter, extraProperties);
    }
    
    async saveFrontmatter(frontmatter: Record<string, any>, extraProperties: string[] = []) {
        const fileContent = await this.app.vault.read(this.file);
        const { body } = this.extractFrontmatter(fileContent);
    
        // Reformater le frontmatter
        const newFrontmatter = this.formatFrontmatter(frontmatter);
        const filteredExtraProperties = extraProperties.filter(prop => prop.trim() !== "");
        const extraText = filteredExtraProperties.length > 0 ? `\n${filteredExtraProperties.join("\n")}` : "";

        
        // Sauvegarde du fichier
        const newContent = `---\n${newFrontmatter}\n---\n${body}${extraText}`;
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
            }
            else {
              sortedFrontmatter[prop] = null
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
    formatFrontmatter(frontmatter: Record<string, any>) {
        return Object.entries(frontmatter)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join("\n");
    }
  

}