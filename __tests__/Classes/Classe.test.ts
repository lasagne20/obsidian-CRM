import { Classe } from '../../Classes/Classe';

// Tests simplifiés pour la classe Classe
// Polyfill pour .contains() utilisé dans le code source
declare global {
  interface Array<T> {
    contains(item: T): boolean;
  }
  interface String {
    contains(item: string): boolean;
  }
}

Array.prototype.contains = function<T>(item: T): boolean {
  return this.includes(item);
};

String.prototype.contains = function(item: string): boolean {
  return this.includes(item);
};

// Classe de test concrete qui étend Classe
class TestClasse extends Classe {
  public static className = "TestClasse";
  public static classIcon = "test-icon";
  
  public static parentProperty = {
    read: jest.fn(),
    getParentValue: jest.fn(),
    getClasses: jest.fn(() => ['TestParent']),
    formatParentValue: jest.fn(),
    name: 'parent'
  } as any;
  
  public static subClassesProperty = {
    getSubClassFromName: jest.fn(),
    getSubClass: jest.fn()
  } as any;
  
  public static Properties = {
    testProp: {
      name: 'testProp',
      type: 'string',
      read: jest.fn(),
      getDisplay: jest.fn(() => document.createElement('div')),
      reloadDynamicContent: jest.fn()
    } as any
  };

  getConstructor(): typeof TestClasse {
    return TestClasse;
  }

  static getConstructor(): typeof TestClasse {
    return TestClasse;
  }

  async populate(...args: any[]) {
    // Implementation pour les tests
  }
}

describe('Classe', () => {
  let testClasse: TestClasse;
  let mockApp: any;
  let mockVault: any;
  let mockFile: any;

  beforeEach(() => {
    // Mocks simplifiés
    mockApp = {
      vault: {
        getFiles: jest.fn(() => []),
        getAbstractFileByPath: jest.fn(),
        createFolder: jest.fn(),
        delete: jest.fn(),
        rename: jest.fn()
      },
      metadataCache: {
        resolvedLinks: {},
        getFileCache: jest.fn()
      }
    };

    mockVault = {
      getFileData: jest.fn(() => null),
      getFromFile: jest.fn(),
      getMediaFromLink: jest.fn(),
      readLinkFile: jest.fn()
    };

    mockFile = {
      basename: 'test-file',
      name: 'test-file.md',
      path: 'folder/test-file.md',
      parent: {
        path: 'folder',
        children: []
      }
    };

    testClasse = new TestClasse(mockApp, mockVault, mockFile);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Méthodes de base', () => {
    test('should create instance correctly', () => {
      expect(testClasse).toBeInstanceOf(TestClasse);
      expect(testClasse).toBeInstanceOf(Classe);
    });

    test('should get constructor', () => {
      const constructor = testClasse.getConstructor();
      expect(constructor).toBe(TestClasse);
    });

    test('should get classe name', () => {
      const className = testClasse.getClasse();
      expect(className).toBe('TestClasse');
    });

    test('should get static classe name', () => {
      const className = TestClasse.getClasse();
      expect(className).toBe('TestClasse');
    });

    test('should get pretty name', () => {
      // Mock getName method
      jest.spyOn(testClasse, 'getName').mockReturnValue('test-file');
      const prettyName = testClasse.getPrettyName();
      expect(prettyName).toBe('test-file');
    });
  });

  describe('Property management', () => {
    test('should read property', () => {
      const mockProperty = TestClasse.Properties.testProp;
      mockProperty.read.mockReturnValue('test value');
      
      const result = testClasse.readProperty('testProp');
      expect(result).toBe('test value');
      expect(mockProperty.read).toHaveBeenCalledWith(testClasse);
    });

    test('should get properties', () => {
      const properties = testClasse.getProperties();
      expect(properties).toBe(TestClasse.Properties);
    });

    test('should get parent property', () => {
      const parentProperty = testClasse.getparentProperty();
      expect(parentProperty).toBe(TestClasse.parentProperty);
    });

    test('should get parent value', () => {
      TestClasse.parentProperty.read.mockReturnValue('parent-value');
      const parentValue = testClasse.getParentValue();
      expect(parentValue).toBe('parent-value');
    });

    test('should return empty string when no parent value', () => {
      TestClasse.parentProperty.read.mockReturnValue('');
      const parentValue = testClasse.getParentValue();
      expect(parentValue).toBe('');
    });
  });

  describe('Metadata handling', () => {
    test('should get metadata value from file data', () => {
      // Mock super.getMetadata() indirectly
      jest.spyOn(testClasse, 'getMetadata' as any).mockReturnValue(null);
      mockVault.getFileData.mockReturnValue({ testKey: 'dataValue' });

      const value = testClasse.getMetadataValue('testKey');
      expect(value).toBe('dataValue');
    });

    test('should handle missing metadata and file data', () => {
      jest.spyOn(testClasse, 'getMetadata' as any).mockReturnValue(null);
      mockVault.getFileData.mockReturnValue(null);

      const value = testClasse.getMetadataValue('nonExistentKey');
      expect(value).toBeUndefined();
    });
  });

  describe('SubClass management', () => {
    test('should get subclass from name', () => {
      const mockSubClass = { name: 'TestSubClass' };
      TestClasse.subClassesProperty.getSubClassFromName.mockReturnValue(mockSubClass);

      const subClass = testClasse.getSubClassFromName('TestSubClass');
      expect(subClass).toBe(mockSubClass);
      expect(TestClasse.subClassesProperty.getSubClassFromName).toHaveBeenCalledWith('TestSubClass');
    });

    test('should get selected subclass', () => {
      const mockSubClass = { name: 'SelectedSubClass' };
      TestClasse.subClassesProperty.getSubClass.mockReturnValue(mockSubClass);

      const selectedSubClass = testClasse.getSelectedSubClasse();
      expect(selectedSubClass).toBe(mockSubClass);
    });
  });

  describe('Property search', () => {
    test('should find property from value', () => {
      const mockProperty = TestClasse.Properties.testProp;
      mockProperty.read.mockReturnValue('search-value');

      const foundProperty = testClasse.findPropertyFromValue('search-value');
      expect(foundProperty).toBe(mockProperty);
    });

    test('should return null when property not found', () => {
      TestClasse.Properties.testProp.read.mockReturnValue('different-value');

      const foundProperty = testClasse.findPropertyFromValue('search-value');
      expect(foundProperty).toBeNull();
    });
  });

  describe('Static methods', () => {
    test('should get items', async () => {
      const items = await TestClasse.getItems();
      expect(items).toEqual([]);
    });

    test('should throw error for base getConstructor', () => {
      expect(() => Classe.getConstructor()).toThrow('Need to define the Classes');
    });

    test('should throw error for base populate', async () => {
      const baseClasse = new (class extends Classe {
        getConstructor() { return Classe; }
      })(mockApp, mockVault, mockFile);
      
      await expect(baseClasse.populate()).rejects.toThrow('Need to define the Classes');
    });
  });

  describe('Utility methods', () => {
    test('should call updateLocation in update method', async () => {
      jest.spyOn(testClasse, 'updateLocation').mockResolvedValue();

      await testClasse.update();
      
      expect(testClasse.updateLocation).toHaveBeenCalled();
    });

    test('should call getID in check method', async () => {
      jest.spyOn(testClasse, 'getID').mockReturnValue('test-id');

      await testClasse.check();
      
      expect(testClasse.getID).toHaveBeenCalled();
    });
  });

  describe('Complex methods testing', () => {
    test('should handle getProperty with basic property', () => {
      // Mock getSelectedSubClasse to return null to avoid getProperties() call on undefined
      jest.spyOn(testClasse, 'getSelectedSubClasse').mockReturnValue(undefined);
      
      const [classe, property] = testClasse.getProperty('testProp');
      expect(classe).toBe(testClasse);
      expect(property).toBe(TestClasse.Properties.testProp);
    });

    test('should return null for unknown property', () => {
      // Mock getSelectedSubClasse to return null to avoid getProperties() call on undefined
      jest.spyOn(testClasse, 'getSelectedSubClasse').mockReturnValue(undefined);
      
      const [classe, property] = testClasse.getProperty('unknownProp');
      expect(classe).toBe(testClasse);
      expect(property).toBeNull();
    });

    test('should handle getAllProperties including subclass properties', () => {
      const mockSubClass = {
        getProperties: jest.fn(() => ({ subProp: { name: 'subProp' } }))
      };
      TestClasse.subClassesProperty.getSubClass.mockReturnValue(mockSubClass);

      const allProperties = testClasse.getAllProperties();
      expect(allProperties).toEqual({
        ...TestClasse.Properties,
        subProp: { name: 'subProp' }
      });
    });

    test('should get incoming links', () => {
      const mockFile2 = { path: 'other/file.md' };
      const mockClasse2 = { name: 'other-classe' };
      
      mockApp.vault.getFiles.mockReturnValue([mockFile2]);
      mockApp.metadataCache.resolvedLinks = {
        'other/file.md': { 'folder/test-file.md': 1 }
      };
      mockVault.getFromFile.mockReturnValue(mockClasse2);

      const incomingLinks = testClasse.getIncomingLinks();
      expect(incomingLinks).toEqual([mockClasse2]);
    });

    test('should return empty array when no incoming links', () => {
      mockApp.vault.getFiles.mockReturnValue([]);
      mockApp.metadataCache.resolvedLinks = {};

      const incomingLinks = testClasse.getIncomingLinks();
      expect(incomingLinks).toEqual([]);
    });

    test('should get parent async', async () => {
      const mockParent = { name: 'parent' };
      TestClasse.parentProperty.read.mockReturnValue('parent-link');
      TestClasse.parentProperty.getParentValue.mockReturnValue('parent-file');
      jest.spyOn(testClasse, 'getFromLink').mockReturnValue(mockParent as any);

      const parent = await testClasse.getParent();
      expect(parent).toBe(mockParent);
    });
  });

  describe('File naming operations', () => {
    test('should start with string value', async () => {
      jest.spyOn(testClasse, 'move').mockResolvedValue();
      jest.spyOn(testClasse, 'getParentFolderPath').mockReturnValue('folder');

      await testClasse.startWith('StringPrefix');
      
      expect(testClasse.move).toHaveBeenCalledWith('folder', 'StringPrefix - test-file.md');
    });

    test('should handle empty value in startWith', async () => {
      // Test avec une chaîne vide directement
      jest.spyOn(testClasse, 'move').mockResolvedValue();

      await testClasse.startWith('');
      
      // Le code vérifie (!value) après l'assignation, donc move ne devrait pas être appelé
      expect(testClasse.move).not.toHaveBeenCalled();
    });

    test('should clean existing prefix in filename', async () => {
      mockFile.basename = 'Old Prefix - test-file';
      jest.spyOn(testClasse, 'move').mockResolvedValue();
      jest.spyOn(testClasse, 'getParentFolderPath').mockReturnValue('folder');

      await testClasse.startWith('New Prefix');
      
      expect(testClasse.move).toHaveBeenCalledWith('folder', 'New Prefix - test-file.md');
    });

    test('should handle Property objects in startWith', async () => {
      const mockProperty = {
        read: jest.fn(() => 'Property Value'),
        type: 'text'
      } as any;
      jest.spyOn(testClasse, 'move').mockResolvedValue();
      jest.spyOn(testClasse, 'getParentFolderPath').mockReturnValue('folder');

      // Test that the method doesn't throw
      await expect(testClasse.startWith(mockProperty)).resolves.not.toThrow();
    });

    test('should handle date range values', async () => {
      jest.spyOn(testClasse, 'move').mockResolvedValue();
      jest.spyOn(testClasse, 'getParentFolderPath').mockReturnValue('folder');

      await testClasse.startWith('2023-01-01 to 2023-01-31');
      
      expect(testClasse.move).toHaveBeenCalledWith('folder', '2023-01-01 to 2023-01-31 - test-file.md');
    });
  });

  describe('Folder and file operations', () => {
    test('should get child folder path', () => {
      const childClasse = new TestClasse(mockApp, mockVault, { ...mockFile, name: 'child.md' });
      jest.spyOn(testClasse, 'getFolderFilePath').mockReturnValue('parent/folder');
      
      const childPath = testClasse.getChildFolderPath(childClasse);
      expect(childPath).toBe('parent/folder');
    });

    test('should check child folder', async () => {
      const childClasse = new TestClasse(mockApp, mockVault, { ...mockFile, name: 'child.md' });
      jest.spyOn(testClasse, 'getChildFolderPath').mockReturnValue('parent/child');
      jest.spyOn(testClasse, 'addSubFolder').mockResolvedValue();
      
      await testClasse.checkChildFolder(childClasse);
      
      expect(testClasse.addSubFolder).toHaveBeenCalledWith('parent/child');
    });

    test('should add sub folder when parent folder exists', async () => {
      jest.spyOn(testClasse, 'getFolderFilePath').mockReturnValue('parent');
      jest.spyOn(testClasse, 'move').mockResolvedValue();
      
      const mockParentFolder = { type: 'folder' };
      mockApp.vault.getAbstractFileByPath
        .mockReturnValueOnce(mockParentFolder) // Parent exists
        .mockReturnValueOnce(null); // Child doesn't exist
      
      await testClasse.addSubFolder('parent/child');
      
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith('parent/child');
    });

    test('should create parent folder when it does not exist', async () => {
      jest.spyOn(testClasse, 'getFolderFilePath').mockReturnValue('parent');
      jest.spyOn(testClasse, 'move').mockResolvedValue();
      
      mockApp.vault.getAbstractFileByPath
        .mockReturnValueOnce(null) // Parent doesn't exist
        .mockReturnValueOnce(null); // Child doesn't exist
      
      await testClasse.addSubFolder('parent/child');
      
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith('parent');
      expect(testClasse.move).toHaveBeenCalledWith('parent');
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith('parent/child');
    });

    test('should handle folder creation errors', async () => {
      jest.spyOn(testClasse, 'getFolderFilePath').mockReturnValue('parent');
      jest.spyOn(console, 'error').mockImplementation();
      
      mockApp.vault.getAbstractFileByPath.mockReturnValue(null);
      mockApp.vault.createFolder.mockRejectedValue(new Error('Creation failed'));
      
      await testClasse.addSubFolder('parent/child');
      
      expect(console.error).toHaveBeenCalled();
    });

    test('should get children when is folder file', () => {
      jest.spyOn(testClasse, 'isFolderFile').mockReturnValue(true);
      
      const children = testClasse.getChildren();
      expect(Array.isArray(children)).toBe(true);
    });

    test('should get children from specific folder', () => {
      const mockFolder = null;
      
      const children = testClasse.getChildren(mockFolder as any);
      expect(Array.isArray(children)).toBe(true);
    });
  });

  describe('Location and parent updates', () => {
    test('should update location when parent exists and path is correct', async () => {
      const mockParent = {
        getClasse: jest.fn(() => 'TestParent'),
        getChildFolderPath: jest.fn(() => 'correct/path'),
        checkChildFolder: jest.fn()
      };
      
      jest.spyOn(testClasse, 'getParent').mockResolvedValue(mockParent as any);
      jest.spyOn(testClasse, 'getParentFolderPath').mockReturnValue('correct/path');
      jest.spyOn(console, 'log').mockImplementation();
      
      TestClasse.parentProperty.getClasses.mockReturnValue(['TestParent']);
      
      await testClasse.updateLocation();
      
      expect(console.log).toHaveBeenCalledWith('Update Location');
    });

    test('should handle missing parent in updateLocation', async () => {
      jest.spyOn(testClasse, 'getParent').mockResolvedValue(undefined);
      jest.spyOn(console, 'error').mockImplementation();
      
      await testClasse.updateLocation();
      
      expect(console.error).toHaveBeenCalledWith("Le parent n'existe pas");
    });

    test('should handle wrong parent class in updateLocation', async () => {
      const mockParent = {
        getClasse: jest.fn(() => 'WrongClass')
      };
      
      jest.spyOn(testClasse, 'getParent').mockResolvedValue(mockParent as any);
      jest.spyOn(console, 'error').mockImplementation();
      
      TestClasse.parentProperty.getClasses.mockReturnValue(['TestParent']);
      
      await testClasse.updateLocation();
      
      expect(console.error).toHaveBeenCalledWith('Mauvaise classe pour cette propiété: WrongClass au lieu de TestParent');
    });

    test('should move file when path is incorrect', async () => {
      const mockParent = {
        getClasse: jest.fn(() => 'TestParent'),
        getChildFolderPath: jest.fn(() => 'correct/path'),
        checkChildFolder: jest.fn()
      };
      
      jest.spyOn(testClasse, 'getParent').mockResolvedValue(mockParent as any);
      jest.spyOn(testClasse, 'getParentFolderPath').mockReturnValue('wrong/path');
      jest.spyOn(testClasse, 'move').mockResolvedValue();
      jest.spyOn(console, 'log').mockImplementation();
      
      TestClasse.parentProperty.getClasses.mockReturnValue(['TestParent']);
      
      await testClasse.updateLocation();
      
      expect(mockParent.checkChildFolder).toHaveBeenCalledWith(testClasse);
      expect(console.log).toHaveBeenCalledWith('Move to child folder : correct/path');
      expect(testClasse.move).toHaveBeenCalledWith('correct/path');
    });

    test('should update parent property from folder structure', async () => {
      jest.spyOn(testClasse, 'getFolderPath').mockReturnValue('parent/child');
      jest.spyOn(testClasse, 'isFolderFile').mockReturnValue(false);
      jest.spyOn(testClasse, 'updateMetadata').mockResolvedValue();
      jest.spyOn(testClasse, 'update').mockResolvedValue();
      jest.spyOn(console, 'log').mockImplementation();
      
      const mockParentFile = { type: 'file', path: 'parent/parent.md' };
      const mockParent = {
        getLink: jest.fn(() => '[[Parent]]')
      };
      
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockParentFile);
      mockVault.getFromFile.mockReturnValue(mockParent);
      
      await testClasse.updatePropertyParent();
      
      expect(testClasse.updateMetadata).toHaveBeenCalledWith('parent', '[[Parent]]');
      expect(testClasse.update).toHaveBeenCalled();
    });

    test('should handle special parent property types', async () => {
      jest.spyOn(testClasse, 'getFolderPath').mockReturnValue('parent/child');
      jest.spyOn(testClasse, 'isFolderFile').mockReturnValue(false);
      jest.spyOn(testClasse, 'updateMetadata').mockResolvedValue();
      jest.spyOn(testClasse, 'update').mockResolvedValue();
      
      const mockParentFile = { type: 'file', path: 'parent/parent.md' };
      const mockParent = {
        getLink: jest.fn(() => '[[Parent]]')
      };
      
      mockApp.vault.getAbstractFileByPath.mockReturnValue(mockParentFile);
      mockVault.getFromFile.mockReturnValue(mockParent);
      
      await testClasse.updatePropertyParent();
      
      expect(testClasse.updateMetadata).toHaveBeenCalled();
      expect(testClasse.update).toHaveBeenCalled();
    });

    test('should handle no parent found in updatePropertyParent', async () => {
      jest.spyOn(testClasse, 'getFolderPath').mockReturnValue('root/file');
      jest.spyOn(testClasse, 'isFolderFile').mockReturnValue(false);
      jest.spyOn(console, 'log').mockImplementation();
      
      mockApp.vault.getAbstractFileByPath.mockReturnValue(null);
      
      await testClasse.updatePropertyParent();
      
      expect(console.log).toHaveBeenCalledWith('No parent found for : root/file');
    });
  });

  describe('Display and media operations', () => {
    test('should generate top display content with config', async () => {
      const mockDisplayManager = {
        generateDisplayContent: jest.fn(() => Promise.resolve(document.createElement('div')))
      };
      
      // Mock du DisplayManager
      jest.doMock('../../Utils/Display/DisplayManager', () => ({
        DisplayManager: mockDisplayManager
      }));
      
      testClasse.displayConfig = {
        display: { type: 'custom' }
      } as any;
      
      const content = await testClasse.getTopDisplayContent();
      expect(content).toBeDefined();
      expect(content.tagName.toLowerCase()).toBe('div');
    });

    test('should generate default top display content', async () => {
      testClasse.displayConfig = undefined;
      
      const content = await testClasse.getTopDisplayContent();
      expect(content).toBeDefined();
      expect(content.tagName.toLowerCase()).toBe('div');
    });

    test('should reload top display content', async () => {
      const mockProperty = TestClasse.Properties.testProp;
      
      await testClasse.reloadTopDisplayContent();
      
      expect(mockProperty.reloadDynamicContent).toHaveBeenCalledWith(testClasse);
    });

    test('should handle media move operations', async () => {
      const mockProperty = {
        name: 'media',
        read: jest.fn(() => ['[[image.jpg]]'])
      };
      
      jest.spyOn(testClasse, 'getFolderFilePath').mockReturnValue('new/folder');
      jest.spyOn(testClasse, 'addSubFolder').mockResolvedValue();
      jest.spyOn(testClasse, 'updateMetadata').mockResolvedValue();
      
      await testClasse.moveMediaToFolder(mockProperty as any, 'images');
      
      expect(testClasse.addSubFolder).toHaveBeenCalled();
    });

    test('should handle no media links case', async () => {
      const mockProperty = {
        name: 'media',
        read: jest.fn(() => null)
      };
      
      jest.spyOn(testClasse, 'addSubFolder').mockResolvedValue();
      
      await testClasse.moveMediaToFolder(mockProperty as any, 'folder');
      
      expect(testClasse.addSubFolder).not.toHaveBeenCalled();
    });

    test('should handle empty media array', async () => {
      const mockProperty = {
        name: 'media',
        read: jest.fn(() => [])
      };
      
      jest.spyOn(testClasse, 'addSubFolder').mockResolvedValue();
      
      await testClasse.moveMediaToFolder(mockProperty as any, 'folder');
      
      expect(testClasse.addSubFolder).not.toHaveBeenCalled();
    });
  });

  describe('Additional coverage tests', () => {
    test('should handle getChildFolderPath', () => {
      const childClasse = new TestClasse(mockApp, mockVault, mockFile);
      jest.spyOn(testClasse, 'getFolderFilePath').mockReturnValue('/parent/path');
      
      const path = testClasse.getChildFolderPath(childClasse);
      expect(path).toBe('/parent/path');
    });

    test('should handle checkChildFolder', async () => {
      const childClasse = new TestClasse(mockApp, mockVault, mockFile);
      jest.spyOn(testClasse, 'getChildFolderPath').mockReturnValue('/child/path');
      jest.spyOn(testClasse, 'addSubFolder').mockResolvedValue();
      
      await testClasse.checkChildFolder(childClasse);
      
      expect(testClasse.addSubFolder).toHaveBeenCalledWith('/child/path');
    });

    test('should handle reloadTopDisplayContent', async () => {
      const mockProperty = {
        reloadDynamicContent: jest.fn().mockResolvedValue(undefined)
      };
      jest.spyOn(testClasse, 'getProperties').mockReturnValue({
        prop1: mockProperty as any
      });
      
      await testClasse.reloadTopDisplayContent();
      
      expect(mockProperty.reloadDynamicContent).toHaveBeenCalledWith(testClasse);
    });

    test('should handle findPropertyFromValue', () => {
      const mockProperty = {
        read: jest.fn(() => 'test value')
      };
      TestClasse.Properties = { testProp: mockProperty as any };
      
      const property = testClasse.findPropertyFromValue('test');
      expect(property).toBe(mockProperty);
    });

    test('should handle findPropertyFromValue with no match', () => {
      const mockProperty = {
        read: jest.fn(() => 'different value')
      };
      TestClasse.Properties = { testProp: mockProperty as any };
      
      const property = testClasse.findPropertyFromValue('nomatch');
      expect(property).toBeNull();
    });

    test('should get incoming links', () => {
      mockApp.vault.getFiles.mockReturnValue([
        { path: 'file1.md' },
        { path: 'file2.md' }
      ]);
      mockApp.metadataCache.resolvedLinks = {
        'file1.md': { 'test-file.md': 1 },
        'file2.md': {}
      };
      mockVault.getFromFile.mockReturnValue({ name: 'LinkedFile' });
      
      const links = testClasse.getIncomingLinks();
      expect(Array.isArray(links)).toBe(true);
    });

    test('should handle check method', async () => {
      jest.spyOn(testClasse, 'getID').mockReturnValue('test-id');
      
      await testClasse.check();
      
      expect(testClasse.getID).toHaveBeenCalled();
    });

    test('should handle getMetadataValue with data fallback', () => {
      jest.spyOn(testClasse, 'getMetadata').mockReturnValue(null);
      mockVault.getFileData.mockReturnValue({ prop2: 'data2' });
      
      const value = testClasse.getMetadataValue('prop2');
      
      expect(value).toBe('data2');
    });

    test('should handle static getClasse method', () => {
      expect(TestClasse.getClasse()).toBe('TestClass');
    });

    test('should handle getProperty with parent property', () => {
      const parentClasse = {
        getProperty: jest.fn(() => [null, { name: 'parentProp' }])
      };
      jest.spyOn(testClasse, 'getFromLink').mockReturnValue(parentClasse as any);
      jest.spyOn(testClasse, 'getparentProperty').mockReturnValue({
        getParentValue: jest.fn(() => 'parent.md'),
        read: jest.fn(() => 'parent-link')
      } as any);
      
      const [classe, prop] = testClasse.getProperty('parent.someProp');
      expect(parentClasse.getProperty).toHaveBeenCalledWith('someProp');
    });

    test('should handle addSubFolder with existing parent folder', async () => {
      jest.spyOn(testClasse, 'getFolderFilePath').mockReturnValue('/parent');
      jest.spyOn(testClasse, 'move').mockResolvedValue();
      
      mockApp.vault.getAbstractFileByPath
        .mockReturnValueOnce({ type: 'folder' }) // parent exists
        .mockReturnValueOnce(null); // child doesn't exist
      
      await testClasse.addSubFolder('/parent/child');
      
      expect(mockApp.vault.createFolder).toHaveBeenCalledWith('/parent/child');
    });

    test('should handle getSelectedSubClasse', () => {
      const mockSubClassProperty = {
        getSubClass: jest.fn(() => ({ name: 'SubClass' }))
      };
      TestClasse.subClassesProperty = mockSubClassProperty as any;
      
      const subClass = testClasse.getSelectedSubClasse();
      expect(mockSubClassProperty.getSubClass).toHaveBeenCalledWith(testClasse);
    });

    test('should handle getSelectedSubClasse when no property', () => {
      TestClasse.subClassesProperty = undefined as any;
      
      const subClass = testClasse.getSelectedSubClasse();
      expect(subClass).toBeUndefined();
    });

    test('should handle getPrettyName', () => {
      jest.spyOn(testClasse, 'getName').mockReturnValue('Pretty Name');
      
      const name = testClasse.getPrettyName();
      expect(name).toBe('Pretty Name');
      expect(testClasse.getName).toHaveBeenCalledWith(false);
    });

    test('should handle getParentValue with empty value', () => {
      jest.spyOn(testClasse, 'getparentProperty').mockReturnValue({
        read: jest.fn(() => '')
      } as any);
      
      const value = testClasse.getParentValue();
      expect(value).toBe('');
    });

    test('should handle getParentValue with valid value', () => {
      jest.spyOn(testClasse, 'getparentProperty').mockReturnValue({
        read: jest.fn(() => 'parent-value')
      } as any);
      
      const value = testClasse.getParentValue();
      expect(value).toBe('parent-value');
    });
  });
});