import { filter } from "cheerio/dist/commonjs/api/traversing";
import { Classe } from "Classes/Classe";
import { SubClass } from "Classes/SubClasses/SubClass";
import { App } from "obsidian";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";

export class DynamicTable {
    private vault: any;
    private app: App;
    private classe: typeof Classe;
    private classes: (SubClass | Classe)[];
    private propertiesnames: { [key: string]: any };
    private table: HTMLTableElement;
    private thead: HTMLTableSectionElement;
    private tbody: HTMLTableSectionElement;
    private headers: { [key: string]: any }[];

    constructor(vault: any, classe: typeof Classe, classes: (SubClass | Classe)[]) {
        this.vault = vault;
        this.app = vault.app;
        this.classe = classe;
        this.classes = classes;
        this.headers = [{ "name": "Nom", "propertyName": null, "filter": "filter", "sort": "sort" }];
        this.table = document.createElement("table");
        this.table.classList.add("dynamic-table");
        this.thead = document.createElement("thead");
        this.thead.classList.add("dynamic-table-thead");
        this.tbody = document.createElement("tbody");
        this.tbody.classList.add("dynamic-table-tbody");
        this.initTable();
    }

    private initTable() {
        this.createHeaders();
        this.createRows();
        this.table.appendChild(this.thead);
        this.table.appendChild(this.tbody);
        this.updateHeaderCounts();
    }

    public addColumn(name: string, propertyName: string, filter = "", sort = "") {
        this.headers.push({ name: name, propertyName: propertyName, filter: filter, sort: sort });
        this.classes.forEach(cls => {
            const row = this.tbody.querySelector(`tr[data-id="${cls.getID()}"]`);
            if (row) {
                const cell = document.createElement("td");
                let [classe, property] = cls.getProperty(propertyName);
                if (!property) {
                    property = new FormulaProperty(name, propertyName);
                }
                cell.appendChild(property.getDisplay(classe));
                row.appendChild(cell);
            }
        });
        this.createHeaders();
        this.updateHeaderCounts();
    }

    public addTotalRow(columnName: string, formula: (values: any[]) => any) {
        const totalRow = document.createElement("tr");
        totalRow.classList.add("total-row");

        this.headers.forEach((header, index) => {
            const cell = document.createElement("td");
            if (header.name === columnName) {
                let values: number[] = [];
                this.classes.forEach(cls => {
                    const row = this.tbody.querySelector(`tr[data-id="${cls.getID()}"]`);
                    if (row && (row as HTMLElement).style.display !== "none") { // Only consider visible rows
                        const cellValue = parseFloat(row.children[index].textContent || "0");
                        if (!isNaN(cellValue)) {
                            values.push(cellValue);
                        }
                    }
                });
                cell.textContent = formula(values).toString();
            } else if (index === 0) {
                cell.textContent = "Total";
            }
            totalRow.appendChild(cell);
        });

        this.tbody.appendChild(totalRow);
    }

    private createHeaders() {
        this.thead.innerHTML = ""; // Clear existing headers
        const headerRow = document.createElement("tr");
        headerRow.classList.add("header-row");
        this.headers.forEach((header, index) => {
            const th = document.createElement("th");
            th.classList.add("header-cell");
            th.textContent = header.name;

            if (header.filter) {
                if (header.filter === "filter-list") {
                    const filterSelect = document.createElement("select");
                    filterSelect.classList.add("filter-select");
                    const uniqueValues = new Set<string>();
                    this.classes.forEach(cls => {
                        let [classe, property] = cls.getProperty(header.propertyName);
                        if (property) {
                            uniqueValues.add(property.getDisplay(classe).textContent || "");
                        }
                    });
                    uniqueValues.forEach(value => {
                        const option = document.createElement("option");
                        option.value = value;
                        option.textContent = value;
                        filterSelect.appendChild(option);
                    });
                    filterSelect.addEventListener("change", () => {
                        this.filterTableByColumn(header.name, filterSelect.value);
                        this.updateHeaderCounts();
                    });
                    th.appendChild(filterSelect);
                } else {
                    const filterInput = document.createElement("input");
                    filterInput.classList.add("filter-input");
                    filterInput.type = "text";
                    filterInput.placeholder = "Filter";
                    filterInput.addEventListener("input", () => {
                        this.filterTableByColumn(header.name, filterInput.value);
                        this.updateHeaderCounts();
                    });
                    th.appendChild(filterInput);
                }
            }

            if (header.sort) {
                const sortButton = document.createElement("button");
                sortButton.classList.add("sort-button");
                sortButton.textContent = "Sort";
                sortButton.addEventListener("click", () => {
                    this.sortTableByColumn(header.name);
                    this.updateHeaderCounts();
                });
                th.appendChild(sortButton);
            }

            headerRow.appendChild(th);
        });
        this.thead.appendChild(headerRow);
    }

    private createRows() {
        this.tbody.innerHTML = ""; // Clear existing rows
        this.classes.forEach(cls => {
            const row = document.createElement("tr");
            row.classList.add("data-row");
            row.setAttribute("data-id", cls.getID());

            const nameCell = document.createElement("td");
            nameCell.classList.add("name-cell");
            const nameLink = document.createElement("a");
            nameLink.classList.add("name-link");
            nameLink.textContent = typeof (cls) === "string" ? cls : cls.getName(false);
            nameLink.href = `#`;
            nameLink.addEventListener("click", async (event) => {
                event.preventDefault();
                if (cls instanceof SubClass) {
                    let file = await this.vault.createFile(this.classe, cls.getName());
                    this.app.workspace.getLeaf().openFile(file);
                } else {
                    this.app.workspace.getLeaf().openFile(cls.file);
                }
            });
            if (cls instanceof SubClass) {
                nameLink.classList.add("new-link");
            }
            nameCell.appendChild(nameLink);
            row.appendChild(nameCell);

            this.headers.map(x => x.name).slice(1).forEach((name: string) => {
                let [classe, property] = cls.getProperty(name);
                if (!property) {
                    property = new FormulaProperty(name, name);
                }
                const cell = document.createElement("td");
                cell.classList.add("data-cell");
                cell.appendChild(property.getDisplay(classe));
                row.appendChild(cell);
            });

            this.tbody.appendChild(row);
        });
    }

    private sortTableByColumn(column: string) {
        const rows = Array.from(this.tbody.querySelectorAll("tr"));
        const columnIndex = this.headers.map(x => x.name).indexOf(column);
        rows.sort((a, b) => {
            const aText = a.children[columnIndex].textContent || "";
            const bText = b.children[columnIndex].textContent || "";
            return aText.localeCompare(bText);
        });
        rows.forEach(row => this.tbody.appendChild(row));
    }

    private filterTableByColumn(column: string, filterValue: string) {
        const rows = Array.from(this.tbody.querySelectorAll("tr"));
        const columnIndex = this.headers.map(x => x.name).indexOf(column);
        rows.forEach(row => {
            const cellText = row.children[columnIndex].textContent || "";
            row.style.display = cellText.includes(filterValue) ? "" : "none";
        });
    }

    private updateHeaderCounts() {
        const headerCells = this.thead.querySelectorAll("th");
        this.headers.forEach((header, index) => {
            const columnIndex = this.headers.map(x => x.name).indexOf(header.name);
            let nonNullCount = 0;
            let existCount = 0;
            const rows = Array.from(this.tbody.querySelectorAll("tr"));
            rows.forEach(row => {
                if (row.style.display !== "none") {
                    const cellText = row.children[columnIndex]?.textContent || "";
                    if (cellText.trim() !== "") {
                        nonNullCount++;
                    }
                    if (index == 0 && this.vault.getFromLink(cellText, false)){
                        existCount++;
                    }
                }
            });
            if (index == 0 && existCount != rows.length){
                headerCells[index].textContent = `${header.name} (${existCount}/${rows.length})`;
            } else {
                headerCells[index].textContent = `${header.name} (${nonNullCount})`;
            }
        });
    }

    public getTable(): HTMLElement {
        return this.table;
    }
}
