import { Property } from "./Property";
import { File } from "Utils/File";
import { MyVault } from "Utils/MyVault";

export class MultiSelectProperty extends Property {
    public options: {name : string, color : string}[];
    public type : string = "multiSelect";

    constructor(name: string, options: {name : string, color : string}[], args = {}) {
        super(name, args);
        this.options = options;
    }

    fillDisplay(vault: any, value : any, update: (value: string[]) => Promise<void>) {
        this.vault = vault;
        const field = this.createFieldContainer();
        const fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container-column");

        const header = document.createElement("div");
        header.classList.add("metadata-header");
        header.textContent = this.name
        fieldContainer.appendChild(header);

        const buttonContainer = this.createButtonGroup(value, update);
        fieldContainer.appendChild(buttonContainer);
        field.appendChild(fieldContainer);

        return field;
    }

    getDefaultValue(vault : MyVault){
        for (let index in this.default){
            if (this.default[index] == "personalName"){
                this.default[index] = vault.getPersonalName();
            }
        }
        
        return this.default;
    }

    // Crée le conteneur des boutons avec les options
    createButtonGroup(value: string[], update: (value: string[]) => Promise<void>): HTMLDivElement {
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("multi-select-container");

        const selectedValues = new Set(value); 

        this.options.forEach(option => {
            const button = document.createElement("button");
            button.classList.add("multi-select-button");
            button.textContent = option.name;

            if (selectedValues.has(option.name)) {
                button.classList.add("selected");
            }

            button.addEventListener("click", async () => {
                if (selectedValues.has(option.name)) {
                    selectedValues.delete(option.name);
                } else {
                    selectedValues.add(option.name);
                }

                await update([...selectedValues]);
                this.updateButtonState(buttonContainer, selectedValues);
            });

            buttonContainer.appendChild(button);
        });

        return buttonContainer;
    }

    // Met à jour l'affichage des boutons après sélection
    updateButtonState(container: HTMLElement, selectedValues: Set<string>) {
        const buttons = container.querySelectorAll(".multi-select-button");
        buttons.forEach(button => {
            if (selectedValues.has(button.textContent || "")) {
                button.classList.add("selected");
            } else {
                button.classList.remove("selected");
            }
        });
    }
}
