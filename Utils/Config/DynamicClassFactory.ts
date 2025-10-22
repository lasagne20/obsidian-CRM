import { ClassConfigManager } from './ClassConfigManager';
import { Classe } from '../../Classes/Classe';
import { SubClass } from '../../Classes/SubClasses/SubClass';
import { MyVault } from '../MyVault';

export class DynamicClassFactory {
    private static instance: DynamicClassFactory;
    private configManager: ClassConfigManager;
    private classRegistry: Map<string, typeof Classe> = new Map();

    private constructor(configPath: string, app?: any) {
        this.configManager = new ClassConfigManager(configPath, app);
    }

    public static getInstance(configPath?: string, app?: any): DynamicClassFactory {
        if (!DynamicClassFactory.instance) {
            if (!configPath) {
                throw new Error('ConfigPath required for first initialization');
            }
            DynamicClassFactory.instance = new DynamicClassFactory(configPath, app);
        }
        return DynamicClassFactory.instance;
    }

    /**
     * Get or create a dynamic class by name
     */
    async getClass(className: string): Promise<typeof Classe> {
        if (this.classRegistry.has(className)) {
            return this.classRegistry.get(className)!;
        }

        const dynamicClass = await this.configManager.createDynamicClasse(className);
        this.classRegistry.set(className, dynamicClass);
        return dynamicClass;
    }

    /**
     * Create an instance of a class from a file
     */
    async createInstance(className: string, app: any, vault: MyVault, file: any): Promise<Classe> {
        const ClassConstructor = await this.getClass(className);
        const instance = new ClassConstructor(app, vault, file);
        
        // Attacher la configuration d'affichage à l'instance
        try {
            const config = await this.configManager.getClassConfig(className);
            instance.displayConfig = config;
        } catch (error) {
            console.warn(`Could not load display config for ${className}:`, error);
        }
        
        return instance;
    }

    /**
     * Get all available class names
     */
    async getAvailableClasses(): Promise<string[]> {
        return await this.configManager.getAvailableClasses();
    }

    /**
     * Clear cache and reload configurations
     */
    clearCache(): void {
        this.configManager.clearCache();
        this.classRegistry.clear();
    }

    /**
     * Initialize the factory with the plugin's config path
     */
    static async initialize(pluginPath: string, app?: any): Promise<DynamicClassFactory> {
        const configPath = `${pluginPath}/config`;
        return DynamicClassFactory.getInstance(configPath, app);
    }
}