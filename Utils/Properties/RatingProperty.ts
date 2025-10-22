import { setIcon } from "../App";
import { Property } from "./Property";


export class RatingProperty extends Property {

    public type : string = "rating";

    constructor(name: string, args : {} = {icon: "star"}) {
        super(name, args); 
    }

    fillDisplay(vault : any, value : any, update: (value: string) => Promise<void>) {
        this.vault = vault
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
        if (value) {
            selectedRating = value.length;
        }

        // Crée les 5 étoiles
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("div");
            star.classList.add("star");
            setIcon(star, this.icon);

            star.setAttribute("data-value", i.toString());

            const svg = star.querySelector("svg");
            if (svg) {
                if (i <= selectedRating) {
                    svg.classList.add("filled-star");
                }
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

        this.updateStarRating(starContainer, selectedRating); // Initial update to ensure correct state
        return starContainer;
    }

    // Met à jour l'affichage des étoiles en fonction du niveau actuel
    updateStarRating(starContainer: HTMLDivElement, rating: number) {
        const stars = starContainer.querySelectorAll('.star') as NodeListOf<HTMLElement>;
        stars.forEach((star, index) => {
            const svg = star.querySelector("svg");
            if (svg) {
                if (index < rating) {
                    svg.classList.add("filled-star");
                } else {
                    svg.classList.remove("filled-star");
                }
            }
        });
    }

    // Prévisualise les étoiles en fonction du survol
    previewStars(starContainer: HTMLDivElement, rating: number) {
        const stars = starContainer.querySelectorAll('.star') as NodeListOf<HTMLElement>;
        stars.forEach((star, index) => {
            const svg = star.querySelector("svg");
            if (svg) {
                if (index < rating) {
                    svg.classList.add("hovered-star");
                } else {
                    svg.classList.remove("hovered-star");
                }
            }
        });
    }
}

