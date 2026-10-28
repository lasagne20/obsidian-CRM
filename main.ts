import { MarkdownView, Menu, Notice, Plugin, TAbstractFile, TFile, TFolder } from 'obsidian';
import * as L from 'leaflet';
import { Vault, ISettings } from 'markdown-crm';
import { ObsidianApp } from 'src/App';
import { CRMSettingTab } from 'settings';
import { FileFolderManager } from 'src/FileFolderManager';
import { ClassFileModals } from 'src/Modals/Modals';

// The CRM map display (DynamicMap) expects Leaflet as a global `L`
(window as any).L = L;

interface Settings extends ISettings {
  templateFolder: string;
  dataFile: string;
  personalName: string;
  additionalFiles: string[];
  configPath: string;
  enableFolderNotes: boolean;
  folderNotePosition: 'inside' | 'outside';
  hideInFileExplorer: boolean;
  underlineFolderWithNote: boolean;
  classePropertyName: string;
  classePropertyAliases: string[];
  deleteAliasesAfterMigration: boolean;
  tooltipType: "title" | "aria-label" | "both" | undefined;
}
 
const DEFAULT_SETTINGS: Settings = {
  templateFolder: "Outils/Obsidian/Templates",
  dataFile: "Outils/Obsidian/Data/geo.json",
  personalName: "Léo",
  tooltipType: "aria-label",
  additionalFiles: [],
  configPath: "Outils/Obsidian/Config",
  enableFolderNotes: true,
  folderNotePosition: 'inside',
  hideInFileExplorer: true,
  underlineFolderWithNote: true,
  classePropertyName: 'classe',
  classePropertyAliases: ['Classe'],
  deleteAliasesAfterMigration: true,
  // ISettings defaults
  phoneFormat: 'FR',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  numberLocale: 'fr-FR',
  currencySymbol: '€',
};

export default class CRM extends Plugin {
  public vault: Vault;
  public obsidianApp: ObsidianApp;
  public settings: Settings = DEFAULT_SETTINGS;
  private currentFilePath: string | null = null;
  private currentDisplayGeneration: number = 0;
  private folderManager: FileFolderManager | null = null;
  private classFileModals: ClassFileModals | null = null;
  public loadedClassNames: string[] = [];

  async onload() {
    // Build marker: proves which main.js build is actually loaded.
    // If this timestamp does not match the latest build, Obsidian is
    // running a stale or different main.js.
    
    // Load settings first
    await this.loadSettings();
    
    // Add settings tab once
    this.addSettingTab(new CRMSettingTab(this.app, this));
    
    // Wait for the vault to be fully loaded
    this.app.workspace.onLayoutReady(() => {
      this.initializePlugin();
    });
  }

  async initializePlugin() {
    
    // Show loading notice
    const loadingNotice = new Notice("🔄 Chargement de markdown-crm en cours...", 0);
    
    // Initialize the ObsidianApp adapter with settings
    this.obsidianApp = new ObsidianApp(this.app, this.settings);
    
    // Register display refresh callback
    this.obsidianApp.setDisplayRefreshCallback(() => {
      
      // Force removal of existing display before refresh
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (activeView) {
        const view = activeView.contentEl;
        const existingCustomDisplays = view.querySelectorAll('.crm-custom-display');
        if (existingCustomDisplays.length > 0) {
          existingCustomDisplays.forEach(display => display.remove());
        }
      }
      
      this.currentFilePath = null;
      this.currentDisplayGeneration++; // Invalidate any in-progress display creation
      this.replaceMetadataContainer();
    });
    
    // Initialize Vault.classes if not already initialized (library bug fix)
    if (!(Vault as any).classes) {
      (Vault as any).classes = {};
    }
    
    // Initialize the Vault with the adapter
    this.vault = new Vault(this.obsidianApp, {
      templateFolder: this.settings.templateFolder,
      personalName: this.settings.personalName,
      configPath: this.settings.configPath
    });

    // Load class names from YAML config files
    const knownClasses = await this.loadClassNamesFromConfig();
    this.loadedClassNames = knownClasses; // Store for settings display
    
    for (const className of knownClasses) {
      this.addCommand({
        id: `open-${className.toLowerCase()}`,
        name: `Ouvrir/Créer: ${className}`,
        callback: async () => {
          await this.classFileModals?.openClassFileSuggester(className, async (file) => {
            if (file) {
              const filePath = file.getPath ? file.getPath() : file.path;
              const tFile = this.app.vault.getAbstractFileByPath(filePath);
              if (tFile instanceof TFile) {
                await this.app.workspace.getLeaf().openFile(tFile);
              }
            }
          });
        }
      });
    }
    

    // Register right-click menu
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        this.addContextMenuOption(menu, file);
      })
    );

    // Initialize folder manager with vault
    this.folderManager = new FileFolderManager(
      this.app, 
      {
        enabled: this.settings.enableFolderNotes,
        position: this.settings.folderNotePosition,
        hideInFileExplorer: this.settings.hideInFileExplorer,
        underlineFolderWithNote: this.settings.underlineFolderWithNote
      },
      this.vault
    );
    this.folderManager.initialize();

    // Initialize class file modals helper
    this.classFileModals = new ClassFileModals(
      this.app,
      this.vault,
      this.obsidianApp,
      async () => {
        // Reset currentFilePath to force display refresh
        this.currentFilePath = null;
        
        // Force replace metadata container to show the display
        await this.replaceMetadataContainer();
      }
    );

    // Register folder notes functionality
    if (this.settings.enableFolderNotes) {
      this.folderManager.registerEvents(this);
      this.folderManager.registerCommands(this);
    }

    // Watch for file changes to update folder styles
    this.registerEvent(
      this.app.vault.on('create', (file) => {
        this.folderManager?.onFileCreated(file);
      })
    );
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        this.folderManager?.onFileDeleted(file);
      })
    );
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        this.folderManager?.onFileRenamed(file, oldPath);
      })
    );

    // Replace metadata container with custom display
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", async () => {
        await this.replaceMetadataContainer();
      })
    );


    // Initial replacement
    await this.replaceMetadataContainer();

    // Hide loading notice and show ready notice
    loadingNotice.hide();

  }
  async replaceMetadataContainer() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;

    const file = activeView.file;
    if (!file) return;

    // Check if we're still on the same file - if so, check if display still exists
    if (this.currentFilePath === file.path) {
      const view = activeView.contentEl;
      const existingDisplay = view.querySelector('.crm-custom-display');
      if (existingDisplay) {
        return;
      }
    }

    // Set the current file path immediately to prevent race conditions
    this.currentFilePath = file.path;
    
    // Capture the current generation to detect if we've been invalidated
    const myGeneration = ++this.currentDisplayGeneration;

    try {
      // Find the metadata container
      const view = activeView.contentEl;
      const metadataContainer = view.querySelector('.metadata-container');
      
      if (!metadataContainer) {
        return;
      }

      // Remove ALL existing custom displays (not just the first one)
      const existingCustomDisplays = view.querySelectorAll('.crm-custom-display');
      if (existingCustomDisplays.length > 0) {
        existingCustomDisplays.forEach(display => display.remove());
      }

      // Show the original metadata container (in case it was hidden)
      (metadataContainer as HTMLElement).style.display = '';

      // Get the classe instance
      const iFile = this.obsidianApp.toIFile(file);
      const classe = await this.vault.getFromFile(iFile);
      
      // Check if we've been invalidated during the async operation
      if (myGeneration !== this.currentDisplayGeneration) {
        return;
      }
      
      if (!classe) {
        this.currentFilePath = null;
        return;
      }

      // Generate custom display
      const customDisplay = await (classe as any).getDisplay();
      
      // Check again if we've been invalidated during display generation
      if (myGeneration !== this.currentDisplayGeneration) {
        return;
      }
      
      if (!customDisplay) {
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
            return;
          } 
          
          
          try {
            // Get the classe instance from the vault
            const iFile = this.obsidianApp.toIFile(file);
            
            const classe = await this.vault.getFromFile(iFile);
            
            if (classe) {
              await classe.update();
              this.obsidianApp.sendNotice("Objet rafraîchi avec succès");
              
              // Log display if available
              const display = await classe.getDisplay();
              if (display) {
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
    
    // Update folder manager settings
    if (this.folderManager) {
      this.folderManager.updateSettings({
        enabled: this.settings.enableFolderNotes,
        position: this.settings.folderNotePosition,
        hideInFileExplorer: this.settings.hideInFileExplorer,
        underlineFolderWithNote: this.settings.underlineFolderWithNote
      });
    }
  }

  /**
   * Load class names from YAML config files
   */
  async loadClassNamesFromConfig(): Promise<string[]> {
    try {
      const configPath = this.settings.configPath;
      const configFolder = this.app.vault.getAbstractFileByPath(configPath);
      
      if (!configFolder || !('children' in configFolder)) {
        console.warn(`⚠️ Config folder not found: ${configPath}`);
        return [];
      }
      
      const classNames: string[] = [];
      
      // Scan all .yaml files in config folder
      for (const file of (configFolder as any).children) {
        if (file.extension === 'yaml') {
          // Extract class name from filename (remove .yaml extension)
          const className = file.basename;
          classNames.push(className);
        }
      }
      
      return classNames;
    } catch (error) {
      console.error('❌ Error loading class names from config:', error);
      return [];
    }
  }

  /**
   * Register keyboard shortcuts for creating and searching each class
   */
  registerClassCommands(classes: any) {
    
    if (!classes) {
      console.error("❌ Classes is null or undefined");
      return;
    }
    
    const classNames = Object.keys(classes);
    
    if (classNames.length === 0) {
      console.warn("⚠️ No classes found for command registration");
      return;
    }
    
    
    for (const className of classNames) {
      // Single command to search or create
      const commandId = `open-${className.toLowerCase()}`;
      const commandName = `Ouvrir/Créer: ${className}`;
      
      
      this.addCommand({
        id: commandId,
        name: commandName,
        callback: async () => {
          await this.classFileModals?.openClassFileSuggester(className);
        }
      });
      
    }
    
  }

  onunload() {
    
    // Cleanup folder manager
    if (this.folderManager) {
      this.folderManager.destroy();
      this.folderManager = null;
    }
  }
}
