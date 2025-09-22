import { Property } from "Utils/Properties/Property";
import { addFold } from "Utils/Display/Utils";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { MultiSelectProperty } from "Utils/Properties/MultiSelectProperty";
import { DateProperty } from "Utils/Properties/DateProperty";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";
import { FileProperty } from "Utils/Properties/FileProperty";
import { Classe } from "Classes/Classe";
import { Tabs } from "Utils/Display/Tabs";
import { TextProperty } from "Utils/Properties/TextProperty";
import { icon } from "leaflet";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";



export class Suivi{

    public static SuiviProperties : { [key: string]: Property } = {
        suivi : new ObjectProperty("Suivi",{
            date : new DateProperty("Date", ["today", "next-week"], {defaultValue : "today"}),
            interlocuteur : new MultiSelectProperty("Interlocuteur", [
                { name: "Sylvie", color: "blue" },
                { name: "Léo", color: "red" }
            ], {defaultValue : ["personalName"]}),
            moyen: new SelectProperty("Moyen", [
                { name: "Mail", color: "" },
                { name: "SMS", color: "" },
                { name: "Téléphone", color: "" },
                { name: "Visio", color: "" },
                { name: "Présentiel", color: "" },
                { name: "Newsletter", color: "" }
            ]),
            sujet : new FileProperty("Sujet", ["Personne", "Institution", "Action", "Lieu", "Partenariat", "Evenement"],
                {icon :"file-symlink", defaultValue : "like-precedent"}),
            description : new TextProperty("Description", {flexSpan : 4, icon:""})
        }, {icon: "arrow-big-right", appendFirst : true, allowMove : false}),
    }
    
    public static getDisplay(classe: Classe) : any{
        const container = document.createElement("div");
        const title = document.createElement("h2");
        title.textContent = "Suivi de communication";
        title.style.cursor = "pointer";
        container.appendChild(title);
    
        const content2 = document.createElement("div");
        content2.classList.add("metadata-line");
        content2.appendChild(this.SuiviProperties.suivi.getDisplay(classe))
        container.appendChild(content2);
    
        addFold(title, content2);
        return container;
    }

    public static getLinkDisplay(classe: Classe) : any{
        const container = document.createElement("div");
        const title = document.createElement("h2");
        title.textContent = "Suivi de communication";
        title.style.cursor = "pointer";
        container.appendChild(title);
    
        const content = document.createElement("div");
        
        let data = classe.getIncomingLinks().filter((link : any) => link.getClasse() == "Personne")

        let tabs = new Tabs();
        data.forEach((element : Classe) => {
            let tab = document.createElement("div");

            let container = document.createElement("div");
            container.classList.add("metadata-line");
            container.appendChild(new FileProperty("Personne", ["Personne"], {icon: "circle-user-round"}).fillDisplay(classe.vault, element.getLink(), async (value) => {return}))
            container.appendChild(element.getProperties().lastContact.getDisplay(element, {title:"Dernier contact"}))
            container.appendChild(element.getProperties().nextContact.getDisplay(element, {title: "Prochain contact"}))
            container.appendChild(element.getProperties().tache.getDisplay(element,{title:"Prochaine tache"}))
            tab.appendChild(container)

            tab.appendChild(element.getProperties().suivi.getDisplay(element))
            let suivi = element.getMetadataValue("Suivi")
            tabs.addTab(`${element.getName(false)}` + (suivi ?  ` (${suivi.length})` : ""), tab)
        })
        content.appendChild(tabs.getContainer())


        container.appendChild(content);
    
        addFold(title, content);
        return container;
    }
      

}


