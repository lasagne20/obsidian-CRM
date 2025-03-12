import { setIcon } from "obsidian";
import { Property } from "./Property";


export class RatingProperty extends Property {

    public type : string = "rating";

    constructor(name: string, icon: string = "star") {
        super(name, icon); 
    }

    fillDisplay(value : any, update: (value: string) => Promise<void>) {
        const field = this.createFieldContainer();
        const fieldContainer = document.createElement("div");
        fieldContainer.classList.add("field-container-column");

        const header = document.createElement("div");
        header.classList.add("metadata-header");
        header.textContent = this.name
        fieldContainer.appendChild(header);

        const stars = this.createStarRating(value, update); 
        fieldContainer.appendChild(stars);
        field.appendChild(fieldContainer);
        return field;
    }

    // Fonction pour créer la notation par étoiles (5 étoiles cliquables)
    createStarRating(value: string, update: (value: string) => Promise<void>): HTMLDivElement {
        const starContainer = document.createElement("div");
        starContainer.classList.add("star-rating");

        let selectedRating = 0;
        if (value){
            selectedRating = value.length;
        }
        

        // Crée les 5 étoiles
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("div");
            star.classList.add("star");
            setIcon(star, this.icon);
            star.setAttribute("data-value", i.toString());

            if (i <= selectedRating) {
                star.classList.add("filled");  // Remplit l'étoile si elle est sélectionnée
            }

            // Ajout des événements pour l'interaction utilisateur
            star.addEventListener("mouseover", () => this.previewStars(starContainer, i));
            star.addEventListener("mouseleave", () => this.previewStars(starContainer, selectedRating));
            star.addEventListener("click", async () => {
                selectedRating = i;
                await update('+'.repeat(i)); // Sauvegarde en métadonnées sous forme de "+"
                this.updateStarRating(starContainer, selectedRating);
            });

            starContainer.appendChild(star);
        }

        return starContainer;
    }

    // Met à jour l'affichage des étoiles en fonction du niveau actuel
    updateStarRating(starContainer: HTMLDivElement, rating: number) {
        const stars = starContainer.querySelectorAll('.star') as NodeListOf<HTMLElement>;
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add("filled");
            } else {
                star.classList.remove("filled");
            }
        });
    }

    // Prévisualise les étoiles en fonction du survol
    previewStars(starContainer: HTMLDivElement, rating: number) {
        const stars = starContainer.querySelectorAll('.star') as NodeListOf<HTMLElement>;
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add("hovered");
            } else {
                star.classList.remove("hovered");
            }
        });
    }
}

