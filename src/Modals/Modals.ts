import { App, TFile } from 'obsidian';
import { Vault } from 'markdown-crm';
import { ObsidianApp } from '../App';
import { FileSearchModal } from './FileSearchModal';

/**
 * Helper class for class file modals and suggesters
 */
export class ClassFileModals {
    private app: App;
    private vault: Vault;
    private obsidianApp: ObsidianApp;
    private onMetadataUpdate: () => Promise<void>;

    constructor(
        app: App, 
        vault: Vault, 
        obsidianApp: ObsidianApp,
        onMetadataUpdate: () => Promise<void>
    ) {
        this.app = app;
        this.vault = vault;
        this.obsidianApp = obsidianApp;
        this.onMetadataUpdate = onMetadataUpdate;
    }

    /**
     * Open file suggester for a class with create option
     */
    async openClassFileSuggester(className: string) {
        console.log(`🔍 Looking for ${className} files in vault...`);
        
        try {
            // Use Obsidian's file cache instead of listFiles
            const allMarkdownFiles = this.app.vault.getMarkdownFiles();
            console.log(`📚 Total markdown files in vault: ${allMarkdownFiles.length}`);
            
            const classFiles: TFile[] = [];
            let ClassConstructor: any = null;
            let checkedCount = 0;
            let matchedCount = 0;
            
            for (const file of allMarkdownFiles) {
                try {
                    // Check file metadata for classe property using Obsidian's metadata cache
                    const cache = this.app.metadataCache.getFileCache(file);
                    const fileClasse = cache?.frontmatter?.Classe;
                    checkedCount++;
                    
                    if (fileClasse === className) {
                        matchedCount++;
                        console.log(`✅ Match found: ${file.path} has classe: ${fileClasse}`);
                        classFiles.push(file);
                        
                        // Try to load the class constructor from the first matching file
                        if (!ClassConstructor) {
                            try {
                                const iFile = this.obsidianApp.toIFile(file);
                                const obj = await this.vault.getFromFile(iFile);
                                if (obj) {
                                    ClassConstructor = obj.constructor;
                                    console.log(`✅ Constructor loaded from: ${file.path}`);
                                }
                            } catch (e) {
                                console.warn('Could not load class from file:', file.path, e);
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Error checking file:', file.path, e);
                }
            }
            
            console.log(`📊 Checked ${checkedCount} files, found ${matchedCount} matches for ${className}`);
            console.log(`📂 Found ${classFiles.length} ${className} files`);
            
            // If no files found and class not loaded, try to get it from the registry
            if (!ClassConstructor) {
                const classes = (this.vault.constructor as any).classes;
                ClassConstructor = classes[className];
                
                // If still not loaded, force load from YAML config
                if (!ClassConstructor) {
                    const factory = this.vault.getDynamicClassFactory();
                    if (factory) {
                        try {
                            ClassConstructor = await factory.getClass(className);
                            console.log(`✅ Constructor loaded from YAML config for: ${className}`);
                        } catch (e) {
                            console.warn(`Could not load class ${className} from YAML:`, e);
                        }
                    }
                }
                
                if (!ClassConstructor) {
                    console.warn(`⚠️ Class ${className} not loaded yet, creating minimal constructor`);
                    // Create a minimal placeholder that will work for file creation
                    ClassConstructor = class {
                        constructor(vault: any) {}
                        template = '';
                    };
                }
            }

            // Check if class has data sources
            let dataItems: any[] = [];
            const factory = this.vault.getDynamicClassFactory();
            if (factory) {
                try {
                    const configManager = (factory as any).configManager;
                    const config = await configManager.getClassConfig(className);
                    
                    if (config.data && config.data.length > 0) {
                        console.log(`📥 Class "${className}" has data sources, loading...`);
                        dataItems = await configManager.loadClassData(className);
                        console.log(`✅ Loaded ${dataItems.length} data items for "${className}"`);
                    }
                } catch (error) {
                    console.warn(`Could not load data for ${className}:`, error);
                }
            }
            
            // Show suggester with create option and data items
            this.showClassFileSuggester(classFiles, className, ClassConstructor, dataItems);
        } catch (error) {
            console.error(`Error opening file suggester for ${className}:`, error);
            this.obsidianApp.sendNotice(`Erreur lors de l'ouverture du suggester pour ${className}`);
        }
    }

    /**
     * Show file suggester for selecting or creating a class file
     */
    showClassFileSuggester(files: TFile[], className: string, ClassConstructor: any, dataItems: any[] = []) {
        new FileSearchModal(
            this.app,
            async (result) => {
                if (!result) return;
                
                if (typeof result === 'string' && result.startsWith('Create: ')) {
                    // Extract the name from "Create: XXX"
                    const name = result.substring('Create: '.length);
                    
                    try {
                        // Check if this name comes from data items
                        const dataItem = dataItems.find(item => {
                            const itemName = item.nom || item.name || '';
                            return itemName === name || name.includes(itemName);
                        });
                        
                        let createdFile: any = null;
                        
                        if (dataItem) {
                            // Create from data using DynamicClassFactory
                            console.log(`📦 Creating ${className} from data:`, dataItem);
                            const factory = this.vault.getDynamicClassFactory();
                            
                            if (factory) {
                                // Use createInstanceFromDataObject to create the file with proper metadata
                                const instance = await (factory as any).createInstanceFromDataObject(
                                    className,
                                    dataItem,
                                    this.vault,
                                    dataItems // Pass all data for parent resolution
                                );
                                
                                if (instance) {
                                    createdFile = instance.getFile();
                                    const filePath = createdFile.getPath ? createdFile.getPath() : createdFile.path;
                                    console.log(`✅ Created ${className} from data at:`, filePath);
                                    this.obsidianApp.sendNotice(`${className} créé: ${dataItem.title || dataItem.nom || name}`);
                                    
                                    // Open the file and wait for metadata to be ready
                                    const tFile = this.app.vault.getAbstractFileByPath(filePath);
                                    if (tFile instanceof TFile) {
                                        await this.app.workspace.getLeaf().openFile(tFile);
                                        
                                        // Wait for metadata cache to update for the Classe property
                                        await this.obsidianApp.waitForFileMetaDataUpdate(filePath, 'Classe', this.onMetadataUpdate);
                                    }
                                } else {
                                    throw new Error("Failed to create instance from data");
                                }
                            } else {
                                throw new Error("DynamicClassFactory not available");
                            }
                        } else {
                            // Manual creation without data
                            console.log(`📝 Creating ${className} manually: ${name}`);
                            createdFile = await this.vault.createFile(ClassConstructor, name);
                            
                            if (createdFile) {
                                // Open the created file
                                const filePath = createdFile.getPath ? createdFile.getPath() : createdFile.path;
                                const tFile = this.app.vault.getAbstractFileByPath(filePath);
                                if (tFile instanceof TFile) {
                                    await this.app.workspace.getLeaf().openFile(tFile);
                                    
                                    // Wait for metadata cache to update for the Classe property
                                    await this.obsidianApp.waitForFileMetaDataUpdate(filePath, 'Classe', this.onMetadataUpdate);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error creating ${className}:`, error);
                        this.obsidianApp.sendNotice(`Erreur lors de la création de ${className}: ${(error as Error).message}`);
                    }
                } else if (result instanceof TFile) {
                    // Open existing file
                    await this.app.workspace.getLeaf().openFile(result);
                }
            },
            [className], // Filter by this class
            {
                hint: `Rechercher ou créer un ${className}...`,
                dataItems: dataItems // Pass data items to modal
            }
        ).open();
    }
}
