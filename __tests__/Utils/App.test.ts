import AppShim, { TFile, TFolder, isTFile, isTFolder, TFileClass } from "../../Utils/App";

// Mock Obsidian modules
jest.mock('obsidian', () => ({
    App: jest.fn(),
    TFile: jest.fn(),
    TFolder: jest.fn(),
    Notice: jest.fn(),
    Modal: jest.fn(),
    FuzzySuggestModal: jest.fn(),
    Setting: jest.fn(),
    setIcon: jest.fn()
}));

describe('AppShim', () => {
    let mockObsidianApp: any;

    beforeEach(() => {
        mockObsidianApp = {
            vault: {
                read: jest.fn().mockResolvedValue('file content'),
                create: jest.fn().mockResolvedValue({ path: 'test.md', name: 'test.md' }),
                modify: jest.fn().mockResolvedValue({ path: 'test.md', name: 'test.md' }),
                delete: jest.fn().mockResolvedValue(undefined),
                getFiles: jest.fn().mockReturnValue([]),
                getAbstractFileByPath: jest.fn().mockReturnValue(null),
                rename: jest.fn().mockResolvedValue(undefined),
                getName: jest.fn().mockReturnValue('TestVault'),
                createFolder: jest.fn().mockResolvedValue({ path: 'folder', name: 'folder', children: [] }),
                getAllFolders: jest.fn().mockReturnValue([]),
                adapter: {
                    basePath: '/vault/path',
                    exists: jest.fn().mockResolvedValue(true),
                    read: jest.fn().mockResolvedValue('adapter content'),
                    getResourcePath: jest.fn().mockImplementation((path) => `file:///vault/path/${path}`)
                }
            },
            workspace: {
                getActiveFile: jest.fn().mockReturnValue(null),
                setActiveFile: jest.fn(),
                openLinkText: jest.fn().mockResolvedValue(undefined),
                onLayoutReady: jest.fn(),
                getLeavesOfType: jest.fn().mockReturnValue([]),
                getLeaf: jest.fn().mockReturnValue(null)
            },
            metadataCache: {
                getFileCache: jest.fn().mockReturnValue({ frontmatter: {} }),
                on: jest.fn(),
                off: jest.fn(),
                resolvedLinks: {}
            },
            commands: {
                addCommand: jest.fn(),
                executeCommandById: jest.fn(),
                listCommands: jest.fn().mockReturnValue([])
            },
            plugins: {
                enablePlugin: jest.fn().mockResolvedValue(undefined),
                disablePlugin: jest.fn().mockResolvedValue(undefined),
                getPlugin: jest.fn().mockReturnValue(null),
                plugins: new Map()
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Factory Methods', () => {
        it('should create AppShim from Obsidian App', () => {
            const appShim = AppShim.createFromObsidianApp(mockObsidianApp);
            
            expect(appShim.realObsidianApp).toBe(mockObsidianApp);
            expect(appShim.vault).toBeDefined();
            expect(appShim.workspace).toBeDefined();
            expect(appShim.metadataCache).toBeDefined();
            expect(appShim.commands).toBeDefined();
            expect(appShim.plugins).toBeDefined();
        });

        it('should create mock AppShim for testing', () => {
            const appShim = AppShim.createMock();
            
            expect(appShim.realObsidianApp).toBeNull();
            expect(appShim.vault).toBeDefined();
            expect(appShim.workspace).toBeDefined();
            expect(appShim.metadataCache).toBeDefined();
            expect(appShim.commands).toBeDefined();
            expect(appShim.plugins).toBeDefined();
        });
    });

    describe('Constructor', () => {
        it('should initialize with real Obsidian app when provided', () => {
            const appShim = new AppShim(mockObsidianApp);
            
            expect(appShim.realObsidianApp).toBe(mockObsidianApp);
        });

        it('should initialize with mocks when no app provided', () => {
            const appShim = new AppShim();
            
            expect(appShim.realObsidianApp).toBeNull();
        });
    });

    describe('Real Obsidian App Integration', () => {
        let appShim: AppShim;

        beforeEach(() => {
            appShim = new AppShim(mockObsidianApp);
        });

        describe('Vault Wrapper', () => {
            it('should delegate read to real vault', async () => {
                const result = await appShim.vault.read('test.md');
                
                expect(mockObsidianApp.vault.read).toHaveBeenCalledWith('test.md');
                expect(result).toBe('file content');
            });

            it('should delegate create to real vault', async () => {
                const result = await appShim.vault.create('test.md', 'content');
                
                expect(mockObsidianApp.vault.create).toHaveBeenCalledWith('test.md', 'content');
                expect(result).toEqual({ path: 'test.md', name: 'test.md' });
            });

            it('should delegate modify to real vault', async () => {
                const testFile = { path: 'test.md', name: 'test.md' } as TFile;
                const result = await appShim.vault.modify(testFile, 'new content');
                
                expect(mockObsidianApp.vault.modify).toHaveBeenCalledWith(testFile, 'new content');
                expect(result).toEqual({ path: 'test.md', name: 'test.md' });
            });

            it('should delegate delete to real vault', async () => {
                const testFile = { path: 'test.md', name: 'test.md' } as TFile;
                await appShim.vault.delete(testFile);
                
                expect(mockObsidianApp.vault.delete).toHaveBeenCalledWith(testFile);
            });

            it('should delegate exists to real vault adapter', async () => {
                const result = await appShim.vault.exists('test.md');
                
                expect(mockObsidianApp.vault.adapter.exists).toHaveBeenCalledWith('test.md');
                expect(result).toBe(true);
            });

            it('should delegate getFiles to real vault', () => {
                appShim.vault.getFiles();
                
                expect(mockObsidianApp.vault.getFiles).toHaveBeenCalled();
            });

            it('should delegate getAbstractFileByPath to real vault', () => {
                appShim.vault.getAbstractFileByPath('test.md');
                
                expect(mockObsidianApp.vault.getAbstractFileByPath).toHaveBeenCalledWith('test.md');
            });

            it('should delegate rename to real vault', async () => {
                const testFile = { path: 'test.md', name: 'test.md' } as TFile;
                await appShim.vault.rename(testFile, 'new.md');
                
                expect(mockObsidianApp.vault.rename).toHaveBeenCalledWith(testFile, 'new.md');
            });

            it('should delegate getName to real vault', () => {
                const result = appShim.vault.getName();
                
                expect(mockObsidianApp.vault.getName).toHaveBeenCalled();
                expect(result).toBe('TestVault');
            });

            it('should delegate createFolder to real vault', async () => {
                const result = await appShim.vault.createFolder('new-folder');
                
                expect(mockObsidianApp.vault.createFolder).toHaveBeenCalledWith('new-folder');
                expect(result).toEqual({ path: 'folder', name: 'folder', children: [] });
            });

            it('should delegate getAllFolders to real vault when available', () => {
                appShim.vault.getAllFolders();
                
                expect(mockObsidianApp.vault.getAllFolders).toHaveBeenCalled();
            });

            it('should return empty array when getAllFolders not available', () => {
                delete mockObsidianApp.vault.getAllFolders;
                const result = appShim.vault.getAllFolders();
                
                expect(result).toEqual([]);
            });

            it('should expose adapter correctly', () => {
                expect(appShim.vault.adapter).toBe(mockObsidianApp.vault.adapter);
            });
        });

        describe('Workspace Wrapper', () => {
            it('should delegate getActiveFile to real workspace', () => {
                appShim.workspace.getActiveFile();
                
                expect(mockObsidianApp.workspace.getActiveFile).toHaveBeenCalled();
            });

            it('should delegate setActiveFile to real workspace', () => {
                const testFile = { path: 'test.md' } as TFile;
                appShim.workspace.setActiveFile(testFile);
                
                expect(mockObsidianApp.workspace.setActiveFile).toHaveBeenCalledWith(testFile);
            });

            it('should delegate openFile to real workspace openLinkText', async () => {
                const testFile = { path: 'test.md' } as TFile;
                await appShim.workspace.openFile(testFile);
                
                expect(mockObsidianApp.workspace.openLinkText).toHaveBeenCalledWith('test.md', '');
            });

            it('should delegate onLayoutReady to real workspace', () => {
                const callback = jest.fn();
                appShim.workspace.onLayoutReady(callback);
                
                expect(mockObsidianApp.workspace.onLayoutReady).toHaveBeenCalledWith(callback);
            });

            it('should delegate getLeavesOfType to real workspace', () => {
                appShim.workspace.getLeavesOfType('markdown');
                
                expect(mockObsidianApp.workspace.getLeavesOfType).toHaveBeenCalledWith('markdown');
            });

            it('should delegate getLeaf to real workspace', () => {
                appShim.workspace.getLeaf(true);
                
                expect(mockObsidianApp.workspace.getLeaf).toHaveBeenCalledWith(true);
            });
        });

        describe('MetadataCache Wrapper', () => {
            it('should delegate getFileCache to real metadataCache', () => {
                const testFile = { path: 'test.md' } as TFile;
                appShim.metadataCache.getFileCache(testFile);
                
                expect(mockObsidianApp.metadataCache.getFileCache).toHaveBeenCalledWith(testFile);
            });

            it('should delegate on to real metadataCache', () => {
                const callback = jest.fn();
                appShim.metadataCache.on('changed', callback);
                
                expect(mockObsidianApp.metadataCache.on).toHaveBeenCalledWith('changed', callback);
            });

            it('should delegate off to real metadataCache', () => {
                const callback = jest.fn();
                appShim.metadataCache.off('changed', callback);
                
                expect(mockObsidianApp.metadataCache.off).toHaveBeenCalledWith('changed', callback);
            });

            it('should expose resolvedLinks correctly', () => {
                expect(appShim.metadataCache.resolvedLinks).toBe(mockObsidianApp.metadataCache.resolvedLinks);
            });
        });

        describe('Commands Wrapper', () => {
            it('should delegate addCommand to real commands', () => {
                const command = { id: 'test', name: 'Test', callback: jest.fn() };
                appShim.commands.addCommand(command);
                
                expect(mockObsidianApp.commands.addCommand).toHaveBeenCalledWith(command);
            });

            it('should delegate executeCommand to real commands', () => {
                appShim.commands.executeCommand('test-command');
                
                expect(mockObsidianApp.commands.executeCommandById).toHaveBeenCalledWith('test-command');
            });

            it('should delegate listCommands to real commands', () => {
                appShim.commands.listCommands();
                
                expect(mockObsidianApp.commands.listCommands).toHaveBeenCalled();
            });
        });

        describe('Plugins Wrapper', () => {
            it('should delegate enablePlugin to real plugins', async () => {
                await appShim.plugins.enablePlugin('test-plugin');
                
                expect(mockObsidianApp.plugins.enablePlugin).toHaveBeenCalledWith('test-plugin');
            });

            it('should delegate disablePlugin to real plugins', async () => {
                await appShim.plugins.disablePlugin('test-plugin');
                
                expect(mockObsidianApp.plugins.disablePlugin).toHaveBeenCalledWith('test-plugin');
            });

            it('should delegate getPlugin to real plugins', () => {
                appShim.plugins.getPlugin('test-plugin');
                
                expect(mockObsidianApp.plugins.getPlugin).toHaveBeenCalledWith('test-plugin');
            });

            it('should expose loadedPlugins correctly', () => {
                expect(appShim.plugins.loadedPlugins).toBe(mockObsidianApp.plugins.plugins);
            });
        });
    });

    describe('Mock Mode', () => {
        let appShim: AppShim;

        beforeEach(() => {
            appShim = new AppShim(); // No real app provided
        });

        describe('Mock Vault', () => {
            it('should return mock content from read', async () => {
                const result = await appShim.vault.read('test.md');
                expect(result).toBe('mock content');
            });

            it('should create mock TFile from create', async () => {
                const result = await appShim.vault.create('test.md', 'content');
                
                expect(result.path).toBe('test.md');
                expect(result.name).toBe('test.md');
                expect(result.basename).toBe('test');
                expect(result.extension).toBe('md');
            });

            it('should handle string path in modify', async () => {
                const result = await appShim.vault.modify('test.md', 'content');
                
                expect(result.path).toBe('test.md');
                expect(result.name).toBe('test.md');
            });

            it('should handle TFile in modify', async () => {
                const testFile = { path: 'test.md', name: 'test.md' } as TFile;
                const result = await appShim.vault.modify(testFile, 'content');
                
                expect(result).toBe(testFile);
            });

            it('should return true from exists', async () => {
                const result = await appShim.vault.exists('test.md');
                expect(result).toBe(true);
            });

            it('should return empty array from getFiles', () => {
                const result = appShim.vault.getFiles();
                expect(result).toEqual([]);
            });

            it('should return null from getAbstractFileByPath', () => {
                const result = appShim.vault.getAbstractFileByPath('test.md');
                expect(result).toBeNull();
            });

            it('should not throw from delete', async () => {
                await expect(appShim.vault.delete('test.md')).resolves.not.toThrow();
            });

            it('should not throw from rename', async () => {
                const testFile = { path: 'test.md' } as TFile;
                await expect(appShim.vault.rename(testFile, 'new.md')).resolves.not.toThrow();
            });

            it('should return mock name from getName', () => {
                const result = appShim.vault.getName();
                expect(result).toBe('MockVault');
            });

            it('should create mock folder from createFolder', async () => {
                const result = await appShim.vault.createFolder('test-folder');
                
                expect(result.path).toBe('test-folder');
                expect(result.name).toBe('test-folder');
                expect(result.children).toEqual([]);
            });

            it('should return empty array from getAllFolders', () => {
                const result = appShim.vault.getAllFolders();
                expect(result).toEqual([]);
            });

            it('should provide mock adapter', () => {
                expect(appShim.vault.adapter.basePath).toBe('/mock-vault');
                expect(appShim.vault.adapter.getResourcePath('test.md')).toBe('file:///mock-vault/test.md');
            });
        });

        describe('Mock Workspace', () => {
            it('should return null from getActiveFile', () => {
                const result = appShim.workspace.getActiveFile();
                expect(result).toBeNull();
            });

            it('should not throw from setActiveFile', () => {
                expect(() => appShim.workspace.setActiveFile(null)).not.toThrow();
            });

            it('should not throw from openFile', async () => {
                const testFile = { path: 'test.md' } as TFile;
                await expect(appShim.workspace.openFile(testFile)).resolves.not.toThrow();
            });

            it('should not throw from onLayoutReady', () => {
                expect(() => appShim.workspace.onLayoutReady(() => {})).not.toThrow();
            });

            it('should return empty array from getLeavesOfType', () => {
                const result = appShim.workspace.getLeavesOfType('markdown');
                expect(result).toEqual([]);
            });

            it('should return null from getLeaf', () => {
                const result = appShim.workspace.getLeaf();
                expect(result).toBeNull();
            });
        });

        describe('Mock MetadataCache', () => {
            it('should return mock frontmatter from getFileCache', () => {
                const result = appShim.metadataCache.getFileCache('test.md');
                expect(result).toEqual({ frontmatter: {} });
            });

            it('should not throw from on', () => {
                expect(() => appShim.metadataCache.on('changed', () => {})).not.toThrow();
            });

            it('should not throw from off', () => {
                expect(() => appShim.metadataCache.off('changed', () => {})).not.toThrow();
            });

            it('should provide empty resolvedLinks', () => {
                expect(appShim.metadataCache.resolvedLinks).toEqual({});
            });
        });

        describe('Mock Commands', () => {
            it('should not throw from addCommand', () => {
                const command = { id: 'test', name: 'Test', callback: jest.fn() };
                expect(() => appShim.commands.addCommand(command)).not.toThrow();
            });

            it('should not throw from executeCommand', () => {
                expect(() => appShim.commands.executeCommand('test')).not.toThrow();
            });

            it('should return empty array from listCommands', () => {
                const result = appShim.commands.listCommands();
                expect(result).toEqual([]);
            });
        });

        describe('Mock Plugins', () => {
            it('should not throw from enablePlugin', async () => {
                await expect(appShim.plugins.enablePlugin('test')).resolves.not.toThrow();
            });

            it('should not throw from disablePlugin', async () => {
                await expect(appShim.plugins.disablePlugin('test')).resolves.not.toThrow();
            });

            it('should return null from getPlugin', () => {
                const result = appShim.plugins.getPlugin('test');
                expect(result).toBeNull();
            });

            it('should provide empty loadedPlugins', () => {
                expect(appShim.plugins.loadedPlugins).toBeInstanceOf(Map);
                expect(appShim.plugins.loadedPlugins.size).toBe(0);
            });
        });
    });

    describe('Type Guards', () => {
        it('should identify TFile correctly', () => {
            const file = { path: 'test.md', name: 'test.md' };
            const folder = { path: 'folder', children: [] };
            
            expect(isTFile(file)).toBe(true);
            expect(isTFile(folder)).toBe(false);
            expect(isTFile(null)).toBe(false);
            expect(isTFile(undefined)).toBe(false);
            expect(isTFile({})).toBe(false);
        });

        it('should identify TFolder correctly', () => {
            const file = { path: 'test.md', name: 'test.md' };
            const folder = { path: 'folder', children: [] };
            
            expect(isTFolder(folder)).toBe(true);
            expect(isTFolder(file)).toBe(false);
            expect(isTFolder(null)).toBe(false);
            expect(isTFolder(undefined)).toBe(false);
            expect(isTFolder({})).toBe(false);
        });
    });

    describe('TFileClass', () => {
        it('should create TFile with default values', () => {
            const file = new TFileClass('test/path.md');
            
            expect(file.path).toBe('test/path.md');
            expect(file.name).toBe('path.md');
            expect(file.basename).toBe('path');
            expect(file.extension).toBe('md');
            expect(file.stat).toBeDefined();
        });

        it('should create TFile with custom name', () => {
            const file = new TFileClass('test/path.md', 'custom.md');
            
            expect(file.path).toBe('test/path.md');
            expect(file.name).toBe('custom.md');
            expect(file.basename).toBe('custom');
            expect(file.extension).toBe('md');
        });

        it('should handle files without extension', () => {
            const file = new TFileClass('test/file');
            
            expect(file.path).toBe('test/file');
            expect(file.name).toBe('file');
            expect(file.basename).toBe('file');
            expect(file.extension).toBe('');
        });

        it('should create mock TFile with overrides', () => {
            const mock = TFileClass.createMock({
                path: 'custom/path.md',
                name: 'custom.md',
                basename: 'custom'
            });
            
            expect(mock.path).toBe('custom/path.md');
            expect(mock.name).toBe('custom.md');
            expect(mock.basename).toBe('custom');
            expect(mock.extension).toBe('md');
        });

        it('should use default values in createMock when no overrides', () => {
            const mock = TFileClass.createMock();
            
            expect(mock.path).toBe('mock/file.md');
            expect(mock.name).toBe('file.md');
            expect(mock.basename).toBe('file');
            expect(mock.extension).toBe('md');
        });
    });
});