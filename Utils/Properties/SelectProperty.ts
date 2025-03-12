import { File } from "Utils/File";
import { Property } from "./Property";
import { MyVault } from "Utils/MyVault";

export class SelectProperty extends Property {
    public options: string[];
    public type : string = "select";

    constructor(name: string, options: string[], icon: string = "list",  staticProperty : boolean=false) {
        super(name, icon, staticProperty);
        this.options = options;
    }

    fillDisplay(value : any, update: (value: string) => Promise<void>) {
        const field = this.createFieldContainer();
        const fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container-column");

        if (this.title) {
            const header = document.createElement("div");
            header.classList.add("metadata-header");
            header.textContent = this.title;
            fieldContainer.appendChild(header);
        }

        

        
        const selectElement = this.createSelectWidget(value, update);
        fieldContainer.appendChild(selectElement);
        field.appendChild(fieldContainer);

        return field;
    }

    // Crée le widget de sélection avec une liste déroulante
    createSelectWidget(value: string, update: (value: string) => Promise<void>): HTMLSelectElement {
        const selectElement = document.createElement("select");
        selectElement.classList.add("select-dropdown");

        // Ajouter les options de la liste
        this.options.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.classList.add("select-dropdown-option")
            optionElement.value = option;
            optionElement.textContent = option;

            // Si la valeur est déjà sélectionnée, l'option sera sélectionnée
            if (option === value) {
                optionElement.selected = true;
            }

            selectElement.appendChild(optionElement);
        });

        // Gérer le changement de valeur
        selectElement.addEventListener("change", async (event) => {
            const selectedValue = (event.target as HTMLSelectElement).value;
            await update(selectedValue);
        });

        // Bloquer l'affichage de la liste si this.static est faux
        if (this.static) {
            selectElement.disabled = true;
        }

        return selectElement;
    }
}
