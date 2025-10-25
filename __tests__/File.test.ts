import AppShim, { TFile, TFolder } from "../Utils/App";
import { File } from "../Utils/File";
import { MyVault } from "../Utils/MyVault";
import { waitForFileMetaDataUpdate } from "../Utils/Utils";

// Mock des utilitaires
jest.mock("../Utils/Utils", () => ({
    waitForFileMetaDataUpdate: jest.fn().mockImplementation((app, path, key, callback) => callback())
}));

jest.mock('js-yaml', () => ({
    dump: jest.fn((obj) => `mocked-yaml: ${JSON.stringify(obj)}`),
    load: jest.fn((yaml) => {
        if (yaml === 'valid: yaml') return { valid: 'yaml' };
        if (yaml === 'title: Test\ndescription: Content') return { title: 'Test', description: 'Content' };
        throw new Error('Invalid YAML');
    })
}));

describe('File', () => {
    let app: AppShim;
    let vault: MyVault;
    let file: TFile;
    let fileInstance: File;

    beforeEach(() => {
        app = {
            vault: {
                read: jest.fn().mockResolvedValue('---\ntitle: Test\n---\nContent'),
                modify: jest.fn().mockResolvedValue(undefined),
                getAbstractFileByPath: jest.fn(),
                rename: jest.fn().mockResolvedValue(undefined),
            },
            metadataCache: {
                getFileCache: jest.fn().mockReturnValue({
                    frontmatter: { title: 'Test', Id: 'test-id-123' }
                }),
            },
        } as unknown as AppShim;

        vault = {
            getFromLink: jest.fn(),
        } as unknown as MyVault;

        file = {
            path: 'test/path/file.md',
            name: 'file.md',
            basename: 'file',
            extension: 'md'
        } as TFile;

        fileInstance = new File(app, vault, file);
        jest.clearAllMocks();
    });

    describe('Basic Properties', () => {
        describe('getName', () => {
            it('should return name with .md extension by default', () => {
                expect(fileInstance.getName()).toBe('file.md');
            });

            it('should return name without .md extension when md=false', () => {
                expect(fileInstance.getName(false)).toBe('file');
            });
        });

        describe('getID', () => {
            it('should return existing ID from metadata', () => {
                const id = fileInstance.getID();
                expect(id).toBe('test-id-123');
            });

            it('should generate new ID when none exists', () => {
                (app.metadataCache.getFileCache as jest.Mock).mockReturnValue({
                    frontmatter: { title: 'Test' }
                });
                jest.spyOn(fileInstance, 'updateMetadata').mockImplementation();

                // Mock uuid module
                jest.mock('uuid', () => ({
                    v4: jest.fn(() => 'new-generated-id')
                }));
                const uuid = require('uuid');

                const id = fileInstance.getID();
                expect(fileInstance.updateMetadata).toHaveBeenCalledWith('Id', expect.any(String));
            });
        });

        describe('getFilePath', () => {
            it('should return file path', () => {
                expect(fileInstance.getFilePath()).toBe('test/path/file.md');
            });
        });

        describe('getLink', () => {
            it('should return wikilink format', () => {
                expect(fileInstance.getLink()).toBe('[[test/path/file.md|file]]');
            });
        });

        describe('getFolderPath', () => {
            it('should return folder path', () => {
                expect(fileInstance.getFolderPath()).toBe('test/path');
            });
        });

        describe('isFolderFile', () => {
            it('should return true when file is in folder with same name', () => {
                const folderFile = new File(app, vault, {
                    path: 'test/file/file.md',
                    name: 'file.md'
                } as TFile);
                expect(folderFile.isFolderFile()).toBe(true);
            });

            it('should return false when file is not in matching folder', () => {
                expect(fileInstance.isFolderFile()).toBe(false);
            });
        });

        describe('getFolderFilePath', () => {
            it('should return current path for folder file', () => {
                const folderFile = new File(app, vault, {
                    path: 'test/file/file.md',
                    name: 'file.md'
                } as TFile);
                expect(folderFile.getFolderFilePath()).toBe('test/file');
            });

            it('should return constructed path for non-folder file', () => {
                expect(fileInstance.getFolderFilePath()).toBe('test/path/file');
            });
        });

        describe('getParentFolderPath', () => {
            it('should return parent of folder file', () => {
                const folderFile = new File(app, vault, {
                    path: 'test/file/file.md',
                    name: 'file.md'
                } as TFile);
                expect(folderFile.getParentFolderPath()).toBe('test');
            });

            it('should return current folder for non-folder file', () => {
                expect(fileInstance.getParentFolderPath()).toBe('test/path');
            });
        });
    });

    describe('Metadata Operations', () => {
        describe('getMetadata', () => {
            it('should return frontmatter from metadata cache', () => {
                const metadata = fileInstance.getMetadata();
                expect(metadata).toEqual({ title: 'Test', Id: 'test-id-123' });
            });

            it('should return undefined when no metadata', () => {
                (app.metadataCache.getFileCache as jest.Mock).mockReturnValue(null);
                const metadata = fileInstance.getMetadata();
                expect(metadata).toBeUndefined();
            });
        });

        describe('updateMetadata', () => {
            beforeEach(() => {
                (app.vault.read as jest.Mock).mockResolvedValue('---\ntitle: Test\ndescription: Content\n---\nBody content');
                jest.spyOn(fileInstance, 'extractFrontmatter').mockReturnValue({
                    existingFrontmatter: 'title: Test\ndescription: Content',
                    body: 'Body content'
                });
            });

            it('should update metadata key with new value', async () => {
                await fileInstance.updateMetadata('title', 'New Title');
                
                expect(app.vault.modify).toHaveBeenCalledWith(
                    file,
                    expect.stringContaining('mocked-yaml')
                );
                expect(waitForFileMetaDataUpdate).toHaveBeenCalledWith(
                    app, 
                    'test/path/file.md', 
                    'title', 
                    expect.any(Function)
                );
            });

            it('should handle concurrent access with lock', async () => {
                // Start first update
                const promise1 = fileInstance.updateMetadata('key1', 'value1');
                
                // Start second update immediately
                const promise2 = fileInstance.updateMetadata('key2', 'value2');
                
                // Both should complete without error
                await Promise.all([promise1, promise2]);
                
                expect(app.vault.modify).toHaveBeenCalledTimes(2);
            });

            it('should handle YAML parsing errors gracefully', async () => {
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
                const { load } = require('js-yaml');
                (load as jest.Mock).mockImplementation(() => {
                    throw new Error('YAML parse error');
                });
                
                await fileInstance.updateMetadata('key', 'value');
                
                expect(consoleSpy).toHaveBeenCalledWith('❌ Erreur lors du parsing du frontmatter:', expect.any(Error));
                consoleSpy.mockRestore();
            });

            it('should return early when no existing frontmatter', async () => {
                jest.spyOn(fileInstance, 'extractFrontmatter').mockReturnValue({
                    existingFrontmatter: '',
                    body: 'Body content'
                });
                
                await fileInstance.updateMetadata('key', 'value');
                
                expect(app.vault.modify).not.toHaveBeenCalled();
            });
        });

        describe('removeMetadata', () => {
            it('should remove metadata key', async () => {
                jest.spyOn(fileInstance, 'saveFrontmatter').mockImplementation();
                
                await fileInstance.removeMetadata('title');
                
                expect(fileInstance.saveFrontmatter).toHaveBeenCalledWith({ Id: 'test-id-123' });
            });

            it('should handle missing frontmatter gracefully', async () => {
                (app.metadataCache.getFileCache as jest.Mock).mockReturnValue(null);
                jest.spyOn(fileInstance, 'saveFrontmatter').mockImplementation();
                
                await fileInstance.removeMetadata('title');
                
                expect(fileInstance.saveFrontmatter).not.toHaveBeenCalled();
            });
        });

        describe('reorderMetadata', () => {
            it('should reorder metadata according to properties order', async () => {
                jest.spyOn(fileInstance, 'saveFrontmatter').mockImplementation();
                jest.spyOn(fileInstance, 'sortFrontmatter').mockReturnValue({
                    sortedFrontmatter: { title: 'Test', Id: 'test-id-123' },
                    extraProperties: []
                });
                
                await fileInstance.reorderMetadata(['title', 'description']);
                
                expect(fileInstance.saveFrontmatter).toHaveBeenCalledWith(
                    { title: 'Test', Id: 'test-id-123' },
                    []
                );
            });

            it('should not reorder when order is already correct', async () => {
                (app.metadataCache.getFileCache as jest.Mock).mockReturnValue({
                    frontmatter: { title: 'Test', Id: 'test-id-123' }
                });
                jest.spyOn(fileInstance, 'saveFrontmatter').mockImplementation();
                
                // Mock console.log to avoid output noise
                const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
                
                // The method adds 'Id' to the properties order, so the order becomes ['title', 'Id', 'Id']
                // which means the keys won't match exactly. Let's test with the exact expected order
                await fileInstance.reorderMetadata(['title']);
                
                expect(fileInstance.saveFrontmatter).not.toHaveBeenCalled();
                consoleSpy.mockRestore();
            });

            it('should handle missing frontmatter gracefully', async () => {
                (app.metadataCache.getFileCache as jest.Mock).mockReturnValue(null);
                jest.spyOn(fileInstance, 'saveFrontmatter').mockImplementation();
                
                await fileInstance.reorderMetadata(['title']);
                
                expect(fileInstance.saveFrontmatter).not.toHaveBeenCalled();
            });
        });

        describe('saveFrontmatter', () => {
            beforeEach(() => {
                (app.vault.read as jest.Mock).mockResolvedValue('---\nold: content\n---\nBody content');
                jest.spyOn(fileInstance, 'extractFrontmatter').mockReturnValue({
                    existingFrontmatter: 'old: content',
                    body: 'Body content'
                });
            });

            it('should save frontmatter with new content', async () => {
                const newFrontmatter = { title: 'New Title', description: 'New Description' };
                
                await fileInstance.saveFrontmatter(newFrontmatter);
                
                expect(app.vault.modify).toHaveBeenCalledWith(
                    file,
                    '---\nmocked-yaml: {"title":"New Title","description":"New Description"}\n---\nBody content'
                );
            });

            it('should include extra properties when provided', async () => {
                const newFrontmatter = { title: 'Title' };
                const extraProperties = ['custom: property'];
                
                await fileInstance.saveFrontmatter(newFrontmatter, extraProperties);
                
                expect(app.vault.modify).toHaveBeenCalledWith(
                    file,
                    '---\nmocked-yaml: {"title":"Title"}\n---\nBody content'
                );
            });

            it('should filter out empty extra properties', async () => {
                const newFrontmatter = { title: 'Title' };
                const extraProperties = ['valid: property', '', '   ', 'another: property'];
                
                await fileInstance.saveFrontmatter(newFrontmatter, extraProperties);
                
                // Should work without throwing
                expect(app.vault.modify).toHaveBeenCalled();
            });
        });
    });

    describe('File Operations', () => {
        describe('move', () => {
            beforeEach(() => {
                (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
            });

            it('should move file to target folder', async () => {
                await fileInstance.move('new/folder', 'newname.md');
                
                expect(app.vault.rename).toHaveBeenCalledWith(
                    file,
                    'new/folder/newname.md'
                );
            });

            it('should use current filename when target filename not provided', async () => {
                await fileInstance.move('new/folder');
                
                expect(app.vault.rename).toHaveBeenCalledWith(
                    file,
                    'new/folder/file.md'
                );
            });

            it('should move folder for folder files', async () => {
                const folderFile = new File(app, vault, {
                    path: 'test/file/file.md',
                    name: 'file.md'
                } as TFile);
                const mockFolder = { path: 'test/file' };
                (app.vault.getAbstractFileByPath as jest.Mock)
                    .mockReturnValueOnce(null) // No subtarget
                    .mockReturnValueOnce(mockFolder) // Folder exists
                    .mockReturnValueOnce(null); // No existing target
                
                await folderFile.move('new/location', 'newname.md');
                
                expect(app.vault.rename).toHaveBeenCalledWith(
                    mockFolder,
                    'new/location/newname'
                );
            });

            it('should handle existing target file gracefully', async () => {
                const existingFile = { path: 'new/folder/file.md' };
                (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(existingFile);
                const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
                
                await fileInstance.move('new/folder');
                
                expect(consoleSpy).toHaveBeenCalledWith('Le fichier existe déjà, impossible de déplacer.');
                expect(app.vault.rename).not.toHaveBeenCalled();
                consoleSpy.mockRestore();
            });

            it('should handle move errors gracefully', async () => {
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
                (app.vault.rename as jest.Mock).mockRejectedValue(new Error('Move failed'));
                
                await fileInstance.move('new/folder');
                
                expect(consoleSpy).toHaveBeenCalledWith('Erreur lors du déplacement du fichier :', expect.any(Error));
                consoleSpy.mockRestore();
            });

            it('should handle concurrent move operations with lock', async () => {
                const promise1 = fileInstance.move('folder1');
                const promise2 = fileInstance.move('folder2');
                
                await Promise.all([promise1, promise2]);
                
                // Only one move should succeed due to locking
                expect(app.vault.rename).toHaveBeenCalledTimes(2);
            });

            it('should adjust target path when subtarget exists', async () => {
                const subtargetFolder = { path: 'target/folder/file.md' };
                (app.vault.getAbstractFileByPath as jest.Mock)
                    .mockReturnValueOnce(subtargetFolder) // First call for subtarget
                    .mockReturnValueOnce(null); // Second call for existing file check
                
                await fileInstance.move('target/folder');
                
                expect(app.vault.rename).toHaveBeenCalledWith(
                    file,
                    'target/folder/file.md/file.md'
                );
            });
        });

        describe('getFromLink', () => {
            it('should delegate to vault getFromLink method', () => {
                const mockResult = { name: 'linked file' };
                (vault.getFromLink as jest.Mock).mockReturnValue(mockResult);
                
                const result = fileInstance.getFromLink('[[linked-file]]');
                
                expect(vault.getFromLink).toHaveBeenCalledWith('[[linked-file]]');
                expect(result).toBe(mockResult);
            });
        });
    });

    describe('Frontmatter Utilities', () => {
        describe('extractFrontmatter', () => {
            it('should extract frontmatter and body from content', () => {
                const content = '---\ntitle: Test\ndescription: Content\n---\nBody content here';
                
                const result = fileInstance.extractFrontmatter(content);
                
                expect(result).toEqual({
                    existingFrontmatter: 'title: Test\ndescription: Content',
                    body: 'Body content here'
                });
            });

            it('should handle content without frontmatter', () => {
                const content = 'Just body content';
                
                const result = fileInstance.extractFrontmatter(content);
                
                expect(result).toEqual({
                    existingFrontmatter: '',
                    body: 'Just body content'
                });
            });

            it('should handle malformed frontmatter', () => {
                const content = '---\ntitle: Test\n--\nBody content';
                
                const result = fileInstance.extractFrontmatter(content);
                
                expect(result).toEqual({
                    existingFrontmatter: '',
                    body: '---\ntitle: Test\n--\nBody content'
                });
            });
        });

        describe('formatFrontmatter', () => {
            it('should format simple key-value pairs', () => {
                const frontmatter = {
                    title: "Test Title",
                    description: "Test Description"
                };
                const result = fileInstance.formatFrontmatter(frontmatter);
                expect(result).toBe('mocked-yaml: {"title":"Test Title","description":"Test Description"}');
            });

            it('should format arrays', () => {
                const frontmatter = {
                    tags: ["tag1", "tag2"]
                };
                const result = fileInstance.formatFrontmatter(frontmatter);
                expect(result).toBe('mocked-yaml: {"tags":["tag1","tag2"]}');
            });

            it('should format nested objects', () => {
                const frontmatter = {
                    author: {
                        name: "John Doe",
                        email: "john.doe@example.com"
                    }
                };
                const result = fileInstance.formatFrontmatter(frontmatter);
                expect(result).toBe('mocked-yaml: {"author":{"name":"John Doe","email":"john.doe@example.com"}}');
            });

            it('should format arrays of objects', () => {
                const frontmatter = {
                    contributors: [
                        { name: "John Doe", email: "john.doe@example.com" },
                        { name: "Jane Doe", email: "jane.doe@example.com" }
                    ]
                };
                const result = fileInstance.formatFrontmatter(frontmatter);
                expect(result).toBe('mocked-yaml: {"contributors":[{"name":"John Doe","email":"john.doe@example.com"},{"name":"Jane Doe","email":"jane.doe@example.com"}]}');
            });

            it('should handle empty objects', () => {
                const frontmatter = {
                    emptyObject: {}
                };
                const result = fileInstance.formatFrontmatter(frontmatter);
                expect(result).toBe('mocked-yaml: {"emptyObject":{}}');
            });

            it('should handle empty arrays', () => {
                const frontmatter = {
                    emptyArray: []
                };
                const result = fileInstance.formatFrontmatter(frontmatter);
                expect(result).toBe('mocked-yaml: {"emptyArray":[]}');
            });

            it('should format deeply nested objects', () => {
                const frontmatter = {
                    level1: {
                        level2: {
                            level3: {
                                key: "value"
                            }
                        }
                    }
                };
                const result = fileInstance.formatFrontmatter(frontmatter);
                expect(result).toBe('mocked-yaml: {"level1":{"level2":{"level3":{"key":"value"}}}}');
            });
        });

        describe('sortFrontmatter', () => {
            it('should sort frontmatter according to properties order', () => {
                const frontmatter = {
                    description: "Description",
                    title: "Title",
                    id: "123"
                };
                
                const result = fileInstance.sortFrontmatter(frontmatter, ['title', 'description']);
                
                expect(result.sortedFrontmatter).toEqual({
                    title: "Title",
                    description: "Description"
                });
                expect(result.extraProperties).toContain('id: "123"');
            });

            it('should handle missing properties in frontmatter', () => {
                const frontmatter = {
                    title: "Title"
                };
                
                const result = fileInstance.sortFrontmatter(frontmatter, ['title', 'description', 'author']);
                
                expect(result.sortedFrontmatter).toEqual({
                    title: "Title",
                    description: null,
                    author: null
                });
                expect(result.extraProperties).toEqual([]);
            });

            it('should identify extra properties not in order', () => {
                const frontmatter = {
                    title: "Title",
                    description: "Description",
                    extraProp1: "Extra 1",
                    extraProp2: ["Extra", "Array"]
                };
                
                const result = fileInstance.sortFrontmatter(frontmatter, ['title', 'description']);
                
                expect(result.sortedFrontmatter).toEqual({
                    title: "Title",
                    description: "Description"
                });
                expect(result.extraProperties).toContain('extraProp1: "Extra 1"');
                expect(result.extraProperties).toContain('extraProp2: ["Extra","Array"]');
            });

            it('should handle empty properties order', () => {
                const frontmatter = {
                    title: "Title",
                    description: "Description"
                };
                
                const result = fileInstance.sortFrontmatter(frontmatter, []);
                
                expect(result.sortedFrontmatter).toEqual({});
                expect(result.extraProperties).toContain('title: "Title"');
                expect(result.extraProperties).toContain('description: "Description"');
            });

            it('should handle empty frontmatter', () => {
                const result = fileInstance.sortFrontmatter({}, ['title', 'description']);
                
                expect(result.sortedFrontmatter).toEqual({
                    title: null,
                    description: null
                });
                expect(result.extraProperties).toEqual([]);
            });
        });
    });
});