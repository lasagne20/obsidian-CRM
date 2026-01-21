import { App, TFile, FuzzyMatch, setIcon } from 'obsidian';
import { FileSearchModal } from './FileSearchModal';
import { Classe } from 'markdown-crm';

/**
 * Modal to search and select multiple files in Obsidian
 */
export class MultiFileSearchModal extends FileSearchModal {
    private selectedItems: TFile[] = [];
    private onChooseMulti: (files: (TFile | string)[]) => void;

    constructor(
        app: App,
        vault: any,
        onChooseMulti: (files: (TFile | string)[]) => void,
        classes: string[] = [],
        args: {
            hint?: string;
            optionalFilter?: (file: Classe) => boolean;
            dataItems?: any[];
            classIcons?: Record<string, string>;
        } = {}
    ) {
        // Set default hint for multi-select if not provided
        if (!args.hint) {
            args.hint = "Search files (Ctrl+Space to select, Enter to confirm)";
        }
        super(app, vault, () => {}, classes, args);
        this.onChooseMulti = onChooseMulti;
    }

    onOpen(): void {
        super.onOpen();
        this.inputEl?.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    getItems(): (TFile | string)[] {
        // Return both TFile instances and Create options for multi-select
        return super.getItems();
    }

    onChooseItem(item: TFile | string, evt: MouseEvent | KeyboardEvent): void {
        // Store the chosen item so it can be added in onClose
        this.choosed = item;
        // Close the modal
        this.close();
    }

    async onKeyDown(evt: KeyboardEvent): Promise<void> {
        // Use Ctrl+Space for selection to avoid conflict with typing spaces in Create options
        if (evt.code === "Space" && evt.ctrlKey) {
            evt.preventDefault();
            const activeItem = this.resultContainerEl?.querySelector(".suggestion-item.is-selected");

            if (activeItem) {
                const index = Array.from(this.resultContainerEl?.children ?? []).indexOf(activeItem);
                const suggestions = this.getSuggestions(this.inputEl?.value ?? "");
                const fuzzyMatch = suggestions[index];
                
                if (fuzzyMatch?.item) {
                    if (fuzzyMatch.item instanceof TFile) {
                        // Handle TFile selection
                        const file = fuzzyMatch.item;
                        if (this.selectedItems.includes(file)) {
                            this.selectedItems = this.selectedItems.filter(f => f !== file);
                        } else {
                            this.selectedItems.push(file);
                        }
                    } else if (typeof fuzzyMatch.item === 'string' && fuzzyMatch.item.startsWith('Create: ')) {
                        // Handle Create option - store it for later processing
                        this.choosed = fuzzyMatch.item;
                    }
                }
                this.renderAllSuggestions();
            }
        }
    }

    renderSuggestion(item: FuzzyMatch<string | TFile>, el: HTMLElement): void {
        super.renderSuggestion(item, el);
        
        if (item.item instanceof TFile) {
            const file = item.item;
            if (this.selectedItems.includes(file)) {
                el.classList.add("multi-file-search-modal-selected");
                // Add a check icon if selected
                const icon = document.createElement("span");
                setIcon(icon, "circle-check-big");
                icon.style.marginRight = "4px";
                el.prepend(icon);
            } else {
                el.classList.remove("multi-file-search-modal-selected");
            }
        } else if (typeof item.item === 'string' && item.item.startsWith('Create: ')) {
            // Style Create options differently
            el.classList.add("create-option-item");
            if (item.item === this.choosed) {
                el.classList.add("multi-file-search-modal-selected");
                // Add a check icon if this Create option is chosen
                const icon = document.createElement("span");
                setIcon(icon, "circle-check-big");
                icon.style.marginRight = "4px";
                el.prepend(icon);
            }
        }
    }

    // Helper to re-render all suggestions to update selection classes
    private renderAllSuggestions(): void {
        const suggestionEls = this.getSuggestions(this.inputEl?.value ?? "");
        Array.from(this.resultContainerEl?.children ?? []).forEach((el, idx) => {
            const match = suggestionEls[idx];
            if (match) {
                (el as HTMLElement).textContent = "";
                this.renderSuggestion(match, el as HTMLElement);
            }
        });
    }

    onClose(): void {
        this.inputEl?.removeEventListener("keydown", this.onKeyDown.bind(this));
        super.onClose();
        
        // Prepare the final selection list
        const finalSelection: (TFile | string)[] = [...this.selectedItems];
        
        // Add the chosen item (from Enter key or click) if it exists
        if (this.choosed) {
            if (this.choosed instanceof TFile) {
                // Only add if not already in selection
                if (!this.selectedItems.includes(this.choosed)) {
                    finalSelection.push(this.choosed);
                }
            } else if (typeof this.choosed === 'string' && this.choosed.startsWith('Create: ')) {
                // Add Create option to selection
                finalSelection.push(this.choosed);
            }
        }
        
        setTimeout(() => {
            if (finalSelection.length > 0) {
                this.onChooseMulti(finalSelection);
            }
        }, 100);
    }
}
