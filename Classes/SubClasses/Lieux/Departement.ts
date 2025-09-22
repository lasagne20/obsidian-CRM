import { App, Tasks } from "obsidian";
import { SubClass } from "../SubClass";
import { MyVault } from "Utils/MyVault";
import { Property } from "Utils/Properties/Property";
import { Classe } from "Classes/Classe";
import { Data } from "Utils/Data/Data";
import { DynamicTable } from "Utils/Display/DynamicTable";
import { Tabs } from "Utils/Display/Tabs";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import { Grid } from "gridjs";
import { DynamicMap } from "Utils/Display/DynamicMap";
import { TextDisplay } from "Utils/Display/TextDisplay";
import { NumberDisplay } from "Utils/Display/NumberDisplay";
import { ChartBarDisplay } from "Utils/Display/ChartBarDisplay";
import { GridDisplay } from "Utils/Display/GridDisplay";
import { Action } from "Classes/Action";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";




export class Departement extends SubClass {

    public subClassName : string = "Departement";
    public subClassIcon : string = "box";

    public static Properties : { [key: string]: Property } ={
            communeFile : new Property("CommuneJsonFile", {icon : "data"}),
            centresAereFile : new Property("CentreAereJsonFile", {icon : "data"})
        }

    constructor(classe : typeof Classe, data : Data | null = null) {
        super(classe, data);
    }

    getConstructor(){
        return Departement
      }

    getTopDisplayContent(classe: Classe) : any{
        const container = document.createElement("div");

        let tabs = new Tabs()
        this.vault = classe.vault
        /*
        
        let ecpidata = classe.vault.getGeoData(classe, "EPCI", "Lieu", "EPCI")
        let ecpitable = new DynamicTable(this.vault, this.vault.getClasseFromName("EPCI"), ecpidata)
        ecpitable.addColumn("Email", "email", "", "sort", "")
        let epciContainer = ecpitable.getTable()
        */

        /*
        let communesdata = classe.vault.getGeoData(classe, "Commune", "Lieu", "Commune")
        let communestable = new DynamicTable(this.vault, this.vault.getClasseFromName("Communne"), communesdata)
        communestable.addColumn("Email", "email")
        communestable.addColumn("Partenariats", "partenariats", "filter-list")
        communestable.addColumn("ComCom", "parent")
        let communesContainer = communestable.getTable()*/


        /*
        let centresdata = classe.vault.getGeoData(classe, "Commune", "Institution", "Centre Aéré").filter((c) => {
            return c.getMetadataValue("parent")?.getMetadataValue("Partenariats")})
        let centrestable = new DynamicTable(this.vault, this.vault.getClasseFromName("Institution"), centresdata)
        centrestable.addColumn("Email", "email")
        centrestable.addColumn("Commune", "parent")
        tabs.addTab("Centres aéré", centrestable.getTable()) 

        container.appendChild(tabs.getContainer())


        return container*/

        /*
        let institutions = classe.getChildren().filter((c) => c.getClasse() == "Institution")
        let institutionsTable = new DynamicTable(this.vault, institutions[0].getConstructor(), institutions)
        institutionsTable.addColumn("Type", "type")
        institutionsTable.addColumn("Priorité", "priority")*/


        /*
        let personnes = classe.getChildren().filter((c) => c.getClasse() == "Personne")
            .filter((c) => {
            let prochainContact = c.getMetadataValue("Prochain contact");
            if (!prochainContact) return false;

            let contactDate = new Date(prochainContact);
            let now = new Date();
            let thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            let inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ago
            return contactDate >= thirtyDaysAgo && contactDate <= inThirtyDays;
            })

        if (personnes.length != 0){
            let personnesTable = new DynamicTable(this.vault, personnes[0].getConstructor(), personnes)
            personnesTable.addColumn("Institution", "Postes[0].Institution")
            personnesTable.addColumn("Dernier contact", "lastContact")
            personnesTable.addColumn("Prochain contact", "nextContact")
            personnesTable.addColumn("Priorité", "prioriété")
            personnesTable.addColumn("Interlocuteur", "interlocuteur")
            personnesTable.addColumn("Tache", "tache")
            personnesTable.sortTableByColumn("Prochain contact")
            tabs.addTab("Personnes", personnesTable.getTable())
        }

        let institutions = classe.getChildren().filter((c) => c.getClasse() == "Institution")
            .filter((c) => {
            let prochainContact = c.getMetadataValue("Prochain contact");
            if (!prochainContact) return false;

            let contactDate = new Date(prochainContact);
            let now = new Date();
            let thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            let inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ago
            return contactDate >= thirtyDaysAgo && contactDate <= inThirtyDays;
            })

        if (institutions.length != 0){
            let institutionsTable = new DynamicTable(this.vault, institutions[0].getConstructor(), institutions)
            institutionsTable.addColumn("Type", "type")
            institutionsTable.addColumn("Dernier contact", "lastContact")
            institutionsTable.addColumn("Prochain contact", "nextContact")
            institutionsTable.addColumn("Priorité", "priority")
            institutionsTable.addColumn("Tache", "tache")
            institutionsTable.sortTableByColumn("Prochain contact")
           
            tabs.addTab("Institution", institutionsTable.getTable())
        }


        */
        /*
        let act: any[] = [];
        actions.forEach((action) => {
            let row: { [key: string]: any } = { Nom: action.getName(false) };
            let metadata = (action.getMetadata() as { [key: string]: any });
            Object.keys(metadata).forEach((key) => {
            if (metadata[key] instanceof Array) {
                row[key] = metadata[key].join(", ");
            } else {
                row[key] = metadata[key];
            }
            });
            act.push(row);
        });
        
        let actionTable = document.createElement("div");
        new Grid({
            columns: Object.keys(act[0] || {}),
            data: act.map((row) => Object.values(row)),
            search: true,
            pagination: true,
            sort: true,
        }).render(actionTable);*/
        
        let actions = classe.getChildren().filter((c) => c.getClasse() == "Action" && !["Annulé"].contains(c.getMetadataValue("Etat")));
        let actionTable = new DynamicTable(this.vault, actions.filter((c) => !["Devis signé", "Payé", "Facturé", "Réalisé", "Date validée"].contains(c.getMetadataValue("Etat"))))
        actionTable.addColumn("Date", "date", {sort:"date"})
        actionTable.addColumn("Etat", "etat")
        actionTable.addColumn("Priorité", "priority")
        actionTable.addColumn("Te38", "Partenariats[0].Partenariat")
        actionTable.sortTableByColumn("Priorité", false)

        let personnesSummary = actions.filter((c) => !["Devis signé", "Payé", "Facturé"].contains(c.getMetadataValue("Etat"))).map(action => `
            Nom: ${action.getName(false)}
            Date: ${action.getMetadataValue("Date")}
            Etat: ${action.getMetadataValue("Etat")}
            Clients: ${action.getMetadataValue("Clients") ? (action.getMetadataValue("Clients")[0] ? action.getMetadataValue("Clients")[0].Contact: "") : ""}
        `).join("\n");

        let emailFormattedSummary = `Personnes :${personnesSummary}`;

        navigator.clipboard.writeText(emailFormattedSummary).then(() => {
            console.log("Personnes summary copied to clipboard in email-friendly format");
        }).catch(err => {
            console.error("Failed to copy personnes summary to clipboard: ", err);
        });

        let actionprévu = actions.filter((c) => ["Devis signé", "Payé", "Réalisé", "Facturé", "Devis envoyé", "Date validée"].contains(c.getMetadataValue("Etat"))).filter((c) => {
            let date = c.getMetadataValue("Date")
            if (!date) return true
            if (date.includes(" to ")){
                date = date.split(" to ")[0]
            }
            const actionDate = new Date(date);
            const currentYear = new Date().getFullYear();
            return actionDate.getFullYear() === currentYear;
            })

        let actionprévuTable = new DynamicTable(this.vault, actionprévu)
        actionprévuTable.addColumn("Date", "date", {sort:"date"})
        actionprévuTable.addColumn("Etat", "etat", {filter:"multi-select"}) 

        let displayProperties = actionprévu.map(action => {
            const prop = action.getProperty("animateurs")[1];
            console.log("Property for Animateurs: ", prop);
            if (prop instanceof ObjectProperty) {
                // prop.getDisplayProperties returns an array, so wrap it in a container
                const container = document.createElement("div");
                const displays = prop.getDisplayProperties(action, "animateur", "animateur");
                console.log("Displays for Animateurs: ", displays);
                if (Array.isArray(displays)) {
                    displays.forEach(d => {
                        if (d.display instanceof HTMLElement) {
                            container.appendChild(d.display);
                        } else if (d.display) {
                            // If not HTMLElement, create a span
                            const span = document.createElement("span");
                            span.textContent = String(d.display);
                            container.appendChild(span);
                        }
                    });
                }
                return {classe : action, display : container};
            }
            return {classe: action, display: document.createElement("span")};
        });
        console.log("Display properties for Animateurs: ", displayProperties);
        actionprévuTable.addDisplayPropertyColumn("Animateurs", displayProperties)
 
        actionprévuTable.addColumn("Montant", "montant")
        actionprévuTable.addTotalRow("Montant", (values) => {
            return values.reduce((acc, value) => acc + value, 0) + ' €'
          })
        actionprévuTable.sortTableByColumn("Date")
        
        actionprévuTable.addColumn("Partenariat", "Partenariats[0].Partenariat");



        
        tabs.addTab("Actions prévue", actionprévuTable.getTable())
        tabs.addTab("Actions piste", actionTable.getTable())

        
            // Récupère les lieux (communes) associés à chaque action
            const points = actions
              .map(action => {
                // Trouve le client (lieu) associé à l'action
                const clients = action.getMetadataValue("Clients") || [];
                for (const client of clients) {
                  const file = this.vault.getFromLink(client.Client);
                  if (!file) continue;
                  let lieuFile = file;
                  if (file.getClasse() !== "Lieu") {
                    const parent = this.vault.getFromLink(file.getParentValue());
                    if (parent && parent.getClasse() === "Lieu") {
                      lieuFile = parent;
                    } else {
                      continue;
                    }
                  }
                  // Change la couleur du point selon l'état de l'action
                  const etat = action.getMetadataValue("Etat");
                  let color = "gray";
                  if (etat === "Facturé" || etat == "Payé" || etat == "Réalisé") color = "green";
                  else if (etat === "Date validée" || etat=="Devis signé") color = "blue";
                  else if (etat === "Devis envoyé" || etat == "Réflexion") color = "orange";
        
                  let geoData = this.vault.getGeoDataFromName(lieuFile.getName(false));
                  if (!geoData) {
                    console.warn(`No geo data found for ${lieuFile.getName(false)}`);
                    return null;
                  }
                  if (!geoData.longitude || !geoData.latitude) {
                    console.warn(`No valid coordinates found for ${lieuFile.getName(false)}`);
                    return null;
                  }
                  return {
                    id: action.getName(false), // or use a unique identifier if available
                    longitude: geoData.longitude, // Use the name of the lieu as position
                    latitude: geoData.latitude, // Use the name of the lieu as position
                    file : lieuFile.getLink(), // Use the link to the lieu file
                    label: action.getName(false),
                    color,
                    link: action.getLink()
                  };
                }
                return null;
              });
        
        
            // Filtrer les points valides (non null)
            const validPoints = points.filter((p): p is NonNullable<typeof p> => !!p);
        
            // Créer la carte dynamique si des points existent
            let mapContainer = document.createElement("div");
            mapContainer.classList.add("dynamic-map-container");
            mapContainer.style.height = "800px"; // Set a fixed height for the map
            mapContainer.style.width = "100%"; // Set a fixed width for the map
            
        
            if (validPoints.length > 0) {
              const map = new DynamicMap(this.vault,mapContainer);
              // Ajoute le contour du département du Lieu sur la carte
              const lieu = classe.getName();
              console.log("Lieu for geo polygon: ", lieu);
              if (lieu) {
                // On suppose que getGeoPolygonFromName retourne un tableau de coordonnées [lat, lng]
                const geoPolygon = this.vault.getGeoDataFromName(lieu.replace(".md", ""));
                if (geoPolygon && geoPolygon.geoData && geoPolygon.geoData.geometry && geoPolygon.geoData.geometry.coordinates) {
                  
                    map.addPolygon(geoPolygon.geoData.geometry.coordinates[0], {
                    color: "black",           // Contour noir
                    weight: 4,                // Largeur du contour
                    fillColor: "white",       // Intérieur blanc
                    fillOpacity: 0.1,         // Opacité 10%
                    });
                }
              }
              console.log("Adding markers to map: ", validPoints);
        
               map.addMarkers(validPoints.map(point => ({
                id: point.id,
                latitude: point.latitude,
                longitude: point.longitude,
                file: point.file,
                label: point.label,
                color: point.color,
                link: point.link
              })));
        
              map.fitBoundsToFeatures()
            }
        
            
            tabs.addTab("Carte des actions", mapContainer)
        
        
            // Tab pour les chiffres clés
            let chiffresClesContainer = document.createElement("div");
            chiffresClesContainer.classList.add("chiffres-cles-container");
            // Titre
            const title = new TextDisplay("Chiffres clés");
            chiffresClesContainer.appendChild(title.getDisplay());
        
            // Nombre d'animations (actions non annulées)
            const nbActions = actionprévu.length;
            const nbActionsRealisees = classe.getChildren().filter(link =>
              link.getClasse() === "Action" &&
              ["Facturé", "Réalisé", "Payé"].includes(link.getMetadataValue("Etat"))
            ).length;
            const nbActionsDisplay = new NumberDisplay({ label: `Actions prévues<br/>(dont ${nbActionsRealisees} réalisées)`,
              value: nbActions, size: 80, fillLevel: nbActions/30 });
        
            const actionsTotals = classe.getChildren().filter(link =>
                link.getClasse() === "Action" &&
                link.getMetadataValue("Etat") !== "Annulé"
            );
        
        
            // Compte le nombre d'animations (actions ayant des animations associées)
            let nbAnimations = actions.reduce((acc, action) => {
              const animations = action.getMetadataValue("Animations");
              if (Array.isArray(animations) && animations.length > 0) {
                return acc + animations.length;
              }
              return acc
            }, 0);
            const animationsDisplay = new NumberDisplay({ label: `Ateliers energies réalisés`,
              value: nbAnimations, size: 80, fillLevel: nbAnimations/nbActions });
        
        
            // Compte le nombre d'articles de presse dans les actions liées
            let nbArticles = actions.reduce((acc, action) => {
              const animations = action.getMetadataValue("Presse");
              if (Array.isArray(animations) && animations.length > 0) {
                return acc + animations.length;
              }
              return acc
            }, 0);
            const articlesDisplay = new NumberDisplay({
              label: `Articles de presse`,
              value: nbArticles,
              size: 80,
              fillLevel: nbArticles / 10, // Ajustez le diviseur selon vos besoins
            });
        

            const categories = ["Ecoliers", "Collégiens", "Lycéens", "Collaborateurs", "Grand public", "Retraités"];
            let values = []
              for (const category of categories) {
                const total = actionsTotals.reduce((acc, action) => {
                  const [classe, client] = action.getProperty("clients");
                  let data = client?.read(classe) || [];
                  if (Array.isArray(data)) {
                      for (const client of data) {
                        if (client && !client["Public"]){
                          client["Public"] = "Ecoliers"
                        }
                        if (client && client["Public"] && client["Public"].includes(category)) {
                          acc += (Number(client["Participants"]) || 0);
                        }
                    }
                  }
                  return acc;
                }, 0);
                values.push(total);
              }

            const totalPersonnes = values.reduce((acc, val) => acc + Number(val), 0);
            const personnesDisplay = new NumberDisplay({
              label: `Mains en or <br/>(soit ${totalPersonnes} personnes)`,
              value: totalPersonnes*2,
              size: 80,
              fillLevel: totalPersonnes / 1000, 
            });
        
            const charBar = new ChartBarDisplay({
              labels: categories,
              values: values,
            });
            
            
        
            const grid = new GridDisplay();
            grid.addRow([nbActionsDisplay.getDisplay(), animationsDisplay.getDisplay(), articlesDisplay.getDisplay(), personnesDisplay.getDisplay()]);
        
            
        
        
            chiffresClesContainer.appendChild(grid.getDisplay());
            chiffresClesContainer.appendChild(charBar.getDisplay());
        
        
        
        
        
            tabs.addTab("Chiffres clés", chiffresClesContainer)
        
        container.appendChild(tabs.getContainer())


        return container

    }
}