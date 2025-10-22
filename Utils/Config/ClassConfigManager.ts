import { ClassConfig, DisplayContainer } from './interfaces';
import { ConfigLoader } from './ConfigLoader';
import { Property } from '../Properties/Property';
import { FileProperty } from '../Properties/FileProperty';
import { MultiFileProperty } from '../Properties/MultiFileProperty';
import { ObjectProperty } from '../Properties/ObjectProperty';
import { SubClassProperty } from '../Properties/SubClassProperty';
import { SubClass } from '../../Classes/SubClasses/SubClass';
import { Classe } from '../../Classes/Classe';

export class ClassConfigManager {
    private configLoader: ConfigLoader;
    private loadedClasses: Map<string, typeof Classe> = new Map();

    constructor(configPath: string, app?: any) {
        this.configLoader = new ConfigLoader(configPath, app);
    }

    /**
     * Create a dynamic Classe from configuration
     */
    async createDynamicClasse(className: string): Promise<typeof Classe> {
        if (this.loadedClasses.has(className)) {
            return this.loadedClasses.get(className)!;
        }

        const config = await this.configLoader.loadClassConfig(className);
        
        class DynamicClasse extends Classe {
            public static className = config.className;
            public static classIcon = config.classIcon;
            
            public static parentProperty: FileProperty | MultiFileProperty | ObjectProperty;
            public static subClassesProperty: SubClassProperty;
            public static Properties: { [key: string]: Property } = {};

            constructor(app: any, vault: any, file: any) {
                super(app, vault, file);
            }

            static getConstructor(): typeof DynamicClasse {
                return DynamicClasse;
            }

            getConstructor(): typeof DynamicClasse {
                return DynamicClasse;
            }

            async populate(...args: any[]): Promise<void> {
                // Default implementation - can be overridden in config if needed
            }

            getTopDisplayContent(): any {
                const container = document.createElement("div");
                
                if (config.display && config.display.containers) {
                    for (const containerConfig of config.display.containers) {
                        const displayContainer = this.createDisplayContainer(containerConfig);
                        container.appendChild(displayContainer);
                    }
                } else {
                    // Default display: show all properties
                    const properties = document.createElement("div");
                    for (let property of Object.values(this.getProperties())) {
                        properties.appendChild(property.getDisplay(this));
                    }
                    container.appendChild(properties);
                }
                
                return container;
            }

            private createDisplayContainer(containerConfig: DisplayContainer): HTMLElement {
                const container = document.createElement("div");
                
                if (containerConfig.className) {
                    container.classList.add(containerConfig.className);
                }
                
                // Add CSS class based on container type
                switch (containerConfig.type) {
                    case 'line':
                        container.classList.add("metadata-line");
                        break;
                    case 'column':
                        container.classList.add("metadata-column");
                        break;
                }
                
                if (containerConfig.title) {
                    const title = document.createElement("div");
                    title.textContent = containerConfig.title;
                    title.classList.add("metadata-title");
                    container.appendChild(title);
                }
                
                // Add properties to container
                if (containerConfig.properties) {
                    for (const propName of containerConfig.properties) {
                        const property = this.getAllProperties()[propName];
                        if (property) {
                            container.appendChild(property.getDisplay(this));
                        }
                    }
                }
                
                return container;
            }
        }

        // Initialize static properties
        if (config.parentProperty) {
            DynamicClasse.parentProperty = this.configLoader.createProperty(config.parentProperty) as FileProperty | MultiFileProperty | ObjectProperty;
        }

        if (config.subClassesProperty) {
            DynamicClasse.subClassesProperty = this.configLoader.createSubClassProperty(config, DynamicClasse)!;
        }

        // Initialize all properties
        for (const [key, propConfig] of Object.entries(config.properties)) {
            if (propConfig.type === 'SubClassProperty' && config.subClassesProperty) {
                // Use the subClassesProperty instead
                DynamicClasse.Properties[key] = DynamicClasse.subClassesProperty;
            } else {
                DynamicClasse.Properties[key] = this.configLoader.createProperty(propConfig);
            }
        }

        this.loadedClasses.set(className, DynamicClasse);
        return DynamicClasse;
    }

    /**
     * Get class configuration for display purposes
     */
    async getClassConfig(className: string): Promise<ClassConfig> {
        return await this.configLoader.loadClassConfig(className);
    }

    /**
     * Get all available class names
     */
    async getAvailableClasses(): Promise<string[]> {
        return await this.configLoader.getAllClassNames();
    }

    /**
     * Clear the cache and reload configurations
     */
    clearCache(): void {
        this.loadedClasses.clear();
    }
}