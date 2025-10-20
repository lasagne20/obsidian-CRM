import { App } from "obsidian";
import { SubClass } from "../SubClass";
import { MyVault } from "Utils/MyVault";
import { Data } from "Utils/Data/Data";
import { Classe } from "Classes/Classe";
import { DynamicTable } from "Utils/Display/DynamicTable";
import { Tabs } from "Utils/Display/Tabs";
import { filter } from "jszip";


export class National extends SubClass {

    public subClassName : string = "National";
    public subClassIcon : string = "box";

    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);

    }

    getConstructor(){
        return National
      }

     getTopDisplayContent(classe: Classe) : any{
        const container = document.createElement("div");
    
        let actions = classe.getChildren().filter((c) => c.getClasse() == "Action")
        let actions_validé = actions.filter((c) => ["Devis signé", "Payé", "Réalisé", "Facturé", "Date validée"].contains(c.getMetadataValue("Etat")))
        let actions_non_validé = actions.filter((c) => !["Devis signé", "Payé", "Réalisé", "Facturé", "Date validée", "Annulé"].contains(c.getMetadataValue("Etat")))

        // Filter actions for the current year
        const currentYear = new Date().getFullYear();
        let actionsYear = actions_validé.filter((action) => {
            let date = action.getMetadataValue("Date")
            if (!date){return false}
            const actionDate = new Date(date.split(" to ")[0]);
            return actionDate.getFullYear() === currentYear;
        });
        let actionsYearTable = new DynamicTable(classe.vault, actionsYear)
        actionsYearTable.addColumn("Date", "date", {sort: "date"})
        actionsYearTable.addColumn("Etat", "etat")
        actionsYearTable.addColumn("Montant", "montant")
        actionsYearTable.addTotalRow("Montant", (values) => {
            return values.reduce((acc, value) => acc + value, 0) + ' €'
          })
        actionsYearTable.sortTableByColumn("Date")

        // All actions done 
        let allActions = actions_validé.filter((c) => ["Payé", "Facturé", "Réalisé"].contains(c.getMetadataValue("Etat")))
        let allActionsTable = new DynamicTable(classe.vault, allActions)
        allActionsTable.addColumn("Date", "date",  {sort: "date"})
        allActionsTable.addColumn("Etat", "etat", {filter: "multi-select"})
        allActionsTable.addColumn("Montant", "montant")
        allActionsTable.addColumn("Participants", "participants")
        allActionsTable.addColumn("Type de public", `
            let publics = new Set();
            for (let client of Clients) {
              if (client && client.Public) {
                if (Array.isArray(client.Public)) {
                  client.Public.forEach(p => publics.add(p));
                } else {
                  publics.add(client.Public); 
                }
              }
            }
            return Array.from(publics).join(", ");
          `,  {filter: "multi-select"});
        allActionsTable.addTotalRow("Montant", (values) => {
            return values.reduce((acc, value) => acc + value, 0) + ' €'
          })
        allActionsTable.addTotalRow("Particpants", (values) => {
            return values.reduce((acc, value) => acc + value, 0) + ' personnes'
          })
        allActionsTable.sortTableByColumn("Date")
        allActionsTable.addTotalRow("Participants", (values) => {
          return values.reduce((acc, value) => acc + value, 0) + ' personnes';
        });


        let actionsNonValidéTable = new DynamicTable(classe.vault, actions_non_validé)
        actionsNonValidéTable.addColumn("Date", "date", {sort: "date"})
        actionsNonValidéTable.addColumn("Etat", "etat", {filter: "multi-select"})
        actionsNonValidéTable.addColumn("Montant", "montant")
        actionsNonValidéTable.addColumn("Participants", "participants")
        actionsNonValidéTable.addTotalRow("Montant", (values) => {
            return values.reduce((acc, value) => acc + value, 0) + ' €'
          })
        actionsNonValidéTable.addTotalRow("Participants", (values) => {
          return values.reduce((acc, value) => acc + value, 0) + ' personnes';
        });
        


        let tabs = new Tabs()
        tabs.addTab("Actions 2025",actionsYearTable.getTable())
        tabs.addTab("Actions réalisé",allActionsTable.getTable())
        tabs.addTab("Actions en cours",actionsNonValidéTable.getTable())

        container.appendChild(tabs.getContainer())


        return container

    }
}