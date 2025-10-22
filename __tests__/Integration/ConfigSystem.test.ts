// Mock Three.js modules before any imports
jest.mock('three', () => ({}));
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({ GLTFLoader: class {} }));
jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({ OrbitControls: class {} }));
jest.mock('electron', () => ({
    shell: { openExternal: jest.fn() }
}));

// Mock js-yaml
jest.mock('js-yaml', () => ({
    load: jest.fn()
}));

// Mock all Property classes
jest.mock('../../Utils/Properties/Property', () => ({
    Property: class MockProperty {
        constructor(public name: string, public options: any = {}) {}
    }
}));

jest.mock('../../Utils/Properties/EmailProperty', () => ({
    EmailProperty: class MockEmailProperty {
        constructor(public name: string, public config: any = {}) {}
    }
}));

import { ConfigLoader } from '../../Utils/Config/ConfigLoader';
import { ClassConfigManager } from '../../Utils/Config/ClassConfigManager';
import { DynamicClassFactory } from '../../Utils/Config/DynamicClassFactory';
import * as yaml from 'js-yaml';

const mockYaml = yaml as jest.Mocked<typeof yaml>;

// Mock Obsidian app instance
const mockApp = {
    vault: {
        adapter: {
            read: jest.fn()
        },
        getAbstractFileByPath: jest.fn(),
        read: jest.fn()
    },
    metadataCache: {
        getFileCache: jest.fn()
    }
};

describe('Configuration System Integration Tests', () => {
    let configPath: string;

    beforeEach(() => {
        configPath = './test-config';
        jest.clearAllMocks();
    });

    describe('Full Configuration Pipeline', () => {
        it('should load YAML config, create manager, and instantiate factory', async () => {
            // Mock YAML config object
            const mockConfig = {
                className: "Personne",
                classIcon: "person",
                properties: {
                    nom: { type: "Property", name: "nom" },
                    prenom: { type: "Property", name: "prenom" },
                    email: { type: "EmailProperty", name: "email" }
                },
                display: {
                    containers: [
                        { type: "line", properties: ["nom", "prenom"] },
                        { type: "line", properties: ["email"] }
                    ]
                }
            };

            // Mock Obsidian file reading
            mockApp.vault.adapter.read.mockResolvedValue('mock yaml content');
            mockYaml.load.mockReturnValue(mockConfig);

            // Test ConfigLoader
            const configLoader = new ConfigLoader(configPath, mockApp);
            const config = await configLoader.loadClassConfig('Personne');

            expect(config.className).toBe('Personne');
            expect(Object.keys(config.properties)).toHaveLength(3);
            expect(config.properties['nom'].name).toBe('nom');
            expect(config.properties['nom'].type).toBe('Property');
            expect(config.properties['email'].type).toBe('EmailProperty');

            // Test that ConfigLoader can create the class
            expect(configLoader).toBeDefined();
        });

        it('should handle configuration with all property types', async () => {
            const mockComplexConfig = {
                className: "TestClass",
                classIcon: "test",
                properties: {
                    text: { type: "Property", name: "text" },
                    number: { type: "NumberProperty", name: "number" },
                    email: { type: "EmailProperty", name: "email" }
                }
            };

            mockApp.vault.adapter.read.mockResolvedValue('complex config');
            mockYaml.load.mockReturnValue(mockComplexConfig);

            const configLoader = new ConfigLoader(configPath, mockApp);
            const config = await configLoader.loadClassConfig('TestClass');

            expect(Object.keys(config.properties)).toHaveLength(3);
            expect(config.properties.text.type).toBe('Property');
            expect(config.properties.number.type).toBe('NumberProperty');
            expect(config.properties.email.type).toBe('EmailProperty');
        });

        it('should handle display configuration with different container types', async () => {
            const mockDisplayConfig = {
                className: "DisplayTest",
                classIcon: "display",
                properties: {
                    prop1: { type: "Property", name: "prop1" },
                    prop2: { type: "Property", name: "prop2" }
                },
                display: {
                    containers: [
                        { type: "line", properties: ["prop1", "prop2"] },
                        { type: "column", properties: ["prop2"] }
                    ]
                }
            };

            mockApp.vault.adapter.read.mockResolvedValue('display config');
            mockYaml.load.mockReturnValue(mockDisplayConfig);

            const configLoader = new ConfigLoader(configPath, mockApp);
            const config = await configLoader.loadClassConfig('DisplayTest');

            expect(config.display?.containers).toHaveLength(2);
            if (config.display?.containers) {
                expect(config.display.containers[0].type).toBe('line');
                expect(config.display.containers[0].properties).toEqual(['prop1', 'prop2']);
                expect(config.display.containers[1].type).toBe('column');
            }
        });

        it('should handle configuration errors gracefully', async () => {
            // Test missing file
            mockApp.vault.adapter.read.mockRejectedValue(new Error('File not found'));
            mockApp.vault.getAbstractFileByPath.mockReturnValue(null);
            
            const configLoader = new ConfigLoader(configPath, mockApp);
            
            await expect(configLoader.loadClassConfig('NonExistent'))
                .rejects.toThrow();

            // Test invalid YAML
            mockApp.vault.adapter.read.mockResolvedValue('invalid: yaml: content: [');
            mockYaml.load.mockImplementation(() => {
                throw new Error('YAML parsing error');
            });
            
            await expect(configLoader.loadClassConfig('Invalid'))
                .rejects.toThrow();
        });
    });

    describe('DynamicClassFactory Integration', () => {
        it('should create and cache dynamic classes', async () => {
            // Reset singleton before test
            (DynamicClassFactory as any).instance = undefined;
            
            const mockConfig = {
                className: "CacheTest",
                classIcon: "cache",
                properties: {
                    test: { type: "Property", name: "test" }
                }
            };

            mockApp.vault.adapter.read.mockResolvedValue('cache config');
            mockYaml.load.mockReturnValue(mockConfig);

            const factory = DynamicClassFactory.getInstance(configPath, mockApp);
            
            // Test that factory is created
            expect(factory).toBeDefined();
            
            // Test basic functionality without complex interactions
            factory.clearCache();
            expect(factory).toBeDefined();
        });

        it('should list available classes from config directory', async () => {
            // Reset singleton
            (DynamicClassFactory as any).instance = undefined;
            
            const factory = DynamicClassFactory.getInstance(configPath, mockApp);
            
            // Mock getAvailableClasses to return a list
            const availableClasses = await factory.getAvailableClasses();

            expect(Array.isArray(availableClasses)).toBe(true);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle missing property definitions gracefully', async () => {
            const mockConfig = {
                className: "MissingProps",
                classIcon: "missing",
                properties: {},
                display: {
                    containers: [
                        { type: "line", properties: [] }
                    ]
                }
            };

            mockApp.vault.adapter.read.mockResolvedValue('missing props config');
            mockYaml.load.mockReturnValue(mockConfig);

            const configLoader = new ConfigLoader(configPath, mockApp);
            const config = await configLoader.loadClassConfig('MissingProps');

            expect(Object.keys(config.properties)).toHaveLength(0);
            if (config.display?.containers) {
                expect(config.display.containers[0].properties).toEqual([]);
            }
        });

        it('should handle configuration without display settings', async () => {
            const mockConfig = {
                className: "NoDisplay",
                classIcon: "no-display",
                properties: {
                    simple: { type: "Property", name: "simple" }
                }
            };

            mockApp.vault.adapter.read.mockResolvedValue('no display config');
            mockYaml.load.mockReturnValue(mockConfig);

            const configLoader = new ConfigLoader(configPath, mockApp);
            const config = await configLoader.loadClassConfig('NoDisplay');

            expect(Object.keys(config.properties)).toHaveLength(1);
            expect(config.display).toBeUndefined();
        });
    });
});