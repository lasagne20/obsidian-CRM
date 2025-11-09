import { MarkdownView, Menu, Plugin, TAbstractFile, TFile } from 'obsidian';
import { Vault } from 'markdown-crm';
import { ObsidianApp } from 'src/App';
import { CRMSettingTab } from 'settings';

interface Settings {
  templateFolder: string;
  dataFile: string;
  personalName: string;
  additionalFiles: string[];
  configPath: string;
}
 
const DEFAULT_SETTINGS: Settings = {
  templateFolder: "Outils/Obsidian/Templates",
  dataFile: "Outils/Obsidian/Data/geo.json",
  personalName: "Léo",
  additionalFiles: [],
  configPath: "Outils/Obsidian/Config",
};

export default class CRM extends Plugin {
  public vault: Vault;
  public obsidianApp: ObsidianApp;
  public settings: Settings = DEFAULT_SETTINGS;
  private currentFilePath: string | null = null;

  async onload() {
    console.log("🚀 Plugin CRM - Loading...");
    
    // Wait for the vault to be fully loaded
    this.app.workspace.onLayoutReady(() => {
      this.initializePlugin();
    });
  }

  async initializePlugin() {
    console.log("✅ Vault layout ready");
    
    // Load settings
    this.addSettingTab(new CRMSettingTab(this.app, this));
    await this.loadSettings();
    console.log("✅ Settings loaded:", this.settings);
    
    // Initialize the ObsidianApp adapter
    this.obsidianApp = new ObsidianApp(this.app);
    console.log("✅ ObsidianApp adapter initialized");
    
    // Initialize Vault.classes if not already initialized (library bug fix)
    if (!(Vault as any).classes) {
      (Vault as any).classes = {};
      console.log("🔧 Initialized Vault.classes");
    }
    
    // Initialize the Vault with the adapter
    this.vault = new Vault(this.obsidianApp, {
      templateFolder: this.settings.templateFolder,
      personalName: this.settings.personalName,
      configPath: this.settings.configPath
    });
    console.log("✅ Vault initialized");

    // Log dynamic class factory
    const factory = this.vault.getDynamicClassFactory();
    if (factory) {
      console.log("✅ Dynamic Class Factory loaded");
      const classes = (this.vault.constructor as any).classes;
      console.log("📋 Available classes:", Object.keys(classes || {}));
    } else {
      console.warn("⚠️ Dynamic Class Factory not initialized");
    }

    // Register right-click menu
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        this.addContextMenuOption(menu, file);
      })
    );

    // Replace metadata container with custom display
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.replaceMetadataContainer();
      })
    );

    // Initial replacement
    this.replaceMetadataContainer();
 
    // Add test command to display current file info
    this.addCommand({
      id: "test-display-current-file",
      name: "Test: Afficher les infos du fichier actuel",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          console.log("❌ No active file");
          this.obsidianApp.sendNotice("Aucun fichier actif");
          return;
        }

        console.log("📄 Active file:", activeFile.path);
        
        try {
          const iFile = this.obsidianApp.toIFile(activeFile);
          const classe = await this.vault.getFromFile(iFile);
          
          if (classe) {
            console.log("✅ Classe found:", classe.constructor.name);
            console.log("📦 Properties:", classe.getProperties().map(p => p.name));
            
            const display = await classe.getDisplay();
            if (display) {
              console.log("🎨 Display generated successfully");
              console.log("🎨 Display element:", display);
              this.obsidianApp.sendNotice(`Display généré pour ${classe.constructor.name}`);
            } else {
              console.log("⚠️ No display generated");
              this.obsidianApp.sendNotice("Aucun display généré");
            }
          } else {
            console.log("⚠️ No classe found");
            this.obsidianApp.sendNotice("Aucune classe trouvée");
          }
        } catch (error) {
          console.error("❌ Error:", error);
          this.obsidianApp.sendNotice("Erreur: " + error.message);
        }
      }
    });

    console.log("✅ Plugin CRM - Loaded successfully");
  }

  async replaceMetadataContainer() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    const file = activeView.file;
    if (!file) return;

    // Check if we're still on the same file - if so, don't recreate the display
    if (this.currentFilePath === file.path) {
      console.log("✅ Same file, keeping existing display");
      return;
    }

    try {
      // Find the metadata container
      const view = activeView.contentEl;
      const metadataContainer = view.querySelector('.metadata-container');
      
      if (!metadataContainer) {
        console.log("⚠️ No metadata container found");
        return;
      }

      // Remove any existing custom display first
      const existingCustomDisplay = view.querySelector('.crm-custom-display');
      if (existingCustomDisplay) {
        existingCustomDisplay.remove();
        console.log("🧹 Removed existing custom display");
      }

      // Show the original metadata container (in case it was hidden)
      (metadataContainer as HTMLElement).style.display = '';

      // Get the classe instance
      const iFile = this.obsidianApp.toIFile(file);
      const classe = await this.vault.getFromFile(iFile);
      
      if (!classe) {
        console.log("⚠️ No classe found for file:", file.path);
        this.currentFilePath = null;
        return;
      }
      console.log("📦 Classe retrieved for file:", file.path, "->", classe.constructor.name);

      // Generate custom display
      const customDisplay = await (classe as any).getDisplay();
      if (!customDisplay) {
        console.log("⚠️ No custom display generated");
        this.currentFilePath = null;
        return;
      }

      // Hide the original metadata container
      (metadataContainer as HTMLElement).style.display = 'none';

      // Create wrapper for custom display
      const wrapper = document.createElement('div');
      wrapper.addClass('crm-custom-display');
      wrapper.appendChild(customDisplay);

      // Insert after the hidden metadata container
      metadataContainer.parentElement?.insertBefore(wrapper, metadataContainer.nextSibling);

      // Remember the current file path
      this.currentFilePath = file.path;

      console.log("✅ Metadata container replaced with custom display");
    } catch (error) {
      console.error("❌ Error replacing metadata container:", error);
      this.currentFilePath = null;
    }
  }

  // Add icon to right-click menu
  addContextMenuOption(menu: Menu, file: TAbstractFile | null) {
    menu.addItem((item) =>
      item
        .setTitle("Rafraichir l'objet")
        .setIcon("refresh-ccw")
        .onClick(async () => {
          if (!file || !(file instanceof TFile)) {
            console.log("❌ No file selected or file is not a TFile");
            return;
          }
          
          console.log("🔄 Refreshing file:", file.path);
          
          try {
            // Get the classe instance from the vault
            const iFile = this.obsidianApp.toIFile(file);
            console.log("📄 IFile created:", iFile);
            
            const classe = await this.vault.getFromFile(iFile);
            console.log("📦 Classe retrieved:", classe ? classe.constructor.name : "null");
            
            if (classe) {
              console.log("🔧 Updating classe...");
              await classe.update();
              console.log("✅ Classe updated successfully");
              this.obsidianApp.sendNotice("Objet rafraîchi avec succès");
              
              // Log display if available
              const display = await classe.getDisplay();
              if (display) {
                console.log("🎨 Display generated:", display);
              }
            } else {
              console.warn("⚠️ No classe found for file:", file.path);
              this.obsidianApp.sendNotice("Aucune classe trouvée pour ce fichier");
            }
          } catch (error) {
            console.error('❌ Erreur lors du rafraîchissement:', error);
            this.obsidianApp.sendNotice("Erreur lors du rafraîchissement");
          }
        })
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    console.log("Plugin CRM - Unloaded");
  }
}
