import { App, FuzzySuggestModal, FuzzyMatch } from 'obsidian';

/**
 * Modal to select an item from a list with fuzzy search
 */
export class SelectFromListModal<T> extends FuzzySuggestModal<T> {
    private items: T[];
    private onChoose: (item: T | null) => void;
    private displayFunc: (item: T) => string;
    private hint: string;
    private choosed: T | null = null;

    constructor(
        app: App,
        items: T[],
        onChoose: (item: T | null) => void,
        displayFunc: (item: T) => string,
        hint?: string
    ) {
        super(app);
        this.items = items;
        this.onChoose = onChoose;
        this.displayFunc = displayFunc;
        this.hint = hint || "Select an item from the list";
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

    getItems(): T[] {
        return this.items;
    }

    getItemText(item: T): string {
        return this.displayFunc(item);
    }

    onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void {
        this.choosed = item;
        this.onChoose(item);
    }

    onClose() {
        super.onClose();
        
        // If modal was closed without selecting an item, call onChoose with null
        if (this.choosed === null) {
            this.onChoose(null);
        }
    }
}
