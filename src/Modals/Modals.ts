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
     * @param className - Single class name or array of class names to search for
     * @param onFileSelected - Optional callback when file is selected or created
     * @param options - Optional filter and hint options
     */
    async openClassFileSuggester(className: string | string[], onFileSelected?: (file: any) => void, options?: any) {
        const classNames = Array.isArray(className) ? className : [className];
        console.log(`🔍 Opening suggester for ${classNames.join(', ')}...`);
        
        try {
            // Get extended classes (classes that inherit from requested classes)
            const expandedClassNames = await this.vault.getExtendedClasses(classNames);
            console.log(`🔍 Expanded classes: ${expandedClassNames.join(', ')}`);
            
            if (expandedClassNames.length > classNames.length) {
                console.log(`🔗 Extended classes found: ${expandedClassNames.join(', ')}`);
            }
            
            // Load class constructor
            let ClassConstructor: any = null;
            const classes = (this.vault.constructor as any).classes;
            
            // Try to load constructor from the first class in the list
            for (const cn of expandedClassNames) {
                ClassConstructor = classes[cn];
                if (ClassConstructor) break;
            }
            
            // If not loaded, try from YAML config
            if (!ClassConstructor) {
                const factory = this.vault.getDynamicClassFactory();
                if (factory) {
                    for (const cn of expandedClassNames) {
                        try {
                            ClassConstructor = await factory.getClass(cn);
                            console.log(`✅ Constructor loaded from YAML config for: ${cn}`);
                            break;
                        } catch (e) {
                            console.warn(`Could not load class ${cn} from YAML:`, e);
                        }
                    }
                }
            }
            
            if (!ClassConstructor) {
                console.warn(`⚠️ Classes ${classNames.join(', ')} not loaded yet, creating minimal constructor`);
                ClassConstructor = class {
                    constructor(vault: any) {}
                    template = '';
                };
            }

            // Check if classes have data sources and aggregate all data items
            let dataItems: any[] = [];
            const classIcons: Record<string, string> = {};
            // Search modal customization (chips, sort, title) from the first
            // class that defines a `search` section
            let searchConfig: any = null;
            const factory = this.vault.getDynamicClassFactory();
            if (factory) {
                const configManager = (factory as any).configManager;
                for (const cn of expandedClassNames) {
                    try {
                        const config = await configManager.getClassConfig(cn);

                        // TEMPORARY diagnostics (prefix 🔍 CRM-search) - remove once chips render
                        console.log(`🔍 CRM-search config loaded for "${cn}": search=${JSON.stringify(config.search)?.slice(0, 200)}`);

                        // Store the class icon for later use
                        classIcons[cn] = config.classIcon || 'folder';

                        if (!searchConfig && config.search) {
                            // Enrich the chips with the property definitions
                            // (icon, select options, date formatting)
                            searchConfig = {
                                ...config.search,
                                properties: (config.search.properties || []).map((chip: any) => {
                                    const propertyConfig = config.properties?.[chip.name] || {};
                                    const isDate = propertyConfig.type === 'DateProperty' || propertyConfig.type === 'RangeDateProperty';
                                    return {
                                        name: chip.name,
                                        color: chip.color,
                                        icon: chip.icon || propertyConfig.icon,
                                        options: propertyConfig.options,
                                        type: isDate ? 'date' : chip.type
                                    };
                                })
                            };
                        }

                        if (config.data && config.data.length > 0) {
                            console.log(`📥 Class "${cn}" has data sources, loading...`);
                            const classData = await configManager.loadClassData(cn);
                            // Tag each data item with its class name for later use
                            classData.forEach((item: any) => item._className = cn);
                            dataItems.push(...classData);
                            console.log(`✅ Loaded ${classData.length} data items for "${cn}"`);
                        }
                    } catch (error) {
                        console.warn(`Could not load data for ${cn}:`, error);
                    }
                }
            }
            
            // Show suggester with create option and data items
            console.log(`🚀 Showing file suggester for classes: ${expandedClassNames.join(', ')}`);
            // TEMPORARY diagnostics (prefix 🔍 CRM-search) - remove once chips render
            console.log(`🔍 CRM-search factory present: ${!!factory}`);
            console.log(`🔍 CRM-search resolved searchConfig: ${JSON.stringify(searchConfig)?.slice(0, 300)}`);
            this.showClassFileSuggester(expandedClassNames, ClassConstructor, dataItems, classIcons, onFileSelected, options, searchConfig);
        } catch (error) {
            console.error(`Error opening file suggester for ${classNames.join(', ')}:`, error);
            this.obsidianApp.sendNotice(`Erreur lors de l'ouverture du suggester pour ${classNames.join(', ')}`);
        }
    }

    /**
     * Show file suggester for selecting or creating a class file
     * Async: property values for chips/sorting are preloaded BEFORE the modal
     * opens, so the first render already shows them (no async race).
     */
    async showClassFileSuggester(classNames: string[], ClassConstructor: any, dataItems: any[] = [], classIcons: Record<string, string> = {}, onFileSelected?: (file: any) => void, options?: any, searchConfig?: any) {
        const modal = new FileSearchModal(
            this.app,
            this.vault,
            async (result) => {
                if (!result) {
                    // User closed modal without selecting - notify callback with null
                    if (onFileSelected) {
                        onFileSelected(null);
                    }
                    return;
                }
                
                if (typeof result === 'string' && result.startsWith('Create: ')) {
                    // Extract the name from "Create: XXX"
                    const name = result.substring('Create: '.length);
                    console.log(`🆕 Creating new file: ${name}`);
                    
                    // Check if this name comes from data items
                    const dataItem = dataItems.find(item => {
                        const itemName = item.nom || item.name || '';
                        return itemName === name || name.includes(itemName);
                    });
                    
                    // Determine which class to create from
                    const className = dataItem?._className || classNames[0];
                    
                    try {
                        let createdFile: any = null;
                        console.log(`🚀 Creating instance of ${className}...`);
                        console.log(`🔧 data :`, dataItem);
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
                                    
                                    // Call callback with created file
                                    if (onFileSelected) {
                                        onFileSelected(createdFile);
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
                                // Call callback with created file
                                if (onFileSelected) {
                                    onFileSelected(createdFile);
                                }
                            }
                        }
                    } catch (error) {
                        const errorClassName = dataItem?._className || classNames[0];
                        console.error(`Error creating ${errorClassName}:`, error);
                        this.obsidianApp.sendNotice(`Erreur lors de la création de ${errorClassName}: ${(error as Error).message}`);
                    }
                } else if (result instanceof TFile) {
                    
                    // Get the File object from the classe
                    if (onFileSelected) {
                        const classe = await this.vault.getFromFile(this.obsidianApp.toIFile(result));
                        const fileObj = classe?.getFile();
                        onFileSelected(fileObj);
                    }
                }
            },
            classNames, // Filter by these classes
            {
                hint: options?.hint || `Rechercher ou créer: ${classNames.join(', ')}...`,
                optionalFilter: options?.validationFunction,
                dataItems: dataItems, // Pass data items to modal
                classIcons: classIcons, // Pass class icons to modal
                searchConfig: searchConfig, // Chips, sort and title customization
            }
        );

        // Property values must be ready before the first render, otherwise
        // chips are skipped and the config sort never applies
        await modal.preloadSearchValues();
        modal.open();
    }
}
