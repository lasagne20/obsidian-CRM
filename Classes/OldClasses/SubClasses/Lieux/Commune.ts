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
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { MultiSelectProperty } from "Utils/Properties/MultiSelectProperty";
import { DateProperty } from "Utils/Properties/DateProperty";
import { Suivi } from "Classes/GroupProperties/Suivi";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";


export class Commune extends SubClass {

    public subClassName : string = "Commune";
    public static subClassIcon : string = "box";

    public static Properties : { [key: string]: Property } = {
        site: new LinkProperty("Site web", {icon:"globe"}),
        email : new EmailProperty("Email"),
        telephone : new PhoneProperty("Telephone"),
        adresse : new AdressProperty("Adresse"), 
        priority : new RatingProperty("Priorité"),
        partenariats : new MultiFileProperty("Partenariats", ["Partenariat"], {icon : "hand-coins", static : true}),
        services : new ObjectProperty("Services", {
            name : new Property("Nom", {icon : ""}),
            email : new EmailProperty("Email"),
            telephone : new PhoneProperty("Telephone"),
        }),
        ...Suivi.SuiviProperties
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

        content.appendChild(Commune.Properties.services.getDisplay(classe))
        content.appendChild(Suivi.getDisplay(classe));

        
        const title = document.createElement("h2");
        title.textContent = "Mairie de " + classe.getName(false).split(" - ")[1];
        title.style.cursor = "pointer";
        container.appendChild(title);

        // Assuming you have a method to get people in the commune
        let people : any[]= classe.getChildren().filter(value => value.getClasse() === "Personne")
        if (people.length !== 0) {
            let table = new DynamicTable(this.vault, people)
            table.addColumn("Poste",  `
                for(let el of Postes){
                    if (el.Institution.includes("${classe.getName(false)}")){
                        return el.Poste
                    }
                }
                return  ""
            `)
            content.appendChild(table.getTable());
        }
        container.appendChild(content);
        addFold(title, content);


        const title2 = document.createElement("h2");
        title2.textContent = "Institutions";
        title2.style.cursor = "pointer";
        container.appendChild(title2);

        // Assuming you have a method to get people in the commune
        let institution : any[]= classe.getChildren().filter(value => value.getClasse() === "Institution")
        if (institution.length !== 0) {
            let table = new DynamicTable(this.vault, institution)
            container.appendChild(table.getTable());
            addFold(title2, table.getTable());
        }

        container.appendChild(Suivi.getLinkDisplay(classe))

        return container;
    }
}