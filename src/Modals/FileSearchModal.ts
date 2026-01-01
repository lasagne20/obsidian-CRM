import { Classe } from 'markdown-crm';
import { App, TFile, FuzzySuggestModal, FuzzyMatch, prepareFuzzySearch, setIcon } from 'obsidian';

/**
 * Modal to search and select a file in Obsidian
 */
export class FileSearchModal extends FuzzySuggestModal<TFile | string> {
    private onChoose: (file: TFile | string | null) => void;
    private classes: string[];
    private hint: string;
    public choosed: string | TFile | null = null;
    private optionalFilter?: (file: Classe) => boolean;
    private dataItems: any[];
    private vault: any;
    private classIcons: Record<string, string>;
    private cachedItems: (TFile | string)[] | null = null;
    private isLoadingItems: boolean = false;

    constructor(
        app: App,
        vault: any,
        onChoose: (file: TFile | string | null) => void,
        classes: string[] = [],
        args: {
            hint?: string;
            optionalFilter?: (file: Classe) => boolean;
            dataItems?: any[];
            classIcons?: Record<string, string>;
        } = {}
    ) {
        super(app);
        this.onChoose = onChoose; 
        this.classes = classes;
        this.hint = args.hint || "Search for a file or create a new one";
        this.optionalFilter = args.optionalFilter;
        this.dataItems = args.dataItems || [];
        this.vault = vault;
        this.classIcons = args.classIcons || {};
    }

    onOpen() {
        super.onOpen();

        // Create a div to display the hint
        const hintEl = this.containerEl.createDiv("fuzzy-hint");
        hintEl.textContent = this.hint;

        // Add this div before the suggestions list
        const inputContainer = this.containerEl.querySelector(".prompt");
        if (inputContainer) {
            inputContainer.prepend(hintEl);
        }
        
        // Preload items asynchronously if we have an optional filter
        if (this.optionalFilter) {
            this.preloadItems();
        }
    }
    
    async preloadItems(): Promise<void> {
        if (this.isLoadingItems || this.cachedItems) return;
        
        this.isLoadingItems = true;
        console.log("🔄 Preloading items with optionalFilter...");
        
        try {
            const items = await this.getItemsAsync();
            this.cachedItems = items;
            console.log(`✅ Preloaded ${items.length} items`);
        } catch (error) {
            console.error("❌ Error preloading items:", error);
        } finally {
            this.isLoadingItems = false;
        }
    }
    
    async getItemsAsync(): Promise<(TFile | string)[]> {
        const items: (TFile | string)[] = [];
        
        // Get existing files first
        let files = this.app.vault.getMarkdownFiles();
        
        // Filter by class if specified
        if (this.classes.length > 0) {
            files = files.filter(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                // Check main property and all aliases
                const settings = this.vault.app.getSettings() || {};
                const classePropertyName = settings.classePropertyName || 'Classe';
                const classePropertyAliases = settings.classePropertyAliases || ['Classe'];
                
                let className = cache?.frontmatter?.[classePropertyName];
                if (!className) {
                    for (const alias of classePropertyAliases) {
                        className = cache?.frontmatter?.[alias];
                        if (className) break;
                    }
                }
                return this.classes.includes(className);
            });
        }
        console.log("Files after class filtering: ", files.length);
        
        // Apply optional filter if present - convert TFile to Classe first
        if (this.optionalFilter) {
            console.log("Applying optionalFilter to files...");
            const filteredFiles: TFile[] = [];
            
            for (const file of files) {
                try {
                    // Convert TFile to IFile
                    const iFile = {
                        path: file.path,
                        basename: file.basename,
                        extension: file.extension,
                        name: file.name
                    };
                    
                    // Get Classe instance from vault
                    const classe = await this.vault.getFromFile(iFile);
                    console.log(`Filtering file: ${file.path}`, classe);
                    // Apply filter
                    if (classe && this.optionalFilter(classe)) {
                        filteredFiles.push(file);
                    }
                } catch (error) {
                    console.warn(`Error filtering file ${file.path}:`, error);
                }
            }
            
            files = filteredFiles;
            console.log(`Filtered files count: ${files.length}`);
        }
        
        // Add existing files to items
        items.push(...files);
        
        // If there are data items, add them with "Create:" prefix
        // For classes with data, ONLY allow creation from data
        if (this.dataItems && this.dataItems.length > 0) {
            // Get existing file names (with .md) for comparison
            const existingNames = new Set(files.map(f => f.name));
            console.log("Existing file names:", existingNames);
            
            for (const dataItem of this.dataItems) {
                const itemName = dataItem.nom || dataItem.name || dataItem.title || 'Unknown';
                // Only add if file doesn't already exist
                if (!existingNames.has(itemName+".md")) {
                    items.push(`Create: ${itemName}`);
                }
            }
        }

        return items;
    }

    getItems(): (TFile | string)[] {
        // If we have cached items from async loading, use them
        if (this.cachedItems) {
            return this.cachedItems;
        }
        
        // Otherwise, do synchronous loading (without optionalFilter)
        const items: (TFile | string)[] = [];
        
        // Get existing files first
        let files = this.app.vault.getMarkdownFiles();
        
        // Filter by class if specified
        if (this.classes.length > 0) {
            files = files.filter(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                // Check main property and all aliases
                const settings = this.vault.app.getSettings() || {};
                const classePropertyName = settings.classePropertyName || 'Classe';
                const classePropertyAliases = settings.classePropertyAliases || ['Classe'];
                
                let className = cache?.frontmatter?.[classePropertyName];
                if (!className) {
                    for (const alias of classePropertyAliases) {
                        className = cache?.frontmatter?.[alias];
                        if (className) break;
                    }
                }
                return this.classes.includes(className);
            });
        }
        
        // Add existing files to items
        items.push(...files);
        
        // If there are data items, add them with "Create:" prefix
        // For classes with data, ONLY allow creation from data
        if (this.dataItems && this.dataItems.length > 0) {
            // Get existing file names (with .md) for comparison
            const existingNames = new Set(files.map(f => f.name));
            console.log("Existing file names:", existingNames);
            
            for (const dataItem of this.dataItems) {
                const itemName = dataItem.nom || dataItem.name || dataItem.title || 'Unknown';
                // Only add if file doesn't already exist
                if (!existingNames.has(itemName+".md")) {
                    items.push(`Create: ${itemName}`);
                }
            }
        }

        return items;
    }
    
    getSuggestions(query: string): FuzzyMatch<TFile | string>[] {
        
        const results: FuzzyMatch<TFile | string>[] = [];
        const items = this.getItems();
        
        if (!query) {
            // Return first 100 items without query
            for (const item of items.slice(0, 100)) {
                results.push({ item, match: { score: 0, matches: [] } });
            }
            
            console.log(`📋 No query, returning ${results.length} items`);
            return results;
        }
        
        const lowerQuery = query.toLowerCase();
        
        // Search in all items
        for (const item of items) {
            if (typeof item === 'string') {
                // For "Create: XXX" items
                if (item.toLowerCase().includes(lowerQuery)) {
                    results.push({ item, match: { score: 0, matches: [] } });
                }
            } else {
                // For TFile items
                if (item.basename.toLowerCase().includes(lowerQuery)) {
                    results.push({ item, match: { score: 0, matches: [] } });
                }
            }
        }
        
        // If no data items and no results, add manual "Create: {query}" option
        if (((!this.dataItems || this.dataItems.length === 0) && results.length === 0 )) {
            results.unshift({ 
                item: `Create: ${query}`,
                match: { score: 0, matches: [] }
            });
        }
        
        return results.slice(0, 100); // Limit results
    }

    renderSuggestion(item: FuzzyMatch<TFile | string>, el: HTMLElement): void {
        const content = el.createDiv({ cls: "suggestion-content" });
        
        // Get class name and icon
        let className = '';
        let iconName = '';
        let displayText = '';
        
        if (typeof item.item === "string") {
            // For "Create: XXX" items
            if (item.item.startsWith("Create: ") && this.dataItems && this.dataItems.length > 0) {
                const itemName = item.item.substring("Create: ".length);
                const dataItem = this.dataItems.find(d => 
                    (d.nom || d.name) === itemName
                );
                
                if (dataItem) {
                    className = dataItem._className || '';
                    const title = itemName;
                    displayText = `Create: ${title}`;
                    
                    if (this.classes.length > 1 && className) {
                        iconName = this.classIcons[className] || 'folder';
                    }
                } else {
                    displayText = item.item;
                }
            } else {
                displayText = item.item;
            }
        } else {
            // For TFile items
            displayText = item.item.basename;
            
            if (this.classes.length > 1) {
                const cache = this.app.metadataCache.getFileCache(item.item);
                const settings = this.vault?.app?.getSettings() || {};
                const classePropertyName = settings.classePropertyName || 'Classe';
                const classePropertyAliases = settings.classePropertyAliases || ['Classe'];
                
                className = cache?.frontmatter?.[classePropertyName];
                if (!className) {
                    for (const alias of classePropertyAliases) {
                        className = cache?.frontmatter?.[alias];
                        if (className) break;
                    }
                }
                
                if (className) {
                    iconName = this.classIcons[className] || 'folder';
                }
            }
        }
        
        // Add the main text (bold)
        const textEl = content.createSpan({ cls: "suggestion-title" });
        textEl.textContent = displayText;
        
        // Add class info on the right if we have one
        if (iconName && this.classes.length > 1) {
            const classContainer = content.createSpan({ cls: "suggestion-class-container" });
            
            const iconEl = classContainer.createSpan({ cls: "suggestion-icon" });
            setIcon(iconEl, iconName);
            
            const classNameEl = classContainer.createSpan({ cls: "suggestion-class-name" });
            classNameEl.textContent = className;
        }
    }

    getItemText(item: TFile | string): string {
        if (typeof item === "string") {
            // For "Create: XXX" items, try to find the title from data
            if (item.startsWith("Create: ") && this.dataItems && this.dataItems.length > 0) {
                const itemName = item.substring("Create: ".length);
                const dataItem = this.dataItems.find(d => 
                    (d.nom || d.name) === itemName
                );
                
                if (dataItem) {
                    const className = dataItem._className || '';
                    const title = dataItem.title || itemName;
                    // Show class name if multiple classes or if class is specified
                    if (this.classes.length > 1 && className) {
                        const icon = this.classIcons[className] || 'folder';
                        return `${className} • Create: ${title}`;
                    }
                    return `Create: ${title}`;
                }
            }
            return item;
        } else {
            // For TFile items, show class name if multiple classes
            if (this.classes.length > 1) {
                const cache = this.app.metadataCache.getFileCache(item);
                const settings = this.vault?.app?.getSettings() || {};
                const classePropertyName = settings.classePropertyName || 'Classe';
                const classePropertyAliases = settings.classePropertyAliases || ['Classe'];
                
                let className = cache?.frontmatter?.[classePropertyName];
                if (!className) {
                    for (const alias of classePropertyAliases) {
                        className = cache?.frontmatter?.[alias];
                        if (className) break;
                    }
                }
                
                if (className) {
                    const icon = this.classIcons[className] || 'folder';
                    return `${className} • ${item.basename}`;
                }
            }
            return item.basename;
        }
    }

    onChooseItem(item: TFile | string, evt: MouseEvent | KeyboardEvent): void {
        this.choosed = item;
    }

    onClose(): void {
        super.onClose();
        // Wait for the chosen item
        setTimeout(() => {
            this.onChoose(this.choosed);
        }, 100);
    }
}
