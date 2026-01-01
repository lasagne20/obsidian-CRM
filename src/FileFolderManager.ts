import { App, Menu, TAbstractFile, TFile, TFolder } from 'obsidian';

export interface FolderNoteSettings {
    enabled: boolean;
    position: 'inside' | 'outside';
    hideInFileExplorer: boolean;
    underlineFolderWithNote: boolean;
}

export class FileFolderManager {
    private app: App;
    private settings: FolderNoteSettings;
    private styleEl: HTMLStyleElement | null = null;
    private vault: any; // Vault from markdown-crm
    private observer: MutationObserver | null = null;

    constructor(app: App, settings: FolderNoteSettings, vault?: any) {
        this.app = app;
        this.settings = settings;
        this.vault = vault;
    }

    /**
     * Initialize the folder note manager
     */
    initialize() {
        console.log("📁 FileFolderManager: Initializing with settings:", this.settings);
        
        if (this.settings.enabled) {
            this.applyStyles();
            
            // Initial update with delay to ensure DOM is ready
            setTimeout(() => {
                this.updateAllFolderStyles();
            }, 500);
            
            // Watch for file explorer DOM changes
            this.setupDOMObserver();
            
            // Setup breadcrumb click handlers
            this.setupBreadcrumbHandlers();
            
            console.log("✅ FileFolderManager: Initialized");
        } else {
            console.log("⚠️ FileFolderManager: Disabled in settings");
        }
    }

    /**
     * Setup click handlers for breadcrumbs to open folder notes
     */
    private setupBreadcrumbHandlers() {
        // Watch for breadcrumb clicks
        this.app.workspace.on('layout-change', () => {
            setTimeout(() => {
                const breadcrumbs = document.querySelectorAll('.view-header-breadcrumb');
                breadcrumbs.forEach((breadcrumb) => {
                    if ((breadcrumb as any)._folderNoteHandler) return;
                    
                    const handler = (evt: MouseEvent) => {
                        evt.preventDefault();
                        evt.stopPropagation();
                        
                        const folderName = breadcrumb.getAttribute('aria-label');
                        if (!folderName) return;
                        
                        // Find folder by name in the vault
                        const folders = this.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder && f.name === folderName);
                        
                        for (const folder of folders) {
                            if (this.hasFolderNote(folder as TFolder)) {
                                const notePath = this.getFolderNotePath(folder as TFolder);
                                const file = this.app.vault.getAbstractFileByPath(notePath);
                                
                                if (file instanceof TFile) {
                                    this.app.workspace.getLeaf().openFile(file);
                                    return;
                                }
                            }
                        }
                    };
                    
                    breadcrumb.addEventListener('click', handler);
                    (breadcrumb as any)._folderNoteHandler = handler;
                });
            }, 100);
        });
    }

    /**
     * Setup DOM observer to watch for file explorer changes
     */
    private setupDOMObserver() {
        // Cleanup existing observer
        if (this.observer) {
            this.observer.disconnect();
        }

        // Wait for file explorer to be ready
        const checkFileExplorer = () => {
            const leaves = this.app.workspace.getLeavesOfType('file-explorer');
            if (leaves.length === 0) {
                setTimeout(checkFileExplorer, 500);
                return;
            }

            const fileExplorer = leaves[0];
            const view = (fileExplorer.view as any);
            
            if (!view || !view.containerEl) {
                setTimeout(checkFileExplorer, 500);
                return;
            }

            // Create observer to watch for DOM changes in file explorer
            this.observer = new MutationObserver(() => {
                // Debounce updates
                if ((this as any)._updateTimeout) {
                    clearTimeout((this as any)._updateTimeout);
                }
                (this as any)._updateTimeout = setTimeout(() => {
                    this.updateAllFolderStyles();
                }, 100);
            });

            // Observe the file explorer tree
            this.observer.observe(view.containerEl, {
                childList: true,
                subtree: true,
                attributes: false
            });

            console.log("✅ FileFolderManager: DOM observer setup");
        };

        checkFileExplorer();
    }

    /**
     * Apply CSS styles for folder notes
     */
    applyStyles() {
        // Remove existing style if present
        if (this.styleEl) {
            this.styleEl.remove();
        }

        this.styleEl = document.createElement('style');
        this.styleEl.id = 'crm-folder-notes-style';
        
        let css = '';

        // Underline folders that have a folder note
        if (this.settings.underlineFolderWithNote) {
            css += `
                /* Soulignement subtil pour les dossiers avec folder note */
                .tree-item-self.nav-folder-title.has-folder-note .nav-folder-title-content {
                    text-decoration: underline;
                    text-decoration-color: var(--text-accent);
                    text-decoration-thickness: 1px;
                    text-underline-offset: 2px;
                }
            `;
        }

        // Hide folder notes from file explorer
        if (this.settings.hideInFileExplorer) {
            css += `
                .tree-item.nav-file .tree-item-self.is-folder-note {
                    display: none !important;
                }
            `;
        }

        if (css) {
            this.styleEl.textContent = css;
            document.head.appendChild(this.styleEl);
            console.log("✅ FileFolderManager: CSS styles applied");
        }
    }

    /**
     * Remove applied styles
     */
    removeStyles() {
        if (this.styleEl) {
            this.styleEl.remove();
            this.styleEl = null;
        }
    }

    /**
     * Update settings
     */
    updateSettings(settings: FolderNoteSettings) {
        this.settings = settings;
        this.removeStyles();
        if (this.settings.enabled) {
            this.applyStyles();
            this.updateAllFolderStyles();
        } else {
            this.removeAllFolderClasses();
        }
    }

    /**
     * Get the folder note path for a folder
     */
    getFolderNotePath(folder: TFolder): string {
        const folderName = folder.name;
        if (this.settings.position === 'inside') {
            return `${folder.path}/${folderName}.md`;
        } else {
            const parentPath = folder.path.substring(0, folder.path.lastIndexOf('/'));
            return parentPath ? `${parentPath}/${folderName}.md` : `${folderName}.md`;
        }
    }

    /**
     * Check if a file is a folder note
     */
    isFolderNote(file: TFile): boolean {
        const folder = this.getFolderForNote(file);
        return folder !== null;
    }

    /**
     * Get the folder associated with a folder note
     */
    getFolderForNote(file: TFile): TFolder | null {
        const fileName = file.basename;
        const parentFolder = file.parent;
        
        if (!parentFolder) return null;

        // Check if this is an "inside" folder note
        if (this.settings.position === 'inside') {
            if (parentFolder.name === fileName) {
                return parentFolder;
            }
        }
        
        // Check if this is an "outside" folder note
        if (this.settings.position === 'outside') {
            const siblingFolder = parentFolder.children.find(
                child => child instanceof TFolder && child.name === fileName
            );
            if (siblingFolder instanceof TFolder) {
                return siblingFolder;
            }
        }

        return null;
    }

    /**
     * Get the folder associated with a folder note using old path and name
     */
    getFolderForNoteByName(oldPath: string, oldFileName: string): TFolder | null {
        const oldParentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
        const parentFolder = this.app.vault.getAbstractFileByPath(oldParentPath);
        
        if (!parentFolder || !(parentFolder instanceof TFolder)) return null;

        // Check if this is an "inside" folder note
        if (this.settings.position === 'inside') {
            if (parentFolder.name === oldFileName) {
                return parentFolder;
            }
        }
        
        // Check if this is an "outside" folder note
        if (this.settings.position === 'outside') {
            const siblingFolder = parentFolder.children.find(
                child => child instanceof TFolder && child.name === oldFileName
            );
            if (siblingFolder instanceof TFolder) {
                return siblingFolder;
            }
        }

        return null;
    }

    /**
     * Check if a folder has a folder note
     */
    hasFolderNote(folder: TFolder): boolean {
        const notePath = this.getFolderNotePath(folder);
        const file = this.app.vault.getAbstractFileByPath(notePath);
        return file instanceof TFile;
    }

    /**
     * Update folder classes in the file explorer
     */
    updateAllFolderStyles() {
        if (!this.settings.enabled) return;

        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            let foldersWithNotes = 0;
            let hiddenFiles = 0;
            
            // Process all folders
            this.app.vault.getAllLoadedFiles().forEach(file => {
                if (file instanceof TFolder) {
                    if (this.hasFolderNote(file)) {
                        this.updateFolderStyle(file);
                        foldersWithNotes++;
                    }
                } else if (file instanceof TFile) {
                    if (this.isFolderNote(file)) {
                        this.updateFileStyle(file);
                        hiddenFiles++;
                    }
                }
            });
            
            if (foldersWithNotes > 0 || hiddenFiles > 0) {
                console.log(`📁 Found ${foldersWithNotes} folders with notes and ${hiddenFiles} folder notes to hide`);
            }
        }, 100);
    }

    /**
     * Update style for a specific folder
     */
    updateFolderStyle(folder: TFolder) {
        if (!this.settings.enabled) return;

        const hasFolderNote = this.hasFolderNote(folder);
        const folderEl = this.getFolderElement(folder);
        
        if (!folderEl) {
            // Retry after a delay if element not found
            setTimeout(() => {
                const el = this.getFolderElement(folder);
                if (el && this.hasFolderNote(folder)) {
                    el.classList.add('has-folder-note');
                    this.makeFolderClickable(folder, el);
                }
            }, 200);
            return;
        }

        if (hasFolderNote) {
            folderEl.classList.add('has-folder-note');
            this.makeFolderClickable(folder, folderEl);
        } else {
            folderEl.classList.remove('has-folder-note');
        }
    }

    /**
     * Make folder clickable to open its folder note
     */
    private makeFolderClickable(folder: TFolder, folderEl: HTMLElement) {
        const titleEl = folderEl.querySelector('.nav-folder-title-content');
        if (!titleEl) return;

        // Remove any existing listener
        const oldListener = (titleEl as any)._folderNoteListener;
        if (oldListener) {
            titleEl.removeEventListener('click', oldListener);
        }

        // Add click listener - simple click opens the note if file is hidden
        const listener = (evt: MouseEvent) => {
            // Only handle left click when hideInFileExplorer is enabled
            if (evt.button === 0 && this.settings.hideInFileExplorer) {
                evt.preventDefault();
                evt.stopPropagation();
                
                const notePath = this.getFolderNotePath(folder);
                const file = this.app.vault.getAbstractFileByPath(notePath);
                
                if (file instanceof TFile) {
                    this.app.workspace.getLeaf().openFile(file);
                }
            }
        };

        titleEl.addEventListener('click', listener, true);
        (titleEl as any)._folderNoteListener = listener;

        // Add visual hint with cursor
        (titleEl as HTMLElement).style.cursor = 'pointer';
        (titleEl as HTMLElement).title = 'Cliquer pour ouvrir la note du dossier';
    }

    /**
     * Update style for a specific file
     */
    updateFileStyle(file: TFile) {
        if (!this.settings.enabled) return;

        const isFolderNote = this.isFolderNote(file);
        const fileEl = this.getFileElement(file);
        
        if (!fileEl) {
            // Retry after a delay if element not found
            setTimeout(() => {
                const el = this.getFileElement(file);
                if (el) {
                    if (this.isFolderNote(file)) {
                        el.classList.add('is-folder-note');
                    } else {
                        el.classList.remove('is-folder-note');
                    }
                }
            }, 200);
            return;
        }

        if (isFolderNote) {
            fileEl.classList.add('is-folder-note');
        } else {
            fileEl.classList.remove('is-folder-note');
        }
    }

    /**
     * Remove folder classes from all folders
     */
    removeAllFolderClasses() {
        const folderElements = document.querySelectorAll('.tree-item-self.nav-folder-title.has-folder-note');
        folderElements.forEach(el => el.classList.remove('has-folder-note'));

        const fileElements = document.querySelectorAll('.tree-item-self.nav-file-title.is-folder-note');
        fileElements.forEach(el => el.classList.remove('is-folder-note'));
    }

    /**
     * Get DOM element for a folder
     */
    private getFolderElement(folder: TFolder): HTMLElement | null {
        const leaves = this.app.workspace.getLeavesOfType('file-explorer');
        if (leaves.length === 0) return null;

        const fileExplorer = leaves[0];
        const view = fileExplorer.view as any;
        
        if (!view || !view.fileItems) return null;

        const folderItem = view.fileItems[folder.path];
        if (!folderItem || !folderItem.selfEl) return null;

        // selfEl IS already the .tree-item-self.nav-folder-title element
        return folderItem.selfEl;
    }

    /**
     * Get DOM element for a file
     */
    private getFileElement(file: TFile): HTMLElement | null {
        const leaves = this.app.workspace.getLeavesOfType('file-explorer');
        if (leaves.length === 0) return null;

        const fileExplorer = leaves[0];
        const view = fileExplorer.view as any;
        
        if (!view || !view.fileItems) return null;

        const fileItem = view.fileItems[file.path];
        if (!fileItem || !fileItem.selfEl) return null;

        // selfEl IS already the .tree-item-self.nav-file-title element
        return fileItem.selfEl;
    }

    /**
     * Handle file/folder creation
     */
    onFileCreated(file: TAbstractFile) {
        if (!this.settings.enabled) return;

        if (file instanceof TFolder) {
            this.updateFolderStyle(file);
        } else if (file instanceof TFile) {
            this.updateFileStyle(file);
            
            // Update parent folder if this is a folder note
            const folder = this.getFolderForNote(file);
            if (folder) {
                this.updateFolderStyle(folder);
            }
        }
    }

    /**
     * Handle file/folder deletion
     */
    onFileDeleted(file: TAbstractFile) {
        if (!this.settings.enabled) return;

        if (file instanceof TFile) {
            // Update parent folder if this was a folder note
            const folder = this.getFolderForNote(file);
            if (folder) {
                this.updateFolderStyle(folder);
            }
        }
    }

    /**
     * Handle file/folder rename
     */
    async onFileRenamed(file: TAbstractFile, oldPath: string) {
        if (!this.settings.enabled) return;

        if (file instanceof TFolder) {
            this.updateFolderStyle(file);
        } else if (file instanceof TFile) {
            // Extract old file name without extension
            const oldFileName = oldPath.split('/').pop()?.replace(/\.md$/, '') || '';
            const newFileName = file.basename;
            
            console.log(`📁 File renamed from "${oldFileName}" to "${newFileName}"`);
            
            // Check if this was a folder note using the old file name
            const folder = this.getFolderForNoteByName(oldPath, oldFileName);
            
            console.log(`Associated folder:`, folder);
            if (folder && oldFileName !== newFileName) {
                // Add delay to let Obsidian finish its automatic link updates first
                setTimeout(async () => {
                    try {
                        // Calculate new folder path
                        const newFolderPath = folder.path.replace(new RegExp(`/${folder.name}$`), `/${newFileName}`);
                        
                        console.log(`📁 Renaming folder from "${folder.path}" to "${newFolderPath}" to match renamed file "${file.name}"`);
                        
                        // Rename the folder to match the new file name
                        await this.app.vault.rename(folder, newFolderPath);
                        
                    } catch (error) {
                        console.error(`❌ Failed to rename folder for file "${file.name}":`, error);
                    }
                }, 500); // 500ms delay to let Obsidian finish its link updates
            }
            
            this.updateFileStyle(file);
            
            // Update folders
            if (folder) {
                this.updateFolderStyle(folder);
            }

            // Also check old location
            const oldParent = oldPath.substring(0, oldPath.lastIndexOf('/'));
            const oldParentFolder = this.app.vault.getAbstractFileByPath(oldParent);
            if (oldParentFolder instanceof TFolder) {
                this.updateFolderStyle(oldParentFolder);
            }
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if ((this as any)._updateTimeout) {
            clearTimeout((this as any)._updateTimeout);
        }
        this.removeStyles();
        this.removeAllFolderClasses();
    }

    /**
     * Set the vault instance (for creating folder notes with proper classes)
     */
    setVault(vault: any) {
        this.vault = vault;
    }

    /**
     * Register event handlers for folder notes (to be called by plugin)
     */
    registerEvents(plugin: any) {
        // Watch for folder creation
      

        // Add folder note option to folder context menu
        plugin.registerEvent(
            this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
                if (file instanceof TFile) return; // Only for folders
                
                menu.addItem((item) =>
                    item
                        .setTitle('Créer/Ouvrir la note du dossier')
                        .setIcon('folder')
                        .onClick(async () => {
                            const folderNote = this.getFolderNotePath(file as TFolder);
                            const existingFile = this.app.vault.getAbstractFileByPath(folderNote);
                            
                            if (existingFile instanceof TFile) {
                                await this.app.workspace.getLeaf().openFile(existingFile);
                            } 
                            
                        })
                );
            })
        );
    }

    /**
     * Register commands for folder notes (to be called by plugin)
     */
    registerCommands(plugin: any) {
        // Add command to create folder note for existing folder
        plugin.addCommand({
            id: 'create-folder-note',
            name: 'Créer une note pour ce dossier',
            callback: async () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile) return;
                
                const folder = activeFile.parent;
            }
        });
    }
}

