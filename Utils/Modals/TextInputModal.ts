import { App, TFile, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import { File } from "../File";

/**
 * Modale pour rechercher et sélectionner un fichier dans Obsidian.
 */
export class TextInputModal extends FuzzySuggestModal<string> {
    public onExit: (value? : any |null) => void;
    private hint : string;
    public choosed : any

    constructor(app: App, onExit: (value? : any |null) => void, hint: string="") {
        super(app);
        this.onExit = onExit;
        this.hint = hint;
        this.choosed = null;
    }

    onOpen() {
        super.onOpen();

        // Crée un div pour afficher le message
        const hintEl = this.containerEl.createDiv("fuzzy-hint");
        hintEl.textContent = this.hint;

        // Ajoute ce div avant la liste des suggestions
        const inputContainer = this.containerEl.querySelector(".prompt");
        if (inputContainer) {
            inputContainer.prepend(hintEl);
        }
    }

    getItemText(item: string): string {
        return item;
    }


    getItems(): string[] {
        const inputValue = this.inputEl.value.trim();
        return [`${inputValue}`]
    }

    onClose() {
        super.onClose();
        setTimeout(() => {
            if (!this.choosed) {
                this.onExit(this.choosed);
            }
        }, 100);
    }

    onChooseItem(key : string, evt: MouseEvent | KeyboardEvent): void {
        this.choosed = key
        this.onExit(this.choosed);
    }
}
