import { App, Notice, TFile, TFolder, setIcon } from 'obsidian';
import { IApp, IFile, IFolder, ISettings } from 'markdown-crm';
import { FileSearchModal, MediaSearchModal, MultiFileSearchModal, SelectFromListModal, MultiSelectFromListModal } from './Modals/index';

/**
 * ObsidianApp - Adapter implementing IApp interface from markdown-crm library
 * Bridges Obsidian's API to the platform-agnostic IApp interface
 */
export class ObsidianApp implements IApp {
    private settings: ISettings = {};
    private displayRefreshCallback: (() => void) | null = null;

    constructor(private app: App, settings?: ISettings) {
        if (settings) {
            this.settings = settings;
        }
    }

    /**
     * Set callback to be called when display needs to be refreshed
     */
    setDisplayRefreshCallback(callback: () => void) {
        this.displayRefreshCallback = callback;
    }

    /**
     * Trigger display refresh
     */
    needDisplayRefresh(): void {
        console.log("🔄 needDisplayRefresh called");
        if (this.displayRefreshCallback) {
            this.displayRefreshCallback();
        } else {
            console.warn("⚠️ No display refresh callback registered");
        }
    }

    getVaultPath(): string {
        return this.app.vault.getName();
    }

    getCurrentFile(): IFile | null {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile instanceof TFile) {
            return this.toIFile(activeFile);
        }
        return null;
    }

    async readFile(file: IFile): Promise<string> {
        const tfile = this.app.vault.getAbstractFileByPath(file.path);
        if (tfile instanceof TFile) {
            return await this.app.vault.read(tfile);
        }
        throw new Error(`File not found: ${file.path}`);
    }

    async writeFile(file: IFile, content: string): Promise<void> {
        const tfile = this.app.vault.getAbstractFileByPath(file.path);
        if (tfile instanceof TFile) {
            await this.app.vault.modify(tfile, content);
            return;
        }
        throw new Error(`File not found: ${file.path}`);
    }

    async createFile(path: string, content: string): Promise<IFile> {
        // Ensure parent folders exist
        const folderPath = path.substring(0, path.lastIndexOf('/'));
        if (folderPath) {
            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder) {
                try {
                    await this.app.vault.createFolder(folderPath);
                } catch (error) {
                    // Folder might already exist or be created by concurrent operation
                    console.log(`Note: Could not create folder ${folderPath}:`, error);
                }
            }
        }
        
        const tfile = await this.app.vault.create(path, content);
        return this.toIFile(tfile);
    }

    async delete(file: IFile): Promise<void> {
        const abstractFile = this.app.vault.getAbstractFileByPath(file.path);
        if (abstractFile instanceof TFile || abstractFile instanceof TFolder) {
            try {
                await this.app.vault.delete(abstractFile);
            } catch (error) {
                console.error(`Error deleting ${file.path}:`, error);
                throw error;
            }
            return;
        }
        
        throw new Error(`File or folder not found: ${file.path}`);
    }

    async move(fileOrFolder: IFile | IFolder, newPath: string): Promise<void> {
        const abstractFile = this.app.vault.getAbstractFileByPath(fileOrFolder.path);
        if (!abstractFile) {
            throw new Error(`File or folder not found: ${fileOrFolder.path}`);
        }
        
        console.log(`Moving ${fileOrFolder.path} to ${newPath}`);
        
        try {
            if (abstractFile instanceof TFolder) {
                // Pour les dossiers, vérifier s'il est non vide
                const children = abstractFile.children;
                console.log(`Folder has ${children.length} children`);
                
                if (children.length > 0) {
                    console.log(`Moving non-empty folder with ${children.length} items`);
                }
                
                // Obsidian peut gérer le déplacement de dossiers non vides avec rename
                await this.app.vault.rename(abstractFile, newPath);
                
                // Vérifier que le déplacement a fonctionné
                const movedFolder = this.app.vault.getAbstractFileByPath(newPath);
                if (!movedFolder) {
                    throw new Error(`Failed to move folder: destination not found at ${newPath}`);
                }
                console.log(`Folder successfully moved to ${newPath}`);
            } else {
                // Pour les fichiers, utiliser rename normalement
                await this.app.vault.rename(abstractFile, newPath);
                console.log(`File successfully moved to ${newPath}`);
            }
        } catch (error) {
            console.error(`Error moving ${fileOrFolder.path} to ${newPath}:`, error);
            throw error;
        }
    }

    async createFolder(path: string): Promise<IFolder> {
        const tfolder = await this.app.vault.createFolder(path);
        return this.toIFolder(tfolder);
    }

    async listFiles(folder?: IFolder): Promise<IFile[]> {
        // Get ALL files from vault (including newly created files)
        const files = this.app.vault.getFiles();
        
        const classFiles: IFile[] = [];
        
        for (const file of files) {
            if (folder && !file.path.startsWith(folder.path)) {
                continue;
            }
            classFiles.push(this.toIFile(file));
        }
        
        return classFiles;
    }

    async listFolders(folder?: IFolder): Promise<IFolder[]> {
        const folders: IFolder[] = [];
        const allFolders = this.app.vault.getAllFolders();
        
        for (const tfolder of allFolders) {
            if (!folder || tfolder.path.startsWith(folder.path)) {
                folders.push(this.toIFolder(tfolder));
            }
        }
        console.log(`Found ${folders.length} folders${folder ? ` in folder ${folder.path}` : ''}`);
        console.log(folders);
        return folders;
    }

    async getFile(path: string): Promise<IFile | null> {
        const abstractFile = this.app.vault.getAbstractFileByPath(path);
        if (abstractFile instanceof TFile) {
            return this.toIFile(abstractFile);
        }
        
        // Extraire le nom du fichier du path
        const fileName = path.split('/').pop() || path;
        
        // Chercher dans tous les fichiers de la vault
        const allFiles = this.app.vault.getFiles();
        for (const f of allFiles) {
            if (f.name === fileName || f.path === path) {
                return this.toIFile(f);
            }
        }
        
        return null;
    }

    async getFolder(path: string): Promise<IFolder | null> {
        const abstractFile = this.app.vault.getAbstractFileByPath(path);
        if (abstractFile instanceof TFolder) {
            return this.toIFolder(abstractFile);
        }
        
        // Extraire le nom du dossier du path
        const folderName = path.split('/').pop() || path;
        
        // Chercher dans tous les dossiers de la vault
        const allFolders = this.app.vault.getAllFolders();
        for (const folder of allFolders) {
            if (folder.name === folderName || folder.path === path) {
                return this.toIFolder(folder);
            }
        }
        
        return null;
    }

    getAbsolutePath(relativePath: string): string {
        return (this.app.vault.adapter as any).getBasePath() + '/' + relativePath;
    }

    getName(): string {
        return this.app.vault.getName();
    }

    isFolder(file: IFile): boolean {
        const abstractFile = this.app.vault.getAbstractFileByPath(file.path);
        return abstractFile instanceof TFolder;
    }

    isFile(file: IFile): boolean {
        const abstractFile = this.app.vault.getAbstractFileByPath(file.path);
        return abstractFile instanceof TFile;
    }

    async getMetadata(file: IFile): Promise<any> {
        const cache = this.app.metadataCache.getCache(file.path);
        return cache?.frontmatter || {};
    }

    async updateMetadata(file: IFile, metadata: any): Promise<void> {
        console.log("📝 updateMetadata called for:", file.path, "with data:", metadata);
        const tfile = this.app.vault.getAbstractFileByPath(file.path);
        if (!(tfile instanceof TFile)) {
            console.error("❌ File not found:", file.path);
            throw new Error(`File not found: ${file.path}`);
        }

        // Register the cache-change listener BEFORE writing: Obsidian's
        // metadataCache re-parses the file asynchronously after the write, so
        // without waiting, the next getMetadata() would return the PREVIOUS
        // frontmatter (renames and derived properties one edit behind).
        const cacheChanged = this.waitForMetadataCacheChanged(file.path);

        await this.app.fileManager.processFrontMatter(tfile, (frontmatter) => {
            // Merge new metadata with existing instead of replacing all
            // This preserves properties not included in the metadata parameter
            Object.assign(frontmatter, metadata);
            console.log("✅ Frontmatter updated:", frontmatter);
        });

        await cacheChanged;
    }

    /**
     * Resolve when Obsidian's metadataCache has re-indexed the given file
     * ('changed' event), so subsequent getMetadata() calls return fresh data.
     * Falls back to a safety timeout (1s) if the event never fires (no-op
     * write, cache unavailable), and resolves immediately when there is no
     * metadataCache (test environments).
     */
    private waitForMetadataCacheChanged(filePath: string, timeoutMs: number = 1000): Promise<void> {
        const metadataCache = (this.app as any).metadataCache;
        if (!metadataCache || typeof metadataCache.on !== 'function') {
            return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
            let settled = false;
            let timeout: ReturnType<typeof setTimeout> | undefined;
            const finish = () => {
                if (settled) return;
                settled = true;
                if (timeout !== undefined) clearTimeout(timeout);
                try { metadataCache.off('changed', handler); } catch (e) { /* noop */ }
                resolve();
            };
            const handler = (file: any) => {
                const changedPath = typeof file === 'string' ? file : file?.path;
                if (changedPath === filePath) {
                    finish();
                }
            };
            timeout = setTimeout(finish, timeoutMs);
            metadataCache.on('changed', handler);
        });
    }

    // UI methods
    sendNotice(message: string): void {
        new Notice(message);
    }

    createButton(text: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'mod-cta';
        button.onclick = onClick;
        return button;
    }

    createInput(type: string, value?: string): HTMLInputElement {
        const input = document.createElement('input');
        input.type = type;
        if (value) input.value = value;
        return input;
    }

    createDiv(className?: string): HTMLDivElement {
        const div = document.createElement('div');
        if (className) div.className = className;
        return div;
    }

    setIcon(element: HTMLElement, iconId: string): void {
        // Use Obsidian's setIcon function
        try {
            setIcon(element, iconId);
        } catch (error) {
            console.error('Error setting icon:', iconId, error);
        }
    }

    // Converter helpers - made public so they can be used by the plugin
    public toIFile(tfile: TFile, includeRelations: boolean = true): IFile {
        const parent = (includeRelations && tfile.parent) 
            ? this.toIFolderShallow(tfile.parent as TFolder) 
            : undefined;
        
        // Get children if this is a folder-file (e.g., MyFile/MyFile.md)
        const children: (IFile | IFolder)[] = [];
        if (includeRelations && tfile.parent) {
            const folderName = (tfile.parent as TFolder).name;
            const fileBasename = tfile.basename;
            
            // Check if file is in a folder with the same name (folder-file pattern)
            if (folderName === fileBasename) {
                // Get all children in the parent folder (recursively including subfolders)
                this.collectChildrenRecursive(tfile.parent as TFolder, tfile.path, children);
            }
        }
        
        return {
            path: tfile.path,
            basename: tfile.basename,
            extension: tfile.extension,
            name: tfile.name,
            parent,
            children: children.length > 0 ? children : undefined
        };
    }

    // Helper to collect children recursively from a folder
    private collectChildrenRecursive(folder: TFolder, excludePath: string, result: (IFile | IFolder)[]): void {
        for (const child of folder.children) {
            if (child.path === excludePath) {
                continue; // Skip the file itself
            }
            
            if (child instanceof TFile) {
                result.push(this.toIFile(child, false));
            } else if (child instanceof TFolder) {
                const folderItem = this.toIFolderShallow(child);
                result.push(folderItem);
                // Recurse into subfolder to get nested files
                this.collectChildrenRecursive(child, excludePath, result);
            }
        }
    }

    // Shallow folder conversion - only basic info + parent, no deep children
    private toIFolderShallow(tfolder: TFolder): IFolder {
        const parent = tfolder.parent ? this.toIFolderShallow(tfolder.parent as TFolder) : undefined;
        
        return {
            path: tfolder.path,
            name: tfolder.name,
            children: [],
            parent
        };
    }

    public toIFolder(tfolder: TFolder, includeChildren: boolean = true): IFolder {
        const parent = tfolder.parent ? this.toIFolderShallow(tfolder.parent as TFolder) : undefined;
        
        const children: (IFile | IFolder)[] = [];
        if (includeChildren) {
            for (const child of tfolder.children) {
                if (child instanceof TFile) {
                    children.push(this.toIFile(child, false));
                } else if (child instanceof TFolder) {
                    children.push(this.toIFolder(child, false));
                }
            }
        }
        
        return {
            path: tfolder.path,
            name: tfolder.name,
            children,
            parent
        };
    }

    // Additional IApp methods
    getUrl(path: string): string {
        // First, check if the file exists at the given path
        let actualPath = path;
        const abstractFile = this.app.vault.getAbstractFileByPath(path);
        
        if (!abstractFile || !(abstractFile instanceof TFile)) {
            // File not found at given path, try to find it by filename
            const fileName = path.split('/').pop() || path;
            const allFiles = this.app.vault.getFiles();
            
            // Look for file by name or exact path match
            const foundFile = allFiles.find(f => f.name === fileName || f.path === path);
            
            if (foundFile) {
                actualPath = foundFile.path;
            } else {
                // If still not found, use original path (might be an external reference)
                console.warn(`File not found: ${path}, using original path for URL`);
                actualPath = path;
            }
        }
        
        // Generate Obsidian URI to open file
        // Format: obsidian://open?vault=VaultName&file=path/to/file.md
        const vaultName = encodeURIComponent(this.app.vault.getName());
        const filePath = encodeURIComponent(actualPath);
        return `obsidian://open?vault=${vaultName}&file=${filePath}`;
    }

    async getTemplateContent(templateName: string): Promise<string> {
        const file = await this.getFile(templateName);
        if (file) {
            return await this.readFile(file);
        }
        return '';
    }

    getSetting(key: string): any {
        // Settings are handled by the plugin
        return null;
    }

    async setSetting(key: string, value: any): Promise<void> {
        // Settings are handled by the plugin
    }

    getSettings(): ISettings {
        // Return settings object expected by markdown-crm properties
        return this.settings;
    }

    getFileIcon(extension: string): string {
        return 'document';
    }

    async openFile(file: IFile): Promise<void> {
        const tfile = this.app.vault.getAbstractFileByPath(file.path);
        if (tfile instanceof TFile) {
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(tfile);
        }
    }

    async showInFolder(file: IFile): Promise<void> {
        const tfile = this.app.vault.getAbstractFileByPath(file.path);
        if (tfile instanceof TFile) {
            (this.app.workspace as any).revealInFolder?.(tfile);
        }
    }

    async searchFiles(query: string): Promise<IFile[]> {
        const files = await this.listFiles();
        return files.filter(f => 
            f.name.toLowerCase().includes(query.toLowerCase()) ||
            f.path.toLowerCase().includes(query.toLowerCase())
        );
    }

    async open(url: string): Promise<void> {
        // Check if it's a file path or external URL
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // External URL - open in browser
            window.open(url, '_blank');
        } else {
            // Internal file path - open in Obsidian
            // Remove fragment (anything after #) from the URL
            const filePath = url.split('#')[0];
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (file instanceof TFile) {
                await this.app.workspace.getLeaf().openFile(file);
            } else {
                console.error('File not found:', filePath);
            }
        }
    }

    async waitForFileMetaDataUpdate(filePath: string, key: string, callback: () => Promise<void>): Promise<void> {
        return new Promise((resolve) => {
            let resolved = false;
            
            const handler = (file: any) => {
                if (resolved) return;
                
                // Check if this is the file we're waiting for
                const filePathToCheck = typeof file === 'string' ? file : file?.path;
                if (filePathToCheck === filePath) {
                    // Check if the key exists in metadata
                    const tFile = this.app.vault.getAbstractFileByPath(filePath);
                    if (tFile instanceof TFile) {
                        const metadata = this.app.metadataCache.getFileCache(tFile);
                        if (metadata?.frontmatter?.[key]) {
                            resolved = true;
                            this.app.metadataCache.off('changed', handler);
                            callback().then(() => resolve());
                        }
                    }
                }
            };
            
            // Listen for metadata changes
            this.app.metadataCache.on('changed', handler);
            
            // Fallback timeout after 1 seconds
            setTimeout(() => {
                if (!resolved) {
                    console.warn(`⏱️ Timeout waiting for metadata update on ${filePath}`);
                    resolved = true;
                    this.app.metadataCache.off('changed', handler);
                    callback().then(() => resolve());
                }
            }, 1000);
        });
    }

    async waitForMetaDataCacheUpdate(action: () => Promise<void>): Promise<void> {
        await action();
        // Wait a bit for cache to update
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async selectMedia(vault: any, message: string): Promise<IFile | null> {
        return new Promise((resolve) => {
            const modal = new MediaSearchModal(
                this.app,
                vault,
                (file) => {
                    if (file instanceof TFile) {
                        resolve(this.toIFile(file));
                    } else {
                        resolve(null);
                    }
                },
                message
            );
            modal.open();
        });
    }

    async selectMultipleFile(vault: any, classes: string[], options: any): Promise<(IFile | undefined)[]> {
        console.log(`🔍 [ObsidianApp] selectMultipleFile called - classes: [${classes.join(', ')}]`);
        return new Promise((resolve) => {
            const modal = new MultiFileSearchModal(
                this.app,
                vault,
                async (files) => {
                    console.log(`📥 MultiFileSearch: processing ${files.length} selected item(s)`);
                    // Handle both TFile instances and Create options
                    const resultPromises = files.map(async (f) => {
                        if (f instanceof TFile) {
                            // Handle existing TFile
                            try {
                                const classe = await vault.getFromFile(this.toIFile(f));
                                if (!classe) {
                                    console.warn(`⚠️ getFromFile returned no class for "${f.path}" - the file will be skipped`);
                                    return undefined;
                                }
                                return classe.getFile(); // Return the File object which has getLink()
                            } catch (error) {
                                console.error(`❌ Error loading class from selected file "${f.path}":`, error);
                                this.sendNotice(`Error loading file: ${(error as Error).message}`);
                                return undefined;
                            }
                        } else if (typeof f === 'string' && f.startsWith('Create: ')) {
                            // Handle Create option - replicate the creation logic from openClassFileSuggester
                            const name = f.substring('Create: '.length);
                            console.log(`🆕 Creating new file: ${name}`);
                            
                            try {
                                // Get the class constructor
                                const classeConstructors = (vault.constructor as any).classes;
                                let ClassConstructor = null;
                                
                                for (const className of classes) {
                                    if (classeConstructors[className]) {
                                        ClassConstructor = classeConstructors[className];
                                        break;
                                    }
                                }
                                
                                if (!ClassConstructor) {
                                    throw new Error(`No constructor found for classes: ${classes.join(', ')}`);
                                }
                                
                                // Manual creation without data (for now)
                                console.log(`📝 Creating ${classes[0]} manually: ${name}`);
                                const createdFile = await vault.createFile(ClassConstructor, name);
                                
                                return createdFile;
                            } catch (error) {
                                console.error('Error creating file:', error);
                                this.sendNotice(`Error creating file: ${(error as Error).message}`);
                                return undefined;
                            }
                        }
                        return undefined;
                    });
                    const results = await Promise.all(resultPromises);
                    const validResults = results.filter(r => r !== undefined);
                    console.log(`✅ MultiFileSearch: ${validResults.length}/${files.length} item(s) resolved to File objects`);
                    resolve(validResults);
                },
                classes,
                {
                    hint: options?.hint || "Select files (Enter to select, Ctrl+Space for multi-select)",
                    optionalFilter: options?.validationFunction
                }
            );
            modal.open();
        });
    }

    async selectFile(vault: any, classes: string[], options: any): Promise<IFile | null> {
        // Import ClassFileModals dynamically to avoid circular dependencies
        const { ClassFileModals } = await import('./Modals/Modals');
        return new Promise((resolve) => {
            const classFileModals = new ClassFileModals(
                this.app,
                vault,
                this,
                async () => {} // Empty callback since we don't need metadata update here
            );
            
            // Use openClassFileSuggester with result callback and options
            classFileModals.openClassFileSuggester(classes, (file) => {
                resolve(file);
            }, options);
        });
    }

    async selectClasse(classes: string[]): Promise<string | null> {
        // Would need a custom modal in Obsidian
        return null;
    }

    async selectFromList<T>(
        items: T[],
        options: { multiple: boolean; title?: string }
    ): Promise<T | T[] | null> {
        // Default display function - try to convert to string
        const defaultDisplayFunc = (item: T): string => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) {
                // Try common properties
                const obj = item as any;
                return obj.name || obj.title || obj.label || obj.toString();
            }
            return String(item);
        };

        if (options.multiple) {
            // Multiple selection mode
            return new Promise((resolve) => {
                const modal = new MultiSelectFromListModal<T>(
                    this.app,
                    items,
                    (selectedItems) => {
                        // Return the array of selected items, or null if none selected
                        resolve(selectedItems.length > 0 ? selectedItems : null);
                    },
                    defaultDisplayFunc,
                    options?.title || "Select items from the list (Space to toggle, Enter to confirm)"
                );
                modal.open();
            });
        } else {
            // Single selection mode
            return new Promise((resolve) => {
                const modal = new SelectFromListModal<T>(
                    this.app,
                    items,
                    (selectedItem) => {
                        resolve(selectedItem);
                    },
                    defaultDisplayFunc,
                    options?.title || "Select an item from the list"
                );
                modal.open();
            });
        }
    }
}
