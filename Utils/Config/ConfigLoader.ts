import * as yaml from 'js-yaml';
import { ClassConfig, PropertyConfig, SubClassConfig, PropertyTableRow } from './interfaces';
import { Property } from '../Properties/Property';
import { FileProperty } from '../Properties/FileProperty';
import { MultiFileProperty } from '../Properties/MultiFileProperty';
import { SelectProperty } from '../Properties/SelectProperty';
import { MultiSelectProperty } from '../Properties/MultiSelectProperty';
import { EmailProperty } from '../Properties/EmailProperty';
import { PhoneProperty } from '../Properties/PhoneProperty';
import { LinkProperty } from '../Properties/LinkProperty';
import { ObjectProperty } from '../Properties/ObjectProperty';
import { RatingProperty } from '../Properties/RatingProperty';
import { DateProperty } from '../Properties/DateProperty';
import { RangeDateProperty } from '../Properties/RangeDateProperty';
import { AdressProperty } from '../Properties/AdressProperty';
import { ClasseProperty } from '../Properties/ClasseProperty';
import { SubClassProperty } from '../Properties/SubClassProperty';
import { TextProperty } from '../Properties/TextProperty';
import { BooleanProperty } from '../Properties/BooleanProperty';
import { NumberProperty } from '../Properties/NumberProperty';
import { MediaProperty } from '../Properties/MediaProperty';
import { FormulaProperty } from '../Properties/FormulaProperty';
import { SubClass } from '../../Classes/SubClasses/SubClass';
import { Classe } from '../../Classes/Classe';
// Remove Node.js imports for Obsidian compatibility
// import { readFileSync } from 'fs';
// import { join } from 'path';

export class ConfigLoader {
    private configPath: string;
    private loadedConfigs: Map<string, ClassConfig> = new Map();
    private app: any; // Obsidian App instance

    constructor(configPath: string, app?: any) {
        this.configPath = configPath;
        this.app = app;
    }

    /**
     * Load a class configuration from YAML file
     */
    async loadClassConfig(className: string): Promise<ClassConfig> {
        if (this.loadedConfigs.has(className)) {
            return this.loadedConfigs.get(className)!;
        }

        try {
            const configFilePath = `${this.configPath}/${className}.yaml`;
            let fileContent: string;
            
            if (this.app && this.app.vault) {
                // Try to read using vault adapter for plugin files
                try {
                    fileContent = await this.app.vault.adapter.read(configFilePath);
                } catch (error) {
                    // Fallback to vault API for files in the vault
                    const file = this.app.vault.getAbstractFileByPath(configFilePath);
                    if (!file || !('extension' in file)) {
                        throw new Error(`Configuration file not found: ${configFilePath}`);
                    }
                    fileContent = await this.app.vault.read(file);
                }
            } else {
                // Fallback for testing or when app is not available
                throw new Error('Obsidian app instance required to read configuration files');
            }
            
            const config = yaml.load(fileContent) as ClassConfig;
            
            this.loadedConfigs.set(className, config);
            return config;
        } catch (error) {
            console.error(`Failed to load config for class ${className}:`, error);
            throw new Error(`Configuration not found for class: ${className}`);
        }
    }

    /**
     * Create a Property instance from configuration
     */
    createProperty(config: PropertyConfig): Property {
        const options = config.icon ? { icon: config.icon } : {};
        
        switch (config.type) {
            case 'Property':
                return new Property(config.name, options);
            
            case 'FileProperty':
                return new FileProperty(config.name, config.classes || [], options);
            
            case 'MultiFileProperty':
                return new MultiFileProperty(config.name, config.classes || [], options);
            
            case 'SelectProperty':
                const selectOptions = (config.options || []).map(opt => ({
                    name: opt.name,
                    color: opt.color || ''
                }));
                return new SelectProperty(config.name, selectOptions, options);
            
            case 'MultiSelectProperty':
                const multiSelectOptions = (config.options || []).map(opt => ({
                    name: opt.name,
                    color: opt.color || ''
                }));
                return new MultiSelectProperty(config.name, multiSelectOptions, options);
            
            case 'EmailProperty':
                return new EmailProperty(config.name, options);
            
            case 'PhoneProperty':
                return new PhoneProperty(config.name, options);
            
            case 'LinkProperty':
                return new LinkProperty(config.name, options);
            
            case 'ObjectProperty':
                const objProperties: { [key: string]: Property } = {};
                if (config.properties) {
                    // Vérifier si c'est un format tableau ou objet
                    if (Array.isArray(config.properties)) {
                        // Format tableau
                        for (const row of config.properties) {
                            const propConfig = this.parseTableRowToPropertyConfig(row);
                            objProperties[row.name] = this.createProperty(propConfig);
                        }
                    } else {
                        // Format objet classique
                        for (const [key, propConfig] of Object.entries(config.properties)) {
                            objProperties[key] = this.createProperty(propConfig);
                        }
                    }
                }
                // Ajouter le mode d'affichage si spécifié
                const objOptions: any = { ...options };
                if (config.display) {
                    objOptions.display = config.display;
                }
                return new ObjectProperty(config.name, objProperties, objOptions);
            
            case 'RatingProperty':
                return new RatingProperty(config.name, options);
            
            case 'DateProperty':
                const defaultValues = config.defaultValue ? [config.defaultValue] : [];
                return new DateProperty(config.name, defaultValues, options);
            
            case 'RangeDateProperty':
                return new RangeDateProperty(config.name, options);
            
            case 'AdressProperty':
                return new AdressProperty(config.name, options);
            
            case 'ClasseProperty':
                return new ClasseProperty(config.name, config.icon || 'box');
            
            case 'TextProperty':
                return new TextProperty(config.name, options);
            
            case 'BooleanProperty':
                return new BooleanProperty(config.name, options);
            
            case 'NumberProperty':
                return new NumberProperty(config.name, '', { icon: config.icon || '', static: true });
            
            case 'SubClassProperty':
                // This will be handled separately in createSubClassProperty
                return new Property(config.name, options); // Placeholder

            case 'MediaProperty':
                return new MediaProperty(config.name, options);

            case 'FormulaProperty':
                const formula = config.formula || config.defaultValue || '';
                const formulaOptions = config.icon ? { icon: config.icon, static: true, write: true } : { icon: '', static: true, write: true };
                return new FormulaProperty(config.name, formula, formulaOptions);
            
            default:
                console.warn(`Unknown property type: ${config.type}, falling back to Property`);
                return new Property(config.name, options);
        }
    }

    /**
     * Create SubClass instances from configuration
     */
    createSubClasses(config: ClassConfig, parentClass: typeof Classe): SubClass[] {
        if (!config.subClassesProperty) {
            return [];
        }

        const subClasses: SubClass[] = [];
        const configLoader = this; // Reference to the current ConfigLoader instance
        
        for (const subClassConfig of config.subClassesProperty.subClasses) {
            // Create a dynamic SubClass
            class DynamicSubClass extends SubClass {
                public subClassName = subClassConfig.name;
                public subClassIcon = subClassConfig.icon || 'box';
                
                static Properties: { [key: string]: Property } = {};
                
                constructor(classe: typeof Classe, data: any = null) {
                    super(classe, data);
                    
                    // Initialize properties if defined
                    if (subClassConfig.properties && !Object.keys(DynamicSubClass.Properties).length) {
                        for (const [key, propConfig] of Object.entries(subClassConfig.properties)) {
                            DynamicSubClass.Properties[key] = configLoader.createProperty(propConfig);
                        }
                    }
                }

                getConstructor(): typeof DynamicSubClass {
                    return DynamicSubClass;
                }
            }
            
            subClasses.push(new DynamicSubClass(parentClass));
        }
        
        return subClasses;
    }

    /**
     * Create SubClassProperty from configuration
     */
    createSubClassProperty(config: ClassConfig, parentClass: typeof Classe): SubClassProperty | undefined {
        if (!config.subClassesProperty) {
            return undefined;
        }

        const subClasses = this.createSubClasses(config, parentClass);
        return new SubClassProperty(config.subClassesProperty.name, subClasses);
    }

    /**
     * Get all available class configurations
     */
    async getAllClassNames(): Promise<string[]> {
        // This would scan the config directory for .yaml files
        // For now, return a hardcoded list based on existing classes
        return [
            'Personne', 'Institution', 'Lieu', 'Action', 'Animateur', 
            'Evenement', 'Note', 'Partenariat'
        ];
    }

    /**
     * Parse une ligne de tableau de propriétés en PropertyConfig
     */
    private parseTableRowToPropertyConfig(row: PropertyTableRow): PropertyConfig {
        const config: PropertyConfig = {
            type: row.type,
            name: row.name,
            icon: row.icon,
            defaultValue: row.default
        };

        // Parser les classes (string séparé par virgules)
        if (row.classes) {
            config.classes = row.classes.split(',').map(c => c.trim());
        }

        // Parser les options (format "name1:color1,name2:color2")
        if (row.options) {
            config.options = row.options.split(',').map(opt => {
                const [name, color = ''] = opt.split(':').map(s => s.trim());
                return { name, color };
            });
        }

        // Autres attributs
        if (row.formula) {
            config.formula = row.formula;
        }
        
        if (row.display) {
            config.display = row.display;
        }

        return config;
    }

    /**
     * Set the config path (useful when we need to update it)
     */
    setConfigPath(configPath: string): void {
        this.configPath = configPath;
    }
}