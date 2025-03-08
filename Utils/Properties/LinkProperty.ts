import { MyVault } from "Utils/MyVault";
import { Property } from "./Property";
import { setIcon } from "obsidian";



export class LinkProperty extends Property{


    // Used for property hidden for the user
    constructor(name : string, icon: string = "square-arrow-out-up-right",  staticProperty : boolean=false) {
      super(name, icon, staticProperty)
    }

    validate(url: string) {
      // Ajoute le préfixe "http://" si l'URL ne commence pas par http:// ou https://
      let fixedUrl = url.trim();
  
      // Si le lien ne commence pas par http:// ou https://, ajoute "http://"
      if (!/^https?:\/\//i.test(fixedUrl)) {
          fixedUrl = "http://" + fixedUrl;
      }
      const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9_-]+\.)+[a-zA-Z]{2,6}(\/[a-zA-Z0-9_-]+)*\/?$/;
      if (!urlRegex.test(fixedUrl)) {
          return "";
      }
      return fixedUrl;
    }

    // Fonction pour créer le conteneur de l'icône
    createIconContainer(update: (value: string) => Promise<void>) {
        const iconContainer = super.createIconContainer(update);
        iconContainer.style.cursor = "pointer";
        if (!this.static){
          iconContainer.addEventListener("click", (event)  => this.modifyField(event));
        }
        return iconContainer;
    }

    // Fonction pour créer le lien de l'field
    createFieldLink(value: string) : any {
      const link = document.createElement("a");
      link.href = this.getLink(value);
      link.textContent = value || "";
      link.classList.add("field-link");
      return link;
    }
}