import { Classe } from "../Classes/Classe";
import { TFile, App } from "obsidian";
import { MyVault } from "../Utils/MyVault";
import { FileProperty } from "../Utils/Properties/FileProperty";
import { File } from "../Utils/File";


describe("Classe Tests", () => {
    let mockApp: App;
    let mockVault: MyVault;
    let mockFile: TFile;
    let instance: Classe;

    beforeEach(() => {
        mockApp = {
            vault: {
                getAbstractFileByPath: jest.fn()
            },
            metadataCache: {
                getFileCache: jest.fn(),
            }
        } as unknown as App;

        mockVault = {
            getFromFile: jest.fn()
        } as unknown as MyVault;

        mockFile = {
            path: "folder/mockFile.md",
            name: "mockFile.md"
        } as unknown as TFile;

        instance = new Classe(mockApp, mockVault, mockFile);
    });

     // Fonction utilitaire pour configurer les mocks
  const setupMocks = ({
    folderPath = "",
    fileName = "",
    parentPath = "",
    parentFileFound = true,
    parentName = "parentProp"
  }) => {
    const mockParentFile = parentFileFound ? new TFile() : null;
    if (mockParentFile) {
      mockParentFile.path = parentPath;
    }

    // Mocker les retours des méthodes nécessaires
    mockApp.vault.getAbstractFileByPath = jest.fn().mockReturnValue(mockParentFile);
    mockVault.getFromFile = jest.fn().mockReturnValue({
      getLink: jest.fn().mockReturnValue("parentLink")
    });

    instance.getparentProperties = jest.fn().mockReturnValue({
      name: parentName
    } as FileProperty);
  };
  test("should update metadata when parent file is found", async () => {
    // Arrange
    setupMocks({
      folderPath: "/folder/parent",
      fileName: "child.md",
      parentPath: "/folder/parent/parent.md"
    });
    instance.updateMetadata = jest.fn();

    // Exécution de la méthode
    await instance.updatePropertyParent();

    // Vérifications
    expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith("folder/folder.md");
    expect(instance.updateMetadata).toHaveBeenCalledWith("parentProp", "parentLink");
  });

  test("should update metadata when in the folder of the file", async () => {
    // Arrange
    setupMocks({
      folderPath: "/folder/parent",
      fileName: "parent.md",
      parentPath: "/folder/parent/parent.md"
    });

    instance.updateMetadata = jest.fn();
    // Exécution de la méthode
    await instance.updatePropertyParent();

    // Vérifications
    expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith("folder/folder.md");
    expect(instance.updateMetadata).toHaveBeenCalledWith("parentProp", "parentLink");
  });

  test("should not update metadata if parent file is not found", async () => {
    // Arrange
    setupMocks({
      folderPath: "/folder/parent",
      fileName: "child.md",
      parentPath: "/folder/parent/parent.md",
      parentFileFound: false
    });

    instance.updateMetadata = jest.fn();
    // Exécution de la méthode
    await instance.updatePropertyParent();

    // Vérifications
    expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith("folder/folder.md");
    expect(instance.updateMetadata).not.toHaveBeenCalled(); // Le fichier ne devrait pas être mis à jour
  });

  test("should handle parent folder with multiple subfolders correctly", async () => {
    // Arrange
    setupMocks({
      folderPath: "/folder/parent/subfolder",
      fileName: "child.md",
      parentPath: "/folder/parent/subfolder/parent.md"
    });
    instance.updateMetadata = jest.fn();
    // Exécution de la méthode
    await instance.updatePropertyParent();

    // Vérifications
    expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith("folder/folder.md");
    expect(instance.updateMetadata).toHaveBeenCalledWith("parentProp", "parentLink");
  });

  test("should update metadata when folder is correctly adjusted", async () => {
    // Arrange
    setupMocks({
      folderPath: "/folder/parent",
      fileName: "child.md",
      parentPath: "/folder/parent/parent.md"
    });
    instance.updateMetadata = jest.fn();
    // Exécution de la méthode
    await instance.updatePropertyParent();

    // Vérifications
    expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith("folder/folder.md");
    expect(instance.updateMetadata).toHaveBeenCalledWith("parentProp", "parentLink");
  });

    test("Classe should be initialized correctly", () => {
        expect(instance.app).toBe(mockApp);
        expect(instance.vault).toBe(mockVault);
        expect(instance.file).toBe(mockFile);
    });

    test("getClasse() should throw an error", () => {
        expect(() => instance.getClasse()).toThrow("Need to define the subClasses");
    });

    test("static getClasse() should return className", () => {
        Classe.className = "TestClass";
        expect(Classe.getClasse()).toBe("TestClass");
    });


    test("getProperties() should return Classe.Properties", () => {
        expect(Classe.getProperties()).toEqual({});
    });

    test("addChild() should create folders and move child correctly", async () => {
        const childInstance = new Classe(mockApp, mockVault, mockFile);

        mockApp.vault.getAbstractFileByPath = jest.fn().mockReturnValue(null);
        mockApp.vault.createFolder = jest.fn();
        instance.move = jest.fn();


        expect(mockApp.vault.createFolder).toHaveBeenCalled();
        expect(instance.move).toHaveBeenCalled();
    });

    test("update() should call updateLocation()", async () => {
        instance.getparentProperties = jest.fn().mockReturnValue(new FileProperty("test", Classe));
        instance.updateLocation = jest.fn();

        await instance.update();

        expect(instance.updateLocation).toHaveBeenCalled();
    });

    test("updateLocation() should correctly check and move file", async () => {
        const mockProperty = {
            getLink: jest.fn().mockReturnValue({
                getClasse: jest.fn().mockReturnValue("TestClass"),
                getChildFolderPath: jest.fn().mockReturnValue("childPath"),
                addChild: jest.fn()
            }),
            getClasse: jest.fn().mockReturnValue("TestClass")
        } as unknown as FileProperty;

        instance.getFolderPath = jest.fn().mockReturnValue("currentPath");


        expect(mockProperty.getLink).toHaveBeenCalled();
    });

    test("check() should be callable", async () => {
        await expect(instance.check()).resolves.toBeUndefined();
    });
});
