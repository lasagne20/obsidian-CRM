import { App } from "obsidian";
import { SubClass } from "../SubClass";
import { MyVault } from "Utils/MyVault";
import { Property } from "Utils/Properties/Property";
import { Classe } from "Classes/Classe";
import { Data } from "Utils/Data/Data";
import { DynamicTable } from "Utils/Display/DynamicTable";
import { generateTabs } from "Utils/Display/Utils";



export class Departement extends SubClass {

    public subClassName : string = "Departement";
    public subClassIcon : string = "box";

    public static Properties : { [key: string]: Property } ={
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

        this.vault = classe.vault
        let ecpidata = classe.vault.getGeoData(classe, "EPCI", "Lieu", "EPCI")
        let ecpitable = new DynamicTable(this.vault, this.vault.getClasseFromName("EPCI"), ecpidata)
        ecpitable.addColumn("Email", "email")
        let epciContainer = ecpitable.getTable()
        

        let communesdata = classe.vault.getGeoData(classe, "Commune", "Lieu", "Commune")
        let communestable = new DynamicTable(this.vault, this.vault.getClasseFromName("Communne"), communesdata)
        communestable.addColumn("Email", "email")
        communestable.addColumn("Partenariats", "partenariats", "filter-list")
        communestable.addColumn("ComCom", "parent")
        let communesContainer = communestable.getTable()

        /*
        let centresdata = classe.vault.getGeoData(classe, "Commune", "Institution", "Centre Aéré")
        let centrestable = new DynamicTable(this.vault, this.vault.getClasseFromName("Centre Aéré"), centresdata)
        centrestable.addColumn("Email", "email")
        centrestable.addColumn("Partenariats", "parent.partenariats")
        let centresContainer = centrestable.getTable()*/

        let actions = classe.getChildren().filter((c) => c.getClasse() == "Action")
        let actionTable = new DynamicTable(this.vault, actions[0].getConstructor(), actions)
        actionTable.addColumn("Date", "date", "", "date")
        actionTable.addColumn("Etat", "etat")

        let tabsContainer = generateTabs({
            "Actions" : actionTable.getTable(),
            "Communauté de communes" : epciContainer,
            "Communes" : communesContainer
            }
        )
        container.appendChild(tabsContainer)


        return container

    }
}