import { App, TFile, FuzzyMatch, setIcon } from 'obsidian';
import { FileSearchModal } from './FileSearchModal';
import { Classe } from 'markdown-crm';

/**
 * Modal to search and select multiple files in Obsidian
 */
export class MultiFileSearchModal extends FileSearchModal {
    private selectedItems: TFile[] = [];
    private onChooseMulti: (files: (TFile | string)[]) => void;
    private boundOnKeyDown: (evt: KeyboardEvent) => void;

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
            args.hint = "Search files (Enter to select, Ctrl+Space for multi-select)";
        }
        super(app, vault, () => {}, classes, args);
        this.onChooseMulti = onChooseMulti;
        // Bind once so addEventListener/removeEventListener use the same reference
        this.boundOnKeyDown = this.onKeyDown.bind(this);
    }

    onOpen(): void {
        super.onOpen();
        console.log(`🔍 [MultiFileSearchModal] onOpen - attaching keydown listener, inputEl: ${this.inputEl ? 'found' : 'MISSING'}`);
        this.inputEl?.addEventListener("keydown", this.boundOnKeyDown);
    }

    getItems(): (TFile | string)[] {
        // Return both TFile instances and Create options for multi-select
        return super.getItems();
    }

    onChooseItem(item: TFile | string, evt: MouseEvent | KeyboardEvent): void {
        console.log(`✅ [MultiFileSearchModal] onChooseItem called - item: ${item instanceof TFile ? item.path : item}`);
        // Add the chosen item directly to the selection (Enter or mouse click)
        // so it is always part of finalSelection in onClose
        this.addItemToSelection(item);
        // Close the modal
        this.close();
    }

    /**
     * Add an item to the selection (idempotent - no duplicates)
     */
    private addItemToSelection(item: TFile | string): void {
        if (item instanceof TFile) {
            if (!this.selectedItems.includes(item)) {
                this.selectedItems.push(item);
            }
        } else if (typeof item === 'string' && item.startsWith('Create: ')) {
            this.choosed = item;
        }
    }

    /**
     * Get the currently active suggestion item (the highlighted one)
     */
    private getActiveSuggestion(): TFile | string | null {
        const activeItem = this.resultContainerEl?.querySelector(".suggestion-item.is-selected");
        if (!activeItem) return null;
        const index = Array.from(this.resultContainerEl?.children ?? []).indexOf(activeItem);
        const suggestions = this.getSuggestions(this.inputEl?.value ?? "");
        const fuzzyMatch = suggestions[index];
        return fuzzyMatch?.item ?? null;
    }

    async onKeyDown(evt: KeyboardEvent): Promise<void> {
        // Enter: select the active item and validate (close) directly
        if (evt.key === "Enter" || evt.code === "Enter" || evt.code === "NumpadEnter") {
            console.log(`⌨️ [MultiFileSearchModal] Enter detected`);
            evt.preventDefault();
            evt.stopPropagation();
            const activeItem = this.getActiveSuggestion();
            if (activeItem) {
                console.log(`⌨️ [MultiFileSearchModal] Enter - selecting active item: ${activeItem instanceof TFile ? activeItem.path : activeItem}`);
                this.addItemToSelection(activeItem);
            } else {
                console.warn(`⌨️ [MultiFileSearchModal] Enter - no active item found`);
            }
            this.close();
            return;
        }

        // Use Ctrl+Space to toggle selection without closing (multi-select)
        if (evt.code === "Space" && evt.ctrlKey) {
            console.log(`⌨️ [MultiFileSearchModal] Ctrl+Space detected`);
            evt.preventDefault();
            const activeItem = this.getActiveSuggestion();

            if (activeItem !== null) {
                if (activeItem instanceof TFile) {
                    const file = activeItem;
                    if (this.selectedItems.includes(file)) {
                        this.selectedItems = this.selectedItems.filter(f => f !== file);
                        console.log(`⌨️ [MultiFileSearchModal] deselected: ${file.path} (selected: ${this.selectedItems.length})`);
                    } else {
                        this.selectedItems.push(file);
                        console.log(`⌨️ [MultiFileSearchModal] selected: ${file.path} (selected: ${this.selectedItems.length})`);
                    }
                } else if (typeof activeItem === 'string' && activeItem.startsWith('Create: ')) {
                    // Handle Create option - store it for later processing
                    this.choosed = activeItem;
                    console.log(`⌨️ [MultiFileSearchModal] Create option chosen: ${activeItem}`);
                }
                this.renderAllSuggestions();
            } else {
                console.warn(`⌨️ [MultiFileSearchModal] Ctrl+Space: no active suggestion item found`);
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
        this.inputEl?.removeEventListener("keydown", this.boundOnKeyDown);
        super.onClose();
        
        // IMPORTANT: Obsidian calls close() BEFORE onChooseItem (Enter/click flow).
        // So the selection state (selectedItems / choosed) is NOT final yet here.
        // Build finalSelection inside the timeout, after onChooseItem has run.
        setTimeout(() => {
            const finalSelection: (TFile | string)[] = [...this.selectedItems];
            
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
            
            console.log(`📤 [MultiFileSearchModal] onChooseMulti check - selectedItems: ${this.selectedItems.length}, choosed: ${this.choosed ? (this.choosed instanceof TFile ? this.choosed.path : this.choosed) : 'null'}, finalSelection: ${finalSelection.length}`);
            
            if (finalSelection.length > 0) {
                console.log(`📤 [MultiFileSearchModal] calling onChooseMulti with ${finalSelection.length} item(s)`);
                this.onChooseMulti(finalSelection);
            } else {
                console.warn(`📤 [MultiFileSearchModal] EMPTY selection - onChooseMulti NOT called (select with Enter or Ctrl+Space)`);
            }
        }, 100);
    }
}
