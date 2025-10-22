export class TFile {
    public extension: string;
    
    constructor(public path: string, public name: string, extension?: string) {
        this.extension = extension || 'md';
    }
}

export class TFolder {
    constructor(public path: string, public name: string) {}
}

export class Vault {
    getAbstractFileByPath = jest.fn();
    read = jest.fn();
    createFolder = jest.fn();
    create = jest.fn();
    modify = jest.fn();
    adapter = {
        fs: {
            readFileSync: jest.fn(),
            existsSync: jest.fn(() => true),
            writeFileSync: jest.fn()
        }
    };
}

export class MetadataCache {
    on = jest.fn();
    off = jest.fn();
    getFileCache = jest.fn();
}

export class App {
    vault = new Vault();
    metadataCache = new MetadataCache();
    workspace = {
        on: jest.fn(),
        off: jest.fn()
    };
}

export class Plugin {
    constructor(public app: App, public manifest: any) {}
    
    loadData = jest.fn();
    saveData = jest.fn();
    addRibbonIcon = jest.fn();
    addCommand = jest.fn();
    addSettingTab = jest.fn();
}

export class Component {
    load = jest.fn();
    unload = jest.fn();
    addChild = jest.fn();
    removeChild = jest.fn();
}

export class Setting {
    constructor(public containerEl: HTMLElement) {}
    
    setName = jest.fn().mockReturnThis();
    setDesc = jest.fn().mockReturnThis();
    addText = jest.fn().mockReturnThis();
    addToggle = jest.fn().mockReturnThis();
    addDropdown = jest.fn().mockReturnThis();
}

export class Modal {
    constructor(public app: App) {}
    
    open = jest.fn();
    close = jest.fn();
    onOpen = jest.fn();
    onClose = jest.fn();
}

export class Notice {
    constructor(public message: string, public timeout?: number) {}
}

export const addIcon = jest.fn();
export const setIcon = jest.fn();

// Globals pour les tests
(global as any).app = new App();
  