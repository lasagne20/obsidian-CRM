// /c:/Users/leodu/Documents/1 - Pro/Test plugin obsidian/.obsidian/plugins/obsidian-CRM/Utils/App.ts
// AppShim that uses real Obsidian dependencies for production and provides mocks for testing.

import { 
    App, 
    TFile, 
    TFolder, 
    TAbstractFile, 
    Notice, 
    Modal, 
    FuzzySuggestModal, 
    Setting, 
    FuzzyMatch, 
    setIcon 
} from 'obsidian';

// Re-export Obsidian types for compatibility
export type { TFile, TFolder, TAbstractFile, FuzzyMatch };
export { Notice, Modal, FuzzySuggestModal, Setting, setIcon };

// TFile class for test mocking - now exported for compatibility
export class TFileClass {
    path: string;
    name: string;
    basename: string;
    extension: string;
    stat: { mtime: number; ctime: number; size: number };
    vault: any;
    parent: any;

    constructor(path: string = "", name?: string) {
        this.path = path;
        this.name = name || path.split("/").pop() || path;
        this.basename = this.name.replace(/\.[^/.]+$/, "");
        this.extension = this.name.includes('.') ? this.name.split('.').pop() || '' : '';
        this.stat = { mtime: Date.now(), ctime: Date.now(), size: 0 };
        this.vault = null;
        this.parent = null;
    }
    
    static createMock(overrides: Partial<TFile> = {}): TFile {
        return {
            path: "mock/file.md",
            name: "file.md",
            basename: "file",
            extension: "md",
            stat: { mtime: Date.now(), ctime: Date.now(), size: 0 },
            vault: null as any,
            parent: null as any,
            ...overrides
        } as unknown as TFile;
    }
}

// Type guards for checking file types (keep these as they're useful)
export function isTFile(file: any): file is TFile {
    return file != null && typeof file === 'object' && 'path' in file && !('children' in file);
}

export function isTFolder(file: any): file is TFolder {
    return file != null && typeof file === 'object' && 'children' in file;
}

// SearchResult interface for compatibility
export interface SearchResult {
    [key: string]: any;
}

// Interfaces pour la compatibilité avec les tests
export interface IVaultShim {
    read(pathOrFile: string | TFile): Promise<string>;
    create(path: string, data: string): Promise<TFile>;
    modify(pathOrFile: string | TFile, data: string): Promise<TFile>;
    delete(pathOrFile: string | TFile | TFolder): Promise<void>;
    exists(path: string): Promise<boolean>;
    getFiles(): TFile[];
    getAbstractFileByPath(path: string): TFile | TFolder | null;
    rename(file: TFile | TFolder, newPath: string): Promise<void>;
    getName(): string;
    createFolder(path: string): Promise<TFolder>;
    getAllFolders(): TFolder[];
    adapter: {
        basePath: string;
        read(path: string): Promise<string>;
        getResourcePath(path: string): string;
    };
}

export interface IWorkspaceShim {
    getActiveFile(): TFile | null;
    setActiveFile(file: TFile | null): void;
    openFile(file: TFile): Promise<void>;
    onLayoutReady(cb: () => void): void;
    getLeavesOfType(type: string): Array<any>;
    getLeaf(newLeaf?: boolean): any;
}

export interface IMetadataCacheShim {
    getFileCache(pathOrFile: string | TFile): any | null;
    on(event: string, cb: (...args: any[]) => void): void;
    off(event: string, cb: (...args: any[]) => void): void;
    resolvedLinks: { [filePath: string]: { [linkPath: string]: number } };
}

export interface ICommandsShim {
    addCommand(command: { id: string; name: string; callback: () => void }): void;
    executeCommand(id: string): void;
    listCommands(): Array<{ id: string; name: string }>;
}

export interface IPluginsShim {
    enablePlugin(id: string): Promise<void>;
    disablePlugin(id: string): Promise<void>;
    getPlugin<T = any>(id: string): T | null;
    loadedPlugins: Map<string, any>;
}

// Classe AppShim qui utilise la vraie App d'Obsidian
export default class AppShim {
    vault: IVaultShim;
    workspace: IWorkspaceShim;
    metadataCache: IMetadataCacheShim;
    commands: ICommandsShim;
    plugins: IPluginsShim;

    private realApp: App | null = null;

    constructor(realApp?: App) {
        this.realApp = realApp || null;
        
        if (this.realApp) {
            // Utiliser la vraie App d'Obsidian - créer des wrappers pour compatibilité
            this.vault = this.createVaultWrapper(this.realApp.vault);
            this.workspace = this.createWorkspaceWrapper(this.realApp.workspace);
            this.metadataCache = this.createMetadataCacheWrapper(this.realApp.metadataCache);
            this.commands = this.createCommandsWrapper();
            this.plugins = this.createPluginsWrapper();
        } else {
            // Mode test - utiliser des mocks
            this.vault = this.createMockVault();
            this.workspace = this.createMockWorkspace();
            this.metadataCache = this.createMockMetadataCache();
            this.commands = this.createMockCommands();
            this.plugins = this.createMockPlugins();
        }
    }

    // Factory method pour créer avec la vraie App d'Obsidian
    static createFromObsidianApp(app: App): AppShim {
        return new AppShim(app); 
    }

    // Factory method pour les tests
    static createMock(): AppShim {
        return new AppShim();
    }

    // Getter pour obtenir la vraie App d'Obsidian (nécessaire pour certains composants)
    get realObsidianApp(): App | null {
        return this.realApp;
    }

    private createMockVault(): IVaultShim {
        return {
            read: async () => "mock content",
            create: async (path, data) => {
                // Créer un mock TFile simple
                return {
                    path,
                    name: path.split('/').pop() || path,
                    basename: (path.split('/').pop() || path).replace(/\.[^/.]+$/, ""),
                    extension: path.includes('.') ? path.split('.').pop() || '' : '',
                    stat: { mtime: Date.now(), ctime: Date.now(), size: 0 },
                    vault: null as any,
                    parent: null as any
                } as unknown as TFile;
            },
            modify: async (pathOrFile, data) => {
                if (typeof pathOrFile === 'string') {
                    return {
                        path: pathOrFile,
                        name: pathOrFile.split('/').pop() || pathOrFile,
                        basename: (pathOrFile.split('/').pop() || pathOrFile).replace(/\.[^/.]+$/, ""),
                        extension: pathOrFile.includes('.') ? pathOrFile.split('.').pop() || '' : '',
                        stat: { mtime: Date.now(), ctime: Date.now(), size: 0 },
                        vault: null as any,
                        parent: null as any
                    } as unknown as TFile;
                }
                return pathOrFile;
            },
            delete: async () => {},
            exists: async () => true,
            getFiles: () => [],
            getAbstractFileByPath: () => null,
            rename: async () => {},
            getName: () => "MockVault",
            createFolder: async (path) => ({
                path,
                name: path.split('/').pop() || path,
                children: [],
                isRoot: () => false,
                vault: null as any,
                parent: null as any
            } as unknown as TFolder),
            getAllFolders: () => [],
            adapter: {
                basePath: "/mock-vault",
                read: async () => "mock file content",
                getResourcePath: (path) => `file:///mock-vault/${path}`
            }
        };
    }

    private createMockWorkspace(): IWorkspaceShim {
        return {
            getActiveFile: () => null,
            setActiveFile: () => {},
            openFile: async () => {},
            onLayoutReady: () => {},
            getLeavesOfType: () => [],
            getLeaf: () => null
        };
    }

    private createMockMetadataCache(): IMetadataCacheShim {
        return {
            getFileCache: () => ({ frontmatter: {} }),
            on: () => {},
            off: () => {},
            resolvedLinks: {}
        };
    }

    private createMockCommands(): ICommandsShim {
        return {
            addCommand: () => {},
            executeCommand: () => {},
            listCommands: () => []
        };
    }

    private createMockPlugins(): IPluginsShim {
        return {
            enablePlugin: async () => {},
            disablePlugin: async () => {},
            getPlugin: () => null,
            loadedPlugins: new Map()
        };
    }

    // Wrapper methods pour utiliser la vraie App d'Obsidian
    private createVaultWrapper(realVault: any): IVaultShim {
        return {
            read: (pathOrFile) => realVault.read(pathOrFile),
            create: (path, data) => realVault.create(path, data),
            modify: (pathOrFile, data) => realVault.modify(pathOrFile, data),
            delete: (pathOrFile) => realVault.delete(pathOrFile), // Obsidian's delete accepts TFolder too
            exists: async (path) => await realVault.adapter.exists(path),
            getFiles: () => realVault.getFiles(),
            getAbstractFileByPath: (path) => realVault.getAbstractFileByPath(path),
            rename: (file, newPath) => realVault.rename(file, newPath),
            getName: () => realVault.getName(),
            createFolder: (path) => realVault.createFolder(path),
            getAllFolders: () => realVault.getAllFolders ? realVault.getAllFolders() : [],
            adapter: realVault.adapter
        };
    }

    private createWorkspaceWrapper(realWorkspace: any): IWorkspaceShim {
        return {
            getActiveFile: () => realWorkspace.getActiveFile(),
            setActiveFile: (file) => realWorkspace.setActiveFile(file),
            openFile: (file) => realWorkspace.openLinkText(file.path, ''),
            onLayoutReady: (cb) => realWorkspace.onLayoutReady(cb),
            getLeavesOfType: (type) => realWorkspace.getLeavesOfType(type),
            getLeaf: (newLeaf) => realWorkspace.getLeaf(newLeaf)
        };
    }

    private createMetadataCacheWrapper(realMetadataCache: any): IMetadataCacheShim {
        return {
            getFileCache: (pathOrFile) => realMetadataCache.getFileCache(pathOrFile),
            on: (event, cb) => realMetadataCache.on(event, cb),
            off: (event, cb) => realMetadataCache.off(event, cb),
            resolvedLinks: realMetadataCache.resolvedLinks || {}
        };
    }

    private createCommandsWrapper(): ICommandsShim {
        // Dans Obsidian, les commandes sont dans app.commands
        const commands = (this.realApp as any)?.commands;
        return {
            addCommand: (command) => commands?.addCommand(command),
            executeCommand: (id) => commands?.executeCommandById(id),
            listCommands: () => commands?.listCommands() || []
        };
    }

    private createPluginsWrapper(): IPluginsShim {
        // Dans Obsidian, les plugins sont dans app.plugins
        const plugins = (this.realApp as any)?.plugins;
        return {
            enablePlugin: async (id) => plugins?.enablePlugin(id),
            disablePlugin: async (id) => plugins?.disablePlugin(id),
            getPlugin: (id) => plugins?.getPlugin(id),
            loadedPlugins: plugins?.plugins || new Map()
        };
    }
}