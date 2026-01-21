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
    // Cache for getItemText to avoid repeated normalization and metadata access
    private itemTextCache: WeakMap<TFile, string> = new WeakMap();
    private stringItemTextCache: Map<string, string> = new Map();
    // Index dataItems by name for O(1) lookup instead of O(n) find
    private dataItemsByName: Map<string, any> = new Map();

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
        
        // Build index for fast dataItem lookup
        this.buildDataItemsIndex();
    }
    
    /**
     * Build an index of dataItems by name for O(1) lookup
     */
    private buildDataItemsIndex(): void {
        this.dataItemsByName.clear();
        for (const dataItem of this.dataItems) {
            const name = dataItem.nom || dataItem.name;
            if (name) {
                this.dataItemsByName.set(name, dataItem);
            }
        }
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
            // Clear cache when items change
            this.clearItemTextCache();
            console.log(`✅ Preloaded ${items.length} items`);
        } catch (error) {
            console.error("❌ Error preloading items:", error);
        } finally {
            this.isLoadingItems = false;
        }
    }
    
    /**
     * Clear the item text cache
     */
    private clearItemTextCache(): void {
        this.stringItemTextCache.clear();
        // WeakMap doesn't have clear(), but it will be garbage collected automatically
        this.itemTextCache = new WeakMap();
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
            const items = [...this.cachedItems];
            // Add dynamic Create option based on input
            this.addCreateOption(items);
            return items;
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
            
            for (const dataItem of this.dataItems) {
                const itemName = dataItem.nom || dataItem.name || dataItem.title || 'Unknown';
                // Only add if file doesn't already exist
                if (!existingNames.has(itemName+".md")) {
                    items.push(`Create: ${itemName}`);
                }
            }
        }
        
        // Add dynamic Create option based on input
        this.addCreateOption(items);

        return items;
    }
    
    /**
     * Add dynamic "Create: XXX" option based on current input value
     * Only adds if no dataItems or if dataItems don't cover all classes
     */
    private addCreateOption(items: (TFile | string)[]): void {
        // Get current input value (if modal is open)
        const inputValue = this.inputEl?.value?.trim();
        if (!inputValue) {
            return;
        }
        
        // Check if we should show generic create option
        const shouldShowGenericCreate = !this.dataItems || this.dataItems.length === 0 || 
            (this.classes.length > 0 && !this.allClassesCoveredByDataItems());
        
        if (shouldShowGenericCreate) {
            const createOption = `Create: ${inputValue}`;
            // Add at the beginning so it appears first in suggestions
            items.unshift(createOption);
        }
    }
    
    /**
     * Vérifie si toutes les classes spécifiées sont couvertes par les dataItems
     */
    private allClassesCoveredByDataItems(): boolean {
        if (!this.classes.length || !this.dataItems || !this.dataItems.length) {
            return false;
        }
        
        // Obtenir les classes uniques présentes dans les dataItems
        const dataItemClasses = new Set(
            this.dataItems
                .map(item => item._className)
                .filter(className => className) // Enlever les undefined/null
        );
        
        // Vérifier si toutes les classes spécifiées sont dans les dataItems
        return this.classes.every(classe => dataItemClasses.has(classe));
    }

    // Normalize text to remove accents and diacritics for accent-insensitive search
    private normalizeText(text: string): string {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    /**
     * Get suggestions for a query using Obsidian's native fuzzy matching
     * This delegates to the parent FuzzySuggestModal which uses getItemText()
     * Normalizes the query to handle accents in search
     */
    getSuggestions(query: string): FuzzyMatch<TFile | string>[] {
        // Normalize query to remove accents for matching
        const normalizedQuery = this.normalizeText(query);
        // Call parent's getSuggestions which will use our getItemText() for matching
        return super.getSuggestions(normalizedQuery);
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
                // Use index for O(1) lookup instead of O(n) find
                const dataItem = this.dataItemsByName.get(itemName);
                
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

    /**
     * Get the display text for an item
     * This method is used by Obsidian for fuzzy matching and display
     * Returns normalized text (without accents) for better matching
     * Uses caching to avoid repeated normalization and metadata access
     */
    getItemText(item: TFile | string): string {
        // Check cache first
        if (typeof item === "string") {
            const cached = this.stringItemTextCache.get(item);
            if (cached !== undefined) return cached;
        } else {
            const cached = this.itemTextCache.get(item);
            if (cached !== undefined) return cached;
        }
        
        let text: string;
        
        if (typeof item === "string") {
            // For "Create: XXX" items, try to find the title from data
            if (item.startsWith("Create: ") && this.dataItems && this.dataItems.length > 0) {
                const itemName = item.substring("Create: ".length);
                // Use index for O(1) lookup instead of O(n) find
                const dataItem = this.dataItemsByName.get(itemName);
                
                if (dataItem) {
                    const className = dataItem._className || '';
                    const title = dataItem.title || itemName;
                    // Show class name if multiple classes or if class is specified
                    if (this.classes.length > 1 && className) {
                        text = `${className} • Create: ${title}`;
                    } else {
                        text = `Create: ${title}`;
                    }
                } else {
                    text = item;
                }
            } else {
                text = item;
            }
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
                    text = `${className} • ${item.basename}`;
                } else {
                    text = item.basename;
                }
            } else {
                text = item.basename;
            }
        }
        
        // Normalize text for fuzzy matching (remove accents)
        const normalized = this.normalizeText(text);
        
        // Store in cache
        if (typeof item === "string") {
            this.stringItemTextCache.set(item, normalized);
        } else {
            this.itemTextCache.set(item, normalized);
        }
        
        return normalized;
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
