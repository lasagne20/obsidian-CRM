import { App, Notice, TFile, TFolder, setIcon } from 'obsidian';
import { IApp, IFile, IFolder, ISettings } from 'markdown-crm';
import { FileSearchModal, MediaSearchModal, MultiFileSearchModal } from './Modals';

/**
 * ObsidianApp - Adapter implementing IApp interface from markdown-crm library
 * Bridges Obsidian's API to the platform-agnostic IApp interface
 */
export class ObsidianApp implements IApp {
    private settings: ISettings = {};

    constructor(private app: App, settings?: ISettings) {
        if (settings) {
            this.settings = settings;
        }
    }

    getVaultPath(): string {
        return this.app.vault.getName();
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
        const tfile = await this.app.vault.create(path, content);
        return this.toIFile(tfile);
    }

    async delete(file: IFile): Promise<void> {
        const tfile = this.app.vault.getAbstractFileByPath(file.path);
        if (tfile instanceof TFile) {
            await this.app.vault.delete(tfile);
            return;
        }
        throw new Error(`File not found: ${file.path}`);
    }

    async move(fileOrFolder: IFile | IFolder, newPath: string): Promise<void> {
        const abstractFile = this.app.vault.getAbstractFileByPath(fileOrFolder.path);
        if (!abstractFile) {
            throw new Error(`File or folder not found: ${fileOrFolder.path}`);
        }
        
        await this.app.vault.rename(abstractFile, newPath);
    }

    async createFolder(path: string): Promise<IFolder> {
        const tfolder = await this.app.vault.createFolder(path);
        return this.toIFolder(tfolder);
    }

    async listFiles(folder?: IFolder): Promise<IFile[]> {
        // Get ALL files, not just markdown files (to include .yaml config files)
        const allFiles = this.app.vault.getAllLoadedFiles();
        const files = allFiles.filter(f => f instanceof TFile) as TFile[];
        
        // Filter out files that don't have a Classe in frontmatter
        // This prevents markdown-crm from trying to create classes for non-class files
        const classFiles: IFile[] = [];
        
        for (const file of files) {
            if (folder && !file.path.startsWith(folder.path)) {
                continue;
            }
            
            // Check if file has Classe in frontmatter
            const cache = this.app.metadataCache.getCache(file.path);
            if (cache?.frontmatter?.Classe) {
                classFiles.push(this.toIFile(file));
            }
        }
        
        return classFiles;
    }

    async listFolders(folder?: IFolder): Promise<IFolder[]> {
        const folders: IFolder[] = [];
        const allFiles = this.app.vault.getAllLoadedFiles();
        
        for (const file of allFiles) {
            if (file instanceof TFolder) {
                if (!folder || file.path.startsWith(folder.path)) {
                    folders.push(this.toIFolder(file));
                }
            }
        }
        return folders;
    }

    async getFile(path: string): Promise<IFile | null> {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile) {
            return this.toIFile(file);
        }
        return null;
    }

    getAbsolutePath(relativePath: string): string {
        // @ts-ignore - getBasePath exists but not in types
        return this.app.vault.adapter.getBasePath() + '/' + relativePath;
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

        await this.app.fileManager.processFrontMatter(tfile, (frontmatter) => {
            Object.assign(frontmatter, metadata);
            console.log("✅ Frontmatter updated:", frontmatter);
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
            ? this.toIFolderShallow(tfile.parent) 
            : undefined;
        
        // Get children if this is a folder-file (e.g., MyFile/MyFile.md)
        const children: (IFile | IFolder)[] = [];
        if (includeRelations && tfile.parent) {
            const folderName = tfile.parent.name;
            const fileBasename = tfile.basename;
            
            // Check if file is in a folder with the same name (folder-file pattern)
            if (folderName === fileBasename) {
                // Get all children in the parent folder (recursively including subfolders)
                this.collectChildrenRecursive(tfile.parent, tfile.path, children);
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
        const parent = tfolder.parent ? this.toIFolderShallow(tfolder.parent) : undefined;
        
        return {
            path: tfolder.path,
            name: tfolder.name,
            children: [],
            parent
        };
    }

    public toIFolder(tfolder: TFolder, includeChildren: boolean = true): IFolder {
        const parent = tfolder.parent ? this.toIFolderShallow(tfolder.parent) : undefined;
        
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
        // Generate Obsidian URI to open file
        // Format: obsidian://open?vault=VaultName&file=path/to/file.md
        const vaultName = encodeURIComponent(this.app.vault.getName());
        const filePath = encodeURIComponent(path);
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
            // @ts-ignore
            this.app.workspace.revealInFolder?.(tfile);
        }
    }

    async copyToClipboard(text: string): Promise<void> {
        await navigator.clipboard.writeText(text);
    }

    getOS(): string {
        // @ts-ignore
        return this.app.platform || 'unknown';
    }

    async searchFiles(query: string): Promise<IFile[]> {
        const files = await this.listFiles();
        return files.filter(f => 
            f.name.toLowerCase().includes(query.toLowerCase()) ||
            f.path.toLowerCase().includes(query.toLowerCase())
        );
    }

    async open(url: string): Promise<void> {
        window.open(url, '_blank');
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
            
            // Fallback timeout after 5 seconds
            setTimeout(() => {
                if (!resolved) {
                    console.warn(`⏱️ Timeout waiting for metadata update on ${filePath}`);
                    resolved = true;
                    this.app.metadataCache.off('changed', handler);
                    callback().then(() => resolve());
                }
            }, 5000);
        });
    }

    async waitForMetaDataCacheUpdate(action: () => Promise<void>): Promise<void> {
        await action();
        // Wait a bit for cache to update
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async selectMedia(): Promise<IFile | null> {
        return new Promise((resolve) => {
            const modal = new MediaSearchModal(
                this.app,
                (file) => {
                    if (file instanceof TFile) {
                        resolve(this.toIFile(file));
                    } else {
                        resolve(null);
                    }
                },
                "Select a media file"
            );
            modal.open();
        });
    }

    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    async saveJson(file: IFile, data: any): Promise<void> {
        const content = JSON.stringify(data, null, 2);
        await this.writeFile(file, content);
    }

    async selectMultipleFile(vault: any, classes: string[], options: any): Promise<any[]> {
        return new Promise((resolve) => {
            const modal = new MultiFileSearchModal(
                this.app,
                async (files) => {
                    // Get Classe instances from vault for each file, then extract File
                    const classePromises = files.map(async (f) => {
                        const classe = await vault.getFromFile(this.toIFile(f));
                        return classe?.getFile(); // Return the File object which has getLink()
                    });
                    const fileObjects = await Promise.all(classePromises);
                    resolve(fileObjects.filter(f => f !== undefined));
                },
                classes,
                {
                    hint: options?.hint || "Select multiple files (use Space to select/deselect)"
                }
            );
            modal.open();
        });
    }

    async selectFile(vault: any, classes: string[], options: any): Promise<any> {
        return new Promise((resolve) => {
            const modal = new FileSearchModal(
                this.app,
                async (file) => {
                    if (file instanceof TFile) {
                        // Get Classe instance from vault, then return its File object
                        const classe = await vault.getFromFile(this.toIFile(file));
                        const fileObj = classe?.getFile(); // File has getLink() method
                        resolve(fileObj);
                    } else if (typeof file === 'string') {
                        // Handle "Create: filename" format - create new file
                        const filename = file.replace(/^Create:\s*/, '').trim();
                        // TODO: Create file through vault
                        resolve(null);
                    } else {
                        resolve(null);
                    }
                },
                classes,
                {
                    hint: options?.hint || "Select a file or create a new one"
                }
            );
            modal.open();
        });
    }

    async selectClasse(classes: string[]): Promise<string | null> {
        // Would need a custom modal in Obsidian
        return null;
    }
}
