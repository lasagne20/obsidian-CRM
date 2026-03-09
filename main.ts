import { MarkdownView, Menu, Notice, Plugin, TAbstractFile, TFile, TFolder } from 'obsidian';
import { Vault, ISettings } from 'markdown-crm';
import { ObsidianApp } from 'src/App';
import { CRMSettingTab } from 'settings';
import { FileFolderManager } from 'src/FileFolderManager';
import { ClassFileModals } from 'src/Modals/Modals';
import { OllamaService, EntityExtractor } from 'src/Services/IA';
import { AIExtractModal } from 'src/Modals/AIExtractModal';

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
  // Ollama settings
  ollamaUrl: string;
  ollamaModel: string;
  ollamaTemperature: number;
  ollamaEnabled: boolean;
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
  // Ollama settings
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'mistral',
  ollamaTemperature: 0.1,
  ollamaEnabled: true,
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
  // Services IA
  private ollamaService: OllamaService | null = null;
  private entityExtractor: EntityExtractor | null = null;

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
    
    // Show loading notice
    const loadingNotice = new Notice("🔄 Chargement de markdown-crm en cours...", 0);
    
    // Initialize the ObsidianApp adapter with settings
    this.obsidianApp = new ObsidianApp(this.app, this.settings);
    console.log("✅ ObsidianApp adapter initialized with settings");
    
    // Register display refresh callback
    this.obsidianApp.setDisplayRefreshCallback(() => {
      console.log("🔄 Display refresh requested");
      
      // Force removal of existing display before refresh
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (activeView) {
        const view = activeView.contentEl;
        const existingCustomDisplays = view.querySelectorAll('.crm-custom-display');
        if (existingCustomDisplays.length > 0) {
          existingCustomDisplays.forEach(display => display.remove());
          console.log(`🧹 Forced removal of ${existingCustomDisplays.length} display(s) before refresh`);
        }
      }
      
      this.currentFilePath = null;
      this.currentDisplayGeneration++; // Invalidate any in-progress display creation
      this.replaceMetadataContainer();
    });
    
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

    // Initialize AI services
    if (this.settings.ollamaEnabled) {
      this.ollamaService = new OllamaService({
        url: this.settings.ollamaUrl,
        model: this.settings.ollamaModel,
        temperature: this.settings.ollamaTemperature
      });
      // On créera l'EntityExtractor après avoir chargé les noms de classes
      console.log("✅ OllamaService initialized");
    }

    // Load class names from YAML config files
    const knownClasses = await this.loadClassNamesFromConfig();
    this.loadedClassNames = knownClasses; // Store for settings display
    console.log("📋 Registering commands for classes from config:", knownClasses);
    
    // Initialize EntityExtractor with loaded class names
    if (this.settings.ollamaEnabled && this.ollamaService) {
      this.entityExtractor = new EntityExtractor(this.ollamaService, this.vault, knownClasses);
      console.log("✅ EntityExtractor initialized with classes:", knownClasses);
    }
    
    for (const className of knownClasses) {
      this.addCommand({
        id: `open-${className.toLowerCase()}`,
        name: `Ouvrir/Créer: ${className}`,
        callback: async () => {
          console.log(`🚀 Command executed: ${className}`);
          await this.classFileModals?.openClassFileSuggester(className, async (file) => {
            console.log(`📂 Opening file for class ${className}:`, file);
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
      console.log(`✅ Registered command: Ouvrir/Créer: ${className}`);
    }
    
    console.log("✅ All commands registered");

    // Add AI commands if enabled
    if (this.settings.ollamaEnabled && this.ollamaService) {
      // Command to test Ollama connection
      this.addCommand({
        id: 'test-ollama-connection',
        name: '🤖 Tester la connexion Ollama',
        callback: async () => {
          await this.ollamaService?.testConnection();
        }
      });

      // Command to extract entities from selection
      this.addCommand({
        id: 'extract-entities-from-selection',
        name: '✨ Extraire les entités (sélection)',
        editorCallback: async (editor, view) => {
          const selection = editor.getSelection();
          if (!selection) {
            new Notice('Veuillez sélectionner du texte');
            return;
          }
          await this.extractEntitiesFromText(selection, view.file?.path);
        }
      });

      console.log("✅ AI commands registered");
    }

    // Register right-click menu
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        this.addContextMenuOption(menu, file);
      })
    );

    // Register editor context menu for AI extraction
    if (this.settings.ollamaEnabled) {
      this.registerEvent(
        this.app.workspace.on("editor-menu", (menu, editor, view) => {
          const selection = editor.getSelection();
          if (selection) {
            menu.addItem((item) =>
              item
                .setTitle("✨ Extraire avec IA")
                .setIcon("sparkles")
                .onClick(async () => {
                  await this.extractEntitiesFromText(selection, view.file?.path);
                })
            );
          }
        })
      );
    }

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

    console.log("✅ Plugin CRM - Loaded successfully");
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
        console.log("✅ Same file, keeping existing display");
        return;
      }
      console.log("🔄 Same file but display missing, recreating...");
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
      console.log("📄 IFile created for file:", file.path, iFile);
      const classe = await this.vault.getFromFile(iFile);
      console.log("📦 Classe retrieved for file:", file.path, classe ? classe.constructor.name : "null");
      
      // Check if we've been invalidated during the async operation
      if (myGeneration !== this.currentDisplayGeneration) {
        console.log("🚫 Display generation invalidated, aborting");
        return;
      }
      
      if (!classe) {
        console.log("⚠️ No classe found for file:", file.path);
        this.currentFilePath = null;
        return;
      }
      console.log("📦 Classe retrieved for file:", file.path, "->", classe.constructor.name);

      // Generate custom display
      const customDisplay = await (classe as any).getDisplay();
      
      // Check again if we've been invalidated during display generation
      if (myGeneration !== this.currentDisplayGeneration) {
        console.log("🚫 Display generation invalidated after getDisplay, aborting");
        return;
      }
      
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

  /**
   * Extract entities from text using AI
   */
  async extractEntitiesFromText(text: string, currentFile?: string) {
    if (!this.entityExtractor || !this.settings.ollamaEnabled) {
      new Notice('Les services IA ne sont pas activés');
      return;
    }

    const loadingNotice = new Notice('🤖 Extraction en cours...', 0);

    try {
      // Extract entities
      const result = await this.entityExtractor.extractFromText(text, {
        currentFile
      });

      loadingNotice.hide();

      // Show modal to validate and edit
      const modal = new AIExtractModal(
        this.app,
        this.vault,
        result,
        async (entities) => {
          // Create files for each entity
          // Use a shared Map to track created entities for linking
          const createdEntities = new Map<string, any>();
          
          for (const entity of entities) {
            await this.createEntityFile(entity, createdEntities);
          }
        }
      );
      modal.open();

    } catch (error) {
      loadingNotice.hide();
      new Notice(`❌ Erreur: ${error.message}`);
      console.error('Error extracting entities:', error);
    }
  }

  /**
   * Convert property value based on its type from class config
   */
  async convertPropertyValue(
    propertyConfig: any,
    value: any,
    createdEntities: Map<string, any> = new Map()
  ): Promise<any> {
    if (value === null || value === undefined) {
      return value;
    }

    const propType = propertyConfig.type;

    switch (propType) {
      case 'FileProperty':
        // Handle link to another entity
        if (typeof value === 'string') {
          // Check if we already created this entity in this batch
          const existingEntity = createdEntities.get(value);
          if (existingEntity) {
            const file = existingEntity.getFile();
            const filename = file.getName ? file.getName() : file.name;
            return `[[${filename}]]`;
          }

          // Search for existing file or create it
          const classes = propertyConfig.classes || [];
          if (classes.length > 0) {
            // Try to find existing file
            const files = this.app.vault.getMarkdownFiles();
            const existingFile = files.find(f => 
              f.basename.toLowerCase() === value.toLowerCase() &&
              f.path.includes(classes[0]) // Check if in correct folder
            );

            if (existingFile) {
              // Return wikilink format [[filename]]
              return `[[${existingFile.basename}]]`;
            }

            // If not found, create the linked entity
            console.log(`🔗 Creating linked entity: ${classes[0]} - ${value}`);
            const ClassConstructor = (this.vault.constructor as any).classes[classes[0]];
            if (ClassConstructor) {
              const newEntity = await this.vault.createFile(ClassConstructor, value);
              createdEntities.set(value, newEntity);
              const file = newEntity.getFile();
              const filename = file.getName ? file.getName() : file.name;
              return `[[${filename}]]`;
            }
          }
        }
        return value;

      case 'ObjectProperty':
        // Handle nested properties
        if (typeof value === 'object' && !Array.isArray(value) && propertyConfig.properties) {
          const convertedObject: any = {};
          for (const [subKey, subValue] of Object.entries(value)) {
            const subPropConfig = propertyConfig.properties[subKey];
            if (subPropConfig) {
              convertedObject[subKey] = await this.convertPropertyValue(
                subPropConfig, 
                subValue, 
                createdEntities
              );
            } else {
              convertedObject[subKey] = subValue;
            }
          }
          return convertedObject;
        }
        return value;

      case 'MultiSelectProperty':
        // Ensure it's an array
        if (!Array.isArray(value)) {
          return [value];
        }
        return value;

      case 'PhoneProperty':
        // Normalize phone format if needed
        if (typeof value === 'string') {
          // Keep the value as-is, normalization done by AI
          return value;
        }
        return value;

      default:
        // For other types (Property, EmailProperty, LinkProperty, etc.)
        return value;
    }
  }

  /**
   * Create a file for an extracted entity
   */
  async createEntityFile(entity: any, createdEntities: Map<string, any> = new Map()) {
    try {
      console.log('\n📝 ===== CREATE ENTITY FILE START =====');
      console.log('🏷️  Class:', entity.className);
      console.log('📊 Confidence:', entity.confidence);
      console.log('🔑 Properties:', Object.keys(entity.properties));
      console.log('📋 Property values:', entity.properties);

      // Get class constructor
      const ClassConstructor = (this.vault.constructor as any).classes[entity.className];
      if (!ClassConstructor) {
        throw new Error(`Class ${entity.className} not found in vault`);
      }

      // Get class config to understand property types
      const factory = this.vault.getDynamicClassFactory();
      if (!factory) {
        throw new Error('No dynamic class factory available');
      }

      const configManager = (factory as any).configManager;
      const config = await configManager.getClassConfig(entity.className);

      // Convert properties based on their types
      console.log('\n🔄 Converting properties...');
      const convertedProperties: any = {};
      for (const [key, value] of Object.entries(entity.properties)) {
        const propertyConfig = config.properties[key];
        console.log(`  - ${key}: ${JSON.stringify(value)} (type: ${propertyConfig?.type || 'unknown'})`);
        if (propertyConfig) {
          convertedProperties[key] = await this.convertPropertyValue(
            propertyConfig,
            value,
            createdEntities
          );
        } else {
          // If no config found, keep the value as-is
          convertedProperties[key] = value;
        }
      }

      // Generate entity name from properties
      console.log('\n🏷️  Determining entity name...');
      console.log('  - nom:', convertedProperties.nom);
      console.log('  - name:', convertedProperties.name);
      console.log('  - title:', convertedProperties.title);
      console.log('  - email:', convertedProperties.email);
      
      const nameProperty = convertedProperties.nom || 
                          convertedProperties.name || 
                          convertedProperties.title ||
                          convertedProperties.email ||
                          Object.values(convertedProperties)[0];
      
      console.log('  → Selected nameProperty:', nameProperty);
      
      if (!nameProperty) {
        console.error('❌ Cannot determine entity name from properties:', convertedProperties);
        throw new Error('Cannot determine entity name from properties');
      }

      const entityName = typeof nameProperty === 'string' 
        ? nameProperty 
        : String(nameProperty);
      
      console.log('  → Final entity name:', entityName);

      // Create the entity file using markdown-crm's vault.createFile
      console.log(`🆕 Creating ${entity.className}: ${entityName} with properties:`, convertedProperties);
      
      // Use createInstanceFromDataObject for better handling
      // markdown-crm expects a 'name' property for the file name
      const dataObject = {
        name: entityName,  // Required by markdown-crm
        _className: entity.className,
        ...convertedProperties
      };

      const instance = await (factory as any).createInstanceFromDataObject(
        entity.className,
        dataObject,
        this.vault,
        [] // No additional data items
      );

      if (instance) {
        createdEntities.set(entityName, instance);
        const file = instance.getFile();
        const filePath = file.getPath ? file.getPath() : file.path;
        new Notice(`✅ Créé: ${entityName}`);
        console.log(`✅ Entity created at: ${filePath}`);
        console.log('📝 ===== CREATE ENTITY FILE END (SUCCESS) ===== \n');
        return instance;
      } else {
        console.error('❌ createInstanceFromDataObject returned null/undefined');
        throw new Error('Failed to create instance');
      }

    } catch (error) {
      console.error('❌ Error creating entity file:', error);
      console.error('   Entity:', entity);
      console.error('   Stack:', error.stack);
      console.log('📝 ===== CREATE ENTITY FILE END (ERROR) ===== \n');
      new Notice(`❌ Erreur: ${error.message}`);
      throw error;
    }
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

    // Update Ollama service settings
    if (this.ollamaService) {
      this.ollamaService.updateOptions({
        url: this.settings.ollamaUrl,
        model: this.settings.ollamaModel,
        temperature: this.settings.ollamaTemperature
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
