import { App, TFile } from 'obsidian';
import { ObsidianApp } from '../../src/App';

// Mock des dépendances
jest.mock('obsidian', () => ({
    App: jest.fn().mockImplementation(() => ({
        vault: {
            getMarkdownFiles: jest.fn(() => []),
            getName: jest.fn(() => 'TestVault'),
            getAbstractFileByPath: jest.fn(),
            create: jest.fn(),
            read: jest.fn(),
            modify: jest.fn(),
            delete: jest.fn(),
            createFolder: jest.fn(),
            rename: jest.fn(),
            getAllLoadedFiles: jest.fn(() => []),
            getAllFolders: jest.fn(() => []),
            getFiles: jest.fn(() => []),
            adapter: {
                getBasePath: jest.fn(() => '/mock/path')
            }
        },
        workspace: {
            getLeaf: jest.fn(() => ({
                openFile: jest.fn()
            }))
        },
        metadataCache: {
            getCache: jest.fn(() => ({ frontmatter: {} })),
            getFileCache: jest.fn(() => ({ frontmatter: {} })),
            on: jest.fn(),
            off: jest.fn()
        },
        fileManager: {
            processFrontMatter: jest.fn()
        }
    })),
    TFile: jest.fn().mockImplementation((path, basename, extension) => ({
        path: path || 'test.md',
        basename: basename || 'test',
        name: (basename || 'test') + '.md',
        extension: extension || 'md',
        parent: null
    })),
    Notice: jest.fn(),
    setIcon: jest.fn()
}));

// Mock du MultiFileSearchModal
jest.mock('../../src/Modals', () => ({
    MultiFileSearchModal: jest.fn().mockImplementation((app, vault, callback, classes, options) => {
        const modal = {
            app,
            vault,
            callback,
            classes,
            options,
            open: jest.fn(() => {
                // Simuler l'appel du callback avec les fichiers sélectionnés
                setTimeout(() => {
                    // Appeler le callback avec des données de test
                }, 100);
            })
        };
        return modal;
    }),
    FileSearchModal: jest.fn(),
    MediaSearchModal: jest.fn(),
    SelectFromListModal: jest.fn(),
    MultiSelectFromListModal: jest.fn()
}));

// Helper function to create a mock TFile
function createMockFile(path: string, basename: string): TFile {
    const mockFile = {
        path,
        basename,
        name: basename + '.md',
        extension: 'md',
        parent: null
    };
    Object.setPrototypeOf(mockFile, TFile.prototype);
    return mockFile as TFile;
}

// Mock pour la classe Vault avec les méthodes nécessaires
const createMockVault = () => ({
    constructor: {
        classes: {
            Personne: class MockPersonne {
                static className = 'Personne';
            },
            Institution: class MockInstitution {
                static className = 'Institution';
            }
        }
    },
    createFile: jest.fn(async (ClassConstructor: any, name: string) => {
        console.log(`Mock: Creating file with ${ClassConstructor.className}: ${name}`);
        return {
            getPath: () => `${ClassConstructor.className}/${name}.md`,
            getLink: () => `[[${name}]]`,
            path: `${ClassConstructor.className}/${name}.md`,
            name: name
        };
    }),
    getFromFile: jest.fn(async (file: any) => {
        return {
            getFile: () => ({
                getLink: () => `[[${file.basename || file.name}]]`,
                getPath: () => file.path,
                path: file.path,
                name: file.name || file.basename
            })
        };
    })
});

describe('ObsidianApp - selectMultipleFile', () => {
    let obsidianApp: ObsidianApp;
    let mockApp: any;
    let mockVault: any;

    beforeEach(() => {
        mockApp = new App();
        obsidianApp = new ObsidianApp(mockApp);
        mockVault = createMockVault();

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('File creation from Create options', () => {
        it('should create files from Create: XXX options', async () => {
            // Mock du MultiFileSearchModal pour simuler la sélection d'options Create
            const { MultiFileSearchModal } = require('../../src/Modals');
            
            let modalCallback: any;
            MultiFileSearchModal.mockImplementation((app: any, vault: any, callback: any, classes: any, options: any) => ({
                app,
                vault,
                callback,
                classes,
                options,
                open: jest.fn(() => {
                    modalCallback = callback;
                    // Simuler la sélection d'options Create
                    setTimeout(async () => {
                        await modalCallback([
                            'Create: Jean Dupont',
                            'Create: Marie Martin'
                        ]);
                    }, 10);
                })
            }));

            const resultPromise = obsidianApp.selectMultipleFile(mockVault, ['Personne'], {
                hint: 'Select multiple contacts'
            });

            // Attendre le résultat
            const result = await resultPromise;

            // Vérifier que les fichiers ont été créés
            expect(mockVault.createFile).toHaveBeenCalledTimes(2);
            expect(mockVault.createFile).toHaveBeenCalledWith(
                mockVault.constructor.classes.Personne,
                'Jean Dupont'
            );
            expect(mockVault.createFile).toHaveBeenCalledWith(
                mockVault.constructor.classes.Personne,
                'Marie Martin'
            );

            // Vérifier le retour
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('getLink');
            expect(result[1]).toHaveProperty('getLink');
            expect(result[0].getLink()).toBe('[[Jean Dupont]]');
            expect(result[1].getLink()).toBe('[[Marie Martin]]');
        });

        it('should handle mixed TFile and Create options', async () => {
            // Créer un fichier TFile existant
            const existingFile = createMockFile('Contact/Existing Contact.md', 'Existing Contact');
            
            const { MultiFileSearchModal } = require('../../src/Modals');
            
            let modalCallback: any;
            MultiFileSearchModal.mockImplementation((app: any, vault: any, callback: any, classes: any, options: any) => ({
                app,
                vault,
                callback,
                classes,
                options,
                open: jest.fn(() => {
                    modalCallback = callback;
                    // Simuler la sélection mixte : TFile existant + option Create
                    setTimeout(async () => {
                        await modalCallback([
                            existingFile,
                            'Create: New Contact'
                        ]);
                    }, 10);
                })
            }));

            const result = await obsidianApp.selectMultipleFile(mockVault, ['Personne'], {});

            // Vérifier qu'un seul fichier a été créé (l'option Create)
            expect(mockVault.createFile).toHaveBeenCalledTimes(1);
            expect(mockVault.createFile).toHaveBeenCalledWith(
                mockVault.constructor.classes.Personne,
                'New Contact'
            );

            // Vérifier que getFromFile a été appelé pour le fichier existant
            expect(mockVault.getFromFile).toHaveBeenCalledTimes(1);

            // Vérifier le retour
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('getLink'); // Fichier existant
            expect(result[1]).toHaveProperty('getLink'); // Fichier créé
        });

        it('should handle creation errors gracefully', async () => {
            // Mock une erreur lors de la création
            mockVault.createFile.mockRejectedValueOnce(new Error('Creation failed'));
            
            const { MultiFileSearchModal } = require('../../src/Modals');
            
            let modalCallback: any;
            MultiFileSearchModal.mockImplementation((app: any, vault: any, callback: any, classes: any, options: any) => ({
                app,
                vault,
                callback,
                classes,
                options,
                open: jest.fn(() => {
                    modalCallback = callback;
                    setTimeout(async () => {
                        await modalCallback([
                            'Create: Failed Contact',
                            'Create: Success Contact'
                        ]);
                    }, 10);
                })
            }));

            // Mock sendNotice
            const sendNoticeSpy = jest.spyOn(obsidianApp, 'sendNotice').mockImplementation(() => {});

            const result = await obsidianApp.selectMultipleFile(mockVault, ['Personne'], {});

            // Vérifier que sendNotice a été appelé pour l'erreur
            expect(sendNoticeSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error creating file: Creation failed')
            );

            // Vérifier que seul le fichier réussi est retourné
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('getLink');
            expect(result[0].getLink()).toBe('[[Success Contact]]');

            sendNoticeSpy.mockRestore();
        });

        it('should handle multiple classes correctly', async () => {
            const { MultiFileSearchModal } = require('../../src/Modals');
            
            let modalCallback: any;
            MultiFileSearchModal.mockImplementation((app: any, vault: any, callback: any, classes: any, options: any) => ({
                app,
                vault,
                callback,
                classes,
                options,
                open: jest.fn(() => {
                    modalCallback = callback;
                    setTimeout(async () => {
                        await modalCallback([
                            'Create: New Institution'
                        ]);
                    }, 10);
                })
            }));

            const result = await obsidianApp.selectMultipleFile(mockVault, ['Institution', 'Personne'], {});

            // Vérifier que le premier constructeur de classe est utilisé
            expect(mockVault.createFile).toHaveBeenCalledWith(
                mockVault.constructor.classes.Institution,
                'New Institution'
            );

            expect(result).toHaveLength(1);
            expect(result[0].getLink()).toBe('[[New Institution]]');
        });

        it('should handle no class constructor found', async () => {
            // Créer un vault sans constructeurs
            const vaultWithoutClasses = {
                ...mockVault,
                constructor: { classes: {} }
            };
            
            const { MultiFileSearchModal } = require('../../src/Modals');
            
            let modalCallback: any;
            MultiFileSearchModal.mockImplementation((app: any, vault: any, callback: any, classes: any, options: any) => ({
                app,
                vault,
                callback,
                classes,
                options,
                open: jest.fn(() => {
                    modalCallback = callback;
                    setTimeout(async () => {
                        await modalCallback(['Create: Test Contact']);
                    }, 10);
                })
            }));

            const sendNoticeSpy = jest.spyOn(obsidianApp, 'sendNotice').mockImplementation(() => {});

            const result = await obsidianApp.selectMultipleFile(vaultWithoutClasses, ['NonExistentClass'], {});

            // Vérifier que l'erreur est gérée
            expect(sendNoticeSpy).toHaveBeenCalledWith(
                expect.stringContaining('No constructor found for classes: NonExistentClass')
            );

            // Aucun fichier ne devrait être retourné
            expect(result).toHaveLength(0);

            sendNoticeSpy.mockRestore();
        });
    });
});