import { App, TFile, TFolder } from 'obsidian';
import { ObsidianApp } from '../../src/App';
import { IFile, IFolder } from 'markdown-crm';

describe('ObsidianApp.listFiles()', () => {
    let mockApp: jest.Mocked<App>;
    let obsidianApp: ObsidianApp;

    beforeEach(() => {
        // Create mock Obsidian app
        mockApp = {
            vault: {
                getFiles: jest.fn(),
                getAbstractFileByPath: jest.fn(),
            },
        } as any;

        obsidianApp = new ObsidianApp(mockApp);
    });

    it('should return all files from vault using getFiles()', async () => {
        // Create mock files
        const mockFile1 = {
            path: 'folder1/file1.md',
            basename: 'file1',
            extension: 'md',
            name: 'file1.md',
            parent: null,
        } as TFile;

        const mockFile2 = {
            path: 'folder2/file2.md',
            basename: 'file2',
            extension: 'md',
            name: 'file2.md',
            parent: null,
        } as TFile;

        const mockFile3 = {
            path: 'newfile.md',
            basename: 'newfile',
            extension: 'md',
            name: 'newfile.md',
            parent: null,
        } as TFile;

        // Mock getFiles to return all files (including newly created ones)
        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([
            mockFile1,
            mockFile2,
            mockFile3,
        ]);

        // Call listFiles
        const result = await obsidianApp.listFiles();

        // Verify getFiles was called (not getAllLoadedFiles)
        expect(mockApp.vault.getFiles).toHaveBeenCalled();

        // Verify all files are returned
        expect(result).toHaveLength(3);
        expect(result[0].path).toBe('folder1/file1.md');
        expect(result[1].path).toBe('folder2/file2.md');
        expect(result[2].path).toBe('newfile.md');
    });

    it('should return only files in specified folder', async () => {
        const mockFile1 = {
            path: 'target-folder/file1.md',
            basename: 'file1',
            extension: 'md',
            name: 'file1.md',
            parent: null,
        } as TFile;

        const mockFile2 = {
            path: 'target-folder/subfolder/file2.md',
            basename: 'file2',
            extension: 'md',
            name: 'file2.md',
            parent: null,
        } as TFile;

        const mockFile3 = {
            path: 'other-folder/file3.md',
            basename: 'file3',
            extension: 'md',
            name: 'file3.md',
            parent: null,
        } as TFile;

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([
            mockFile1,
            mockFile2,
            mockFile3,
        ]);

        // Create IFolder for filtering
        const targetFolder: IFolder = {
            path: 'target-folder',
            name: 'target-folder',
            children: [],
        };

        // Call listFiles with folder filter
        const result = await obsidianApp.listFiles(targetFolder);

        // Should only return files in target-folder (including subfolders)
        expect(result).toHaveLength(2);
        expect(result[0].path).toBe('target-folder/file1.md');
        expect(result[1].path).toBe('target-folder/subfolder/file2.md');
    });

    it('should include newly created files immediately', async () => {
        // Initial state: 2 files
        const existingFile = {
            path: 'existing.md',
            basename: 'existing',
            extension: 'md',
            name: 'existing.md',
            parent: null,
        } as TFile;

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([existingFile]);

        // First call
        const resultBefore = await obsidianApp.listFiles();
        expect(resultBefore).toHaveLength(1);

        // Simulate file creation - getFiles now returns new file
        const newFile = {
            path: 'newfile.md',
            basename: 'newfile',
            extension: 'md',
            name: 'newfile.md',
            parent: null,
        } as TFile;

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([
            existingFile,
            newFile,
        ]);

        // Second call - should immediately include new file
        const resultAfter = await obsidianApp.listFiles();
        expect(resultAfter).toHaveLength(2);
        expect(resultAfter[1].path).toBe('newfile.md');
    });

    it('should return empty array when vault has no files', async () => {
        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([]);

        const result = await obsidianApp.listFiles();

        expect(result).toEqual([]);
    });

    it('should convert TFile to IFile with correct properties', async () => {
        const mockParent = {
            path: 'parent-folder',
            name: 'parent-folder',
            parent: null,
        } as TFolder;

        const mockFile = {
            path: 'parent-folder/test.md',
            basename: 'test',
            extension: 'md',
            name: 'test.md',
            parent: mockParent,
        } as TFile;

        (mockApp.vault.getFiles as jest.Mock).mockReturnValue([mockFile]);

        const result = await obsidianApp.listFiles();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            path: 'parent-folder/test.md',
            basename: 'test',
            extension: 'md',
            name: 'test.md',
        });
        expect(result[0].parent).toBeDefined();
        expect(result[0].parent?.path).toBe('parent-folder');
    });
});
