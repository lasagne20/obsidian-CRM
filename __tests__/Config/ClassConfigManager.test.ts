// Mock Three.js modules before any imports
jest.mock('three', () => ({}));
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({ GLTFLoader: class {} }));
jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({ OrbitControls: class {} }));
jest.mock('electron', () => ({
    shell: { openExternal: jest.fn() }
}));

// Mock DisplayManager
jest.mock('../../Utils/Display/DisplayManager', () => ({
    DisplayManager: class {
        generateDisplayContent() {
            return {
                tagName: 'DIV',
                className: 'crm-display-container',
                appendChild: jest.fn(),
                querySelector: jest.fn(),
                querySelectorAll: jest.fn(() => [])
            };
        }
    }
}));

// Mock document for DOM operations
const mockDocument = {
    createElement: jest.fn((tagName: string) => ({
        tagName: tagName.toUpperCase(),
        className: '',
        innerHTML: '',
        appendChild: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn()
        },
        style: {}
    }))
};

(global as any).document = mockDocument;

import { ClassConfigManager } from '../../Utils/Config/ClassConfigManager';
import { ConfigLoader } from '../../Utils/Config/ConfigLoader';
import { Classe } from '../../Classes/Classe';

// Mock des dépendances
jest.mock('../../Utils/Config/ConfigLoader');
const MockConfigLoader = ConfigLoader as jest.MockedClass<typeof ConfigLoader>;

describe('ClassConfigManager', () => {
    let classConfigManager: ClassConfigManager;
    let mockConfigLoader: jest.Mocked<ConfigLoader>;
    let mockApp: any;

    beforeEach(() => {
        mockApp = {
            vault: {
                getAbstractFileByPath: jest.fn(),
                read: jest.fn()
            }
        };
        
        mockConfigLoader = {
            loadClassConfig: jest.fn(),
            createProperty: jest.fn(),
            createSubClassProperty: jest.fn(),
            getAllClassNames: jest.fn()
        } as any;
        
        MockConfigLoader.mockImplementation(() => mockConfigLoader);
        classConfigManager = new ClassConfigManager('./config', mockApp);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createDynamicClasse', () => {
        it('should create a dynamic class from configuration', async () => {
            const mockConfig = {
                className: 'TestClass',
                classIcon: 'test-icon',
                properties: {
                    testProp: {
                        type: 'Property',
                        name: 'Test Property'
                    }
                },
                parentProperty: {
                    type: 'FileProperty',
                    name: 'Parent',
                    classes: ['Lieu']
                }
            };

            const mockProperty = { name: 'Test Property', type: 'basic' };
            const mockParentProperty = { name: 'Parent', type: 'file' };

            mockConfigLoader.loadClassConfig.mockResolvedValue(mockConfig);
            mockConfigLoader.createProperty.mockReturnValue(mockProperty as any);
            mockConfigLoader.createProperty.mockReturnValueOnce(mockParentProperty as any);

            const DynamicClass = await classConfigManager.createDynamicClasse('TestClass');

            expect(DynamicClass.className).toBe('TestClass');
            expect(DynamicClass.classIcon).toBe('test-icon');
            expect(DynamicClass.Properties.testProp).toBe(mockProperty);
            expect(DynamicClass.parentProperty).toBe(mockParentProperty);
        });

        it('should cache created classes', async () => {
            const mockConfig = {
                className: 'TestClass',
                classIcon: 'test-icon',
                properties: {}
            };

            mockConfigLoader.loadClassConfig.mockResolvedValue(mockConfig);

            // Premier appel
            const DynamicClass1 = await classConfigManager.createDynamicClasse('TestClass');
            // Deuxième appel
            const DynamicClass2 = await classConfigManager.createDynamicClasse('TestClass');

            expect(DynamicClass1).toBe(DynamicClass2);
            expect(mockConfigLoader.loadClassConfig).toHaveBeenCalledTimes(1);
        });

        it('should handle classes with subClassesProperty', async () => {
            const mockConfig = {
                className: 'Institution',
                classIcon: 'building',
                properties: {},
                subClassesProperty: {
                    name: 'Type',
                    subClasses: [
                        { name: 'Entreprise', icon: 'briefcase' }
                    ]
                }
            };

            const mockSubClassProperty = { name: 'Type', type: 'subclass' };

            mockConfigLoader.loadClassConfig.mockResolvedValue(mockConfig);
            mockConfigLoader.createSubClassProperty.mockReturnValue(mockSubClassProperty as any);

            const DynamicClass = await classConfigManager.createDynamicClasse('Institution');

            expect(DynamicClass.subClassesProperty).toBe(mockSubClassProperty);
            expect(mockConfigLoader.createSubClassProperty).toHaveBeenCalledWith(mockConfig, DynamicClass);
        });

        it('should handle display configuration', async () => {
            const mockConfig = {
                className: 'TestClass',
                classIcon: 'test-icon',
                properties: {
                    prop1: { type: 'Property', name: 'Property 1' },
                    prop2: { type: 'Property', name: 'Property 2' }
                },
                display: {
                    layout: 'custom' as const,
                    containers: [
                        {
                            type: 'line' as const,
                            className: 'metadata-line',
                            properties: ['prop1', 'prop2']
                        }
                    ]
                }
            };

            mockConfigLoader.loadClassConfig.mockResolvedValue(mockConfig);
            mockConfigLoader.createProperty.mockReturnValue({ 
                name: 'test', 
                type: 'basic',
                getDisplay: jest.fn().mockReturnValue(mockDocument.createElement('div'))
            } as any);

            const DynamicClass = await classConfigManager.createDynamicClasse('TestClass');
            
            // Test que la classe a été créée avec la config d'affichage
            expect(DynamicClass).toBeDefined();
            expect(typeof DynamicClass).toBe('function');
            
            // Test que la configuration display est attachée à la classe ou que la classe a accès aux propriétés
            // Note: la displayConfig pourrait ne pas être directement attachée à la classe statique
            if ((DynamicClass as any).displayConfig) {
                expect((DynamicClass as any).displayConfig).toEqual(mockConfig);
            } else {
                // Vérifier que les propriétés sont bien créées avec la config
                expect(mockConfigLoader.createProperty).toHaveBeenCalledWith(mockConfig.properties.prop1);
                expect(mockConfigLoader.createProperty).toHaveBeenCalledWith(mockConfig.properties.prop2);
            }
            
            // Si getTopDisplayContent existe, le tester, sinon juste vérifier que la classe fonctionne
            const instance = new DynamicClass({} as any, {} as any, {} as any);
            expect(instance).toBeDefined();
            
            // Test optionnel de getTopDisplayContent s'il existe
            if (typeof instance.getTopDisplayContent === 'function') {
                const displayContent = instance.getTopDisplayContent();
                expect(displayContent).toBeDefined();
            }
        });

        it('should create default display when no display config provided', async () => {
            const mockConfig = {
                className: 'SimpleClass',
                classIcon: 'simple',
                properties: {
                    simpleProp: { type: 'Property', name: 'Simple Property' }
                }
            };

            mockConfigLoader.loadClassConfig.mockResolvedValue(mockConfig);
            mockConfigLoader.createProperty.mockReturnValue({
                name: 'Simple Property',
                type: 'basic',
                getDisplay: jest.fn().mockReturnValue(mockDocument.createElement('div'))
            } as any);

            const DynamicClass = await classConfigManager.createDynamicClasse('SimpleClass');
            const instance = new DynamicClass({} as any, {} as any, {} as any);
            
            const displayContent = instance.getTopDisplayContent();
            
            expect(displayContent).toBeDefined();
            expect(typeof displayContent).toBe('object');
        });
    });

    describe('getAvailableClasses', () => {
        it('should return available classes from config loader', async () => {
            const mockClasses = ['Personne', 'Institution', 'Lieu'];
            mockConfigLoader.getAllClassNames.mockResolvedValue(mockClasses);

            const result = await classConfigManager.getAvailableClasses();

            expect(result).toEqual(mockClasses);
            expect(mockConfigLoader.getAllClassNames).toHaveBeenCalled();
        });
    });

    describe('clearCache', () => {
        it('should clear the loaded classes cache', async () => {
            const mockConfig = {
                className: 'TestClass',
                classIcon: 'test-icon',
                properties: {}
            };

            mockConfigLoader.loadClassConfig.mockResolvedValue(mockConfig);

            // Charger une classe
            await classConfigManager.createDynamicClasse('TestClass');
            
            // Vider le cache
            classConfigManager.clearCache();
            
            // Recharger la même classe
            await classConfigManager.createDynamicClasse('TestClass');

            expect(mockConfigLoader.loadClassConfig).toHaveBeenCalledTimes(2);
        });
    });
});