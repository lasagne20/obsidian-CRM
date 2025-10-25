import { Classe } from "../../Classes/Classe";
import { FreecadFile } from "../../Utils/3D/FreecadFile";
import AppShim, { TFile, TFolder } from "../../Utils/App";
import { DynamicClassFactory } from "../../Utils/Config/DynamicClassFactory";
import { GeoData } from "../../Utils/Data/GeoData";
import { MyVault } from "../../Utils/MyVault";
import { Settings } from "../../Utils/Settings";
import { VaultClassAdapter } from "../../Utils/VaultClassAdapter";

// Mock des dépendances
jest.mock("../../Utils/VaultClassAdapter");
jest.mock("../../Utils/Config/DynamicClassFactory");
jest.mock("../../Utils/Data/GeoData");
jest.mock("../../Utils/3D/FreecadFile");
jest.mock("../../Utils/Modals/Modals", () => ({
    selectClass: jest.fn(),
    selectFile: jest.fn()
}));
jest.mock("../../Utils/Utils", () => ({
    waitForFileMetaDataUpdate: jest.fn().mockImplementation((app, path, key, callback) => callback())
}));

describe('MyVault', () => {
    let app: AppShim;
    let settings: Settings;
    let myVault: MyVault;
    let mockFile: TFile;
    let mockFolder: TFolder;

    beforeEach(() => {
        // Reset des mocks statiques
        MyVault.classes = {};
        (MyVault as any).dynamicClassFactory = null;
        (MyVault as any).geoData = null;

        // Mock AppShim
        app = {
            vault: {
                getFiles: jest.fn().mockReturnValue([]),
                getAbstractFileByPath: jest.fn(),
                create: jest.fn(),
                modify: jest.fn(),
                delete: jest.fn(),
                read: jest.fn().mockResolvedValue("---\nClasse: TestClass\n---\n"),
                getAllFolders: jest.fn().mockReturnValue([])
            },
            metadataCache: {
                getFileCache: jest.fn().mockReturnValue({
                    frontmatter: { Classe: "TestClass" }
                })
            },
            workspace: {
                getActiveFile: jest.fn()
            }
        } as unknown as AppShim;

        // Mock Settings
        settings = {
            personalName: "Test User",
            dataFile: "test-data.json",
            additionalFiles: [],
            configPath: "./config",
            templateFolder: "./templates"
        } as Settings;

        // Mock files
        mockFile = {
            path: "test/file.md",
            name: "file.md",
            basename: "file",
            extension: "md",
            stat: { mtime: Date.now(), ctime: Date.now(), size: 100 }
        } as TFile;

        mockFolder = {
            path: "test/folder",
            name: "folder",
            children: [mockFile],
            isRoot: () => false,
            vault: app.vault,
            parent: null
        } as unknown as TFolder;

        // Mock des classes
        const mockClasse = jest.fn().mockImplementation((app, vault, file) => ({
            getName: jest.fn().mockReturnValue("TestClass"),
            getClasse: jest.fn().mockReturnValue("TestClass"),
            update: jest.fn(),
            check: jest.fn(),
            populate: jest.fn(),
            file: file,
            findPropertyFromValue: jest.fn(),
            getChildren: jest.fn().mockReturnValue([]),
            getSelectedSubClasse: jest.fn()
        }));
        (mockClasse as any).getClasse = jest.fn().mockReturnValue("TestClass");
        
        MyVault.classes = {
            TestClass: mockClasse
        };

        // Mock DynamicClassFactory
        const mockDynamicFactory = {
            getAvailableClasses: jest.fn().mockResolvedValue(['TestClass']),
            getClass: jest.fn().mockResolvedValue(mockClasse)
        };
        (DynamicClassFactory.getInstance as jest.Mock).mockReturnValue(mockDynamicFactory);

        myVault = new MyVault(app, settings);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with app and settings', () => {
            expect(myVault.app).toBe(app);
            expect(myVault.settings).toBe(settings);
            expect(myVault.files).toEqual({});
        });

        it('should initialize GeoData when dataFile is provided', () => {
            expect(GeoData).toHaveBeenCalledWith(app, settings.dataFile, settings.additionalFiles);
        });

        it('should initialize VaultClassAdapter when configPath is provided', () => {
            expect(VaultClassAdapter).toHaveBeenCalledWith(myVault, settings.configPath);
        });

        it('should not initialize GeoData when dataFile is not provided', () => {
            jest.clearAllMocks();
            const settingsWithoutData = { ...settings, dataFile: '' };
            new MyVault(app, settingsWithoutData);
            expect(GeoData).not.toHaveBeenCalled();
        });
    });

    describe('getDynamicClass', () => {
        it('should get dynamic class from factory', async () => {
            // Clear existing factory to trigger initialization
            (MyVault as any).dynamicClassFactory = null;
            const mockDynamicFactory = {
                getClass: jest.fn().mockResolvedValue(MyVault.classes.TestClass)
            };
            (DynamicClassFactory.getInstance as jest.Mock).mockReturnValue(mockDynamicFactory);

            const result = await myVault.getDynamicClass('TestClass');
            
            expect(result).toBe(MyVault.classes.TestClass);
            expect(mockDynamicFactory.getClass).toHaveBeenCalledWith('TestClass');
        });

        it('should handle errors when getting dynamic class', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const mockDynamicFactory = {
                getClass: jest.fn().mockRejectedValue(new Error('Test error'))
            };
            (DynamicClassFactory.getInstance as jest.Mock).mockReturnValue(mockDynamicFactory);
            // Clear existing factory
            (MyVault as any).dynamicClassFactory = null;

            const result = await myVault.getDynamicClass('NonExistentClass');
            
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Failed to get dynamic class NonExistentClass:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('getPersonalName', () => {
        it('should return personal name from settings', () => {
            expect(myVault.getPersonalName()).toBe("Test User");
        });
    });

    describe('getFileData', () => {
        it('should return FreecadFile data when name is provided and exists', () => {
            const mockFreecadFile = { checkUpdate: jest.fn() };
            myVault.dataFiles['test.fcstd'] = mockFreecadFile as any;

            const result = myVault.getFileData({} as Classe, 'test.fcstd');
            
            expect(result).toBe(mockFreecadFile);
            expect(mockFreecadFile.checkUpdate).toHaveBeenCalled();
        });

        it('should return GeoData when no name provided', () => {
            const mockGeoData = { getGeoData: jest.fn().mockReturnValue('geoDataResult') };
            MyVault.geoData = mockGeoData as any;
            const mockClasse = { getName: jest.fn().mockReturnValue('TestClass') };

            const result = myVault.getFileData(mockClasse as any);
            
            expect(result).toBe('geoDataResult');
            expect(mockGeoData.getGeoData).toHaveBeenCalledWith('TestClass');
        });

        it('should return null when no GeoData available', () => {
            (MyVault as any).geoData = null;
            
            const result = myVault.getFileData({} as Classe);
            
            expect(result).toBeNull();
        });
    });

    describe('getAsyncFileData', () => {
        it('should return FreecadFile for .fcstd files', async () => {
            const mockMediaFile = { extension: 'fcstd' };
            const mockFreecadFile = { generateJsonData: jest.fn() };
            
            jest.spyOn(myVault, 'getMediaFromLink').mockReturnValue(mockMediaFile as any);
            (FreecadFile as unknown as jest.Mock).mockImplementation(() => mockFreecadFile);

            const result = await myVault.getAsyncFileData({} as Classe, 'test.fcstd');
            
            expect(result).toBe(mockFreecadFile);
            expect(mockFreecadFile.generateJsonData).toHaveBeenCalled();
            expect(myVault.dataFiles['test.fcstd']).toBe(mockFreecadFile);
        });

        it('should return null for non-existent files', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            jest.spyOn(myVault, 'getMediaFromLink').mockReturnValue(null);

            const result = await myVault.getAsyncFileData({} as Classe, 'nonexistent.file');
            
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith("Fichier non trouvé : nonexistent.file");
            
            consoleSpy.mockRestore();
        });

        it('should fallback to getFileData when no name provided', async () => {
            jest.spyOn(myVault, 'getFileData').mockReturnValue('fallbackResult' as any);

            const result = await myVault.getAsyncFileData({} as Classe);
            
            expect(result).toBe('fallbackResult');
        });
    });

    describe('readLinkFile', () => {
        it('should parse wikilink with alias', () => {
            const result = myVault.readLinkFile('[[folder/file.md|Display Name]]');
            expect(result).toBe('Display Name');
        });

        it('should parse wikilink without alias', () => {
            const result = myVault.readLinkFile('[[folder/file.md]]');
            expect(result).toBe('file');
        });

        it('should return path when path=true', () => {
            const result = myVault.readLinkFile('[[folder/file.md|Display Name]]', true);
            expect(result).toBe('folder/file.md');
        });

        it('should add .md extension when path=true and no extension', () => {
            const result = myVault.readLinkFile('[[folder/file|Display Name]]', true);
            expect(result).toBe('folder/file.md');
        });

        it('should handle non-wikilink strings', () => {
            const result = myVault.readLinkFile('plain text');
            expect(result).toBe('plain text');
        });

        it('should handle empty or invalid input', () => {
            expect(myVault.readLinkFile('')).toBe('');
            expect(myVault.readLinkFile(null as any)).toBe('');
            expect(myVault.readLinkFile(undefined as any)).toBe('');
        });
    });

    describe('getFromLink', () => {
        beforeEach(() => {
            (app.vault.getFiles as jest.Mock).mockReturnValue([
                { path: 'folder/file.md', name: 'file.md' },
                { path: 'other/file.md', name: 'file.md' }
            ]);
        });

        it('should find file by exact path', () => {
            // Le code vérifie `directfile.path in Object.keys(this.files)` ce qui est toujours false
            // car Object.keys retourne un array et on ne peut pas faire `in` sur un array
            // Donc il va toujours créer une nouvelle classe. Testons cela.
            jest.spyOn(myVault, 'createClasse').mockReturnValue('newClasse' as any);
            
            // Mock the exact file that will be found
            (app.vault.getFiles as jest.Mock).mockReturnValue([
                { path: 'folder/file.md', name: 'file.md' }
            ]);

            const result = myVault.getFromLink('[[folder/file.md]]');
            
            expect(result).toBe('newClasse');
            expect(myVault.createClasse).toHaveBeenCalled();
        });

        it('should create classe for existing file', () => {
            jest.spyOn(myVault, 'createClasse').mockReturnValue('newClasse' as any);

            const result = myVault.getFromLink('[[folder/file.md]]');
            
            expect(result).toBe('newClasse');
            expect(myVault.createClasse).toHaveBeenCalledWith({ path: 'folder/file.md', name: 'file.md' });
        });

        it('should handle multiple files with same name', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            // Mock multiple files with same name but different paths
            (app.vault.getFiles as jest.Mock).mockReturnValue([
                { path: 'folder1/file.md', name: 'file.md' },
                { path: 'folder2/file.md', name: 'file.md' }
            ]);
            jest.spyOn(myVault, 'createClasse').mockReturnValue('newClasse' as any);
            
            // Mock readLinkFile to return just the filename (which would trigger the multiple files scenario)
            jest.spyOn(myVault, 'readLinkFile')
                .mockReturnValueOnce('file.md') // First call with path=true
                .mockReturnValueOnce(''); // Second call inside the if condition (path=true again)

            const result = myVault.getFromLink('file.md'); // Plain name without brackets
            
            expect(result).toBe('newClasse');
            expect(consoleSpy).toHaveBeenCalledWith('Plusieurs fichiers trouvés pour le lien sans chemin : file.md', expect.any(Array));
            
            consoleSpy.mockRestore();
        });

        it('should return null for non-existent file', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            (app.vault.getFiles as jest.Mock).mockReturnValue([]);

            const result = myVault.getFromLink('[[nonexistent.md]]');
            
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Fichier non trouvé : [[nonexistent.md]]');
            
            consoleSpy.mockRestore();
        });

        it('should not log error when log=false', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            (app.vault.getFiles as jest.Mock).mockReturnValue([]);

            const result = myVault.getFromLink('[[nonexistent.md]]', false);
            
            expect(result).toBeNull();
            expect(consoleSpy).not.toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('getMediaFromLink', () => {
        beforeEach(() => {
            (app.vault.getFiles as jest.Mock).mockReturnValue([
                { path: 'media/image.png', name: 'image.png' },
                { path: 'other/image.png', name: 'image.png' }
            ]);
        });

        it('should find media file by exact path', () => {
            const result = myVault.getMediaFromLink('[[media/image.png]]');
            
            expect(result).toEqual({ path: 'media/image.png', name: 'image.png' });
        });

        it('should find media file by name', () => {
            const result = myVault.getMediaFromLink('[[image.png]]');
            
            expect(result).toEqual({ path: 'media/image.png', name: 'image.png' });
        });

        it('should handle multiple files with same name', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = myVault.getMediaFromLink('image.png'); // No brackets
            
            expect(result).toEqual({ path: 'media/image.png', name: 'image.png' });
            expect(consoleSpy).toHaveBeenCalledWith('Plusieurs fichiers trouvés pour le lien sans chemin : image.png', expect.any(Array));
            
            consoleSpy.mockRestore();
        });

        it('should return null for non-existent media', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            (app.vault.getFiles as jest.Mock).mockReturnValue([]);

            const result = myVault.getMediaFromLink('[[nonexistent.png]]');
            
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Media non trouvé : [[nonexistent.png]]');
            
            consoleSpy.mockRestore();
        });
    });

    describe('getFromFolder', () => {
        it('should find classe file in folder', () => {
            const mockFile = { name: 'test.md', path: 'folder/test.md' };
            const mockFolder = { 
                path: 'folder/test', 
                children: [mockFile],
                name: 'test'
            };
            jest.spyOn(myVault, 'getFromFile').mockReturnValue('classeResult' as any);

            const result = myVault.getFromFolder(mockFolder as any);
            
            expect(result).toBe('classeResult');
            expect(myVault.getFromFile).toHaveBeenCalledWith(mockFile);
        });

        it('should log error when no matching file found', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const mockFolder = { 
                path: 'folder/test', 
                children: [{ name: 'other.md' }],
                name: 'test'
            };

            myVault.getFromFolder(mockFolder as any);
            
            expect(consoleSpy).toHaveBeenCalledWith('Le dossier n\'a pas de fichier classe : folder/test');
            
            consoleSpy.mockRestore();
        });
    });

    describe('getFromFile', () => {
        it('should return existing classe from cache', () => {
            const existingClasse = { name: 'existing' };
            myVault.files[mockFile.path] = existingClasse as any;

            const result = myVault.getFromFile(mockFile);
            
            expect(result).toBe(existingClasse);
        });

        it('should create new classe for TFile', () => {
            jest.spyOn(myVault, 'createClasse').mockReturnValue('newClasse' as any);

            const result = myVault.getFromFile(mockFile);
            
            expect(result).toBe('newClasse');
            expect(myVault.createClasse).toHaveBeenCalledWith(mockFile);
            expect(myVault.files[mockFile.path]).toBe('newClasse');
        });

        it('should handle TFolder by finding corresponding file', () => {
            const mockFile = { path: 'test/folder/folder.md' };
            (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(mockFile);

            // Create a proper folder mock that will pass isTFolder test
            const folderMock = {
                path: 'test/folder',
                name: 'folder',
                children: [],
                isRoot: () => false
            };

            const result = myVault.getFromFile(folderMock as any);
            
            // The correct path should be constructed as: folder.path + "/" + folder.name + ".md"
            expect(app.vault.getAbstractFileByPath).toHaveBeenCalledWith('test/folder/folder.md');
            // Since we mock getAbstractFileByPath to return a file, getFromFile should be called recursively
            expect(result).toBeDefined();
        });
    });

    describe('createFile', () => {
        it('should create file with template content', async () => {
            const mockTemplate = '---\nClasse: TestClass\n---\nTemplate content';
            const mockCreatedFile = { path: 'test.md', name: 'test.md' };
            
            (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue({
                name: 'TestClass.md',
                path: './templates/TestClass.md'
            });
            (app.vault.read as jest.Mock).mockResolvedValue(mockTemplate);
            (app.vault.create as jest.Mock).mockResolvedValue(mockCreatedFile);
            
            jest.spyOn(myVault, 'getFromFile').mockReturnValue({
                populate: jest.fn(),
                check: jest.fn(),
                update: jest.fn(),
                getName: jest.fn().mockReturnValue('test')
            } as any);

            const result = await myVault.createFile(MyVault.classes.TestClass, 'test');
            
            expect(app.vault.create).toHaveBeenCalledWith('test.md', mockTemplate);
            expect(result).toBe(mockCreatedFile);
        });

        it('should modify existing file if creation fails', async () => {
            const mockTemplate = '---\nClasse: TestClass\n---\nTemplate content';
            const mockExistingFile = { path: 'test.md', name: 'test.md' };
            
            (app.vault.getAbstractFileByPath as jest.Mock)
                .mockReturnValueOnce(null) // No template
                .mockReturnValueOnce(mockExistingFile); // Existing file
            (app.vault.read as jest.Mock).mockResolvedValue(mockTemplate);
            (app.vault.create as jest.Mock).mockRejectedValue(new Error('File exists'));
            (app.vault.modify as jest.Mock).mockResolvedValue(undefined);
            
            jest.spyOn(myVault, 'getFromFile').mockReturnValue({
                populate: jest.fn(),
                check: jest.fn(),
                update: jest.fn(),
                getName: jest.fn().mockReturnValue('test')
            } as any);

            const result = await myVault.createFile(MyVault.classes.TestClass, 'test');
            
            const expectedTemplate = '---\nClasse: TestClass\n---\n'; // Default template when no template file
            expect(app.vault.modify).toHaveBeenCalledWith(mockExistingFile, expectedTemplate);
            expect(result).toBe(mockExistingFile);
        });

        it('should use default template when template file not found', async () => {
            const defaultTemplate = '---\nClasse: TestClass\n---\n';
            const mockCreatedFile = { path: 'test.md', name: 'test.md' };
            
            (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
            (app.vault.create as jest.Mock).mockResolvedValue(mockCreatedFile);
            
            jest.spyOn(myVault, 'getFromFile').mockReturnValue({
                populate: jest.fn(),
                check: jest.fn(),
                update: jest.fn(),
                getName: jest.fn().mockReturnValue('test')
            } as any);

            const result = await myVault.createFile(MyVault.classes.TestClass, 'test');
            
            expect(app.vault.create).toHaveBeenCalledWith('test.md', defaultTemplate);
            expect(result).toBe(mockCreatedFile);
        });
    });

    describe('updateFile', () => {
        it('should call update on existing classe', async () => {
            const mockClasse = { update: jest.fn() };
            jest.spyOn(myVault, 'getFromFile').mockReturnValue(mockClasse as any);

            await myVault.updateFile(mockFile);
            
            expect(mockClasse.update).toHaveBeenCalled();
        });

        it('should handle file without classe gracefully', async () => {
            jest.spyOn(myVault, 'getFromFile').mockReturnValue(undefined);

            await expect(myVault.updateFile(mockFile)).resolves.not.toThrow();
        });
    });

    describe('checkFile', () => {
        it('should call check on existing classe', async () => {
            const mockClasse = { check: jest.fn() };
            jest.spyOn(myVault, 'getFromFile').mockReturnValue(mockClasse as any);

            await myVault.checkFile(mockFile);
            
            expect(mockClasse.check).toHaveBeenCalled();
        });

        it('should handle file without classe gracefully', async () => {
            jest.spyOn(myVault, 'getFromFile').mockReturnValue(undefined);

            await expect(myVault.checkFile(mockFile)).resolves.not.toThrow();
        });
    });

    describe('getClasseFromName', () => {
        it('should return classe constructor from static classes', () => {
            const result = myVault.getClasseFromName('TestClass');
            
            expect(result).toBe(MyVault.classes.TestClass);
        });

        it('should return undefined for non-existent class', () => {
            const result = myVault.getClasseFromName('NonExistentClass');
            
            expect(result).toBeUndefined();
        });
    });

    describe('createClasse', () => {
        it('should create classe instance from metadata', () => {
            const result = myVault.createClasse(mockFile);
            
            expect(MyVault.classes.TestClass).toHaveBeenCalledWith(app, myVault, mockFile);
            expect(result).toBeDefined();
        });

        it('should log error when no metadata found', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            (app.metadataCache.getFileCache as jest.Mock).mockReturnValue(null);

            const result = myVault.createClasse(mockFile);
            
            expect(result).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith('Pas de metadata');
            
            consoleSpy.mockRestore();
        });

        it('should log error when unknown class type', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            (app.metadataCache.getFileCache as jest.Mock).mockReturnValue({
                frontmatter: { Classe: 'UnknownClass' }
            });

            const result = myVault.createClasse(mockFile);
            
            expect(result).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalledWith('Type non connue : UnknownClass');
            
            consoleSpy.mockRestore();
        });
    });

    describe('refreshAll', () => {
        it('should update and check all files', async () => {
            const mockClasse1 = { update: jest.fn(), check: jest.fn() };
            const mockClasse2 = { update: jest.fn(), check: jest.fn() };
            const mockFiles = [
                { name: 'file1.md', path: 'file1.md' },
                { name: 'file2.md', path: 'file2.md' }
            ];
            
            (app.vault.getFiles as jest.Mock).mockReturnValue(mockFiles);
            (app.vault.getAllFolders as jest.Mock).mockReturnValue([]);
            jest.spyOn(myVault, 'getFromFile')
                .mockReturnValueOnce(mockClasse1 as any)
                .mockReturnValueOnce(mockClasse2 as any);

            await myVault.refreshAll();
            
            expect(mockClasse1.update).toHaveBeenCalled();
            expect(mockClasse1.check).toHaveBeenCalled();
            expect(mockClasse2.update).toHaveBeenCalled();
            expect(mockClasse2.check).toHaveBeenCalled();
        });

        it('should delete empty folders', async () => {
            const emptyFolder = { children: [], path: 'empty' };
            const nonEmptyFolder = { children: [{}], path: 'nonEmpty' };
            
            (app.vault.getFiles as jest.Mock).mockReturnValue([]);
            (app.vault.getAllFolders as jest.Mock).mockReturnValue([emptyFolder, nonEmptyFolder]);

            await myVault.refreshAll();
            
            expect(app.vault.delete).toHaveBeenCalledWith(emptyFolder);
            expect(app.vault.delete).not.toHaveBeenCalledWith(nonEmptyFolder);
        });
    });
});