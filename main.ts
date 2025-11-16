import { MarkdownView, Menu, Plugin, TAbstractFile, TFile, TFolder } from 'obsidian';
import { Vault, ISettings } from 'markdown-crm';
import { ObsidianApp } from 'src/App';
import { CRMSettingTab } from 'settings';
import { FileFolderManager } from 'src/FileFolderManager';
import { ClassFileModals } from 'src/Modals/Modals';

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
}
 
const DEFAULT_SETTINGS: Settings = {
  templateFolder: "Outils/Obsidian/Templates",
  dataFile: "Outils/Obsidian/Data/geo.json",
  personalName: "Léo",
  additionalFiles: [],
  configPath: "Outils/Obsidian/Config",
  enableFolderNotes: true,
  folderNotePosition: 'inside',
  hideInFileExplorer: true,
  underlineFolderWithNote: true,
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
  private folderManager: FileFolderManager | null = null;
  private classFileModals: ClassFileModals | null = null;
  public loadedClassNames: string[] = [];

  async onload() {
    console.log("🚀 Plugin CRM - Loading...");
    
    // Load settings first
    await this.loadSettings();
    console.log("✅ Settings loaded:", this.settings);
    
    // Add settings tab once
    this.addSettingTab(new CRMSettingTab(this.app, this));
    
    // Wait for the vault to be fully loaded
    this.app.workspace.onLayoutReady(() => {
      this.initializePlugin();
    });
  }

  async initializePlugin() {
    console.log("✅ Vault layout ready");
    
    // Initialize the ObsidianApp adapter with settings
    this.obsidianApp = new ObsidianApp(this.app, this.settings);
    console.log("✅ ObsidianApp adapter initialized with settings");
    
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

    // Load class names from YAML config files
    const knownClasses = await this.loadClassNamesFromConfig();
    this.loadedClassNames = knownClasses; // Store for settings display
    console.log("📋 Registering commands for classes from config:", knownClasses);
    
    for (const className of knownClasses) {
      this.addCommand({
        id: `open-${className.toLowerCase()}`,
        name: `Ouvrir/Créer: ${className}`,
        callback: async () => {
          console.log(`🚀 Command executed: ${className}`);
          await this.classFileModals?.openClassFileSuggester(className);
        }
      });
      console.log(`✅ Registered command: Ouvrir/Créer: ${className}`);
    }
    
    console.log("✅ All commands registered");

    // Log dynamic class factory (for info only)
    const factory = this.vault.getDynamicClassFactory();
    if (factory) {
      console.log("✅ Dynamic Class Factory loaded");
      const classes = (this.vault.constructor as any).classes;
      console.log("📋 Loaded dynamic classes:", Object.keys(classes || {}));
      
      // Load data for classes that have data files configured
      console.log("🔄 Checking for classes with data files to load...");
      for (const className of knownClasses) {
        try {
          const configManager = (factory as any).configManager;
          const config = await configManager.getClassConfig(className);
          
          if (config.data && config.data.length > 0) {
            console.log(`📥 Class "${className}" has ${config.data.length} data source(s), attempting to load...`);
            
            // Load data for this class
            const loadedData = await configManager.loadClassData(className);
            console.log(`✅ Loaded ${loadedData.length} data items for "${className}"`);
            
            // Setup dynamic reload if configured
            const hasDynamicSource = config.data.some((ds: any) => ds.dynamic);
            if (hasDynamicSource) {
              console.log(`📡 Setting up dynamic reload for "${className}"...`);
              await (factory as any).setupDynamicDataReload(className, this.vault);
            }
          }
        } catch (error) {
          console.error(`❌ Error loading data for "${className}":`, error);
        }
      }
    } else {
      console.warn("⚠️ Dynamic Class Factory not initialized");
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

    // Add test command to find children
    this.addCommand({
      id: "test-find-children",
      name: "Test: Trouver les enfants du fichier actuel",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          console.log("❌ No active file");
          this.obsidianApp.sendNotice("Aucun fichier actif");
          return;
        }

        try {
          const iFile = this.obsidianApp.toIFile(activeFile);
          const classe = await this.vault.getFromFile(iFile);
          
          if (classe) {
            console.log("📂 Recherche des enfants de:", activeFile.path);
            console.log("📂 Nom du fichier:", activeFile.basename);
            
            // Log IFile children
            console.log("📦 IFile.children:", iFile.children?.length || 0);
            if (iFile.children && iFile.children.length > 0) {
              console.log("📦 Liste des children dans IFile:");
              iFile.children.forEach(c => console.log(`  - ${c.path}`));
            }
            
            // Get the dedicated folder path
            const fileFolder = activeFile.path.substring(0, activeFile.path.lastIndexOf('/'));
            const fileFolderName = fileFolder.substring(fileFolder.lastIndexOf("/") + 1);
            const hasOwnFolder = fileFolderName === activeFile.basename;
            const dedicatedFolderPath = hasOwnFolder ? fileFolder : `${fileFolder}/${activeFile.basename}`;
            
            console.log("📂 Dossier dédié attendu:", dedicatedFolderPath);
            console.log("📂 A déjà son propre dossier:", hasOwnFolder);
            
            // List all files
            const allFiles = await this.obsidianApp.listFiles();
            console.log(`📋 Total de ${allFiles.length} fichier(s) avec Classe`);
            
            // Check which files would be in dedicated folder
            const inDedicatedFolder = allFiles.filter(f => {
              const folder = f.path.substring(0, f.path.lastIndexOf('/'));
              return folder === dedicatedFolderPath || folder.startsWith(dedicatedFolderPath + '/');
            });
            
            console.log(`📂 ${inDedicatedFolder.length} fichier(s) dans le dossier dédié:`);
            inDedicatedFolder.forEach(f => console.log(`  - ${f.path}`));
            
            // Call findChildren
            const children = await (classe as any).findChildren();
            console.log(`✅ Trouvé ${children.length} enfant(s):`);
            
            for (const child of children) {
              const childFile = child.getFile();
              console.log(`  - ${childFile?.getPath()}`);
            }
            
            this.obsidianApp.sendNotice(`Trouvé ${children.length} enfant(s)`);
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

    // Add test command to check IFile parent/children properties
    this.addCommand({
      id: "test-ifile-relations",
      name: "Test: Vérifier parent/children IFile",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          console.log("❌ No active file");
          this.obsidianApp.sendNotice("Aucun fichier actif");
          return;
        }

        try {
          console.log("🔍 Testing IFile parent/children for:", activeFile.path);
          
          const iFile = this.obsidianApp.toIFile(activeFile);
          
          console.log("📁 Parent:", iFile.parent?.path || "none");
          console.log("👶 Children count:", iFile.children?.length || 0);
          
          if (iFile.children && iFile.children.length > 0) {
            console.log("👶 Children list:");
            for (const child of iFile.children) {
              console.log(`  - ${child.path} (${(child as any).extension || 'folder'})`);
            }
          }
          
          // Check parent chain
          if (iFile.parent) {
            console.log("🔗 Parent chain:");
            let current: any = iFile.parent;
            let depth = 0;
            while (current && depth < 10) {
              console.log(`  ${'  '.repeat(depth)}↑ ${current.path}`);
              current = current.parent;
              depth++;
            }
          }
          
          this.obsidianApp.sendNotice(`Parent: ${iFile.parent?.name || 'none'}, Children: ${iFile.children?.length || 0}`);
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

      // Remove ALL existing custom displays (not just the first one)
      const existingCustomDisplays = view.querySelectorAll('.crm-custom-display');
      if (existingCustomDisplays.length > 0) {
        existingCustomDisplays.forEach(display => display.remove());
        console.log(`🧹 Removed ${existingCustomDisplays.length} existing custom display(s)`);
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
      
      console.log(`📂 Found ${classNames.length} class configs in ${configPath}:`, classNames);
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
    console.log("🎹 registerClassCommands called");
    console.log("📦 Classes object:", classes);
    
    if (!classes) {
      console.error("❌ Classes is null or undefined");
      return;
    }
    
    const classNames = Object.keys(classes);
    console.log("📋 Class names:", classNames);
    
    if (classNames.length === 0) {
      console.warn("⚠️ No classes found for command registration");
      return;
    }
    
    console.log(`🎹 Registering ${classNames.length} commands for classes:`, classNames);
    
    for (const className of classNames) {
      // Single command to search or create
      const commandId = `open-${className.toLowerCase()}`;
      const commandName = `Ouvrir/Créer: ${className}`;
      
      console.log(`📝 Adding command: ${commandId} - ${commandName}`);
      
      this.addCommand({
        id: commandId,
        name: commandName,
        callback: async () => {
          console.log(`🚀 Command executed: ${commandName}`);
          await this.classFileModals?.openClassFileSuggester(className);
        }
      });
      
      console.log(`✅ Registered command: ${commandName}`);
    }
    
    console.log("✅ All commands registered successfully");
  }

  onunload() {
    console.log("Plugin CRM - Unloaded");
    
    // Cleanup folder manager
    if (this.folderManager) {
      this.folderManager.destroy();
      this.folderManager = null;
    }
  }
}
