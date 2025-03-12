import { cp } from "fs";
import { Property } from "./Property";
import { MyVault } from "Utils/MyVault";

export class NumberProperty extends Property {

    public unit: string = "";
    public type : string = "number";

    constructor(name: string, icon: string = "hash", staticProperty: boolean = false, unit: string = "") {
        super(name, icon, staticProperty);
        this.unit = unit;
    }

    validate(value: string): string {
        const numberValue = parseFloat(value);
        if (isNaN(numberValue)) {
            return "";
        }
        return numberValue.toString();
    }

    fillDisplay(value: any, update: (value: any) => Promise<void>) {
        const field = this.createFieldContainer();

        if (this.title) {
            const title = document.createElement("div");
            title.textContent = this.title;
            title.classList.add("metadata-title");
            field.appendChild(title);
        }

        const iconContainer = this.createIconContainer(update);
        const fieldContainer = this.createFieldContainerContent(update, value);

        field.appendChild(iconContainer);
        field.appendChild(fieldContainer);

        return field;
    }

    createFieldContainerContent(update: (value: string) => Promise<void>, value: string): HTMLDivElement {
        const fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container");

        const currentField = value;
        const input = this.createFieldInput(currentField);
        const link = this.createFieldLink(currentField);

        if (this.static) {
            link.style.display = "block";
            input.style.display = "none";
        } else {
            if (currentField && this.validate(value)) {
                link.style.display = "block";
                input.style.display = "none";
            } else {
                input.style.display = "block";
                link.style.display = "none";
            }
        }

        fieldContainer.appendChild(link);
        fieldContainer.appendChild(input);

        if (!this.static) {
            this.handleFieldInput(update, input, link);
        }

        return fieldContainer;
    }

    createFieldLink(value: string) {
        const link = document.createElement("div");
        link.textContent = value ? `${value} ${this.unit}` : "";
        link.classList.add("field-link");
        link.style.cursor = this.static ? "default" : "text";
        if (!this.static) {
            link.addEventListener("click", (event) => this.modifyField(event));
        }
        return link;
    }

    async updateField(update: (value: string) => Promise<void>, input: HTMLInputElement, link: HTMLElement) {
        let value = input.value;
        if (value) {
            await update(value);
            input.style.display = "none";
            link.textContent = value ? `${value} ${this.unit}` : "";
            link.style.display = "block";
        } else {
            await update(input.value);
        }
    }

    createFieldInput(value: string) {
        const input = document.createElement("input");
        input.type = "number";
        input.value = value || "";
        input.classList.add("field-input");
        return input;
    }
}