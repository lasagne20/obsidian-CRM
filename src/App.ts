import { App, Notice, TFile, TFolder, setIcon } from 'obsidian';
import { IApp, IFile, IFolder } from 'markdown-crm';
import { FileSearchModal, MediaSearchModal, MultiFileSearchModal } from './Modals';

/**
 * ObsidianApp - Adapter implementing IApp interface from markdown-crm library
 * Bridges Obsidian's API to the platform-agnostic IApp interface
 */
export class ObsidianApp implements IApp {
    constructor(private app: App) {}

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

    async renameFile(file: IFile, newPath: string): Promise<void> {
        const tfile = this.app.vault.getAbstractFileByPath(file.path);
        if (tfile instanceof TFile) {
            await this.app.vault.rename(tfile, newPath);
            return;
        }
        throw new Error(`File not found: ${file.path}`);
    }

    async createFolder(path: string): Promise<IFolder> {
        const tfolder = await this.app.vault.createFolder(path);
        return this.toIFolder(tfolder);
    }

    async listFiles(folder?: IFolder): Promise<IFile[]> {
        // Get ALL files, not just markdown files (to include .yaml config files)
        const allFiles = this.app.vault.getAllLoadedFiles();
        const files = allFiles.filter(f => f instanceof TFile) as TFile[];
        
        if (folder) {
            return files
                .filter(f => f.path.startsWith(folder.path))
                .map(f => this.toIFile(f));
        }
        return files.map(f => this.toIFile(f));
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
    public toIFile(tfile: TFile): IFile {
        return {
            path: tfile.path,
            basename: tfile.basename,
            extension: tfile.extension,
            name: tfile.name
        };
    }

    public toIFolder(tfolder: TFolder): IFolder {
        return {
            path: tfolder.path,
            name: tfolder.name,
            children: [] // Obsidian doesn't provide direct access to children
        };
    }

    // Additional IApp methods
    getUrl(): string {
        return 'app://obsidian.md';
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
        await callback();
        // Wait a bit for metadata to update
        await new Promise(resolve => setTimeout(resolve, 100));
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
