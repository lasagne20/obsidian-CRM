import { MyVault } from "Utils/MyVault";
import { Classe } from "./Classe";
import { App, TFile } from 'obsidian';
import { File } from "Utils/File";
import { Property } from "Utils/Properties/Property";
import { FileProperty } from "Utils/Properties/FileProperty";
import { SelectProperty } from "Utils/Properties/SelectProperty";
import { MultiFileProperty } from "Utils/Properties/MultiFileProperty";
import { Institution } from "./Institution";
import { Lieu } from "./Lieu";
import { selectFile } from "Utils/Modals/Modals";
import { Personne } from "./Personne";
import { ObjectProperty } from "Utils/Properties/ObjectProperty";
import { DateProperty } from "Utils/Properties/DateProperty";
import { MediaProperty } from "Utils/Properties/MediaProperty";

export class Partenariat extends Classe {
  public static className: string = "Partenariats";

  public static parentProperty: FileProperty | MultiFileProperty = new FileProperty("Partenaire", [Institution]);

  public static get Properties() {
    return {
      classe: new Property("Classe"),
      partenaire: this.parentProperty,
      montant: new Property("Montant"),
      contacts: new MultiFileProperty("Contact", [Personne]),
      dateStart: new DateProperty("Date de signature", ["today"]),
      dateEnd: new DateProperty("Date de fin", ["today"]),
      document: new Property("Document"),
      etat: new Property("Etat"),
    };
  }
  public data: { [key: string]: any };

  constructor(app: App, vault: MyVault, file: TFile) {
    super(app, vault, file);
    // Temp for TE38
  }

  getConstructor(){
    return Partenariat
  }


  async getTopDisplayContent(): Promise<HTMLDivElement> {
    const epciData = this.data["epci"] as any;

    const container = document.createElement("div");

    const filterContainer = this.createFilterContainer(epciData, container);
    container.appendChild(filterContainer);

    const tabContainer = await this.createTabContainer(epciData);
    container.appendChild(tabContainer);

    return container as HTMLDivElement;
  }

  createFilterContainer(epciData: any, container: HTMLDivElement): HTMLDivElement {
    const filterContainer = document.createElement("div");
    const epciSelect = document.createElement("select");
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Filter by EPCI";
    epciSelect.appendChild(defaultOption);

    Object.keys(epciData).forEach(epciName => {
      const option = document.createElement("option");
      option.value = epciName;
      option.textContent = epciName;
      epciSelect.appendChild(option);
    });

    epciSelect.onchange = () => {
      const communeRows = container.querySelectorAll("#communeTable tbody tr");
      communeRows.forEach(row => {
        const epciCell = row.querySelector("td:nth-child(1)");
        if (epciCell && (epciSelect.value === "" || epciCell.textContent === epciSelect.value)) {
          (row as HTMLElement).style.display = "";
        } else {
          (row as HTMLElement).style.display = "none";
        }
      });

      const centreAereRows = container.querySelectorAll("#centreAereTable tbody tr");
      centreAereRows.forEach(row => {
        const communeCell = row.querySelector("td:nth-child(1)");
        if (communeCell && (epciSelect.value === "" || epciData[epciSelect.value]?.communes.some((commune: any) => commune.nom === communeCell.textContent))) {
          (row as HTMLElement).style.display = "";
        } else {
          (row as HTMLElement).style.display = "none";
        }
      });

      this.updateRowCount(container);
    };

    filterContainer.appendChild(epciSelect);
    return filterContainer;
  }

  async createTabContainer(epciData: any): Promise<HTMLDivElement> {
    const tabContainer = document.createElement("div");

    const tabButtons = document.createElement("div");
    tabButtons.className = "tab-buttons";

    const communeTabButton = document.createElement("button");
    communeTabButton.textContent = "Communes";
    communeTabButton.onclick = () => this.switchTab("communeTable", "centreAereTable");
    tabButtons.appendChild(communeTabButton);

    const centreAereTabButton = document.createElement("button");
    centreAereTabButton.textContent = "Centres de Loisir";
    centreAereTabButton.onclick = () => this.switchTab("centreAereTable", "communeTable");
    tabButtons.appendChild(centreAereTabButton);

    tabContainer.appendChild(tabButtons);

    const communeTable = this.createTable(epciData);
    communeTable.id = "communeTable";
    tabContainer.appendChild(communeTable);

    const centreAereTable = document.createElement("div");
    centreAereTable.id = "centreAereTable";
    centreAereTable.style.display = "none";
    centreAereTable.appendChild(await this.getCentreAereData(epciData));
    tabContainer.appendChild(centreAereTable);

    this.updateRowCount(tabContainer);

    return tabContainer;
  }

  switchTab(showId: string, hideId: string) {
    document.getElementById(showId)!.style.display = "";
    document.getElementById(hideId)!.style.display = "none";
    this.updateRowCount(document.getElementById(showId)!.parentElement!);
  }

  async getCentreAereData(epciData: any): Promise<HTMLDivElement> {


    const centreAereFile = await this.app.vault.adapter.read("centre_aere.json");
    const centreAereData = JSON.parse(centreAereFile);

    if (typeof centreAereData !== 'object' || Array.isArray(centreAereData)) {
      throw new Error("centre_aere.json is not a valid object");
    }

    const container = document.createElement("div");

    const emailButton = document.createElement("button");
    emailButton.textContent = "Send Email to All Centers";
    emailButton.onclick = () => {
      const emails = Array.from(container.querySelectorAll("tbody tr"))
      .filter(row => (row as HTMLElement).style.display !== "none")
      .map(row => row.querySelector("td:nth-child(4)")?.textContent || "")
      .filter(email => email.trim() !== "");

      const uniqueEmails = Array.from(new Set(emails));

      console.log(uniqueEmails);
      if (uniqueEmails.length) {
      window.location.href = `mailto:?bcc=${uniqueEmails.join(",")}`;
      }
    };
    container.appendChild(emailButton);

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.textAlign = "left";
    table.border = "1";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = ["Commune", "Centre Aéré", "Adresse", "Email"];
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    Object.entries(epciData).forEach(([epciName, epciDetails]: [string, any]) => {
      epciDetails["communes"].forEach((commune: any) => {
        if (commune.te38 === true) {
          const centreAere = centreAereData[commune.code];
          if (centreAere) {
            centreAere.forEach((centre: any) => {
              const row = document.createElement("tr");
              const data: { [key: string]: string } = {
                Commune: commune.nom,
                "Centre Aéré": centre.name,
                Adresse: centre.address || "",
                Email: centre.email || ""
              };
              headers.forEach((key: string) => {
                const td = document.createElement("td");
                if (key === "Email" && data[key]) {
                  const emailLink = document.createElement("a");
                  emailLink.href = `mailto:${data[key]}`;
                  emailLink.textContent = data[key];
                  td.appendChild(emailLink);
                } else {
                  const textNode = document.createTextNode(data[key as keyof typeof data]);
                  td.appendChild(textNode);
                }
                row.appendChild(td);
              });
              tbody.appendChild(row);
            });
          }
        }
      });
    });
    table.appendChild(tbody);

    container.appendChild(table);

    return container as HTMLDivElement;
  }

  createTable(epciData: any): HTMLTableElement {
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.textAlign = "left";
    table.border = "1";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = ["EPCI", "Commune", "Code", "email", "telephone"];
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    Object.entries(epciData).forEach(([epciName, epciDetails]: [string, any]) => {
      epciDetails["communes"].forEach((commune: any) => {
        if (commune.te38 === true) {
          const row = document.createElement("tr");
          const data: { [key: string]: string } = {
            EPCI: epciName,
            Commune: commune.nom,
            Code: commune.code,
            email: commune.email || "",
            telephone: commune.telephone || ""
          };
          headers.forEach((key: string) => {
            const td = document.createElement("td");
            if (key === "email" && data[key]) {
              const emailLink = document.createElement("a");
              emailLink.href = `mailto:${data[key]}`;
              emailLink.textContent = data[key];
              td.appendChild(emailLink);
            } else {
              td.textContent = data[key as keyof typeof data];
            }
            row.appendChild(td);
          });
          tbody.appendChild(row);
        }
      });
    });
    table.appendChild(tbody);

    return table;
  }

  updateRowCount(container: HTMLElement) {
    const activeTable = container.querySelector("table:not([style*='display: none'])");
    const rowCount = activeTable ? activeTable.querySelectorAll("tbody tr").length : 0;
    let rowCountDisplay = container.querySelector("#rowCountDisplay");
    if (!rowCountDisplay) {
      rowCountDisplay = document.createElement("div");
      rowCountDisplay.id = "rowCountDisplay";
      const filterContainer = container.querySelector("div");
      if (filterContainer) {
        filterContainer.appendChild(rowCountDisplay);
      } else {
        container.appendChild(rowCountDisplay);
      }
    }
    rowCountDisplay.textContent = `Nombre de lignes: ${rowCount}`;
  }

  getClasse() {
    return Partenariat.className;
  }

  getparentProperties(): FileProperty | MultiFileProperty {
    return Partenariat.parentProperty;
  }

  static getProperties() {
    return Partenariat.Properties;
  }

  getProperties() {
    return Partenariat.Properties;
  }

  async populate(...args: any[]) {
  }

  // Validate that the file content is standard
  async check() {
    // Check si le l'institution est correct
  }
}
