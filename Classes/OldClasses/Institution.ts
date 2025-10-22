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
import { DateProperty } from "Utils/Properties/DateProperty";
import { Suivi } from "./GroupProperties/Suivi";
import { icon } from "leaflet";
import { Universitaire } from "./SubClasses/Institutions/Universitaire";
import { Fondation } from "./SubClasses/Institutions/Fondation";
import { Mediatheque } from "./SubClasses/Institutions/Mediatheque";

export class Institution extends Classe {

  public static className : string = "Institution";
  public static classIcon : string = "building-2";

  public static parentProperty: FileProperty  = new FileProperty("Lieu", ["Lieu"], {icon : Lieu.classIcon});
  public static subClassesProperty : SubClassProperty = new SubClassProperty("Type institution", [
                            new Entreprise(Institution),
                            new CentreAere(Institution),
                            new Association(Institution),
                            new College(Institution),
                            new Lycee(Institution),
                            new Ecole(Institution),
                            new Universitaire(Institution),
                            new Fondation(Institution),
                            new Mediatheque(Institution)
                          ]);

  public static Properties : { [key: string]: Property } = {
      classe : new ClasseProperty("Classe", this.classIcon),
      type: this.subClassesProperty,
      groupe: new FileProperty("Groupe", ["Institution"], {icon :Institution.classIcon}),
      site: new LinkProperty("Site web", {icon :"globe"}),
      email : new EmailProperty("Email"),
      telephone : new PhoneProperty("Telephone"),
      relation: new MultiSelectProperty("Type de relation", [
        { name: "financeurs", color: "" },
        { name: "vecteur", color: "" },
        { name: "clients", color: "" },
        { name: "support", color: "" }
      ]),
      lieu: this.parentProperty,
      domaine: new MultiSelectProperty("Domaine", [
        { name: "santé", color: "" },
        { name: "éducation", color: "" },
        { name: "culture", color: "" },
        { name: "sport", color: "" },
        { name: "social", color: "" },
        { name: "environnement", color: "" },
        { name: "économie", color: "" },
        { name: "numérique", color: "" }
      ]),
      adresse : new AdressProperty("Adresse"), 
      priority : new RatingProperty("Priorité"),
      personnes : new Property("Personnes"),
      liens : new Property("Liens"),
      etat:  new SelectProperty("Etat", [
        { name: "Pas encore contacté", color: "gray" },
        { name: "Prise de contact en cours", color: "blue" },
        { name: "Suivie d'affaire", color: "green" },
        { name: "En attente de soliciation", color: "red" }
      ]),
      interlocuteur : new MultiSelectProperty("Interlocuteur", [
        { name: "Sylvie", color: "blue" },
        { name: "Léo", color: "red" }
      ]),
      tache : new SelectProperty("Prochaine tache", [
        { name: "Prise de contact", color: "blue" },
        { name: "Relance 1", color: "green" },
        { name: "Relance 2", color: "yellow" },
        { name: "Faire le point", color: "orange" },
        { name: "Valider point", color: "red" }
      ]),
      lastContact: new DateProperty("Dernier contact", ["today"]),
      nextContact : new DateProperty("Prochain contact", ["next-week"]),
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
      return super.getChildFolderPath(child) + "/" +  child.getClasse() + "s"
    }

    async populate(args : {parent : Classe | null} = {parent : null}){
      //get the parent
      if (args["parent"]){
        let parent = this.vault.getFromLink(args["parent"].getName(false))
        if (!parent){
          let file = await this.vault.createFile(Lieu, args["parent"].getName(false))
          if (file){
            parent = this.vault.getFromFile(file)
          }
        }
        await this.updateMetadata(Institution.parentProperty.name, args["parent"].getLink())
      }
      else {
        let parent = await selectFile(this.vault, Institution.parentProperty.classes, {hint:"Selectionner le lieux parent"})
        if (parent){
          await this.updateMetadata(Institution.parentProperty.name, parent.getLink())
        }
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

      const thirdContainer = document.createElement("div");
      thirdContainer.classList.add("metadata-line");
      thirdContainer.appendChild(Institution.Properties.etat.getDisplay(this))
      thirdContainer.appendChild(Institution.Properties.interlocuteur.getDisplay(this))
      thirdContainer.appendChild(Institution.Properties.tache.getDisplay(this))
      thirdContainer.appendChild(Institution.Properties.lastContact.getDisplay(this, {staticMode:false, title:"Dernier contact : "}))
      thirdContainer.appendChild(Institution.Properties.nextContact.getDisplay(this, {staticMode:false, title:"Prochain contact : "}))
      container.appendChild(thirdContainer)

      const content = document.createElement("div");
      container.appendChild(content);
  
      let people : any[]= this.getChildren().filter(value => value.getClasse() === "Personne")
      if (people.length !== 0) {
          let table = new DynamicTable(this.vault, people)
          table.addColumn("Poste",  `
            for(let el of Postes){
                console.log(el)
                if (el.Institution.contains("${this.getName(false)}")) {
                    return el.Poste
                }
            }
            return  ""
        `)
          content.appendChild(table.getTable());
      }
      container.appendChild(Suivi.getLinkDisplay(this))

      return container;
  }
    // Validate that the file content is standart
    async check(){
      await super.check()
      // Check si le lieu est correct
      await Institution.Properties.lieu.check(this)
    }
  }
  