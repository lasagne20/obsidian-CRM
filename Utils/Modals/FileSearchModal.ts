import { App, TFile, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import { File } from "../File";
import { MyVault } from "Utils/MyVault";
import { Classe } from "Classes/Classe";

/**
 * Modale pour rechercher et sélectionner un fichier dans Obsidian.
 */
export class FileSearchModal extends FuzzySuggestModal<TFile|string> {
    public onChoose: (file: TFile|string|null, classe:  typeof Classe|null) => void;
    public classes : typeof Classe[];
    public hint : string;
    public vault: MyVault;
    public choosed : string | TFile | null;
    public choosedClass : typeof Classe | null;
    public items : string[] = [];
    public classItems : {[key : string]: typeof Classe} = {};

    constructor(vault : MyVault, onChoose: (file: TFile|string|null, classe: typeof Classe|null) => void, classes : typeof Classe[] = [], hint: string="") {
        super(vault.app);
        this.vault = vault;
        this.onChoose = onChoose;
        this.classes = classes;
        this.hint = hint;
        this.choosed = null
        this.choosedClass = null
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
        this.loadItems();
    }

    async loadItems(){
        // Add other items
        for (const classItem of this.classes) {
            const items = await classItem.getItems();
            items.forEach(item => {
                this.classItems[item] = classItem;
            });
        }
        if (this.classItems){
            Object.keys(this.classItems).forEach((value) => {
                this.items.push(`Créer un nouveau fichier : ${value}`);
            });
        }
        console.log(this.classItems)
    }


    getItems(): (TFile | string)[] {
        let files = this.app.vault.getFiles().filter(file => file.extension === "md");
        files = files.filter(file => {
            let className = this.app.metadataCache.getFileCache(file)?.frontmatter?.Classe 
            let classNames = this.classes.map(classItem => classItem.getClasse())
            return classNames.includes(className)
        })
        const inputValue = this.inputEl.value.trim();
        if (inputValue && !files.some(file => file.basename === inputValue)) {
            (files as (TFile | string)[]).push(`Créer un nouveau fichier : ${inputValue}`);
        }

        return [...files, ...this.items];
    }

    getItemText(item: TFile|string): string {
        return typeof item === "string" ? item : item.name.replace(".md","");
    }

    onChooseItem(item: TFile |string, evt: MouseEvent | KeyboardEvent): void {
        if (typeof item === "string"){
            let name = item.replace("Créer un nouveau fichier : ", "").trim()
            this.choosed = name
            console.log(this.classItems)
            this.choosedClass = this.classes.length > 1 ? this.classItems[name] : this.classes[0]
            console.log(this.choosedClass)
        }
        else{
            this.choosed = item
        }
    }

    onClose(): void {
        super.onClose()
        // wait for the chosen item if one
        setTimeout(() => {
            this.onChoose(this.choosed, this.choosedClass)
          
        }, 100); 

    }

}
