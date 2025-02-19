import { Plugin, MarkdownView, TFile, App } from 'obsidian';
import { GestionManagerSettingTab } from 'settings';
import { MyVault } from "Utils/MyVault";


const DEFAULT_SETTINGS: Settings = {
  templateFolder: "Outils/Obsidian/Templates", // Dossier par défaut
};

export default class GestionManager extends Plugin {
  public vault: MyVault;
  public settings = DEFAULT_SETTINGS;

  async onload() {
    this.vault = new MyVault(this.app, this.settings);

    // Enregistrer un événement pour ajouter dynamiquement un DataviewJS chaque fois qu'un fichier est ouvert
    let inUpdate = false;
    this.addSettingTab(new GestionManagerSettingTab(this.app, this));
    this.loadSettings();

    this.app.workspace.on("editor-change", async () => {
      if (inUpdate) {return}
      inUpdate = true;
      // waiting for the cache to be updated
      const onResolved = async () => {
        this.app.metadataCache.off('resolved', onResolved);
        await this.updateFile()
      };
      this.app.metadataCache.on('resolved', onResolved);
      inUpdate = false;
    });

    this.app.workspace.on('active-leaf-change', async () => {
      if (inUpdate) {return}
      inUpdate = true;
      await this.updateFile(true)
      inUpdate = false;
    });

    document.addEventListener("click", async (event) => {
      if (inUpdate) {return}
      inUpdate = true;
      const target = event.target as HTMLElement;
      // Vérifie si l'élément cliqué est un lien local et non résolu
      if (target.classList.contains("internal-link") || target.classList.contains("is-unresolved")) {
        event.preventDefault();
        const linkUrl = (target as HTMLAnchorElement).href;
        if (target.textContent){
          await this.createNewFile(target.textContent, linkUrl);
        }
      }
      inUpdate = false;
    });

    this.app.vault.on('rename', async (file) => {
      if (inUpdate) {return}
      inUpdate = true;
      if (!(file instanceof TFile)) return;
      let classe = this.vault.getFromFile(file)
      classe.updateParent()
      inUpdate = false;
    });

  }

  async createNewFile(name : string, path : string) {
    console.log("Create new object")
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    const file = activeView.file; // Récupère le fichier actif
    if (!file) return;

    if (!(file instanceof TFile)) return;

    await this.vault.createLinkFile(file, name)
  }

  private inUpdate : boolean = false;

  async updateFile(check: boolean = false) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    const file = activeView.file; // Récupère le fichier actif
    if (!file) return;

    if (!(file instanceof TFile)) return;

    console.log("Update objects")
    if (check){
      // Validate the content of the file
      await this.vault.checkFile(file)
    }
    await this.vault.updateFile(file)
    console.log("Object updated")

  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  
  async saveSettings() {
    await this.saveData(this.settings);
  }


  onunload() {
    console.log("Plugin unloaded");
  }
}
