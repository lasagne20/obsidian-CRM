import { App, TFile } from "obsidian";
import { MyVault } from '../Utils/MyVault';
import { File } from "../Utils/File";

// Mock des classes externes et des méthodes nécessaires
jest.mock("obsidian", () => ({
  App: jest.fn().mockImplementation(() => ({
    vault: {
      getAbstractFileByPath: jest.fn(),
      modify: jest.fn(),
      rename: jest.fn(),
      read: jest.fn(),
    },
    metadataCache: {
      getFileCache: jest.fn(),
    }
  })),
  TFile: jest.fn(),
}));

describe("File Class", () => {
  let mockApp: App;
  let mockVault: MyVault;
  let mockFile: File;
  let mockTFile: TFile;

  beforeEach(() => {
    mockApp = new App();
    mockVault = {} as MyVault;
    mockTFile = new TFile();
    mockFile = new File(mockApp, mockVault, mockTFile);
  });

  test("should get the folder name correctly", () => {
    mockTFile.path = "/folder/parent/child.md";
    

  });
  

  test("should correctly identify if file is a folder file", () => {
    mockTFile.path = "/folder/parent/parent.md";
    mockTFile.name = "parent"

    expect(mockFile.isFolderFile()).toBe(true); // The parent name and file name are the same
  });

  test("should correctly get the folder path", () => {
    mockTFile.path = "/folder/parent/child.md";
    
    const folderPath = mockFile.getFolderPath();

    expect(folderPath).toBe("/folder/parent");
  });

  test("should correctly get the file name", () => {
    mockTFile.name = "child.md";
    
    const name = mockFile.getName();

    expect(name).toBe("child.md");
  });

  test("should correctly get the full file path", () => {
    mockTFile.path = "/folder/parent/child.md";
    

  });

  test("should generate correct link format", () => {
    mockTFile.name = "child.md";
    
    const link = mockFile.getLink();

    expect(link).toBe("[[child]]");
  });

  test("should move the file successfully", async () => {
    mockTFile.name = "child.md";
    const folderPath = "/folder/parent/newFolder";

    // Mock the vault method
    mockApp.vault.getAbstractFileByPath = jest.fn().mockReturnValue(null); // Simuler l'absence du fichier cible

    // Mock the rename method to avoid actual file renaming
    mockApp.vault.rename = jest.fn().mockResolvedValue(true);

    // Exécution
    await mockFile.move(folderPath);

    // Vérification
    expect(mockApp.vault.rename).toHaveBeenCalledWith(mockTFile, `${folderPath}/child.md`);
    expect(mockApp.vault.rename).toHaveBeenCalledTimes(1);
  });

  test("should not move the file if the target file exists", async () => {
    mockTFile.name = "child.md";
    const folderPath = "/folder/parent/newFolder";

    // Simuler l'existence du fichier cible
    mockApp.vault.getAbstractFileByPath = jest.fn().mockReturnValue(new TFile());

    // Exécution
    await mockFile.move(folderPath);

    // Vérification
    expect(mockApp.vault.rename).not.toHaveBeenCalled(); // Le déplacement ne doit pas être effectué
  });

  test("should update metadata correctly", async () => {
    mockTFile.path = "/folder/parent/child.md";
    mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
      frontmatter: { key: "oldValue" }
    });

    // Mock du saveFrontmatter
    mockFile.saveFrontmatter = jest.fn();

    // Exécution
    await mockFile.updateMetadata("key", "newValue");

    // Vérification
    expect(mockFile.saveFrontmatter).toHaveBeenCalledWith({
      key: "newValue"
    });
  });

  test("should reorder metadata correctly", async () => {
    mockTFile.path = "/folder/parent/child.md";
    mockApp.metadataCache.getFileCache = jest.fn().mockReturnValue({
      frontmatter: { key1: "value1", key2: "value2", key3: "value3", key4: null}
    });

    // Mock du saveFrontmatter
    mockFile.saveFrontmatter = jest.fn();

    // Exécution
    await mockFile.reorderMetadata(["key2", "key1"]);

    // Vérification
    expect(mockFile.saveFrontmatter).toHaveBeenCalledWith({
      key2: "value2",
      key1: "value1"
    }, ["key3: \"value3\""]);
  });

  test("should handle frontmatter saving correctly", async () => {
    const content = "---\nkey: value\n---\nContent body";
    mockApp.vault.read = jest.fn().mockResolvedValue(content);
    mockApp.vault.modify = jest.fn();

    // Exécution
    await mockFile.saveFrontmatter({ key: "newValue" });

    // Vérification de l'appel à modify avec le bon contenu
    expect(mockApp.vault.modify).toHaveBeenCalledWith(mockTFile, expect.stringContaining("newValue"));
  });

  // Tests supplémentaires peuvent être ajoutés ici pour les autres méthodes comme `getFromLink`, `extractFrontmatter`, etc.
});
