import * as L from 'leaflet';
import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import { App, TFile } from 'obsidian';
import { Property } from "Utils/Properties/Property";
import { FileProperty } from "Utils/Properties/FileProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { MediaProperty } from "Utils/Properties/MediaProperty";
import { DynamicTable } from "Utils/Display/DynamicTable";
import { RangeDateProperty } from "Utils/Properties/RangeDateProperty";
import { NumberProperty } from "Utils/Properties/NumberProperty";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";
import { Suivi } from "./GroupProperties/Suivi";
import { SubClass } from './SubClasses/SubClass';
import { DynamicMap } from "Utils/Display/DynamicMap";
import { Tabs } from 'Utils/Display/Tabs';
import { NumberDisplay } from "Utils/Display/NumberDisplay";
import { TextDisplay } from "Utils/Display/TextDisplay";
import { GridDisplay } from "Utils/Display/GridDisplay"; 
import { ChartBarDisplay } from 'Utils/Display/ChartBarDisplay';



export class Partenariat extends Classe {
  public static className: string = "Partenariat";
  public static classIcon: string = "handshake";

  public static parentProperty: FileProperty  = new FileProperty("Lieu", ["Lieu"], "map");

  public static Properties = {
      classe: new Property("Classe"),
      partenaire: new FileProperty("Partenaire", ["Institution"], {icon :"handshake"}),
      montant: new NumberProperty("Montant","€", {icon :"euro-sign"}),
      lieu : this.parentProperty,
      contacts: new MultiFileProperty("Contact", ["Personne"], {icon :"circle-user-round"}),
      periode: new RangeDateProperty("Date de signature"),
      document: new MediaProperty("Document"),
      etat: new SelectProperty("Etat", [
        { name: "Piste", color: "gray" },
        { name: "En attente", color: "yellow" },
        { name: "En cours", color: "blue" },
        { name: "Terminé", color: "green" },
        { name: "Annulé", color: "red" }
      ]),
      accompte: new NumberProperty("Accompte", "€", {icon: "euro-sign"}),
    };
  public data: { [key: string]: any };

  constructor(app: App, vault: MyVault, file: TFile) {
    super(app, vault, file);
    // Temp for TE38
  }

  getConstructor(){
    return Partenariat
  }

  static getConstructor(){
    return Partenariat
  }


  getTopDisplayContent(): HTMLDivElement {
    const container = document.createElement("div");

    let firstContainer = document.createElement("div");
    firstContainer.classList.add("metadata-line")
    firstContainer.appendChild(Partenariat.Properties.classe.getDisplay(this))
    firstContainer.appendChild(Partenariat.Properties.partenaire.getDisplay(this))
    firstContainer.appendChild(Partenariat.Properties.montant.getDisplay(this))
    firstContainer.appendChild(Partenariat.Properties.lieu.getDisplay(this))
    firstContainer.appendChild(Partenariat.Properties.etat.getDisplay(this))
    container.appendChild(firstContainer)

    let secondContainer = document.createElement("div");
    secondContainer.classList.add("metadata-line")
    
    secondContainer.appendChild(Partenariat.Properties.contacts.getDisplay(this))
    secondContainer.appendChild(Partenariat.Properties.periode.getDisplay(this))
    container.appendChild(secondContainer)
    
     
    let data = this.getIncomingLinks().filter((link) => link.getClasse() == "Action" && link.getMetadataValue("Etat") != "Annulé")
    let table = new DynamicTable(this.vault, data)
    table.addColumn("Date", "date")
    table.addColumn("Etat", "etat", {filter: "multi-select"})
    table.addColumn("Montant", `
      for (let partenaire of Partenariats){
        if (partenaire.Partenariat.includes("${this.getName(false)}") && partenaire.Montant){
          return partenaire.Montant + ' €'
        }
     }
      `)
    table.addColumn("Communes", `
        for (let client of Clients){
          let file = vault.getFromLink(client.Client)
          if (!file){return}
          if (file.getClasse() == "Lieu"){
            return file.getLink()
          }
          let parent = vault.getFromLink(file.getParentValue())
          if (parent){
            return parent.getLink()
          }
          
       }
        `)   

      table.addColumn("Hors zone", `
          for (let client of Clients){
            let file = vault.getFromLink(client.Client)
            if (!file){return}
            if (file.getClasse() == "Lieu"){
              return file.getMetadataValue("Partenariats") ? "" : "x"
            }
            let parent = vault.getFromLink(file.getParentValue())
            if (parent){
              return parent.getMetadataValue("Partenariats") ? "" : "x"
            }
            
         }
          `)
    table.addColumn("Participants", "participants")

    table.addColumn("Type de public", `
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
    `, {filter: "multi-select"});


    let montant = this.getMetadataValue("Montant")

    table.addTotalRow("Montant", (values) => {
      let total = values.reduce((acc, value) => acc + value, 0)

      return total + ' € (' + Math.round((total / montant) * 100) + '%)'
    })
    table.addTotalRow("Participants", (values) => {
            return values.reduce((acc, value) => acc + value, 0) + ' personnes'
          })

    table.sortTableByColumn("Date");


    
    // Ajout d'une carte dynamique pour afficher les communes liées aux actions
    const actions = this.getIncomingLinks().filter(link => link.getClasse() === "Action" && link.getMetadataValue("Etat") !== "Annulé");

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
      const lieu = Partenariat.parentProperty.read(this);
      if (lieu) {
        // On suppose que getGeoPolygonFromName retourne un tableau de coordonnées [lat, lng]
        const geoPolygon = this.vault.getGeoDataFromName(this.vault.readLinkFile(lieu));
        if (geoPolygon && geoPolygon.geoData && geoPolygon.geoData.geometry && geoPolygon.geoData.geometry.coordinates) {
          console.log("Adding polygon to map: ", geoPolygon.geoData.geometry.coordinates[0]);
            map.addPolygon(geoPolygon.geoData.geometry.coordinates[0], {
            color: "black",           // Contour noir
            weight: 4,                // Largeur du contour
            fillColor: "white",       // Intérieur blanc
            fillOpacity: 0.1,         // Opacité 10%
            });
        }
      }

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

    

    // Tab pour les chiffres clés
    let chiffresClesContainer = document.createElement("div");
    chiffresClesContainer.classList.add("chiffres-cles-container");
    // Titre
    const title = new TextDisplay("Chiffres clés");
    chiffresClesContainer.appendChild(title.getDisplay());

    // Nombre d'animations (actions non annulées)
    const nbActions = this.getIncomingLinks().filter(link => link.getClasse() === "Action" && link.getMetadataValue("Etat") !== "Annulé").length;
    const nbActionsRealisees = this.getIncomingLinks().filter(link =>
      link.getClasse() === "Action" &&
      ["Facturé", "Réalisé", "Payé"].includes(link.getMetadataValue("Etat"))
    ).length;
    const nbActionsDisplay = new NumberDisplay({ label: `Actions prévues<br/>(dont ${nbActionsRealisees} réalisées)`,
      value: nbActions, size: 80, fillLevel: nbActions/30 });

    const actionsTotals = this.getIncomingLinks().filter(link =>
        link.getClasse() === "Action" &&
        link.getMetadataValue("Etat") !== "Annulé"
    );
    const actionsValider = actionsTotals.filter(
      link =>
        link.getMetadataValue("Etat") !== "Piste" &&
        link.getMetadataValue("Etat") !== "Devis envoyé" &&
        link.getMetadataValue("Etat") !== "Réflexion"
    );
    // Calcule le montant total des actions en utilisant la logique des partenaires liés à chaque action
    const montantTotalActions = actionsTotals.reduce((acc, action) => {
      const partenariats = action.getMetadataValue("Partenariats") || [];
      let montant = 0;
      for (let partenaire of partenariats) {
      if (partenaire.Partenariat.includes(this.getName(false)) && partenaire.Montant) {
        montant = parseFloat(partenaire.Montant);
        break;
      }
      }
      return acc + montant;
    }, 0);

    const montantActionsValider = actionsValider.reduce((acc, action) => {
      const partenariats = action.getMetadataValue("Partenariats") || [];
      let montant = 0;
      for (let partenaire of partenariats) {
      if (partenaire.Partenariat.includes(this.getName(false)) && partenaire.Montant) {
        montant = parseFloat(partenaire.Montant);
        break;
      }
      }
      return acc + montant;
    }, 0);

    let montantPartenariat = this.getMetadataValue("Montant");

    const pourcentage = montant > 0 ? Math.round((montantTotalActions / montantPartenariat) * 100) : 0;
    const financementDisplay = new NumberDisplay({
      label: `Financement des actions<br/>(${Math.round((montantActionsValider / montantPartenariat) * 100)}% validées)`,
      value: pourcentage,
      unit: "%",
      size: 80,
    });


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

    // Compte le nombre de communes différentes en utilisant getColumnValues du tableau des actions
    const communesValues = table.getColumnValues("Communes");
    const uniqueCommunes = new Set(communesValues.filter(Boolean));
    const nbCommunes = uniqueCommunes.size;
    const communesDisplay = new NumberDisplay({
      label: `Communes concernées`,
      value: nbCommunes,
      size: 80,
      fillLevel: nbCommunes / 25, 
    });

    const personnesValues = table.getColumnValues("Participants");
    const totalPersonnes = personnesValues.reduce((acc, val) => acc + Number(val), 0);
    const personnesDisplay = new NumberDisplay({
      label: `Mains en or <br/>(soit ${totalPersonnes} personnes)`,
      value: totalPersonnes*2,
      size: 80,
      fillLevel: totalPersonnes / 1000, 
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
    console.log("Values for categories: ", values);

    const charBar = new ChartBarDisplay({
      labels: categories,
      values: values,
    });


    const montantActionsPayés = actionsTotals.reduce((acc, action) => {
      if (action.getMetadataValue("Etat") !== "Payé") return acc;
      const partenariats = action.getMetadataValue("Partenariats") || [];
      let montant = 0;
      for (let partenaire of partenariats) {
        if (partenaire.Partenariat.contains(this.getName(false)) && partenaire.Montant) {
            montant = parseFloat(partenaire.Montant);
          break;
        }
      }
      return acc + montant;
    }, 0);
    
    const accompte = this.getMetadataValue("Accompte") || 0;
    const montantActionsPayesDisplay = new NumberDisplay({
      label: `Budget accompte (${montantActionsPayés - accompte} €)`,
      value: Math.round((accompte-montantActionsPayés)/accompte*100) || 0,
      size: 80,
      unit: "%",
      fillLevel: montantActionsPayés / montantPartenariat,
    });
    

    const grid = new GridDisplay();
    grid.addRow([financementDisplay.getDisplay(), nbActionsDisplay.getDisplay(), communesDisplay.getDisplay()]);

    grid.addRow([animationsDisplay.getDisplay(), articlesDisplay.getDisplay(), personnesDisplay.getDisplay()]);
    grid.addRow([montantActionsPayesDisplay.getDisplay()]);

    


    chiffresClesContainer.appendChild(grid.getDisplay());
    chiffresClesContainer.appendChild(charBar.getDisplay());

    let tabs = new Tabs()
    tabs.addTab("Chiffres clés", chiffresClesContainer)
    tabs.addTab("Carte des actions", mapContainer)
    tabs.addTab("Tableau des actions", table.getTable())
    



    container.appendChild(tabs.getContainer())
    return container
  }

  getparentProperty() : FileProperty | MultiFileProperty | ObjectProperty{
      // If we have a lieu and no Institution, parent is the lieu
      if (!Partenariat.parentProperty.read(this) && Partenariat.Properties.partenaire.read(this)){
        return (Partenariat.Properties.partenaire as FileProperty)
      }
      return Partenariat.parentProperty
  }


  getClasse() {
    return Partenariat.className;
  }

  getparentProperties(): FileProperty | MultiFileProperty {
    return Partenariat.parentProperty;
  }


  async populate(...args: any[]) {
  }

  // Validate that the file content is standard
  async check() {
    await super.check()
    // Check si le l'institution est correct
  }
}


