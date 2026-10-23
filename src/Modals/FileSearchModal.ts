import { Classe } from 'markdown-crm';
import { App, TFile, FuzzySuggestModal, FuzzyMatch, prepareFuzzySearch, setIcon } from 'obsidian';

/** Chip de propriété affichée sur la ligne d'un résultat de recherche */
export interface SearchChip {
    name: string;                                        // Property name
    icon?: string;                                       // Lucide icon
    color?: string;                                      // Explicit CSS color (overrides select option color)
    type?: string;                                       // 'date' | 'dateRange' -> French short format
    options?: Array<{ name: string; color?: string }>;   // SelectProperty options (color by value)
}

/** Search modal customization resolved from the class config `search` section */
export interface SearchModalConfig {
    properties?: SearchChip[];
    sort?: string;
    sortDirection?: 'asc' | 'desc';
    titleTemplate?: string;
}

/**
 * Map config color names to Obsidian theme variables so chips follow the
 * active theme instead of raw CSS colors. Obsidian exposes color accents
 * as RGB triplets (use with rgb()); unknown names fall back to raw value.
 */
const OBSIDIAN_COLOR_MAP: Record<string, string> = {
    red: 'rgb(var(--color-red, 185, 93, 93))',
    orange: 'rgb(var(--color-orange, 231, 160, 55))',
    yellow: 'rgb(var(--color-yellow, 244, 226, 141))',
    gold: 'rgb(var(--color-yellow, 244, 226, 141))',
    green: 'rgb(var(--color-green, 110, 160, 120))',
    cyan: 'rgb(var(--color-cyan, 90, 190, 200))',
    blue: 'rgb(var(--color-blue, 90, 150, 220))',
    purple: 'rgb(var(--color-purple, 160, 120, 220))',
    pink: 'rgb(var(--color-pink, 220, 120, 180))',
    gray: 'var(--text-muted, gray)',
    grey: 'var(--text-muted, gray)',
    black: 'var(--text-normal, black)'
};

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
    // Search customization (chips, sort, title cleanup)
    private searchConfig?: SearchModalConfig;
    // Property values per file for chips and sorting (built by preloadSearchValues)
    private searchValues: Map<TFile, Record<string, any>> = new Map();
    // Regex stripping the rename-template prefix from displayed titles
    private titleStripRegex: RegExp | null = null;

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
            searchConfig?: SearchModalConfig;
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
        this.searchConfig = args.searchConfig;
        this.titleStripRegex = this.buildTitleStripRegex(this.searchConfig?.titleTemplate);

        // Build index for fast dataItem lookup
        this.buildDataItemsIndex();
    }

    /**
     * Build the regex stripping the rename-template prefix from titles.
     * The part of titleTemplate BEFORE {current} is the generated prefix
     * (e.g. "{animations[0].date} - Action - "): placeholders become
     * non-greedy wildcards, literal parts are matched exactly.
     */
    private buildTitleStripRegex(titleTemplate?: string): RegExp | null {
        if (!titleTemplate) return null;
        const markerIndex = titleTemplate.indexOf('{current}');
        if (markerIndex <= 0) return null;
        const prefix = titleTemplate.slice(0, markerIndex);
        const literalParts = prefix.split(/\{[^}]*\}/);
        const pattern = '^' + literalParts
            .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('.*?');
        try {
            return new RegExp(pattern);
        } catch (error) {
            return null;
        }
    }

    /**
     * Title displayed for a file: the basename stripped of the rename-template
     * prefix when it matches, the full basename otherwise.
     */
    private getDisplayTitle(basename: string): string {
        if (this.titleStripRegex) {
            const stripped = basename.replace(this.titleStripRegex, '');
            if (stripped) return stripped;
        }
        return basename;
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

        // Preload property values for chips and sorting
        if (this.searchConfig) {
            this.preloadSearchValues();
        }
    }

    /**
     * Preload the property values used by chips and sorting for every
     * class-filtered file. Computed values (derived dates, formulas) are
     * resolved through the property's read(); the map is used synchronously
     * afterwards by renderSuggestion and getSuggestions.
     */
    async preloadSearchValues(): Promise<void> {
        if (!this.searchConfig) return;
        // Already preloaded (showClassFileSuggester awaits before opening)
        if (this.searchValues.size > 0) return;
        const chipNames = (this.searchConfig.properties || []).map(chip => chip.name);
        const propNames = [...new Set([...chipNames, ...(this.searchConfig.sort ? [this.searchConfig.sort] : [])])];
        if (propNames.length === 0) return;

        const files = this.getItems().filter(item => typeof item !== 'string') as TFile[];
        const values = new Map<TFile, Record<string, any>>();

        for (const file of files) {
            try {
                const iFile = {
                    path: file.path,
                    basename: file.basename,
                    extension: file.extension,
                    name: file.name
                };
                const classe = await this.vault.getFromFile(iFile);
                if (!classe) continue;

                const record: Record<string, any> = {};
                for (const propName of propNames) {
                    try {
                        const property = classe.getProperty?.(propName);
                        record[propName] = property
                            ? await property.read(classe)
                            : await classe.getPropertyValue(propName);
                    } catch (error) {
                        // Value stays undefined; chips skip it, sort puts it last
                    }
                }
                values.set(file, record);
            } catch (error) {
                console.warn(`Error loading search values for ${file.path}:`, error);
            }
        }

        this.searchValues = values;

        // If the modal is already open, refresh the displayed suggestions.
        // Obsidian's HTMLElement.trigger works in the plugin runtime;
        // dispatchEvent is the standard fallback.
        if (this.inputEl) {
            try {
                (this.inputEl as any).trigger?.('input');
            } catch (error) {
                // Noop
            }
            try {
                this.inputEl.dispatchEvent(new Event('input'));
            } catch (error) {
                // Noop
            }
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
        const suggestions = super.getSuggestions(this.normalizeText(query));

        // Config-driven sort applies only when the query is empty (the
        // initial list); while typing, the fuzzy score takes over.
        if (!query.trim() && this.searchConfig?.sort && this.searchValues) {
            const sortProperty = this.searchConfig.sort;
            const descending = this.searchConfig.sortDirection === 'desc';
            const valueOf = (item: TFile | string): string | null => {
                if (typeof item === 'string') return null;
                return this.searchValues.get(item)?.[sortProperty] ?? null;
            };
            suggestions.sort((a, b) => {
                const va = valueOf(a.item);
                const vb = valueOf(b.item);
                // Missing values always last, in both directions
                if (va === null && vb === null) return 0;
                if (va === null) return 1;
                if (vb === null) return -1;
                const comparison = String(va).localeCompare(String(vb));
                return descending ? -comparison : comparison;
            });
        }

        return suggestions;
    }

    renderSuggestion(item: FuzzyMatch<TFile | string>, el: HTMLElement): void {
        const content = el.createDiv({ cls: "suggestion-content" });

        // Class icon on the left, always visible for class items
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

                    if (className) {
                        iconName = this.classIcons[className] || 'folder';
                    }
                } else {
                    displayText = item.item;
                }
            } else {
                displayText = item.item;
                iconName = 'file-plus';
            }
        } else {
            // For TFile items: strip the rename-template prefix from the title
            displayText = this.getDisplayTitle(item.item.basename);

            // Class icon is always visible; for a single class no metadata read is needed
            if (this.classes.length === 1) {
                className = this.classes[0];
                iconName = this.classIcons[className] || 'folder';
            } else {
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

        // Class icon on the left of the line
        if (iconName) {
            const classIconEl = content.createSpan({ cls: "suggestion-class-icon" });
            setIcon(classIconEl, iconName);
        }

        // Property columns (date, state dot...) BEFORE the title, so the date
        // forms a fixed, aligned column at the left edge for easy scanning
        if (typeof item.item !== 'string') {
            this.renderChips(item.item, content);
        }

        // Add the main text (bold)
        const textEl = content.createSpan({ cls: "suggestion-title" });
        textEl.textContent = displayText;

        // Add class info on the right for multi-class searches
        if (className && this.classes.length > 1) {
            const classContainer = content.createSpan({ cls: "suggestion-class-container" });

            const classNameEl = classContainer.createSpan({ cls: "suggestion-class-name" });
            classNameEl.textContent = className;
        }
    }

    /**
     * Render the configured property columns for a file:
     * - chips with a select options list (state) render as a COLOR DOT only,
     *   the label is available in the tooltip;
     * - other chips (date) render as icon + value, theme-mapped color.
     */
    private renderChips(file: TFile, content: HTMLElement): void {
        const chips = this.searchConfig?.properties;
        if (!chips || chips.length === 0) return;
        const values = this.searchValues.get(file);
        if (!values) return;

        const chipsEl = content.createDiv({ cls: "suggestion-chips" });
        for (const chip of chips) {
            const raw = values[chip.name];
            if (raw === null || raw === undefined || raw === '') continue;

            // Color: explicit override, otherwise the select option color.
            // Names are mapped to Obsidian theme variables when known.
            // Set as a custom property: CSS consumes it via var(--chip-color).
            let color = chip.color;
            if (!color && chip.options) {
                const option = chip.options.find(opt => opt.name === String(raw));
                if (option?.color) {
                    color = option.color;
                }
            }
            const resolvedColor = color ? (OBSIDIAN_COLOR_MAP[color.toLowerCase()] ?? color) : undefined;

            // Select-like chips (options defined): color dot only, label in tooltip
            if (chip.options && chip.options.length > 0) {
                const dotEl = chipsEl.createSpan({ cls: "suggestion-chip-dot" });
                dotEl.title = this.formatChipValue(raw, chip.type);
                if (resolvedColor) {
                    dotEl.style.setProperty('--chip-color', resolvedColor);
                }
                continue;
            }

            const chipEl = chipsEl.createSpan({ cls: "suggestion-chip" });
            if (resolvedColor) {
                chipEl.style.setProperty('--chip-color', resolvedColor);
            }

            if (chip.icon) {
                const iconEl = chipEl.createSpan({ cls: "suggestion-chip-icon" });
                setIcon(iconEl, chip.icon);
            }

            const valueEl = chipEl.createSpan({ cls: "suggestion-chip-value" });
            valueEl.textContent = this.formatChipValue(raw, chip.type);
        }
    }

    /**
     * Format a chip value: dates in short French, ranges compact ("14 → 16 nov. 2026")
     */
    private formatChipValue(raw: any, type?: string): string {
        const text = String(raw);
        if (type === 'date' || type === 'dateRange') {
            if (text.includes(' to ')) {
                const [start, end] = text.split(' to ');
                return this.formatShortDateRange(start, end);
            }
            return this.formatShortDate(text);
        }
        return text;
    }

    private formatShortDate(value: string): string {
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    /**
     * Compact short range: start day then the full short end date,
     * e.g. "14 → 16 nov. 2026" - fits the chip width without truncation
     */
    private formatShortDateRange(start: string, end: string): string {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return `${start} → ${end}`;
        }
        const startDay = startDate.toLocaleDateString('fr-FR', { day: 'numeric' });
        const endFull = endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${startDay} → ${endFull}`;
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
