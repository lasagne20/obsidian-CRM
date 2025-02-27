import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { FileProperty } from "Utils/Properties/FileProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { Lieu } from "./Lieux";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { selectFile } from "Utils/Modals/Modals";

export class Institution extends Classe {

  public static className : string = "Institutions";

  public static parentProperty: FileProperty| MultiFileProperty  = new FileProperty("Lieu", Lieu);

  public static get Properties() : { [key: string]: Property } { 
    return {
      classe : new Property("Classe"),
      type: new Property("Type institution"),
      groupe: new FileProperty("Groupe", Institution),
      site: new Property("Site web"),
      mail : new Property("Email"),
      telephone : new Property("Telephone"),
      relation: new SelectProperty("Type de relation", ["financeurs", "vecteurs", "clients", "support"]),
      lieu: this.parentProperty,
      domaine: new Property("Domaine"),
      addresse : new Property("Adresse"), 
      prioriété : new Property("Priorité"),
      personnes : new Property("Personnes"),
      liens : new Property("Liens")
      }
    }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getClasse(){
      return Institution.className
    }

    static getProperties(){
      return Institution.Properties
    }

    getparentProperties(): FileProperty| MultiFileProperty{
      return Institution.parentProperty
    }


    getChildFolderPath(child : Classe){
      return super.getChildFolderPath(child) + "/" +  child.getClasse()
    }

    async populate(...args : any[]){
      //get the parent
      let parent = await selectFile(this.vault, Institution.parentProperty.classe, "Selectionner le lieux parent")
      if (parent){
        await this.updateMetadata(Institution.parentProperty.name, parent.getLink())
      }
      await this.update()
    }

    getTopDisplayContent() {
      const content = document.createElement("div");
  
      // Récupérer la liste des personnes
      let personnes : any[]= this.getChildren().filter(value => value.getClasse() === "Personnes")
      console.log(personnes)
  
      if (!personnes || personnes.length === 0) {
          content.innerHTML = "<p>Aucune personne enregistrée dans cette institution.</p>";
          return content;
      }
  
      // Créer une table
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
  
      // Ajouter un en-tête avec une nouvelle colonne
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
  
      // Ajouter les entêtes de colonnes (Nom et Rôle)
      headerRow.innerHTML = "<th style='border: 1px solid black; padding: 8px;'>Nom</th><th style='border: 1px solid black; padding: 8px;'>Poste</th>";
      thead.appendChild(headerRow);
      table.appendChild(thead);
  
      // Ajouter les personnes sous forme de liens
      const tbody = document.createElement("tbody");
  
      personnes.forEach((person) => {
          const row = document.createElement("tr");
  
          // Colonne 1: Nom (lien cliquable)
          const nameCell = document.createElement("td");
          nameCell.style.border = "1px solid black";
          nameCell.style.padding = "8px";
  
          const link = document.createElement("a");
          link.onclick = (event) => {
              event.preventDefault();
              this.app.workspace.getLeaf().openFile(person.file);
          }
          link.textContent = person.getName(false);
          link.target = "_blank"; // Ouvre dans Obsidian
          link.style.textDecoration = "none";
          link.style.color = "blue";
  
          nameCell.appendChild(link);
          row.appendChild(nameCell);
  
          // Colonne 2: Rôle (ajout d'une donnée fictive ou d'une propriété à afficher)
          const roleCell = document.createElement("td");
          roleCell.style.border = "1px solid black";
          roleCell.style.padding = "8px";
  
          // Exemple de rôle (tu peux remplacer cette ligne par une propriété réelle si nécessaire)
          const role = person.getPoste() || "Non spécifié"; // Remplacer 'role' par une vraie propriété si elle existe
          roleCell.textContent = role;
          row.appendChild(roleCell);
  
          tbody.appendChild(row);
      });
  
      table.appendChild(tbody);
      content.appendChild(table);
  
      return content;
  }
  
  


    // Validate that the file content is standart
    async check(){
      // Check si le lieu est correct
      await Institution.Properties.lieu.check(this)
      // Remet les propriétés dans l'ordre
      await this.reorderMetadata(Object.values(Institution.Properties).map(p => p.name));
    }
  }
  