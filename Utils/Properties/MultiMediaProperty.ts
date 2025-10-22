
import { ObjectProperty } from "./ObjectProperty";
import { FileProperty } from "./FileProperty";
import { setIcon } from "../App";
import { selectFile, selectMedia } from "Utils/Modals/Modals";
import { File } from "Utils/File";
import { MyVault } from "Utils/MyVault";
import { MultiFileProperty } from "./MultiFileProperty";
import { MediaProperty } from "./MediaProperty";


export class MultiMediaProperty extends MultiFileProperty {

    public type : string = "multiMedia";
    public property : MediaProperty;
    public flexSpan = 2;


    constructor(name: string, args = {}){
        super(name, [], args);
        this.property = new MediaProperty(name, args);
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
        if (!Array.isArray(values) || values.length === 0) return;
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
        let newFile = await selectMedia(this.vault, "Choisissez un media ");
        if (newFile) {
            if (!values){values = []}
            values.push(`[[${newFile.path}|${newFile.name}]]`);
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