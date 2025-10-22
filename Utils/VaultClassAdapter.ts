import { DynamicClassFactory } from './Config/DynamicClassFactory';
import { MyVault } from './MyVault';
import { Classe } from '../Classes/Classe';
import AppShim, { TFile } from './App';

/**
 * Adapter class to integrate dynamic classes with MyVault
 */
export class VaultClassAdapter {
    private dynamicFactory: DynamicClassFactory;
    private vault: MyVault;

    constructor(vault: MyVault, configPath: string) {
        this.vault = vault;
        this.dynamicFactory = DynamicClassFactory.getInstance(configPath, vault.app);
    }

    /**
     * Create a class instance from a file, using dynamic configuration
     */
    async getFromFile(file: TFile): Promise<Classe | null> {
        // Try to determine class type from metadata or file structure
        const className = await this.determineClassType(file);
        
        if (!className) {
            console.warn(`Could not determine class type for file: ${file.path}`);
            return null;
        }

        try {
            return await this.dynamicFactory.createInstance(className, this.vault.app, this.vault, file);
        } catch (error) {
            console.error(`Failed to create instance for ${className}:`, error);
            return null;
        }
    }

    /**
     * Get a dynamic class constructor by name
     */
    async getClass(className: string): Promise<typeof Classe> {
        return await this.dynamicFactory.getClass(className);
    }

    /**
     * Get all available class names
     */
    async getAvailableClasses(): Promise<string[]> {
        return await this.dynamicFactory.getAvailableClasses();
    }

    /**
     * Determine class type from file metadata or structure
     */
    private async determineClassType(file: TFile): Promise<string | null> {
        const metadata = this.vault.app.metadataCache.getFileCache(file)?.frontmatter;
        
        if (metadata && metadata.classe) {
            return metadata.classe;
        }

        // Try to infer from file path or name patterns
        const path = file.path.toLowerCase();
        const availableClasses = await this.getAvailableClasses();
        
        for (const className of availableClasses) {
            const classLower = className.toLowerCase();
            if (path.includes(classLower) || path.includes(`${classLower}s`)) {
                return className;
            }
        }

        // Default fallback - could be improved with better heuristics
        return null;
    }

    /**
     * Clear cache and reload configurations
     */
    clearCache(): void {
        this.dynamicFactory.clearCache();
    }
}