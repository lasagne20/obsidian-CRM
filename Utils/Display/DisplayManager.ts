import { Classe } from "../../Classes/Classe";
import { Property } from "../Properties/Property";
import { Tabs } from "./Tabs";
import { DisplayContainer, TabConfig } from "../Config/interfaces";

/**
 * Gère l'affichage dynamique basé sur la configuration YAML
 */
export class DisplayManager {
    
    /**
     * Génère le contenu d'affichage basé sur la configuration display
     */
    static async generateDisplayContent(classe: Classe, displayConfig?: any): Promise<HTMLElement> {
        const container = document.createElement("div");
        
        if (!displayConfig || !displayConfig.containers) {
            // Affichage par défaut
            return this.generateDefaultDisplay(classe);
        }
        
        for (const containerConfig of displayConfig.containers) {
            const element = await this.createDisplayElement(classe, containerConfig);
            if (element) {
                container.appendChild(element);
            }
        }
        
        return container;
    }
    
    /**
     * Crée un élément d'affichage selon le type de container
     */
    private static async createDisplayElement(classe: Classe, config: DisplayContainer): Promise<HTMLElement | null> {
        switch (config.type) {
            case 'line':
                return this.createLineContainer(classe, config);
            
            case 'column':
                return this.createColumnContainer(classe, config);
                
            case 'tabs':
                return this.createTabsContainer(classe, config);
                
            case 'fold':
                return this.createFoldContainer(classe, config);
                
            case 'custom':
                return this.createCustomContainer(classe, config);
                
            default:
                console.warn(`Unknown display container type: ${config.type}`);
                return null;
        }
    }
    
    /**
     * Crée un container en ligne
     */
    private static createLineContainer(classe: Classe, config: DisplayContainer): HTMLElement {
        const container = document.createElement("div");
        container.classList.add("metadata-line");
        
        if (config.className) {
            container.classList.add(config.className);
        }
        
        if (config.properties) {
            for (const propName of config.properties) {
                const [, property] = classe.getProperty(propName);
                if (property) {
                    const display = property.getDisplay(classe);
                    if (display) {
                        container.appendChild(display);
                    }
                }
            }
        }
        
        return container;
    }
    
    /**
     * Crée un container en colonne
     */
    private static createColumnContainer(classe: Classe, config: DisplayContainer): HTMLElement {
        const container = document.createElement("div");
        container.classList.add("metadata-column");
        
        if (config.className) {
            container.classList.add(config.className);
        }
        
        if (config.properties) {
            for (const propName of config.properties) {
                const [, property] = classe.getProperty(propName);
                if (property) {
                    const display = property.getDisplay(classe);
                    if (display) {
                        container.appendChild(display);
                    }
                }
            }
        }
        
        return container;
    }
    
    /**
     * Crée un système de tabs
     */
    private static createTabsContainer(classe: Classe, config: DisplayContainer): HTMLElement | null {
        if (!config.tabs) {
            console.warn('Tabs container requires tabs configuration');
            return null;
        }
        
        const tabs = new Tabs();
        
        for (const tabConfig of config.tabs) {
            const tabContainer = document.createElement("div");
            tabContainer.classList.add("metadata-line");
            
            for (const propName of tabConfig.properties) {
                const [, property] = classe.getProperty(propName);
                if (property) {
                    const display = property.getDisplay(classe);
                    if (display) {
                        tabContainer.appendChild(display);
                    }
                }
            }
            
            tabs.addTab(tabConfig.name, tabContainer);
        }
        
        return tabs.getContainer();
    }
    
    /**
     * Crée un container pliable
     */
    private static createFoldContainer(classe: Classe, config: DisplayContainer): HTMLElement {
        const container = document.createElement("details");
        container.classList.add("metadata-fold");
        
        const summary = document.createElement("summary");
        summary.textContent = config.foldTitle || config.title || "Détails";
        container.appendChild(summary);
        
        const content = document.createElement("div");
        content.classList.add("metadata-line");
        
        if (config.properties) {
            for (const propName of config.properties) {
                const [, property] = classe.getProperty(propName);
                if (property) {
                    const display = property.getDisplay(classe);
                    if (display) {
                        content.appendChild(display);
                    }
                }
            }
        }
        
        container.appendChild(content);
        return container;
    }
    
    /**
     * Crée un container personnalisé
     */
    private static createCustomContainer(classe: Classe, config: DisplayContainer): HTMLElement {
        const container = document.createElement("div");
        container.classList.add("metadata-custom");
        
        if (config.className) {
            container.classList.add(config.className);
        }
        
        if (config.properties) {
            for (const propName of config.properties) {
                const [, property] = classe.getProperty(propName);
                if (property) {
                    const display = property.getDisplay(classe);
                    if (display) {
                        container.appendChild(display);
                    }
                }
            }
        }
        
        return container;
    }
    
    /**
     * Génère un affichage par défaut simple
     */
    private static generateDefaultDisplay(classe: Classe): HTMLElement {
        const container = document.createElement("div");
        const lineContainer = document.createElement("div");
        lineContainer.classList.add("metadata-line");
        
        // Affiche toutes les propriétés dans une ligne
        const properties = classe.getProperties();
        for (const [name, property] of Object.entries(properties)) {
            const display = property.getDisplay(classe);
            if (display) {
                lineContainer.appendChild(display);
            }
        }
        
        container.appendChild(lineContainer);
        return container;
    }
}