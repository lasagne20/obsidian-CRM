import { App, SuggestModal } from 'obsidian';

/**
 * Modal to select multiple items from a list with fuzzy search
 * Uses Space to select/deselect items, Enter to confirm selection
 */
export class MultiSelectFromListModal<T> extends SuggestModal<T> {
    private items: T[];
    private selectedItems: Set<T>;
    private onChoose: (items: T[]) => void;
    private displayFunc: (item: T) => string;
    private hint: string;
    private confirmed: boolean = false;

    constructor(
        app: App,
        items: T[],
        onChoose: (items: T[]) => void,
        displayFunc: (item: T) => string,
        hint?: string
    ) {
        super(app);
        this.items = items;
        this.selectedItems = new Set<T>();
        this.onChoose = onChoose;
        this.displayFunc = displayFunc;
        this.hint = hint || "Select items from the list (Space to select/deselect, Enter to confirm)";
    }

    onOpen() {
        super.onOpen();

        // Create a div to display the hint
        const hintEl = this.containerEl.createDiv("fuzzy-hint");
        hintEl.textContent = this.hint;
        hintEl.style.padding = "8px 12px";
        hintEl.style.fontSize = "0.9em";
        hintEl.style.color = "var(--text-muted)";

        // Add selection counter
        const counterEl = this.containerEl.createDiv("selection-counter");
        counterEl.style.padding = "4px 12px";
        counterEl.style.fontSize = "0.85em";
        counterEl.style.color = "var(--text-accent)";
        this.updateCounter(counterEl);

        // Add this div before the suggestions list
        const inputContainer = this.containerEl.querySelector(".prompt");
        if (inputContainer) {
            inputContainer.prepend(counterEl);
            inputContainer.prepend(hintEl);
        }

        // Add custom keydown handler for space bar
        const inputEl = this.inputEl;
        if (inputEl) {
            inputEl.addEventListener('keydown', (evt: KeyboardEvent) => {
                if (evt.key === ' ' && !evt.ctrlKey && !evt.metaKey && !evt.altKey) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    
                    // Get the currently highlighted suggestion
                    const suggestions = this.containerEl.querySelectorAll('.suggestion-item');
                    const selected = this.containerEl.querySelector('.is-selected');
                    
                    if (selected) {
                        const index = Array.from(suggestions).indexOf(selected);
                        if (index >= 0 && index < this.items.length) {
                            this.toggleSelection(this.items[index]);
                            this.updateCounter(counterEl);
                            
                            // Force re-render of suggestions to update checkboxes
                            const currentValue = inputEl.value;
                            inputEl.value = currentValue + ' ';
                            inputEl.value = currentValue;
                            inputEl.dispatchEvent(new Event('input'));
                        }
                    }
                }
            });
        }
    }

    getSuggestions(query: string): T[] {
        const lowerQuery = query.toLowerCase();
        
        if (!query) {
            return this.items;
        }

        return this.items.filter(item => {
            const displayText = this.displayFunc(item).toLowerCase();
            return displayText.includes(lowerQuery);
        });
    }

    renderSuggestion(item: T, el: HTMLElement): void {
        const isSelected = this.selectedItems.has(item);
        
        // Create container for checkbox and text
        const container = el.createDiv({ cls: 'multi-select-suggestion' });
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '8px';
        
        // Add checkbox indicator
        const checkbox = container.createDiv({ cls: 'multi-select-checkbox' });
        checkbox.style.width = '16px';
        checkbox.style.height = '16px';
        checkbox.style.border = '2px solid var(--text-muted)';
        checkbox.style.borderRadius = '3px';
        checkbox.style.display = 'flex';
        checkbox.style.alignItems = 'center';
        checkbox.style.justifyContent = 'center';
        
        if (isSelected) {
            checkbox.style.backgroundColor = 'var(--interactive-accent)';
            checkbox.style.borderColor = 'var(--interactive-accent)';
            checkbox.innerHTML = '✓';
            checkbox.style.color = 'var(--text-on-accent)';
            checkbox.style.fontWeight = 'bold';
        }
        
        // Add text
        const textEl = container.createDiv({ cls: 'multi-select-text' });
        textEl.textContent = this.displayFunc(item);
        
        if (isSelected) {
            textEl.style.fontWeight = '600';
            textEl.style.color = 'var(--interactive-accent)';
        }
    }

    onChooseSuggestion(item: T, evt: MouseEvent | KeyboardEvent): void {
        // Enter key confirms selection
        if (evt instanceof KeyboardEvent && evt.key === 'Enter') {
            this.confirmed = true;
            this.close();
        } else {
            // Click toggles selection
            this.toggleSelection(item);
            
            // Update counter
            const counterEl = this.containerEl.querySelector('.selection-counter');
            if (counterEl) {
                this.updateCounter(counterEl as HTMLElement);
            }
            
            // Force re-render to update checkboxes
            const inputEl = this.inputEl;
            if (inputEl) {
                const currentValue = inputEl.value;
                inputEl.value = currentValue + ' ';
                inputEl.value = currentValue;
                inputEl.dispatchEvent(new Event('input'));
            }
        }
    }

    private toggleSelection(item: T): void {
        if (this.selectedItems.has(item)) {
            this.selectedItems.delete(item);
        } else {
            this.selectedItems.add(item);
        }
    }

    private updateCounter(counterEl: HTMLElement): void {
        const count = this.selectedItems.size;
        counterEl.textContent = count === 0 
            ? 'No items selected' 
            : `${count} item${count > 1 ? 's' : ''} selected`;
    }

    onClose() {
        super.onClose();
        
        // Call onChoose with selected items
        const selectedArray = Array.from(this.selectedItems);
        this.onChoose(selectedArray);
    }
}
