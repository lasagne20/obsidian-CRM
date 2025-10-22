import { FuzzyMatch, SearchResult, TFile, setIcon, isTFile } from "../App";
import { FileSearchModal } from "./FileSearchModal";
import { Classe } from "Classes/Classe";
import { MyVault } from "Utils/MyVault";

/**
 * Modale pour rechercher et sélectionner plusieurs fichiers dans Obsidian.
 */
export class MultiFileSearchModal extends FileSearchModal {
    public selectedItems: (TFile)[] = [];
    public onChooseMulti: (files: (TFile)[]) => void;
    constructor(
        vault: MyVault,
        onChooseMulti: (files: (TFile)[]) => void,
        classes: typeof Classe[] = [],
        args: {
            hint?: string,
            optionnalFilter?: (file: TFile) => boolean,
            optionnalGetItems?: () => (TFile)[]
        } = {}
    ) {
        super(vault, () => {}, classes, args);
        this.onChooseMulti = onChooseMulti;
    }

    // Ensure keydown events are handled by adding an event listener in onOpen
    onOpen(): void {
        super.onOpen();
        this.inputEl?.addEventListener("keydown", this.onKeyDown.bind(this));
    }

    getItems(): (TFile | string)[] {
        return super.getItems().filter(item => isTFile(item)); // Ensure we only return TFile instances
    }



    async onKeyDown(evt: KeyboardEvent): Promise<void> {
        if (evt.code === "Space"){
            evt.preventDefault();
            const activeItem = this.resultContainerEl?.querySelector(".suggestion-item.is-selected");

            if (activeItem) {
                const index = Array.from(this.resultContainerEl?.children ?? []).indexOf(activeItem);
                const suggestions = this.getSuggestions(this.inputEl?.value ?? "");
                const fuzzyMatch = suggestions[index];
                const file = fuzzyMatch?.item && isTFile(fuzzyMatch.item) ? fuzzyMatch.item : null;
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
        const file = isTFile(item.item) ? item.item : null;
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
        let suggestionEls = this.getSuggestions(this.inputEl?.value ?? "")
        Array.from(this.resultContainerEl?.children ?? []).forEach((el, idx) => {
            // Get the currently displayed suggestion item
            const match = suggestionEls[idx];
            if (match) {
                (el as HTMLElement).textContent = "";
                this.renderSuggestion(match, el as HTMLElement);
            }
        });
    }



    // Override to handle multi-selection on close
    onClose(): void {
        this.inputEl?.removeEventListener("keydown", this.onKeyDown.bind(this));
        super.onClose();
        setTimeout(() => {
            if (this.selectedItems.length > 0) this.onChooseMulti(this.selectedItems);
            else if (this.choosed && isTFile(this.choosed)) this.onChooseMulti([this.choosed]);
        }, 100);
    }
} 
