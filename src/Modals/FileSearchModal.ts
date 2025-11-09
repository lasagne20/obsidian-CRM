import { App, TFile, FuzzySuggestModal } from 'obsidian';

/**
 * Modal to search and select a file in Obsidian
 */
export class FileSearchModal extends FuzzySuggestModal<TFile | string> {
    private onChoose: (file: TFile | string | null) => void;
    private classes: string[];
    private hint: string;
    private choosed: string | TFile | null = null;
    private optionalFilter?: (file: TFile) => boolean;

    constructor(
        app: App,
        onChoose: (file: TFile | string | null) => void,
        classes: string[] = [],
        args: {
            hint?: string;
            optionalFilter?: (file: TFile) => boolean;
        } = {}
    ) {
        super(app);
        this.onChoose = onChoose;
        this.classes = classes;
        this.hint = args.hint || "Search for a file or create a new one";
        this.optionalFilter = args.optionalFilter;
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

        const items: (TFile | string)[] = [...files];

        // Add option to create new file
        const inputValue = this.inputEl.value.trim();
        if (inputValue) {
            items.push(`Create: ${inputValue}`);
        }

        return items;
    }

    getItemText(item: TFile | string): string {
        if (typeof item === "string") {
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
