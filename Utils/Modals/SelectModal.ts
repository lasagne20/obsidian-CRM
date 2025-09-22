import { App, TFile, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import { File } from "../File";

/**
 * Modale pour rechercher et sélectionner un fichier dans Obsidian.
 */
export class SelectModal extends FuzzySuggestModal<string> {
    private onChoose: (value : any) => void;
    private onExit: (value? : any |null) => void;
    private list : { [key: string]: any };
    private hint : string;
    private choosed : any

    constructor(app: App, onChoose: (value : any) => void, onExit: (value? : any |null) => void, list : { [key: string]: any }, hint: string="") {
        super(app);
        this.onChoose = onChoose;
        this.onExit = onExit;
        this.list = list;
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
        return Object.keys(this.list)
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
        this.choosed = this.list[key]
        this.onChoose(this.choosed);
    }

}
