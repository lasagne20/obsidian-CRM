import { Property } from "./Property";
import { File } from "Utils/File";
import { waitForMetaDataCacheUpdate } from "Utils/Utils";
import { addIcon, setIcon } from "obsidian";


export class ObjectProperty extends Property{
    // Used for property object

    public properties : {[key : string] : Property};

    constructor(name : string, icon: string = "boxes", properties : {[key : string ] : Property}) {
      super(name, icon)
      this.properties = properties
      Object.values(this.properties).forEach(prop => prop.parent = this)
    }

    read(file: File, pretty = true) {
        let data = super.read(file)
        if (data && pretty) {
            data = data.map((obj: any) => {
            let renamedObj: any = {};
            Object.keys(this.properties).forEach(key => {
                renamedObj[key] = obj[this.properties[key].name];
            });
            return renamedObj;
            });
        }
        return data;
    }

    getPropertyValue(file: File, property : Property, index=0){
        let values = super.read(file)
        if (values && values.length > index){
            return values[index][property.name]
        }
    }

      // Méthode principale pour obtenir l'affichage
      getDisplay(file: File): HTMLDivElement {
          const container = document.createElement("div");
          container.classList.add("metadata-object-container");
  
          // Créer l'en-tête
          this.createHeader(file, container);
  
          // Créer les lignes d'objet
          this.createObjects(file, container);
  
          return container;
      }
  
      // Crée l'en-tête avec les propriétés
      createHeader(file : File, container: HTMLDivElement) {
          const headerRow = document.createElement("div");
          headerRow.classList.add("metadata-header-row");
  
          Object.values(this.properties).forEach(prop => {
              const header = document.createElement("div");
              header.classList.add("metadata-object-header");
              header.textContent = prop.name;
              headerRow.appendChild(header);
          });
  
          // Ajouter le bouton d'ajout
          const addButton = this.createAddButton(file, container);
          headerRow.appendChild(addButton);
  
          container.appendChild(headerRow);
      }
  
      // Crée le bouton d'ajout d'un nouvel objet
      createAddButton(file: File, container: HTMLDivElement): HTMLButtonElement {
          const addButton = document.createElement("button");
          setIcon(addButton, "circle-plus")
          addButton.classList.add("metadata-add-button");
          addButton.onclick = async () => await this.addProperty(file, container);
          return addButton;
      }
  
      // Crée les objets et les lignes à afficher
      createObjects(file: File, container: HTMLDivElement) {
          let objectsList = this.read(file);
          if (!objectsList){return}
          objectsList.forEach((objects: any, index: number) => {
              const row = this.createObjectRow(file, objects, index, container);
              container.appendChild(row);
          });
          this.enableDragAndDrop(container, file);
      }
  
      // Crée une ligne d'objet avec ses propriétés
      createObjectRow(file: File, objects: any, index: number, container: HTMLDivElement): HTMLDivElement {
          const row = document.createElement("div");
          row.classList.add("metadata-object-row");
          row.draggable = true;
          row.dataset.index = index.toString();
  
          Object.keys(objects).forEach(name => {
              const property = this.properties[name];
              if (property){
                let value = this.getPropertyValue(file, property, index)
                row.appendChild(property.fillDisplay(file.vault, value, async (value) => await this.updateObject(file, index, property, value)));
              }
          });
  
          // Ajouter le bouton de suppression
          const deleteButton = this.createDeleteButton(file, index, container);
          row.appendChild(deleteButton);
  
          return row;
      }
  
      // Crée un bouton de suppression pour une ligne d'objet
      createDeleteButton(file: File, index: number, container: HTMLDivElement): HTMLButtonElement {
          const deleteButton = document.createElement("button");
          setIcon(deleteButton, "circle-minus");
          deleteButton.classList.add("metadata-delete-button");
          deleteButton.onclick = async () => await this.removeProperty(file, index, container);
          return deleteButton;
      }
  
      // Gère le glisser-déposer pour réordonner les objets
      enableDragAndDrop(container: HTMLDivElement, file: File) {
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
              await this.updateOrder(container, file);
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
      async updateOrder(container: HTMLDivElement, file: File) {
        console.log("Update order")
          let newOrder: any[] = [];
          Array.from(container.querySelectorAll(".metadata-object-row")).forEach((row) => {
              // Assurer qu'on travaille avec un HTMLElement pour accéder à dataset
              if (row instanceof HTMLElement && row.dataset.index) {
                  let index = parseInt(row.dataset.index);
                  newOrder.push(this.read(file, false)[index]);
              }
          });
          // Mettre à jour les métadonnées
          await file.updateMetadata(this.name, newOrder);
          await this.reloadObjects(file)
      }
  
      // Fonction pour supprimer un objet
      async removeProperty(file: File, index: number, container: HTMLDivElement) {
          console.log("Remove index : ", index)
          let objectsList = this.read(file, false);
          objectsList.splice(index, 1);
          await file.updateMetadata(this.name, objectsList);
          await this.reloadObjects(file)
      }
  
      // Fonction pour ajouter un objet
      async addProperty(file: File, container: HTMLDivElement) {
          console.log("Add new")
          let newObject: any = {};
          Object.values(this.properties).forEach(prop => newObject[prop.name] = ""); // Valeurs par défaut
          let objectsList = this.read(file, false);
          if (!objectsList){objectsList = []}
          objectsList.push(newObject);
          await file.updateMetadata(this.name, objectsList);
          await this.reloadObjects(file)
      }
  
      // Mise à jour des métadonnées
      async updateObject(file: File, index: number, property: Property, value: string) {
        console.log("Update index : ", index)
          let content = this.read(file, false);
          if (content){
            content[index][property.name] = value;
          }
          else {
            content = [{[property.name] : value}]
          }
          
          await file.updateMetadata(this.name, content);
          await this.reloadObjects(file)
      }

    // Recharge dynamiquement les objets
    async reloadObjects(file: File) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const container = document.querySelector(".metadata-object-container") as HTMLDivElement;
        if (container) {
            // Supprimer tous les enfants existants
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            // Recréer l'en-tête et les objets
            this.createHeader(file, container);
            this.createObjects(file, container);
        }
        
    }
  }
  