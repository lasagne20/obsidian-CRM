import { Classe } from "Classes/Classe";
import { Property } from "./Property";
import { File } from "Utils/File";
import { MyVault } from "Utils/MyVault";
import { addIcon, setIcon } from "obsidian";
import { FileProperty } from "./FileProperty";
import { MultiFileProperty } from "./MultiFileProperty";


export class ObjectProperty extends Property{
    // Used for property object

    public properties : {[key : string] : Property};
    public type : string = "object";

    constructor(name : string, icon: string = "boxes", properties : {[key : string ] : Property}, staticMode: boolean = false){
      super(name, icon, staticMode);
      this.properties = properties
    }

    setVault(vault: MyVault) {
        this.vault = vault;
        Object.values(this.properties).forEach(prop => prop.setVault(vault));
    }

    getClasses(): string[]{
        for (let prop of Object.values(this.properties)){
            if (prop instanceof FileProperty || prop instanceof ObjectProperty || prop instanceof MultiFileProperty){
                return prop.getClasses()
            }
        }
        throw new Error("No class found")
      }

    // Used by the ClasseProperty to get the parent file
    getParentValue(values : any) : File | undefined{
        if (values && values.length){
          for (let prop of Object.values(this.properties)){
            if (prop instanceof FileProperty || prop instanceof ObjectProperty || prop instanceof MultiFileProperty){
              return prop.getParentValue(values[0][prop.name])
            }
          }
        }
    }

    formatParentValue(value : string){
        let newObject: any = {};
        Object.values(this.properties).forEach(prop => {
            if (value && prop instanceof FileProperty || prop instanceof ObjectProperty || prop instanceof MultiFileProperty){
                newObject[prop.name] = value
                value = "" // Only one parent
            }
            else {
                newObject[prop.name] = ""
            }
        });
        return [newObject]
    }

     // Méthode principale pour obtenir l'affichage
     fillDisplay(values: any, update: (value: any) => Promise<void>) {
        const container = document.createElement("div");
        container.classList.add("metadata-object-container-"+this.name.toLowerCase());

        // Créer l'en-tête
        this.createHeader(values, update, container);

        // Créer les lignes d'objet
        this.createObjects(values, update, container);

        return container;
      }
  
      // Crée l'en-tête avec les propriétés
      createHeader(values : any, update : (value: any) => Promise<void>, container: HTMLDivElement) {
          const headerRow = document.createElement("div");
          headerRow.classList.add("metadata-object-header-row");

          let title = document.createElement("div");
          title.textContent = this.name + " : ";
          title.classList.add("metadata-header");
          headerRow.appendChild(title);
  
          // Ajouter le bouton d'ajout
          const addButton = this.createAddButton(values, update, container);
          headerRow.appendChild(addButton);
  
          container.appendChild(headerRow);
      }
  
      // Crée le bouton d'ajout d'un nouvel objet
      createAddButton(values : any, update : (value: any) => Promise<void>, container: HTMLDivElement): HTMLButtonElement {
          const addButton = document.createElement("button");
          setIcon(addButton, "circle-plus")
          addButton.classList.add("metadata-add-button");
          addButton.onclick = async () => await this.addProperty(values, update, container);
          return addButton;
      }
  
      // Crée les objets et les lignes à afficher
      createObjects(values: any, update : (value: any) => Promise<void>,  container: HTMLDivElement) {
          if (!values){return}
          values.forEach((objects: any, index: number) => {
              const row = this.createObjectRow(values, update, objects, index, container);
              container.appendChild(row);
          });
          this.enableDragAndDrop(values, update, container);
      }
  
      // Crée une ligne d'objet avec ses propriétés
    createObjectRow(values : any, update : (value: any) => Promise<void>, objects: any, index: number, container: HTMLDivElement): HTMLDivElement {
        const row = document.createElement("div");
        row.classList.add("metadata-object-row");
        row.draggable = true;
        row.dataset.index = index.toString();

        // Ajouter le bouton de suppression
        const deleteButton = this.createDeleteButton(values, update, index, container);
        deleteButton.style.position = "absolute";
        deleteButton.style.top = "0";
        deleteButton.style.right = "0";
        row.style.position = "relative";
        row.appendChild(deleteButton);


        Object.keys(objects).forEach(name => {

          const property = Object.values(this.properties).find(prop => prop.name === name);
          if (property){
            let value = objects[property.name]


            let propertyContainer = document.createElement("div");
            propertyContainer.classList.add("metadata-object-property");
            if (property instanceof ObjectProperty) {
                propertyContainer.style.gridColumn = "span 2";
            } else {
                propertyContainer.style.gridColumn = "span 1";
            }

            const title = document.createElement("div");
            title.textContent = property.name;
            title.classList.add("metadata-title");
            propertyContainer.appendChild(title);
            propertyContainer.appendChild(property.fillDisplay(value,
                async (value) => await this.updateObject(values, update, index, property, value)));
            row.appendChild(propertyContainer);
          }
        });
        return row;
      }
  
      // Crée un bouton de suppression pour une ligne d'objet
      createDeleteButton(values : any, update : (value: any) => Promise<void>, index: number, container: HTMLDivElement): HTMLButtonElement {
          const deleteButton = document.createElement("button");
          setIcon(deleteButton, "circle-minus");
          deleteButton.classList.add("metadata-delete-button");
          deleteButton.onclick = async () => await this.removeProperty(values, update, index, container);
          return deleteButton;
      }
  
      // Gère le glisser-déposer pour réordonner les objets
      enableDragAndDrop(values : any, update : (value: any) => Promise<void>, container: HTMLDivElement) {
          let draggedElement: HTMLElement | null = null;

          let isEditing = false;

          // Lorsque l'utilisateur clique dans un champ d'édition (input), on active l'édition
          document.addEventListener("focus", (event) => {
              const input = event.target as HTMLElement;
              if (input?.classList.contains('field-input')) {
                  isEditing = true;  // Le champ est en mode édition
              }
          }, true);

          // Lorsque l'utilisateur quitte un champ d'édition (blur), on désactive l'édition
          document.addEventListener("blur", (event) => {
              const input = event.target as HTMLElement;
              if (input?.classList.contains('field-input')) {
                  isEditing = false;  // Le champ n'est plus en mode édition
              }
          }, true);

          container.addEventListener("dragstart", (event) => {
            if (isEditing) {
              event.preventDefault();
              return;
            }
            draggedElement = event.target as HTMLElement;
            draggedElement.classList.add("dragging");
          });
  
          container.addEventListener("dragover", (event) => {
              event.preventDefault();
              const afterElement = this.getDragAfterElement(container, event.clientY);
              if (afterElement == null) {
                  container.appendChild(draggedElement!);
              } else {
                container.insertBefore(draggedElement!, afterElement);
              }
          });
  
          container.addEventListener("dragend", async () => {
              if (!draggedElement) return;
              draggedElement.classList.remove("dragging");
  
              // Récupérer le nouvel ordre des éléments
              await this.updateOrder(values, update, container);
          });
      }
  
      // Trouver l'élément après lequel insérer (pour le Drag & Drop)
      getDragAfterElement(container: HTMLDivElement, y: number): Element | null {
          const draggableElements = Array.from(container.querySelectorAll(".metadata-object-row:not(.dragging)"));
  
          return draggableElements.reduce((closest, child) => {
              const box = child.getBoundingClientRect();
              const offset = y - box.top - box.height / 2;
              return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
          }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
      }
  
      // Met à jour l'ordre des éléments après un glisser-déposer
      async updateOrder(values : any, update : (value: any) => Promise<void>, container: HTMLDivElement) {
        console.log("Update order")
          let newOrder: any[] = [];
          Array.from(container.querySelectorAll(".metadata-object-row")).forEach((row) => {
              // Assurer qu'on travaille avec un HTMLElement pour accéder à dataset
              if (row instanceof HTMLElement && row.dataset.index) {
                  let index = parseInt(row.dataset.index);
                  newOrder.push(values[index]);
              }
          });
          // Mettre à jour les métadonnées
          await update(newOrder);
          await this.reloadObjects(newOrder, update)
      }
  
      // Fonction pour supprimer un objet
      async removeProperty(values : any, update : (value: any) => Promise<void>, index: number, container: HTMLDivElement) {
          console.log("Remove index : ", index)
          values.splice(index, 1);
          await update(values);
          await this.reloadObjects(values, update)
      }
  
      // Fonction pour ajouter un objet
      async addProperty(values : any, update : (value: any) => Promise<void>, container: HTMLDivElement) {
          console.log("Add new")
          let newObject: any = {};
          Object.values(this.properties).forEach(prop => newObject[prop.name] = ""); // Valeurs par défaut
          if (!values){values = []}
          values.push(newObject);
          await update(values);
          await this.reloadObjects(values, update)
      }
  
      // Mise à jour des métadonnées
      async updateObject(values : any, update : (value: any) => Promise<void>, index: number, property: Property, value: string) {
        console.log("Update index : ", index)
          if (values){
            values[index][property.name] = value;
          }
          else {
            values = [{[property.name] : value}]
          }
          console.log("Updated Values : ", values)
          await update(values);
          await this.reloadObjects(values, update)
      }

    // Recharge dynamiquement les objets
    async reloadObjects(values : any, update : (value: any) => Promise<void>,) {
        const container = document.querySelector(".metadata-object-container-"+this.name.toLowerCase()) as HTMLDivElement;
        if (container) {
            container.innerHTML = "";
            // Recréer l'en-tête et les objets
            console.log("Values : ", values)
            this.createHeader(values, update, container);
            this.createObjects(values, update, container);
        }
        
    }
  }
  