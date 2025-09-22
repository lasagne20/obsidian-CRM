import { File } from "Utils/File";
import { MyVault } from "Utils/MyVault";
import { setIcon } from "obsidian";
import { ObjectProperty } from "./ObjectProperty";
import { Classe } from "Classes/Classe";
import { SubClass } from "Classes/SubClasses/SubClass";
import { get } from "http";


export class Property {
    public name: string;
    public icon: string;
    public vault: MyVault;
    public static: boolean;
    public title: string;
    public flexSpan = 0;
    public default: any;

    public type : string = "text";

    constructor(name: string, options: { 
        icon?: string, 
        staticProperty?: boolean, 
        flexSpan?: number, 
        defaultValue?: any, 
        [key: string]: any 
    } = {}) {
        const { icon = "align-left", staticProperty = false, flexSpan = 1, defaultValue = "", ...additionalOptions } = options;
        this.flexSpan = flexSpan;
        this.name = name;
        this.icon = icon;
        this.default = defaultValue;
        this.static = staticProperty;

        // Assign additional options to the instance
        Object.assign(this, additionalOptions);
    }

    getDefaultValue(vault : MyVault){
        if (this.default == "personalName"){
            return vault.getPersonalName();
        }
        return this.default;
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

    getPretty(value: string) {
        return value;  
    }

    getDisplay(file: any, args : {staticMode? : boolean, title?: string} = {staticMode : false, title:""}) {
        this.static = args.staticMode ? true : this.static;
        this.title = args.title ? args.title : "";
        let value = this.read(file);
        return this.fillDisplay(file.vault, value, async (value) => await file.updateMetadata(this.name, value), args);
    }

    fillDisplay(vault : any, value: any, update: (value: any) => Promise<void>, args? : {}) {
        this.vault = vault;
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
            if (currentField) {
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
        link.textContent = this.getPretty(value) || "";
        link.classList.add("field-link");
        link.style.cursor = this.static ? "default" : "text";
        if (!this.static) {
            link.addEventListener("click", (event) => this.modifyField(event));
        }
        return link;
    }

    handleFieldInput(update: (value: string) => Promise<void>, input: HTMLInputElement | HTMLTextAreaElement, link: HTMLElement) {
        input.addEventListener("blur", async () => {
            await this.updateField(update, input, link);
        });

        input.addEventListener("keydown", async (event) => {
            if ((event as KeyboardEvent).key === "Enter" || (event as KeyboardEvent).key === "Escape") {
                    event.preventDefault();
                    await this.updateField(update, input, link);
            }
        });
    }

    createFieldInput(value: string) : HTMLInputElement | HTMLTextAreaElement {
        const input = document.createElement("input");
        input.type = "text";
        input.value = value || "";
        input.classList.add("field-input");
        return input;
    }

    async updateField(update: (value: string) => Promise<void>, input: HTMLInputElement | HTMLTextAreaElement, link: HTMLElement) {
        let value = this.validate(input.value);
        if (value) {
            await update(value);
            input.style.display = "none";
            link.textContent = value;
            if ((link as HTMLAnchorElement).href){
                (link as HTMLAnchorElement).href = this.getLink(value);
            }
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