// Mock Three.js modules before any imports
jest.mock('three', () => ({}));
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({ GLTFLoader: class {} }));
jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({ OrbitControls: class {} }));
jest.mock('electron', () => ({
    shell: { openExternal: jest.fn() }
}));

import { DynamicClassFactory } from '../../Utils/Config/DynamicClassFactory';
import { ClassConfigManager } from '../../Utils/Config/ClassConfigManager';
import { Classe } from '../../Classes/Classe';

// Mock des dépendances
jest.mock('../../Utils/Config/ClassConfigManager');
const MockClassConfigManager = ClassConfigManager as jest.MockedClass<typeof ClassConfigManager>;

describe('DynamicClassFactory', () => {
    let mockApp: any;
    let mockConfigManager: jest.Mocked<ClassConfigManager>;

    beforeEach(() => {
        mockApp = {
            vault: {
                getAbstractFileByPath: jest.fn(),
                read: jest.fn()
            }
        };

        mockConfigManager = {
            createDynamicClasse: jest.fn(),
            getAvailableClasses: jest.fn(),
            clearCache: jest.fn()
        } as any;

        MockClassConfigManager.mockImplementation(() => mockConfigManager);
        
        // Reset singleton
        (DynamicClassFactory as any).instance = undefined;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getInstance', () => {
        it('should create singleton instance', () => {
            const factory1 = DynamicClassFactory.getInstance('./config', mockApp);
            const factory2 = DynamicClassFactory.getInstance('./config', mockApp);

            expect(factory1).toBe(factory2);
            expect(MockClassConfigManager).toHaveBeenCalledTimes(1);
        });

        it('should throw error when no config path provided for first initialization', () => {
            expect(() => {
                DynamicClassFactory.getInstance();
            }).toThrow('ConfigPath required for first initialization');
        });

        it('should return existing instance when called without parameters after initialization', () => {
            const factory1 = DynamicClassFactory.getInstance('./config', mockApp);
            const factory2 = DynamicClassFactory.getInstance();

            expect(factory1).toBe(factory2);
        });
    });

    describe('getClass', () => {
        let factory: DynamicClassFactory;

        beforeEach(() => {
            factory = DynamicClassFactory.getInstance('./config', mockApp);
        });

        it('should get dynamic class from config manager', async () => {
            const mockClass = class extends Classe {
                static className = 'TestClass';
                static classIcon = 'test-icon';
            };

            mockConfigManager.createDynamicClasse.mockResolvedValue(mockClass as any);

            const result = await factory.getClass('TestClass');

            expect(result).toBe(mockClass);
            expect(mockConfigManager.createDynamicClasse).toHaveBeenCalledWith('TestClass');
        });

        it('should cache classes and return from cache on subsequent calls', async () => {
            const mockClass = class extends Classe {
                static className = 'TestClass';
            };

            mockConfigManager.createDynamicClasse.mockResolvedValue(mockClass as any);

            // Premier appel
            const result1 = await factory.getClass('TestClass');
            // Deuxième appel
            const result2 = await factory.getClass('TestClass');

            expect(result1).toBe(result2);
            expect(mockConfigManager.createDynamicClasse).toHaveBeenCalledTimes(1);
        });
    });

    describe('createInstance', () => {
        let factory: DynamicClassFactory;

        beforeEach(() => {
            factory = DynamicClassFactory.getInstance('./config', mockApp);
        });

        it('should create instance of dynamic class', async () => {
            const MockClass = jest.fn();
            MockClass.mockImplementation((app, vault, file) => ({
                app,
                vault,
                file,
                getClasse: jest.fn().mockReturnValue('TestClass')
            }));

            mockConfigManager.createDynamicClasse.mockResolvedValue(MockClass as any);

            const mockVault = {
                app: mockApp,
                files: {},
                dataFiles: {},
                settings: {},
                classAdapter: {},
                dynamicFactory: {},
                configLoader: {},
                classConfigManager: {},
                adapter: {},
                getFromLink: jest.fn(),
                getAllClassesNames: jest.fn(),
                getAllFile: jest.fn(),
                getAllFileClasses: jest.fn(),
                getAllFiles: jest.fn(),
                getFile: jest.fn(),
                getFileFromPath: jest.fn(),
                readFile: jest.fn(),
                writeFile: jest.fn(),
                createFolder: jest.fn(),
                deleteFile: jest.fn(),
                renameFile: jest.fn(),
                getFileContent: jest.fn(),
                updateFileContent: jest.fn(),
                createFile: jest.fn(),
                loadClasse: jest.fn(),
                loadAllClasses: jest.fn(),
                loadJSON: jest.fn(),
                saveJSON: jest.fn()
            } as any;
            const mockFile = {};
            
            const instance = await factory.createInstance('TestClass', mockApp, mockVault, mockFile);

            expect(MockClass).toHaveBeenCalledWith(mockApp, mockVault, mockFile);
            expect(instance).toBeDefined();
        });
    });

    describe('getAvailableClasses', () => {
        let factory: DynamicClassFactory;

        beforeEach(() => {
            factory = DynamicClassFactory.getInstance('./config', mockApp);
        });

        it('should return available classes from config manager', async () => {
            const mockClasses = ['Personne', 'Institution', 'Lieu'];
            mockConfigManager.getAvailableClasses.mockResolvedValue(mockClasses);

            const result = await factory.getAvailableClasses();

            expect(result).toEqual(mockClasses);
            expect(mockConfigManager.getAvailableClasses).toHaveBeenCalled();
        });
    });

    describe('clearCache', () => {
        let factory: DynamicClassFactory;

        beforeEach(() => {
            factory = DynamicClassFactory.getInstance('./config', mockApp);
        });

        it('should clear both config manager and internal cache', async () => {
            const mockClass = class extends Classe {};
            mockConfigManager.createDynamicClasse.mockResolvedValue(mockClass as any);

            // Charger une classe pour remplir le cache
            await factory.getClass('TestClass');
            
            // Vider les caches
            factory.clearCache();
            
            // Recharger la même classe
            await factory.getClass('TestClass');

            expect(mockConfigManager.clearCache).toHaveBeenCalled();
            expect(mockConfigManager.createDynamicClasse).toHaveBeenCalledTimes(2);
        });
    });

    describe('initialize', () => {
        it('should initialize factory with plugin path and app', async () => {
            const pluginPath = '/path/to/plugin';
            const factory = await DynamicClassFactory.initialize(pluginPath, mockApp);

            expect(factory).toBeInstanceOf(DynamicClassFactory);
            expect(MockClassConfigManager).toHaveBeenCalledWith(`${pluginPath}/config`, mockApp);
        });

        it('should work without app parameter', async () => {
            const pluginPath = '/path/to/plugin';
            const factory = await DynamicClassFactory.initialize(pluginPath);

            expect(factory).toBeInstanceOf(DynamicClassFactory);
        });
    });
});