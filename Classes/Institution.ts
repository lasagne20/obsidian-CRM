import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import {App, TFile} from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { FileProperty } from "Utils/Properties/FileProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { Lieu } from "./Lieu";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { selectFile } from "Utils/Modals/Modals";
import { ClasseProperty } from "Utils/Properties/ClasseProperty";
import { LinkProperty } from "Utils/Properties/LinkProperty";
import { EmailProperty } from "Utils/Properties/EmailProperty";
import { PhoneProperty } from "Utils/Properties/PhoneProperty";
import { AdressProperty } from "Utils/Properties/AdressProperty";
import { RatingProperty } from "Utils/Properties/RatingProperty";
import { MultiSelectProperty } from "Utils/Properties/MultiSelectProperty";
import { SubClassProperty } from "Utils/Properties/SubClassProperty";
import { Entreprise } from "./SubClasses/Institutions/Entreprise";
import { CentreAere } from "./SubClasses/Institutions/CentreAere";
import { Association } from "./SubClasses/Institutions/Association";
import { College } from "./SubClasses/Institutions/College";
import { Lycee } from "./SubClasses/Institutions/Lycee";
import { Ecole } from "./SubClasses/Institutions/Ecole";
import { DynamicTable } from "Utils/Display/DynamicTable";

export class Institution extends Classe {

  public static className : string = "Institution";
  public static classIcon : string = "building-2";

  public static parentProperty: FileProperty  = new FileProperty("Lieu", ["Lieu"]);
  public static subClassesProperty : SubClassProperty = new SubClassProperty("Type institution", [
                            new Entreprise(Institution),
                            new CentreAere(Institution),
                            new Association(Institution),
                            new College(Institution),
                            new Lycee(Institution),
                            new Ecole(Institution)
                          ]);

  public static Properties : { [key: string]: Property } = {
      classe : new ClasseProperty("Classe", this.classIcon),
      type: this.subClassesProperty,
      groupe: new FileProperty("Groupe", ["Institution"], Institution.classIcon),
      site: new LinkProperty("Site web", "globe"),
      email : new EmailProperty("Email"),
      telephone : new PhoneProperty("Telephone"),
      relation: new MultiSelectProperty("Type de relation", ["financeurs", "vecteur", "clients", "support"]),
      lieu: this.parentProperty,
      domaine: new MultiSelectProperty("Domaine", ["santé", "éducation", "culture", "sport", "social", "environnement", "économie", "numérique"]),
      adresse : new AdressProperty("Adresse"), 
      priority : new RatingProperty("Priorité"),
      personnes : new Property("Personnes"),
      liens : new Property("Liens")
    }
    
    constructor(app : App, vault:MyVault, file : TFile) {
      super(app, vault, file)
    }

    getConstructor(){
      return Institution
    }

    static getConstructor(){
      return Institution
    }

    getChildFolderPath(child : Classe){
      return super.getChildFolderPath(child) + "/" +  child.getClasse()
    }

    async populate(...args : any[]){
      //get the parent
      let parent = await selectFile(this.vault, Institution.parentProperty.classes, "Selectionner le lieux parent")
      if (parent){
        await this.updateMetadata(Institution.parentProperty.name, parent.getLink())
      }
      await this.update()
    }

    getTopDisplayContent() : any {
      const container =  document.createElement("div");

      container.appendChild(Institution.Properties.classe.getDisplay(this))
      
      const firstContainer = document.createElement("div");
      firstContainer.classList.add("metadata-line");
      firstContainer.appendChild(Institution.Properties.type.getDisplay(this))
      firstContainer.appendChild(Institution.Properties.relation.getDisplay(this))
      firstContainer.appendChild(Institution.Properties.groupe.getDisplay(this))
      firstContainer.appendChild(Institution.Properties.lieu.getDisplay(this))
      firstContainer.appendChild(Institution.Properties.priority.getDisplay(this))
      
      container.appendChild(firstContainer)

      const secondContainer = document.createElement("div");
      secondContainer.classList.add("metadata-line");
      secondContainer.appendChild(Institution.Properties.site.getDisplay(this))
      secondContainer.appendChild(Institution.Properties.email.getDisplay(this))
      secondContainer.appendChild(Institution.Properties.telephone.getDisplay(this))
      
      secondContainer.appendChild(Institution.Properties.domaine.getDisplay(this))
      secondContainer.appendChild(Institution.Properties.adresse.getDisplay(this))
      container.appendChild(secondContainer)

      const content = document.createElement("div");
      container.appendChild(content);
  
      let people : any[]= this.getChildren().filter(value => value.getClasse() === "Personne")
      if (people.length !== 0) {
          let table = new DynamicTable(this.vault, this.vault.getClasseFromName("Personne"), people)
          table.addColumn("Poste",  `
              for(let el of postes){
                  if (el.institution === "[[${this.getName(false)}]]"){
                      return el.poste
                  }
              }
              return  ""
          `)
          content.appendChild(table.getTable());
      }

      return container;
  }
    // Validate that the file content is standart
    async check(){
      await super.check()
      // Check si le lieu est correct
      await Institution.Properties.lieu.check(this)
      // Remet les propriétés dans l'ordre
      await this.reorderMetadata(Object.values(Institution.Properties).map(p => p.name));
    }
  }
  