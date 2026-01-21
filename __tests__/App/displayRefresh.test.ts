/**
 * Test for display refresh functionality after UpdateClassAction
 * This test demonstrates the bug where the display doesn't refresh automatically
 * when a class configuration is updated.
 */

import { App, TFile, MarkdownView } from 'obsidian';
import { Vault } from 'markdown-crm';
import { ObsidianApp } from '../../src/App';

// Mock Obsidian
jest.mock('obsidian');

// We'll create a minimal plugin mock instead of importing the full CRM class
// to avoid dependency issues with settings import

describe('Display Refresh After UpdateClassAction', () => {
    let plugin: any; // Simplified plugin mock
    let mockApp: jest.Mocked<App>;
    let mockVault: any;
    let mockWorkspace: any;
    let mockMarkdownView: jest.Mocked<MarkdownView>;
    let mockFile: jest.Mocked<TFile>;
    let mockContentEl: any;

    beforeEach(async () => {
        // Setup mock App
        mockApp = {
            vault: {
                getName: jest.fn().mockReturnValue('test-vault'),
                getAbstractFileByPath: jest.fn(),
                getFiles: jest.fn().mockReturnValue([]),
                getAllFolders: jest.fn().mockReturnValue([]),
                on: jest.fn(),
            },
            workspace: {
                on: jest.fn(),
                getActiveViewOfType: jest.fn(),
            },
            metadataCache: {
                on: jest.fn(),
                getFileCache: jest.fn(),
            },
            fileManager: {
                processFrontMatter: jest.fn(),
            },
        } as any;

        mockWorkspace = mockApp.workspace;

        // Setup mock file
        mockFile = {
            path: 'Test/Person1.md',
            name: 'Person1.md',
            basename: 'Person1',
            extension: 'md',
        } as any;

        // Setup mock content element with querySelector
        // We need to track which display is currently in the DOM
        let currentDisplay: HTMLElement | null = null;
        
        // Setup mock metadata container
        const mockMetadataContainer = document.createElement('div');
        mockMetadataContainer.className = 'metadata-container';

        // Setup mock custom display (the OLD display that should be replaced)
        const mockOldDisplay = document.createElement('div');
        mockOldDisplay.className = 'crm-custom-display';
        mockOldDisplay.innerHTML = '<div>Old Display - Person Class v1</div>';
        currentDisplay = mockOldDisplay; // Initially, old display is shown

        mockContentEl = {
            querySelector: jest.fn((selector: string) => {
                if (selector === '.metadata-container') {
                    return mockMetadataContainer;
                }
                if (selector === '.crm-custom-display') {
                    // Returns the currently active display
                    return currentDisplay;
                }
                return null;
            }),
            querySelectorAll: jest.fn((selector: string) => {
                if (selector === '.crm-custom-display') {
                    return currentDisplay ? [currentDisplay] : [];
                }
                return [];
            }),
        };

        // Setup mock MarkdownView
        mockMarkdownView = {
            file: mockFile,
            contentEl: mockContentEl,
        } as any;

        mockWorkspace.getActiveViewOfType.mockReturnValue(mockMarkdownView);

        // Setup plugin as a minimal mock object
        plugin = {
            app: mockApp,
            settings: {
                configPath: 'Config',
                dataPath: 'Data',
            },
            currentFilePath: null,
            currentDisplayGeneration: 0,
            
            // Mock replaceMetadataContainer method (copied logic from main.ts)
            replaceMetadataContainer: async function() {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!activeView) return;

                const file = activeView.file;
                if (!file) return;

                // Check if we're still on the same file - if so, check if display still exists
                if (this.currentFilePath === file.path) {
                    const view = activeView.contentEl;
                    const existingDisplay = view.querySelector('.crm-custom-display');
                    if (existingDisplay) {
                        console.log("✅ Same file, keeping existing display");
                        return; // 🐛 THIS IS THE BUG - early return prevents refresh
                    }
                    console.log("🔄 Same file but display missing, recreating...");
                }

                // Set the current file path immediately to prevent race conditions
                this.currentFilePath = file.path;
                
                // Capture the current generation to detect if we've been invalidated
                const myGeneration = ++this.currentDisplayGeneration;

                // Find the metadata container
                const view = activeView.contentEl;
                const metadataContainer = view.querySelector('.metadata-container');
                
                if (!metadataContainer) {
                    console.log("⚠️ No metadata container found");
                    return;
                }

                // Remove ALL existing custom displays (not just the first one)
                const existingCustomDisplays = view.querySelectorAll('.crm-custom-display');
                if (existingCustomDisplays.length > 0) {
                    existingCustomDisplays.forEach((display: any) => display.remove());
                    console.log(`🧹 Removed ${existingCustomDisplays.length} existing custom display(s)`);
                    // Simulate removal in our mock
                    currentDisplay = null;
                }

                // Get the classe instance
                const iFile = this.obsidianApp.toIFile(file);
                const classe = await this.vault.getFromFile(iFile);
                
                // Check if we've been invalidated during the async operation
                if (myGeneration !== this.currentDisplayGeneration) {
                    console.log("🚫 Display generation invalidated, aborting");
                    return;
                }
                
                if (!classe) {
                    console.log("⚠️ No classe found for file:", file.path);
                    this.currentFilePath = null;
                    return;
                }

                // Generate custom display
                const customDisplay = await classe.getDisplay();
                
                // Check again if we've been invalidated during display generation
                if (myGeneration !== this.currentDisplayGeneration) {
                    console.log("🚫 Display generation invalidated after getDisplay, aborting");
                    return;
                }
                
                if (!customDisplay) {
                    console.log("⚠️ No custom display generated");
                    this.currentFilePath = null;
                    return;
                }

                // Update the current display reference (simulating DOM insertion)
                currentDisplay = customDisplay;
                console.log("✅ Custom display created");
            }
        };

        // Setup plugin
        // plugin = new CRM();
        // (plugin as any).app = mockApp;
        // (plugin as any).settings = {
        //     configPath: 'Config',
        //     dataPath: 'Data',
        // };

        // Create ObsidianApp
        const obsidianApp = new ObsidianApp(mockApp, plugin.settings);
        plugin.obsidianApp = obsidianApp;

        // Track which "version" of the class we're using
        let classVersion = 1;

        // Create mock Vault with a mock classe that has a getDisplay method
        const mockClasse = {
            constructor: { name: 'Personne' },
            getDisplay: jest.fn().mockImplementation(async () => {
                const newDisplay = document.createElement('div');
                newDisplay.className = 'crm-custom-display';
                newDisplay.innerHTML = `<div>Display - Person Class v${classVersion}</div>`;
                return newDisplay;
            }),
        };

        mockVault = {
            app: obsidianApp,
            getFromFile: jest.fn().mockResolvedValue(mockClasse),
            classes: {
                Personne: class Personne {},
            },
            // Add a method to simulate class update
            _simulateClassUpdate: () => {
                classVersion = 2;
            }
        };

        plugin.vault = mockVault;
        // plugin.currentFilePath = null;
        // plugin.currentDisplayGeneration = 0;

        // Register the display refresh callback
        obsidianApp.setDisplayRefreshCallback(() => {
            console.log("🔄 Display refresh requested");
            plugin.currentFilePath = null;
            plugin.currentDisplayGeneration++;
            plugin.replaceMetadataContainer();
        });

        // Simulate initial display creation (user opens the file)
        await plugin.replaceMetadataContainer();
    });

    it('should refresh display correctly when needDisplayRefresh is called', async () => {
        // At this point, the file is open and display is shown (v1)
        expect(plugin.currentFilePath).toBe('Test/Person1.md');
        
        // The initial display shows old version (v1)
        let display = mockContentEl.querySelector('.crm-custom-display');
        expect(display.innerHTML).toContain('Display - Person Class v1');
        
        // Simulate class configuration update (e.g., UpdateClassAction)
        plugin.vault._simulateClassUpdate();
        
        // Simulate UpdateClassAction calling needDisplayRefresh()
        // This simulates: await action.execute(this.vault)
        // which calls: this.vault.app.needDisplayRefresh()
        console.log("📝 Simulating UpdateClassAction execution...");
        
        // Call needDisplayRefresh (this is what UpdateClassAction does)
        plugin.obsidianApp.needDisplayRefresh();
        
        // Wait a bit for async operations
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // ✅ With the current code, this SHOULD work because needDisplayRefresh
        // resets currentFilePath to null before calling replaceMetadataContainer
        const currentDisplay = mockContentEl.querySelector('.crm-custom-display');
        
        // The display should now be refreshed with the new version
        expect(currentDisplay.innerHTML).toContain('Display - Person Class v2');
    });

    it('should demonstrate the BUG: replaceMetadataContainer called directly does NOT refresh', async () => {
        // At this point, the file is open and display is shown
        const initialFilePath = plugin.currentFilePath;
        expect(initialFilePath).toBe('Test/Person1.md');
        
        // The display exists and shows v1
        let currentDisplay = mockContentEl.querySelector('.crm-custom-display');
        expect(currentDisplay).toBeTruthy();
        expect(currentDisplay.innerHTML).toContain('Display - Person Class v1');
        
        // Simulate class configuration update
        plugin.vault._simulateClassUpdate();
        
        // 🐛 BUG: If replaceMetadataContainer is called DIRECTLY (not via needDisplayRefresh)
        // for example from active-leaf-change event or manual call
        // it will NOT refresh the display because currentFilePath matches
        await plugin.replaceMetadataContainer();
        
        // Wait for async
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // The display is STILL the old one (v1) because of early return
        currentDisplay = mockContentEl.querySelector('.crm-custom-display');
        expect(currentDisplay.innerHTML).toContain('Display - Person Class v1');
        expect(currentDisplay.innerHTML).not.toContain('Display - Person Class v2');
    });

    it('should demonstrate the root cause: early return when display exists and file path matches', async () => {
        // Spy on console.log to see what's happening
        const consoleLogSpy = jest.spyOn(console, 'log');
        
        // Initial state: file is open, display exists
        expect(plugin.currentFilePath).toBe('Test/Person1.md');
        
        // Call replaceMetadataContainer directly (NOT via needDisplayRefresh)
        // This simulates what happens when active-leaf-change is triggered
        // but the file is already open
        await plugin.replaceMetadataContainer();
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Check console logs to see if it hit the early return
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("Same file, keeping existing display")
        );
        
        // This proves that when replaceMetadataContainer is called directly,
        // it returns early and doesn't refresh the display
        // This is the optimization to avoid recreating the display unnecessarily
        // BUT it also means that if the CLASS DEFINITION changes,
        // the display won't update until the file is closed and reopened
        
        consoleLogSpy.mockRestore();
    });

    it('should NOT display anything when vault.getFromFile returns null (new file scenario)', async () => {
        // Spy on console.log to see what's happening
        const consoleLogSpy = jest.spyOn(console, 'log');
        
        // Create a completely new plugin setup for a file without a classe
        const newFile: jest.Mocked<TFile> = {
            path: 'Test/NewFile.md',
            name: 'NewFile.md',
            basename: 'NewFile',
            extension: 'md',
        } as any;
        
        mockMarkdownView.file = newFile;
        
        // Mock vault.getFromFile to return null for this specific file
        const originalGetFromFile = plugin.vault.getFromFile;
        plugin.vault.getFromFile = jest.fn().mockResolvedValue(null);
        
        // Reset currentFilePath to simulate a new file being opened
        plugin.currentFilePath = null;
        
        // Call replaceMetadataContainer (as would happen with active-leaf-change)
        await plugin.replaceMetadataContainer();
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Check that it logged "No classe found"
        expect(consoleLogSpy).toHaveBeenCalledWith(
            "⚠️ No classe found for file:",
            'Test/NewFile.md'
        );
        
        // And currentFilePath is reset to null
        expect(plugin.currentFilePath).toBe(null);
        
        // This is the bug for new files: if vault.getFromFile returns null,
        // no display is created and currentFilePath is set to null
        // When the file is later updated with metadata and becomes valid,
        // replaceMetadataContainer won't be called again automatically
        
        // Restore
        plugin.vault.getFromFile = originalGetFromFile;
        mockMarkdownView.file = mockFile;
        consoleLogSpy.mockRestore();
    });

    it('should create display after metadata is updated (SOLUTION for new files)', async () => {
        // This test demonstrates the solution: listen to metadata changes
        // and retry creating the display when metadata is updated
        
        const consoleLogSpy = jest.spyOn(console, 'log');
        
        // Simulate a newly created file
        const newFile: jest.Mocked<TFile> = {
            path: 'Test/NewPerson.md',
            name: 'NewPerson.md',
            basename: 'NewPerson',
            extension: 'md',
        } as any;
        
        mockMarkdownView.file = newFile;
        
        // Initially, vault.getFromFile returns null (file not indexed yet)
        const originalGetFromFile = plugin.vault.getFromFile;
        plugin.vault.getFromFile = jest.fn().mockResolvedValue(null);
        
        plugin.currentFilePath = null;
        
        // Call replaceMetadataContainer - should fail to create display
        await plugin.replaceMetadataContainer();
        
        expect(consoleLogSpy).toHaveBeenCalledWith(
            "⚠️ No classe found for file:",
            'Test/NewPerson.md'
        );
        expect(plugin.currentFilePath).toBe(null);
        
        // Now simulate metadata being added (e.g., classe property added to frontmatter)
        // Restore getFromFile to return a valid classe
        const mockClasse = {
            constructor: { name: 'Personne' },
            getDisplay: jest.fn().mockResolvedValue((() => {
                const display = document.createElement('div');
                display.className = 'crm-custom-display';
                display.innerHTML = '<div>Display for New Person</div>';
                return display;
            })()),
        };
        plugin.vault.getFromFile = jest.fn().mockResolvedValue(mockClasse);
        
        // Simulate metadata cache change event
        // In the real code, this would trigger the metadata change listener
        // which would call replaceMetadataContainer again
        console.log("📝 Metadata changed for active file:", newFile.path);
        console.log("🔄 Attempting to create display after metadata change");
        await plugin.replaceMetadataContainer();
        
        // Now the display should be created successfully
        const currentDisplay = (mockContentEl as any).querySelector('.crm-custom-display');
        expect(currentDisplay).toBeTruthy();
        expect(currentDisplay.innerHTML).toContain('Display for New Person');
        expect(plugin.currentFilePath).toBe('Test/NewPerson.md');
        
        // Restore
        plugin.vault.getFromFile = originalGetFromFile;
        mockMarkdownView.file = mockFile;
        consoleLogSpy.mockRestore();
    });
});
