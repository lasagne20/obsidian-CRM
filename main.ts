import { Classe } from 'Classes/Classe';
import { Plugin, MarkdownView, TFile, App, TFolder, Menu, TAbstractFile } from 'obsidian';
import { CRMSettingTab } from 'settings';
import { TopDisplay } from 'Utils/Display/TopDisplay';
import { MyVault } from "Utils/MyVault";
import { Settings } from 'Utils/Settings';
import { waitForMetaDataCacheUpdate } from 'Utils/Utils';


const DEFAULT_SETTINGS: Settings = {
  templateFolder: "Outils/Obsidian/Templates", // Dossier par défaut
  dataFile: "Outils/Obsidian/Data/geo.json", // Dossier par défaut
  additionalFiles : [],
};

export default class CRM extends Plugin {
  public vault: MyVault;
  public settings = DEFAULT_SETTINGS;
  private inUpdate = false;
  public topDisplay: TopDisplay;

  async onload() {
    this.addSettingTab(new CRMSettingTab(this.app, this));
    await this.loadSettings();
    this.vault = new MyVault(this.app, this.settings);
    
    // Editor change
    this.app.workspace.on("editor-change", async () => {
      await this.handleMetadataUpdate(async () => {
        //await this.topDisplay.update();
      });
      this.handleUpdate()
    });

    // Tab change
    this.app.workspace.on("active-leaf-change", async () => {
      await this.topDisplay.show();
      await this.handleMetadataUpdate( async () => {
        await this.handleUpdate()
      });
    });

    // Click on lick
    document.addEventListener("click", async (event) => {
        this.handleClickOnInternalLink(event);
    });

    // Rename a file
    this.app.vault.on("rename", async (file) => {
        this.handleFileRename(file);
    });

    // Right-click menu
    this.registerEvent(
        this.app.workspace.on("file-menu", (menu, file) => {
            this.addContextMenuOption(menu, file);
        })
    );

    this.loadHotKeys()
    this.topDisplay = new TopDisplay(this.app, this.vault)
    console.log("Plugin CRM - Loaded")
    this.updateFile()
  }

  private loadHotKeys(){
    for (let [name,classe] of Object.entries(MyVault.classes)){
      this.addCommand({
        id: "create-"+name,
        name: "Créer un nouveau fichier "+name,
        callback: async () => this.handleCreateNewFile(name, classe)});
    }
  }

  // Lock the action to be sure only one action is in process
  private async runWithUpdateLock(action: () => Promise<void>) {
      if (this.inUpdate) return;
      this.inUpdate = true;
      try {
          await action();
      } catch (error) {
          console.error("Erreur :", error);
      } finally {
          this.inUpdate = false;
      }
  }

  async handleCreateNewFile(name: string, classe : typeof Classe){
    await this.runWithUpdateLock(async () => {
      let file = await this.vault.createFile(classe);
      if (!file) {return}
      const leaf = this.app.workspace.getLeaf();
      await leaf.openFile(file);
  })
  }

  // Update the file
  private async handleUpdate(force: boolean = true, time = 100) {
      await this.handleMetadataUpdate(async () => {
          await this.updateFile(force);
      }, time);
  }

  private async handleMetadataUpdate(action: () => Promise<void>, time = 100) {
    await this.runWithUpdateLock(async () => {
        const metadataUpdatePromise = waitForMetaDataCacheUpdate(this.app, action);
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, time));
        
        await Promise.race([metadataUpdatePromise, timeoutPromise]);
        await action();
    });
}


  // Internal link click
  private async handleClickOnInternalLink(event: Event) {
      await this.runWithUpdateLock(async () => {
          const target = event.target as HTMLElement | null;
          if (!target) return;
          const linkElement = target.closest(".internal-link.is-unresolved") as HTMLAnchorElement | null;
          if (linkElement) {
              event.preventDefault();
              const linkText = linkElement.textContent?.trim();
              if (linkText) {
                  await this.createNewFile(linkText);
              }
          }
      });
  }

  // Rename of a file
  private async handleFileRename(file: TAbstractFile) {
      await this.handleMetadataUpdate(async () => {
        console.log("Rename " + file.name)
          let classe;
          if (file instanceof TFile) {
              classe = this.vault.getFromFile(file);
          } else if (file instanceof TFolder) {
              classe = this.vault.getFromFolder(file);
          }
          if (classe) {
              await classe.updatePropertyParent();
          }
      });
  }

  // Add icon to right-click menu
  addContextMenuOption(menu: Menu, file: TAbstractFile | null) {
    menu.addItem((item) =>
        item
            .setTitle("Rafraichir l'objet")
            .setIcon("refresh-ccw") // Icône (optionnel)
            .onClick(async () =>  {
              await this.runWithUpdateLock(async () => {
                if (!file){return}
                let classe = this.vault.getFromFile(file)
                await classe?.update()
              });
            })
    );
  }


  // Create a new file from a name
  async createNewFile(name : string) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    const file = activeView.file; // Récupère le fichier actif
    if (!file) return;

    if (!(file instanceof TFile)) return;
    console.log("Create new object")
    await this.vault.createLinkFile(file, name)
  }

  // Update the current file
  async updateFile(check: boolean = false) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    const file = activeView.file; 
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

  async refreshVault(){
    await this.runWithUpdateLock(async () => {
      await this.vault.refreshAll()
    });
    
  }

  onunload() {
    console.log("Plugin unloaded");
  }
}
