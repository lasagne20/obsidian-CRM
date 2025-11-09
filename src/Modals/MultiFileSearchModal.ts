import { App, TFile, FuzzyMatch, setIcon } from 'obsidian';
import { FileSearchModal } from './FileSearchModal';

/**
 * Modal to search and select multiple files in Obsidian
 */
export class MultiFileSearchModal extends FileSearchModal {
    private selectedItems: TFile[] = [];
    private onChooseMulti: (files: TFile[]) => void;

    constructor(
        app: App,
        onChooseMulti: (files: TFile[]) => void,
        classes: string[] = [],
        args: {
            hint?: string;
            optionalFilter?: (file: TFile) => boolean;
        } = {}
    ) {
        super(app, () => {}, classes, args);
        this.onChooseMulti = onChooseMulti;
    }

    onOpen(): void {
        super.onOpen();
        this.inputEl?.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    getItems(): (TFile | string)[] {
        // Only return TFile instances for multi-select
        return super.getItems().filter((item): item is TFile => item instanceof TFile);
    }

    async onKeyDown(evt: KeyboardEvent): Promise<void> {
        if (evt.code === "Space") {
            evt.preventDefault();
            const activeItem = this.resultContainerEl?.querySelector(".suggestion-item.is-selected");

            if (activeItem) {
                const index = Array.from(this.resultContainerEl?.children ?? []).indexOf(activeItem);
                const suggestions = this.getSuggestions(this.inputEl?.value ?? "");
                const fuzzyMatch = suggestions[index];
                const file = fuzzyMatch?.item instanceof TFile ? fuzzyMatch.item : null;
                
                if (file) {
                    if (this.selectedItems.includes(file)) {
                        this.selectedItems = this.selectedItems.filter(f => f !== file);
                    } else {
                        this.selectedItems.push(file);
                    }
                }
                this.renderAllSuggestions();
            }
        }
    }

    renderSuggestion(item: FuzzyMatch<string | TFile>, el: HTMLElement): void {
        super.renderSuggestion(item, el);
        const file = item.item instanceof TFile ? item.item : null;
        
        if (file && this.selectedItems.includes(file)) {
            el.classList.add("multi-file-search-modal-selected");
            // Add a check icon if selected
            const icon = document.createElement("span");
            setIcon(icon, "circle-check-big");
            icon.style.marginRight = "4px";
            el.prepend(icon);
        } else {
            el.classList.remove("multi-file-search-modal-selected");
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
        setTimeout(() => {
            if (this.selectedItems.length > 0) {
                this.onChooseMulti(this.selectedItems);
            }
        }, 100);
    }
}
