import { App } from "obsidian";
import { SubClass } from "./SubClass";
import { MyVault } from "Utils/MyVault";
import { Property } from "Utils/Properties/Property";
import { Classe } from "Classes/Classe";
import { generateTableFromClasses, generateTabs } from "Utils/Display/Utils";
import { Data } from "Utils/Data/Data";



export class Departement extends SubClass {

    public subClassName : string = "Departement";
    public subClassIcon : string = "box";

    public Properties : { [key: string]: Property } ={
            communeFile : new Property("CommuneJsonFile", "data"),
            centresAereFile : new Property("CentreAereJsonFile", "data")
        }

    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);
    }

    getConstructor(){
        return Departement
      }

    getTopDisplayContent(classe: Classe) : any{
        const container = document.createElement("div");

        let epciContainer = classe.vault.generateTable(classe, "EPCI", "Lieux", "EPCI", 
            {
                "Email" : "email"
            }
        )

        let communesContainer = classe.vault.generateTable(classe, "Commune", "Lieux", "Commune", {
            "Email":  "email",
            "Partenariats" : "partenariats",
            "ComCom" : "parent"
        })


        let tabsContainer = generateTabs({
            "Communauté de communes" : epciContainer,
            "Communes" : communesContainer
            }
        )
        container.appendChild(tabsContainer)

        return container

    }
}