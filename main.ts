import { Plugin, MarkdownView, TFile, App } from 'obsidian';
import { Vault } from "Classes/Vault";

export default class GestionManager extends Plugin {
  async onload() {
    this.vault = new Vault();

    // Enregistrer un événement pour ajouter dynamiquement un DataviewJS chaque fois qu'un fichier est ouvert
    this.registerEvent(
      this.app.workspace.on("editor-change", this.vault.updateFile.bind(this))
    );
	this.registerEvent(
		this.app.workspace.on("active-leaf-change", this.vault.updateFile.bind(this))
	  );

  
  }

  async updateFile(file){
    this.vault.updateFile(fi)
  }

  async handleFileMoveAndCreateFolder(file: TFile, oldPath: string, app: App) {
    console.log(`Fichier déplacé : ${oldPath} → ${file.path}`);
  
    // Vérifier que c'est bien un fichier et non un dossier
    if (!(file instanceof TFile)) return;
  
    // Lire les métadonnées du fichier
    const metadata = app.metadataCache.getFileCache(file)?.frontmatter;
    if (!metadata || metadata["Classe"] !== "Institutions") {
      console.log(`Ignoré : Métadonnée "Classe" absente ou différente de "Institutions"`);
      return;
    }
  
    // Déterminer le dossier à créer (même nom que le fichier sans extension)
    const newFolderPath = file.path.substring(0, file.path.lastIndexOf("."));
  
    try {
      await app.vault.createFolder(newFolderPath);
      console.log(`Dossier créé : ${newFolderPath}`);
      // Déplacer le fichier dans le dossier
      const newFilePath = `${newFolderPath}/${file.name}`;
      await app.vault.rename(file, newFilePath);
    } catch (error) {
      console.warn(`Le dossier existe déjà ou erreur de création : ${error}`);
    }
  }
  



  // Fonction pour ajouter dynamiquement un DataviewJS au début de la vue active
  async addDataviewJsToUI(file) {
    // Vérifier si le fichier ouvert est un fichier Markdown
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    // Vérifier si le conteneur de Dataview existe déjà dans la vue active
    let container = activeView.contentEl.querySelector("#dataviewjs-container");
    if (!container) {
      // Si le conteneur n'existe pas, créez un nouveau conteneur
      container = document.createElement("div");
      container.id = "dataviewjs-container";

      // Accéder au cache des métadonnées du fichier
      const metadataCache = this.app.metadataCache.getFileCache(file);

      if (metadataCache && metadataCache.frontmatter) {
		const frontmatter = metadataCache.frontmatter;
		console.log("Frontmatter récupéré:", frontmatter);
		// Exemple : Utiliser le frontmatter pour afficher une valeur spécifique
	   if (frontmatter.title) {
	     console.log("Titre du document:", frontmatter.title);
		}
	 }
      // Insérer le conteneur avant l'éditeur
	  const metadataContainer = activeView.contentEl.querySelector(".metadata-container");
      metadataContainer.parentNode.insertAfter(container, metadataContainer);
	  console.log(activeView.contentEl)
      // Ajouter un bloc DataviewJS au conteneur
      this.renderDataviewJs(container);
    }
  }

  // Fonction pour rendre dynamiquement le DataviewJS
  renderDataviewJs(container) {
    const dv = this.app.plugins.plugins["dataview"]?.api;
    if (!dv) {
      container.innerHTML = "<p style='color:red;'>Le plugin Dataview n'est pas chargé.</p>";
      return;
    }
    // Testez avec du contenu supplémentaire pour rendre le test plus visible
    const testContent = document.createElement("div");
	console.log(document)
    testContent.innerHTML = "<p><strong>Ceci est un test supplémentaire</strong> pour vérifier si le contenu est correctement rendu.</p>";
    container.appendChild(testContent);
  }

  onunload() {
    console.log("Plugin unloaded");
  }
}
