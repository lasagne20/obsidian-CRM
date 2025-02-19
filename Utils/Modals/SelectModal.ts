import { App, TFile, FuzzySuggestModal } from "obsidian";
import { File } from "../File";

/**
 * Modale pour rechercher et sélectionner un fichier dans Obsidian.
 */
export class SelectModal extends FuzzySuggestModal<string> {
    private onChoose: (file: TFile) => void;
    private list : { [key: string]: any };
    private hint : string;

    constructor(app: App, onChoose: (value : any) => void, list : { [key: string]: any }, hint: string="") {
        super(app);
        this.onChoose = onChoose;
        this.list = list;
        this.hint = hint;
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


    onChooseItem(key : string, evt: MouseEvent | KeyboardEvent): void {
        this.onChoose(this.list[key]);
    }
}
