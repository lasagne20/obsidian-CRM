import { File } from "Utils/File";
import { MyVault } from "Utils/MyVault";
import { setIcon } from "obsidian";
import { ObjectProperty } from "./ObjectProperty";
import { Classe } from "Classes/Classe";
import { SubClass } from "Classes/SubClasses/SubClass";


export class Property {
    public name: string;
    public icon: string;
    public vault: MyVault;
    public static: boolean;
    public title: string;

    public type : string = "text";

    constructor(name: string, icon: string = "align-left", staticProperty: boolean = false) {
        this.name = name;
        this.icon = icon;
        this.static = staticProperty;
    }

    setVault(vault: MyVault) {
        this.vault = vault;
    }

    read(file: Classe | SubClass | File): any {
        if (file instanceof Classe || file instanceof SubClass) {
            return file.getMetadataValue(this.name)
        }
        return file.getMetadata()?.[this.name];
    }

    check(file: File) {

    }

    validate(value: string) {
        return value;
    }

    getLink(value: string) {
        return value;
    }

    getDisplay(file: any, staticMode : boolean | null =null, title = "") {
        if (staticMode != null) {this.static = staticMode}
        this.title = title;
        let value = this.read(file);
        return this.fillDisplay(value, async (value) => await file.updateMetadata(this.name, value));
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

    createFieldContainer() {
        const field = document.createElement("div");
        field.classList.add("metadata-field");
        return field;
    }

    createIconContainer(update: (value: string) => Promise<void>) {
        const iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");
        if (this.icon) {
            const icon = document.createElement("div");
            setIcon(icon, this.icon);
            iconContainer.appendChild(icon);
            if (!this.static) {
                iconContainer.addEventListener("click", (event) => this.modifyField(event));
            }
        }
        return iconContainer;
    }

    modifyField(event: Event) {
        const link = (event.target as HTMLElement).closest('.metadata-field')?.querySelector('.field-link') as HTMLElement;
        const input = (event.target as HTMLElement).closest('.metadata-field')?.querySelector('.field-input') as HTMLInputElement;
        if (link && input) {
            link.style.display = "none";
            input.style.display = "block";
            input.focus(); 
        }
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
        link.textContent = value || "";
        link.classList.add("field-link");
        link.style.cursor = this.static ? "default" : "text";
        if (!this.static) {
            link.addEventListener("click", (event) => this.modifyField(event));
        }
        return link;
    }

    handleFieldInput(update: (value: string) => Promise<void>, input: HTMLInputElement, link: HTMLElement) {
        input.addEventListener("blur", async () => {
            await this.updateField(update, input, link);
        });

        input.addEventListener("keydown", async (event) => {
            if (event.key === "Enter" || event.key === "Escape") {
                await this.updateField(update, input, link);
                event.preventDefault();
            }
        });
    }

    createFieldInput(value: string) {
        const input = document.createElement("input");
        input.type = "text";
        input.value = value || "";
        input.classList.add("field-input");
        return input;
    }

    async updateField(update: (value: string) => Promise<void>, input: HTMLInputElement, link: HTMLElement) {
        let value = input.value;
        if (value) {
            await update(value);
            input.style.display = "none";
            link.textContent = value;
            link.style.display = "block";
        } else {
            await update(input.value);
        }
    }

    async reloadDynamicContent(file: Classe | SubClass) {
        const field = document.querySelector('.metadata-field');
        if (field) {
            const newValue = this.read(file);
            const link = field.querySelector('.field-link') as HTMLElement;
            const input = field.querySelector('.field-input') as HTMLInputElement;
            if (link && input) {
                link.textContent = newValue;
                input.value = newValue;
            }
        }
    }
}