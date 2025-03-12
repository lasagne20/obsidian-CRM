import { App } from "obsidian";
import { SubClass } from "../SubClass";
import { MyVault } from "Utils/MyVault";
import { Property } from "Utils/Properties/Property";
import { LinkProperty } from "Utils/Properties/LinkProperty";
import { EmailProperty } from "Utils/Properties/EmailProperty";
import { PhoneProperty } from "Utils/Properties/PhoneProperty";
import { AdressProperty } from "Utils/Properties/AdressProperty";
import { RatingProperty } from "Utils/Properties/RatingProperty";
import { Classe } from "Classes/Classe";
import { add } from "cheerio/dist/commonjs/api/traversing";
import { addFold } from "Utils/Display/Utils";
import { Data } from "Utils/Data/Data";
import { BooleanProperty } from "Utils/Properties/BooleanProperty";
import { FileProperty } from "Utils/Properties/FileProperty";
import { Partenariat } from "Classes/Partenariat";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { DynamicTable } from "Utils/Display/DynamicTable";


export class Commune extends SubClass {

    public subClassName : string = "Commune";
    public static subClassIcon : string = "box";

    public static Properties : { [key: string]: Property } = {
        site: new LinkProperty("Site web", "globe"),
        email : new EmailProperty("Email"),
        telephone : new PhoneProperty("Telephone"),
        adresse : new AdressProperty("Adresse"), 
        priority : new RatingProperty("Priorité"),
        partenariats : new MultiFileProperty("Partenariats", ["Partenariat"], "hand-coins", true),
        }


    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);
    }

    getConstructor(){
        return Commune
      }

    async populate(...args : any[]){
        
    }

    getTopDisplayContent(classe: Classe) : any{
        const container = document.createElement("div");
        this.vault = classe.vault

        const title = document.createElement("h2");
        title.textContent = "Mairie de " + classe.getName(false).split(" - ")[1];
        title.style.cursor = "pointer";
        container.appendChild(title);

        const content = document.createElement("div");


        const metadataContainer = document.createElement("div");
        content.appendChild(metadataContainer);

        const firstLineContainer = document.createElement("div");
        firstLineContainer.classList.add("metadata-line");
        firstLineContainer.appendChild(Commune.Properties.site.getDisplay(classe));
        firstLineContainer.appendChild(Commune.Properties.email.getDisplay(classe));
        firstLineContainer.appendChild(Commune.Properties.telephone.getDisplay(classe));
        firstLineContainer.appendChild(Commune.Properties.priority.getDisplay(classe));
        metadataContainer.appendChild(firstLineContainer);

        const secondLineContainer = document.createElement("div");
        secondLineContainer.classList.add("metadata-line"); 
        secondLineContainer.appendChild(Commune.Properties.adresse.getDisplay(classe));
        secondLineContainer.appendChild(Commune.Properties.partenariats.getDisplay(classe));
        metadataContainer.appendChild(secondLineContainer);

        // Assuming you have a method to get people in the commune
        let people : any[]= classe.getChildren().filter(value => value.getClasse() === "Personne")
        if (people.length !== 0) {
            let table = new DynamicTable(this.vault, this.vault.getClasseFromName("Personne"), people)
            table.addColumn("Poste",  `
                for(let el of postes){
                    if (el.institution === "[[${classe.getName(false)}]]"){
                        return el.poste
                    }
                }
                return  ""
            `)
            content.appendChild(table.getTable());
        }

        container.appendChild(content);
        addFold(title, content);

        return container;
    }
  
}