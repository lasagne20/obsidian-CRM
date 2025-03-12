import { SubClass } from "Classes/SubClasses/SubClass";
import { Property } from "./Property";
import { File } from "Utils/File";
import { MyVault } from "Utils/MyVault";
import flatpickr from "flatpickr";
import "flatpickr/dist/l10n/fr.js"; 
import { setIcon } from "obsidian";
import { Classe } from "Classes/Classe";
import { DateProperty } from "./DateProperty";


export class RangeDateProperty extends DateProperty {

    public type : string = "dateRange";
    constructor(name: string) {
        super(name, []);
    }

    createFieldDate(value: string, update: (value: string) => Promise<void>, link: HTMLDivElement) {
        const input = document.createElement("input");
        input.type = "text";
        input.value = value || "";  // Formaté en "YYYY-MM-DD" pour le stockage
        input.classList.add("field-input");
    
        flatpickr(input, {
            dateFormat: "Y-m-d",  // Stocker en "YYYY-MM-DD"
            defaultDate: value || "",
            locale: "fr",  // Utilisation de la langue française pour l'affichage
            mode: "range",  // Permet de sélectionner une plage de dates
            onChange: async (selectedDates: Date[]) => {
                if (selectedDates.length === 2) {
                    const startDate = selectedDates[0];
                    const endDate = selectedDates[1];
                    if (startDate && endDate) {
                        // Met à jour la valeur de l'input avec le format "YYYY-MM-DD to YYYY-MM-DD"
                        if (startDate.getTime() === endDate.getTime()) {
                            input.value = this.formatDateForStorage(startDate);
                        } else {
                            input.value = `${this.formatDateForStorage(startDate)} to ${this.formatDateForStorage(endDate)}`;
                        }
                        await this.updateField(update, input, link);
                        console.log("Input value (stocké) : ", input.value, "Affichage : ", this.formatDateForDisplay(input.value));
                    }
                }
            },
            onClose: async () => await this.updateField(update, input, link)
        });
    
        return input;
    }
    // Crée un lien qui affiche la plage de dates (au format "26 février 2025 au 28 février 2025")
    createFieldLink(value: string) {
        const link = document.createElement("div");
        link.textContent = value ? this.formatDateRangeForDisplay(value) : "Aucune date sélectionnée";
        link.classList.add("date-field-link");
        link.classList.add("field-link");
        link.style.cursor = "pointer";
        link.addEventListener("click", (event) => this.modifyField(event));
        return link;
    }

    // Formate la plage de dates pour l'affichage : "26 février 2025" ou "26 février 2025 au 28 février 2025"
    formatDateRangeForDisplay(dateRange: string): string {
        const [startDate, endDate] = dateRange.split(" to ");
        const formattedStartDate = new Date(startDate).toLocaleDateString("fr-FR", { 
            weekday: "long",
            day: "numeric", 
            month: "long", 
            year: "numeric" 
        });
        if (!endDate) {
            return `${formattedStartDate}`;
        }
        const formattedEndDate = new Date(endDate).toLocaleDateString("fr-FR", { 
            weekday: "long",
            day: "numeric", 
            month: "long", 
            year: "numeric" 
        });
        return `${formattedStartDate} au ${formattedEndDate}`;
    }

    // Crée un conteneur pour afficher la plage de dates et la sélection rapide
    createFieldContainerContent(update: (value: string) => Promise<void>, value: string): HTMLDivElement {
        const fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container");
        fieldContainer.classList.add("metadata-field");

        const currentField = value;
        const link = this.createFieldLink(currentField);
        const input = this.createFieldDate(currentField, update, link);

        // Affichage initial : Si la plage de dates existe, afficher le lien
        if (currentField && this.validate(value)) {
            link.style.display = "block";
            input.style.display = "none";
        } else {
            input.style.display = "block";
            link.style.display = "none";
        }

        fieldContainer.appendChild(link);
        fieldContainer.appendChild(input);

        return fieldContainer;
    }

    // Met à jour la valeur de la plage de dates et bascule l'affichage entre le lien et l'input
    async updateField(update: (value: string) => Promise<void>, input: HTMLInputElement, link: HTMLElement) {
        let value = this.validate(input.value);
        if (value) {
            await update(value);  // Met à jour avec la plage de dates au format "YYYY-MM-DD to YYYY-MM-DD"
            input.style.display = "none";
            link.textContent = this.formatDateRangeForDisplay(value);  // Affichage avec le mois en lettres
            link.style.display = "block";
        } else {
            await update(input.value);
        }
    }

    // Valide la plage de dates au format "YYYY-MM-DD to YYYY-MM-DD"
    validate(value: string): string {
        const dateRangeRegex = /^\d{4}-\d{2}-\d{2}( to \d{4}-\d{2}-\d{2})?$/;
        return dateRangeRegex.test(value) ? value : "";
    }
}
