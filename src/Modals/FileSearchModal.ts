import { App, TFile, FuzzySuggestModal, FuzzyMatch, prepareFuzzySearch } from 'obsidian';

/**
 * Modal to search and select a file in Obsidian
 */
export class FileSearchModal extends FuzzySuggestModal<TFile | string> {
    private onChoose: (file: TFile | string | null) => void;
    private classes: string[];
    private hint: string;
    private choosed: string | TFile | null = null;
    private optionalFilter?: (file: TFile) => boolean;
    private dataItems: any[];

    constructor(
        app: App,
        onChoose: (file: TFile | string | null) => void,
        classes: string[] = [],
        args: {
            hint?: string;
            optionalFilter?: (file: TFile) => boolean;
            dataItems?: any[];
        } = {}
    ) {
        super(app);
        this.onChoose = onChoose; 
        this.classes = classes;
        this.hint = args.hint || "Search for a file or create a new one";
        this.optionalFilter = args.optionalFilter;
        this.dataItems = args.dataItems || [];
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
    }

    getItems(): (TFile | string)[] {
        const items: (TFile | string)[] = [];
        
        // Get existing files first
        let files = this.app.vault.getMarkdownFiles();
        
        // Filter by class if specified
        if (this.classes.length > 0) {
            files = files.filter(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                const className = cache?.frontmatter?.Classe;
                return this.classes.includes(className);
            });
        }

        // Apply optional filter
        if (this.optionalFilter) {
            files = files.filter(file => this.optionalFilter!(file));
        }

        // Add existing files to items
        items.push(...files);
        
        // If there are data items, add them with "Create:" prefix
        // For classes with data, ONLY allow creation from data
        if (this.dataItems && this.dataItems.length > 0) {
            for (const dataItem of this.dataItems.slice(0, 1000)) {
                const itemName = dataItem.nom || dataItem.name || dataItem.title || 'Unknown';
                items.push(`Create: ${itemName}`);
            }
        }

        return items;
    }
    
    getSuggestions(query: string): FuzzyMatch<TFile | string>[] {
        console.log(`🔍 getSuggestions called with query: "${query}"`);
        
        const results: FuzzyMatch<TFile | string>[] = [];
        
        // Get existing files
        let files = this.app.vault.getMarkdownFiles();
        
        // Filter by class if specified
        if (this.classes.length > 0) {
            files = files.filter(file => {
                const cache = this.app.metadataCache.getFileCache(file);
                const className = cache?.frontmatter?.Classe;
                return this.classes.includes(className);
            });
        }

        // Apply optional filter
        if (this.optionalFilter) {
            files = files.filter(file => this.optionalFilter!(file));
        }
        
        if (!query) {
            // Return first 50 existing files + first 50 data items
            for (const file of files.slice(0, 50)) {
                results.push({ item: file, match: { score: 0, matches: [] } });
            }
            
            if (this.dataItems && this.dataItems.length > 0) {
                for (const dataItem of this.dataItems.slice(0, 50)) {
                    const itemName = dataItem.nom || dataItem.name || dataItem.title || 'Unknown';
                    results.push({ 
                        item: `Create: ${itemName}`, 
                        match: { score: 0, matches: [] } 
                    });
                }
            }
            
            console.log(`📋 No query, returning ${results.length} items`);
            return results;
        }
        
        const lowerQuery = query.toLowerCase();
        console.log(`🔎 Searching for: "${lowerQuery}"`);
        
        // Search in existing files
        for (const file of files) {
            if (file.basename.toLowerCase().includes(lowerQuery)) {
                results.push({ item: file, match: { score: 0, matches: [] } });
            }
        }
        
        // Search in data items
        if (this.dataItems && this.dataItems.length > 0) {
            for (const dataItem of this.dataItems) {
                const title = (dataItem.title || '').toLowerCase();
                const code_postal = (dataItem.code_postal || '').toLowerCase();
                const nom = (dataItem.nom || '').toLowerCase();
                
                let shouldInclude = false;
                
                // Check multiple fields for match
                if (title.includes(lowerQuery)) {
                    shouldInclude = true;
                    if (query.length >= 3) console.log(`✅ Match in title: "${dataItem.title}" for query "${query}"`);
                }
                if (code_postal.includes(lowerQuery)) {
                    shouldInclude = true;
                    if (query.length >= 3) console.log(`✅ Match in code_postal: "${dataItem.code_postal}" for query "${query}"`);
                }
                if (nom.includes(lowerQuery)) {
                    shouldInclude = true;
                    if (query.length >= 3) console.log(`✅ Match in nom: "${dataItem.nom}" for query "${query}"`);
                }
                
                // Check name parts (e.g., "59000 - Lille" -> check "Lille")
                const nameParts = nom.split(' - ');
                if (nameParts.length > 1 && nameParts[1].includes(lowerQuery)) {
                    shouldInclude = true;
                    if (query.length >= 3) console.log(`✅ Match in name part: "${nameParts[1]}" for query "${query}"`);
                }
                
                if (shouldInclude) {
                    const itemName = dataItem.nom || dataItem.name || dataItem.title || 'Unknown';
                    results.push({
                        item: `Create: ${itemName}`,
                        match: { score: 0, matches: [] }
                    });
                }
            }
        }
        
        // If no data items, add manual "Create: {query}" option
        if (!this.dataItems || this.dataItems.length === 0) {
            results.unshift({
                item: `Create: ${query}`,
                match: { score: 0, matches: [] }
            });
        }
        
        console.log(`✅ Found ${results.length} matching results`);
        return results.slice(0, 100); // Limit results
    }

    getItemText(item: TFile | string): string {
        if (typeof item === "string") {
            // For "Create: XXX" items, try to find the title from data
            if (item.startsWith("Create: ") && this.dataItems && this.dataItems.length > 0) {
                const itemName = item.substring("Create: ".length);
                const dataItem = this.dataItems.find(d => 
                    (d.nom || d.name) === itemName
                );
                
                if (dataItem && dataItem.title) {
                    return `Create: ${dataItem.title} (${itemName})`;
                }
            }
            return item;
        } 
        return item.basename;
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
