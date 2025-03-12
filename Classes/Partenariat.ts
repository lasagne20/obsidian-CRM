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

export class Partenariat extends Classe {
  public static className: string = "Partenariat";
  public static classIcon: string = "handshake";

  public static parentProperty: FileProperty  = new FileProperty("Lieu", ["Lieu"], "map");

  public static Properties = {
      classe: new Property("Classe"),
      partenaire: new FileProperty("Partenaire", ["Institution"], "handshake"),
      montant: new NumberProperty("Montant", "euro-sign", false, "€"),
      lieu : this.parentProperty,
      contacts: new MultiFileProperty("Contact", ["Personne"], "circle-user-round"),
      periode: new RangeDateProperty("Date de signature"),
      document: new MediaProperty("Document"),
      etat: new SelectProperty("Etat", ["Piste", "En attente", "En cours", "Terminé", "Annulé"]),
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
     
    let data = this.getIncomingLinks().filter((link) => link.getClasse() == "Action")
    let table = new DynamicTable(this.vault, this.vault.getClasseFromName("Personne"), data)
    table.addColumn("Date", "date")
    table.addColumn("Etat", "etat")
    table.addColumn("Montant", `
      for (let partenaire of Partenariats){
        console.log(partenaire)
        if (partenaire.Partenariat == "${this.getLink()}" && partenaire.Montant){
          return partenaire.Montant + ' €'
        }
     }
      `)

    table.addTotalRow("Montant", (values) => {
      return values.reduce((acc, value) => acc + value, 0) + ' €'
    })

    container.appendChild(table.getTable())
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
