import { App, TFile, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import { File } from "../File";
import { MyVault } from "Utils/MyVault";
import { Classe } from "Classes/Classe";

/**
 * Modale pour rechercher et sélectionner un fichier dans Obsidian.
 */
export class FileSearchModal extends FuzzySuggestModal<TFile|string> {
    private onChoose: (file: TFile|string|null) => void;
    private classe : typeof Classe | null;
    private hint : string;
    private vault: MyVault
    private choosed : string | TFile | null

    constructor(vault : MyVault, onChoose: (file: TFile|string|null) => void, classe :typeof Classe |null = null, hint: string="") {
        super(vault.app);
        this.vault = vault;
        this.onChoose = onChoose;
        this.classe = classe;
        this.hint = hint;
        this.choosed = null
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


    getItems(): TFile[] {
        let files = this.app.vault.getFiles().filter(file => file.extension === "md");
        files = files.filter(file => this.app.metadataCache.getFileCache(file)?.frontmatter?.Classe == this.classe?.getClasse())

        const inputValue = this.inputEl.value.trim();
        if (inputValue && !files.some(file => file.basename === inputValue)) {
            (files as (TFile | string)[]).push(`Créer un nouveau fichier : ${inputValue}`);
        }

        return files;
    }

    getItemText(item: TFile|string): string {
        return typeof item === "string" ? item : item.name.replace(".md","");
    }

    onChooseItem(item: TFile |string, evt: MouseEvent | KeyboardEvent): void {
        if (typeof item === "string"){
            let name = item.replace("Créer un nouveau fichier : ", "").trim()
            this.choosed = name
        }
        else{
            this.choosed = item
        }
    }

    onClose(): void {
        super.onClose()
        // wait for the chosen item if one
        setTimeout(() => {
            this.onChoose(this.choosed)
          
        }, 100); 

    }

}
