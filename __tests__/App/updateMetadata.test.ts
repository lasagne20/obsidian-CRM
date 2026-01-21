import { App, TFile } from 'obsidian';
import { ObsidianApp } from '../../src/App';
import { IFile } from 'markdown-crm';

describe('ObsidianApp.updateMetadata() - Bug: metadata deletion', () => {
    let mockApp: jest.Mocked<App>;
    let obsidianApp: ObsidianApp;
    let mockFrontmatter: any;
    let mockFile: TFile;

    beforeEach(() => {
        // Reset frontmatter for each test
        mockFrontmatter = {
            classe: 'Action',
            clients: ['[[Client 1]]'],
            id: 'abc-123',
            etat: 'Piste',
        };

        // Create mock TFile that passes instanceof check
        mockFile = Object.create(TFile.prototype);
        Object.assign(mockFile, {
            path: 'test.md',
            basename: 'test',
            extension: 'md',
            name: 'test.md',
        });

        mockApp = {
            vault: {
                getAbstractFileByPath: jest.fn().mockReturnValue(mockFile),
            },
            fileManager: {
                processFrontMatter: jest.fn((file, callback) => {
                    // Simulate Obsidian's processFrontMatter behavior
                    callback(mockFrontmatter);
                    return Promise.resolve();
                }),
            },
        } as any;

        obsidianApp = new ObsidianApp(mockApp);
    });

    it('should PRESERVE existing metadata when updating with new properties', async () => {
        const iFile: IFile = {
            path: 'test.md',
            basename: 'test',
            extension: 'md',
            name: 'test.md',
        };

        // Initial state: file has classe, clients, id, etat
        expect(mockFrontmatter).toEqual({
            classe: 'Action',
            clients: ['[[Client 1]]'],
            id: 'abc-123',
            etat: 'Piste',
        });

        // Update with new property (animations) - THIS SHOULD NOT DELETE OTHER PROPERTIES
        await obsidianApp.updateMetadata(iFile, {
            animations: [{ date: '2026-01-20', lieu: 'Paris' }],
        });

        // BUG: The current implementation deletes all existing properties
        // EXPECTED: Should preserve classe, clients, id, etat and add animations
        expect(mockFrontmatter).toEqual({
            classe: 'Action',
            clients: ['[[Client 1]]'],
            id: 'abc-123',
            etat: 'Piste',
            animations: [{ date: '2026-01-20', lieu: 'Paris' }],
        });
    });

    it('should UPDATE existing property values', async () => {
        const iFile: IFile = {
            path: 'test.md',
            basename: 'test',
            extension: 'md',
            name: 'test.md',
        };

        // Update existing property
        await obsidianApp.updateMetadata(iFile, {
            etat: 'Devis signé',
        });

        // Should update etat and preserve other properties
        expect(mockFrontmatter).toEqual({
            classe: 'Action',
            clients: ['[[Client 1]]'],
            id: 'abc-123',
            etat: 'Devis signé', // Updated
        });
    });

    it('should handle multiple partial updates in sequence', async () => {
        const iFile: IFile = {
            path: 'test.md',
            basename: 'test',
            extension: 'md',
            name: 'test.md',
        };

        // First update: add animations
        await obsidianApp.updateMetadata(iFile, {
            animations: [{ date: '2026-01-20' }],
        });

        expect(mockFrontmatter.animations).toBeDefined();
        expect(mockFrontmatter.classe).toBe('Action'); // Should still exist

        // Second update: add prospection
        await obsidianApp.updateMetadata(iFile, {
            prospection: 'Contact',
        });

        expect(mockFrontmatter.prospection).toBe('Contact');
        expect(mockFrontmatter.animations).toBeDefined(); // Should still exist
        expect(mockFrontmatter.classe).toBe('Action'); // Should still exist
    });

    it('should allow complete frontmatter replacement when needed', async () => {
        const iFile: IFile = {
            path: 'test.md',
            basename: 'test',
            extension: 'md',
            name: 'test.md',
        };

        // Complete replacement (e.g., for UpdateClassAction)
        await obsidianApp.updateMetadata(iFile, {
            classe: 'Commune',
            nom: 'Paris',
            type: 'Commune',
        });

        // This is a complete replacement scenario
        // Old properties like 'clients', 'id', 'etat' are not in the new metadata
        // But the function should still merge, not delete-then-replace
        expect(mockFrontmatter.classe).toBe('Commune');
        expect(mockFrontmatter.nom).toBe('Paris');
        expect(mockFrontmatter.type).toBe('Commune');
    });
});
