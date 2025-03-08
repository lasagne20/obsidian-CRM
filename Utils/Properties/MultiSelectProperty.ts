import { Property } from "./Property";
import { File } from "Utils/File";
import { MyVault } from "Utils/MyVault";

export class MultiSelectProperty extends Property {
    public options: string[];

    constructor(name: string, options: string[], icon: string = "list") {
        super(name, icon);
        this.options = options;
    }

    fillDisplay(vault: MyVault, value : any, update: (value: string[]) => Promise<void>) {
        console.log("Fill display")
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

    // Crée le conteneur des boutons avec les options
    createButtonGroup(value: string[], update: (value: string[]) => Promise<void>): HTMLDivElement {
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("multi-select-container");

        const selectedValues = new Set(value); 

        this.options.forEach(option => {
            const button = document.createElement("button");
            button.classList.add("multi-select-button");
            button.textContent = option;

            if (selectedValues.has(option)) {
                button.classList.add("selected");
            }

            button.addEventListener("click", async () => {
                if (selectedValues.has(option)) {
                    selectedValues.delete(option);
                } else {
                    selectedValues.add(option);
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
