
import { ObjectProperty } from "./ObjectProperty";
import { FileProperty } from "./FileProperty";
import { setIcon } from "obsidian";
import { selectFile } from "Utils/Modals/Modals";
import { File } from "Utils/File";
import { MyVault } from "Utils/MyVault";


export class MultiFileProperty extends ObjectProperty {

    public type : string = "multiFile";
    public classes: string[];
    public property : FileProperty;
    public flexSpan = 2;


    constructor(name: string, classes : string[], args = {}){
        super(name, {}, args);
        this.classes = classes;
        this.property = new FileProperty(name, classes, args);
    }

    getClasses(): string[] {
        return this.classes;
    }

    getParentValue(values : any) : File | undefined{
        return this.property.getParentValue(values)
    }

    formatParentValue(value : string){
        return [value]
    }

    // Méthode principale pour obtenir l'affichage
    fillDisplay(vault : any,values: any, update: (value: any) => Promise<void>) {
        this.vault = vault;
        const container = document.createElement("div");
        container.classList.add("metadata-multiFiles-container-"+this.name.toLowerCase());
        container.classList.add("metadata-multiFiles-container");

        // Créer les lignes d'objet
        this.createObjects(values, update, container);

        const addButton = this.createAddButton(values, update, container);
        container.appendChild(addButton);

        return container;
    }

    createObjects(values: any, update: (value: any) => Promise<void>, container: HTMLDivElement) {
        if (!values) return;
        values.forEach((objects: any, index: number) => {
            const row = this.createObjectRow(values, update, objects, index, container);
            container.appendChild(row);
        });
    }

    createObjectRow(values: any, update: (value: any) => Promise<void>, value: any, index: number, container: HTMLDivElement): HTMLDivElement {
        const row = document.createElement("div");
        row.classList.add("metadata-multiFiles-row-inline");

        // Ajouter le bouton de suppression
        const deleteButton = this.createDeleteButton(values, update, index, container);
        row.appendChild(deleteButton);


 
        let propertyContainer = document.createElement("div");
        propertyContainer.classList.add("metadata-multiFiles-property-inline");
        propertyContainer.appendChild(this.property.fillDisplay(this.vault, value, async (value) => await this.updateObject(values, update, index, this.property, value)));
        row.appendChild(propertyContainer);

        return row;
    }

    createDeleteButton(values: any, update: (value: any) => Promise<void>, index: number, container: HTMLDivElement): HTMLButtonElement {
        const deleteButton = document.createElement("button");
        setIcon(deleteButton, "minus");
        deleteButton.classList.add("metadata-delete-button-inline-small");
        deleteButton.onclick = async () => await this.removeProperty(values, update, index, container);
        return deleteButton;
    }

    async addProperty(values: any, update: (value: any) => Promise<void>, container: HTMLDivElement) {
        let newFile = await selectFile(this.vault, this.classes, {hint:"Choisissez un fichier " + this.getClasses().join(" ou ")});
        if (newFile) {
            if (!values){values = []}
            values.push(newFile.getLink());
            await update(values);
            await this.reloadObjects(values, update)
        }
    }

    createAddButton(values: any, update: (value: any) => Promise<void>, container: HTMLDivElement): HTMLButtonElement {
        const addButton = document.createElement("button");
        setIcon(addButton, "plus");
        addButton.classList.add("metadata-add-button-inline-small");
        addButton.onclick = async () => await this.addProperty(values, update, container);
        return addButton;
    }

    enableDragAndDrop() {
        // Disable drag and drop
    }
}