import { DynamicClassFactory } from './DynamicClassFactory';
import { MyVault } from '../MyVault';
import AppShim from '../App';

/**
 * Migration utility to test and validate the new configuration system
 */
export class ConfigMigrationTester {
    private dynamicFactory: DynamicClassFactory;
    private configPath: string;

    constructor(configPath: string) {
        this.configPath = configPath;
        this.dynamicFactory = DynamicClassFactory.getInstance(configPath);
    }

    /**
     * Test loading all configuration files
     */
    async testAllConfigurations(): Promise<{ success: string[], failed: string[] }> {
        const success: string[] = [];
        const failed: string[] = [];
        
        const availableClasses = await this.dynamicFactory.getAvailableClasses();
        
        for (const className of availableClasses) {
            try {
                const dynamicClass = await this.dynamicFactory.getClass(className);
                console.log(`✓ Successfully loaded configuration for ${className}`);
                console.log(`  - Class name: ${dynamicClass.className}`);
                console.log(`  - Class icon: ${dynamicClass.classIcon}`);
                console.log(`  - Properties: ${Object.keys(dynamicClass.Properties).length}`);
                success.push(className);
            } catch (error) {
                console.error(`✗ Failed to load configuration for ${className}:`, error);
                failed.push(className);
            }
        }
        
        return { success, failed };
    }

    /**
     * Compare legacy class with dynamic class properties
     */
    async compareClassProperties(className: string, legacyClass: any): Promise<{
        matching: string[],
        missing: string[],
        extra: string[]
    }> {
        try {
            const dynamicClass = await this.dynamicFactory.getClass(className);
            const legacyProps = Object.keys(legacyClass.Properties);
            const dynamicProps = Object.keys(dynamicClass.Properties);
            
            const matching = legacyProps.filter(prop => dynamicProps.includes(prop));
            const missing = legacyProps.filter(prop => !dynamicProps.includes(prop));
            const extra = dynamicProps.filter(prop => !legacyProps.includes(prop));
            
            console.log(`Comparison for ${className}:`);
            console.log(`  - Matching properties: ${matching.length}`);
            console.log(`  - Missing in dynamic: ${missing.length} ${missing.length > 0 ? '(' + missing.join(', ') + ')' : ''}`);
            console.log(`  - Extra in dynamic: ${extra.length} ${extra.length > 0 ? '(' + extra.join(', ') + ')' : ''}`);
            
            return { matching, missing, extra };
        } catch (error) {
            console.error(`Failed to compare ${className}:`, error);
            return { matching: [], missing: [], extra: [] };
        }
    }

    /**
     * Test creating an instance of a dynamic class
     */
    async testCreateInstance(className: string, app: AppShim, vault: MyVault, mockFile: any): Promise<boolean> {
        try {
            const instance = await this.dynamicFactory.createInstance(className, app, vault, mockFile);
            console.log(`✓ Successfully created instance of ${className}`);
            console.log(`  - Instance class: ${instance.getClasse()}`);
            console.log(`  - Properties available: ${Object.keys(instance.getProperties()).length}`);
            return true;
        } catch (error) {
            console.error(`✗ Failed to create instance of ${className}:`, error);
            return false;
        }
    }

    /**
     * Full migration test
     */
    async runFullTest(app: AppShim, vault: MyVault, legacyClasses: { [key: string]: any }): Promise<void> {
        console.log('🔧 Starting configuration migration test...');
        console.log(`📁 Config path: ${this.configPath}`);
        
        // Test 1: Load all configurations
        console.log('\n📋 Test 1: Loading all configurations...');
        const loadResults = await this.testAllConfigurations();
        console.log(`✓ Loaded: ${loadResults.success.length}`);
        console.log(`✗ Failed: ${loadResults.failed.length}`);
        
        // Test 2: Compare with legacy classes
        console.log('\n📋 Test 2: Comparing with legacy classes...');
        for (const [className, legacyClass] of Object.entries(legacyClasses)) {
            if (loadResults.success.includes(className)) {
                await this.compareClassProperties(className, legacyClass);
            }
        }
        
        // Test 3: Create mock instances
        console.log('\n📋 Test 3: Creating mock instances...');
        const mockFile = { path: '/mock/test.md', name: 'test.md' };
        for (const className of loadResults.success) {
            await this.testCreateInstance(className, app, vault, mockFile);
        }
        
        console.log('\n🎉 Migration test completed!');
    }
}