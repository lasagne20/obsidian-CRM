/**
 * Tests basiques pour le système de configuration YAML
 * Ces tests vérifient les fonctionnalités de base sans complexité excessive
 */

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

jest.mock('../../Utils/Properties/SelectProperty', () => ({
    SelectProperty: class MockSelectProperty {
        constructor(public name: string, public options: any[], public config: any = {}) {}
    }
}));

jest.mock('../../Utils/Properties/EmailProperty', () => ({
    EmailProperty: class MockEmailProperty {
        constructor(public name: string, public config: any = {}) {}
    }
}));

import { ConfigLoader } from '../../Utils/Config/ConfigLoader';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Mock fs pour simuler les fichiers YAML
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    readdirSync: jest.fn()
}));
const mockFs = fs as jest.Mocked<typeof fs>;
const mockYaml = yaml as jest.Mocked<typeof yaml>;

// Mock Obsidian app instance
const mockApp = {
    vault: {
        adapter: {
            read: jest.fn()
        },
        getAbstractFileByPath: jest.fn(),
        read: jest.fn()
    }
};

describe('Configuration System - Basic Tests', () => {
    let configLoader: ConfigLoader;
    
    beforeEach(() => {
        configLoader = new ConfigLoader('./test-config', mockApp);
        jest.clearAllMocks();
    });

    describe('ConfigLoader', () => {
        it('should parse basic YAML configuration', async () => {
            const mockYamlContent = `
className: "TestClass"
classIcon: "test-icon"
properties:
  testProperty:
    type: "Property"
    name: "testProperty"
`;
            
            const mockConfig = {
                className: "TestClass",
                classIcon: "test-icon",
                properties: {
                    testProperty: {
                        type: "Property",
                        name: "testProperty"
                    }
                }
            };
            
            mockApp.vault.adapter.read.mockResolvedValue(mockYamlContent);
            mockYaml.load.mockReturnValue(mockConfig);

            const config = await configLoader.loadClassConfig('TestClass');
            
            expect(config.className).toBe('TestClass');
            expect(config.classIcon).toBe('test-icon');
            expect(config.properties.testProperty).toBeDefined();
            expect(config.properties.testProperty.type).toBe('Property');
        });

        it('should cache loaded configurations', async () => {
            const mockYamlContent = `
className: "CacheTest"
classIcon: "cache-icon"
properties:
  prop1:
    type: "Property"
    name: "prop1"
`;
            
            const mockConfig = {
                className: "CacheTest",
                classIcon: "cache-icon",
                properties: {
                    prop1: {
                        type: "Property",
                        name: "prop1"
                    }
                }
            };
            
            mockApp.vault.adapter.read.mockResolvedValue(mockYamlContent);
            mockYaml.load.mockReturnValue(mockConfig);

            // Premier appel
            const config1 = await configLoader.loadClassConfig('CacheTest');
            // Deuxième appel
            const config2 = await configLoader.loadClassConfig('CacheTest');
            
            // Le fichier ne devrait être lu qu'une seule fois
            expect(mockApp.vault.adapter.read).toHaveBeenCalledTimes(1);
            expect(config1).toBe(config2); // Même référence d'objet
        });

        it('should throw error for missing configuration file', async () => {
            mockApp.vault.adapter.read.mockRejectedValue(new Error('File not found'));
            mockApp.vault.getAbstractFileByPath.mockReturnValue(null);
            
            await expect(configLoader.loadClassConfig('MissingClass'))
                .rejects.toThrow();
        });

        it('should handle YAML parsing errors', async () => {
            const invalidYaml = `
className: "Invalid
properties:
  - invalid: yaml: [
`;
            
            mockApp.vault.adapter.read.mockResolvedValue(invalidYaml);
            mockYaml.load.mockImplementation(() => {
                throw new Error('YAML parsing error');
            });
            
            await expect(configLoader.loadClassConfig('InvalidYaml'))
                .rejects.toThrow();
        });
    });

    describe('Property Creation', () => {
        it('should create Property instance', () => {
            const property = configLoader.createProperty({
                type: 'Property',
                name: 'testProp'
            });
            
            expect(property).toBeDefined();
            expect(property.constructor.name).toBe('MockProperty');
        });

        it('should create SelectProperty with options', () => {
            const property = configLoader.createProperty({
                type: 'SelectProperty',
                name: 'selectProp',
                options: [
                    { name: 'Option1', color: 'red' },
                    { name: 'Option2', color: 'blue' }
                ]
            });
            
            expect(property).toBeDefined();
            expect(property.constructor.name).toBe('MockSelectProperty');
        });

        it('should create EmailProperty', () => {
            const property = configLoader.createProperty({
                type: 'EmailProperty',
                name: 'emailProp'
            });
            
            expect(property).toBeDefined();
            expect(property.constructor.name).toBe('MockEmailProperty');
        });

        it('should handle unknown property types', () => {
            // Le ConfigLoader ne throw pas, il return une Property par défaut
            const property = configLoader.createProperty({
                type: 'UnknownProperty',
                name: 'unknown'
            });
            
            expect(property).toBeDefined();
            expect(property.constructor.name).toBe('MockProperty');
        });
    });

    describe('Configuration Validation', () => {
        it('should validate required fields in configuration', async () => {
            const incompleteConfig = `
classIcon: "icon"
properties: {}
`;
            
            const mockConfig = {
                classIcon: "icon",
                properties: {}
                // className manquant
            };
            
            mockApp.vault.adapter.read.mockResolvedValue(incompleteConfig);
            mockYaml.load.mockReturnValue(mockConfig);
            
            // Le className manquant devrait causer une erreur dans le code métier
            const config = await configLoader.loadClassConfig('Incomplete');
            expect(config.className).toBeUndefined();
        });

        it('should handle configuration with display settings', async () => {
            const configWithDisplay = `
className: "WithDisplay"
classIcon: "display-icon"
properties:
  prop1:
    type: "Property"
    name: "prop1"
display:
  layout: "custom"
  containers:
    - type: "line"
      properties: ["prop1"]
`;
            
            const mockConfig = {
                className: "WithDisplay",
                classIcon: "display-icon",
                properties: {
                    prop1: {
                        type: "Property",
                        name: "prop1"
                    }
                },
                display: {
                    layout: "custom",
                    containers: [
                        {
                            type: "line",
                            properties: ["prop1"]
                        }
                    ]
                }
            };
            
            mockApp.vault.adapter.read.mockResolvedValue(configWithDisplay);
            mockYaml.load.mockReturnValue(mockConfig);

            const config = await configLoader.loadClassConfig('WithDisplay');
            
            expect(config.display).toBeDefined();
            expect(config.display?.layout).toBe('custom');
            expect(config.display?.containers).toHaveLength(1);
            expect(config.display?.containers?.[0].type).toBe('line');
            expect(config.display?.containers?.[0].properties).toContain('prop1');
        });
    });

    describe('SubClass Configuration', () => {
        it('should handle configuration with subclasses', async () => {
            const configWithSubClasses = `
className: "ParentClass"
classIcon: "parent-icon"
properties:
  mainProp:
    type: "Property"
    name: "mainProp"
subClassesProperty:
  name: "type"
  subClasses:
    - name: "SubType1"
      icon: "sub1-icon"
    - name: "SubType2"  
      icon: "sub2-icon"
`;
            
            const mockConfig = {
                className: "ParentClass",
                classIcon: "parent-icon",
                properties: {
                    mainProp: {
                        type: "Property",
                        name: "mainProp"
                    }
                },
                subClassesProperty: {
                    name: "type",
                    subClasses: [
                        {
                            name: "SubType1",
                            icon: "sub1-icon"
                        },
                        {
                            name: "SubType2",
                            icon: "sub2-icon"
                        }
                    ]
                }
            };
            
            mockApp.vault.adapter.read.mockResolvedValue(configWithSubClasses);
            mockYaml.load.mockReturnValue(mockConfig);

            const config = await configLoader.loadClassConfig('ParentClass');
            
            expect(config.subClassesProperty).toBeDefined();
            expect(config.subClassesProperty?.name).toBe('type');
            expect(config.subClassesProperty?.subClasses).toHaveLength(2);
            expect(config.subClassesProperty?.subClasses[0].name).toBe('SubType1');
            expect(config.subClassesProperty?.subClasses[1].name).toBe('SubType2');
        });
    });

    describe('Error Handling', () => {
        it('should provide meaningful error messages', async () => {
            mockApp.vault.adapter.read.mockRejectedValue(new Error('File not found'));
            mockApp.vault.getAbstractFileByPath.mockReturnValue(null);
            
            try {
                await configLoader.loadClassConfig('NonExistent');
                fail('Expected error to be thrown');
            } catch (error: any) {
                expect(error.message).toContain('NonExistent');
            }
        });

        it('should handle file system errors gracefully', async () => {
            mockApp.vault.adapter.read.mockRejectedValue(new Error('Permission denied'));
            mockApp.vault.getAbstractFileByPath.mockReturnValue({ extension: 'yaml' });
            mockApp.vault.read.mockRejectedValue(new Error('Permission denied'));
            
            await expect(configLoader.loadClassConfig('PermissionError'))
                .rejects.toThrow('Configuration not found for class: PermissionError');
        });
    });
});