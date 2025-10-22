import { filter } from "cheerio/dist/commonjs/api/traversing";
import { Classe } from "Classes/Classe";
import { SubClass } from "Classes/SubClasses/SubClass";
import AppShim, { Notice, setIcon } from "../App";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";
import { Property } from "Utils/Properties/Property";
import { RangeDateProperty } from "Utils/Properties/RangeDateProperty";
const moment = require('moment');
const XLSX = require("xlsx");

export class DynamicTable {
    private vault: any;
    private app: AppShim;
    private classes: (SubClass | Classe)[];
    private totalFormulas: { columnName: string, formula: (values: any[]) => any }[] = [];
    private table: HTMLTableElement;
    private thead: HTMLTableSectionElement;
    private tbody: HTMLTableSectionElement;
    private headers: { [key: string]: any }[];

    constructor(vault: any, classes: (SubClass | Classe)[]) {
        this.vault = vault;
        this.app = vault.app;
        this.classes = classes;
        this.headers = [{ "name": "Nom", "propertyName": null, "filter": "filter", "sort": "sort" }];
        this.table = document.createElement("table");
        this.table.classList.add("dynamic-table");
        this.thead = document.createElement("thead");
        this.thead.classList.add("dynamic-table-thead");
        this.tbody = document.createElement("tbody");
        this.tbody.classList.add("dynamic-table-tbody");
        this.initTable();
        this.addContextMenu(); // Add context menu functionality
    }

    public async checkFiles() {
        for (const cls of this.classes) {
            if (cls instanceof Classe) {
                await cls.check();
            }
        }
    }

    private addContextMenu() {
        this.table.addEventListener("mousedown", (event) => {
            if (event.button === 2) { // Right-click
                event.preventDefault(); // Prevent default context menu
            }
        });
        this.table.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            const existingContextMenu = document.querySelector(".context-menu");
            if (existingContextMenu) {
                existingContextMenu.remove(); // Remove any existing context menu
            }

            const contextMenu = document.createElement("div");
            contextMenu.classList.add("context-menu");

            const exportOption = document.createElement("div");
            exportOption.classList.add("context-menu-item");
            exportOption.textContent = "Export to ODS";
            exportOption.addEventListener("click", () => {
                this.exportToODS();
                document.body.removeChild(contextMenu);
            });

            contextMenu.appendChild(exportOption);
            document.body.appendChild(contextMenu);

            contextMenu.style.position = "absolute";
            contextMenu.style.top = `${event.clientY}px`;
            contextMenu.style.left = `${event.clientX}px`;

            const removeContextMenu = () => {
                if (document.body.contains(contextMenu)) {
                    document.body.removeChild(contextMenu);
                }
                document.removeEventListener("click", removeContextMenu);
            };

            document.addEventListener("click", removeContextMenu);
        });
    }

    private async exportToODS() {
        const rows = Array.from(this.tbody.querySelectorAll("tr"));
        const headers = this.headers.map(header => header.name);

        const data = [headers];
        rows.forEach(row => {
            if ((row as HTMLElement).style.display !== "none") {
                const rowData = Array.from(row.children).map(cell => {
                    const cellStyle = window.getComputedStyle(cell);
                    let cellText = cell.textContent || "";
                    const dropdown = cell.querySelector("select");
                    if (dropdown) {
                        cellText = dropdown.options[dropdown.selectedIndex]?.text || "";
                    }
                    return {
                        value: cellText,
                        backgroundColor: cellStyle.backgroundColor,
                        color: cellStyle.color,
                    };
                });
                data.push(rowData);
            }
        });

        // Use a library like `sheetjs` to generate an ODS file
        const ws = XLSX.utils.aoa_to_sheet(data.map(row =>
            row.map(cell => typeof cell === "object" ? cell.value : cell)
        ));

        // Apply styles (colors) if supported by the library
        // Note: ODS styling may require additional libraries or custom implementation

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Table Export");

        // Generate the ODS file and prepare for download
        const arrayBuffer = XLSX.write(wb, { bookType: "ods", type: "array" });
        const file = new Blob([arrayBuffer], { type: "application/vnd.oasis.opendocument.spreadsheet" });

        const saveDialog = document.createElement("a");
        saveDialog.download = "table_export.ods"; // Suggest a default file name
        saveDialog.href = URL.createObjectURL(file);
        saveDialog.click(); // Trigger the file save dialog

    }

    private initTable() {
        this.createHeaders();
        this.createRows();
        this.table.appendChild(this.thead);
        this.table.appendChild(this.tbody);
        this.updateHeaderCounts();
    }

    public addColumn(name: string, propertyName: string, args : {filter?: string, sort?: string, action?: string, args?: {}} = {filter :"", sort :"", action:"", args :  {}}) {
        this.headers.push({ name: name, propertyName: propertyName, filter: args.filter, sort: args.sort, action: args.action });
        this.classes.forEach(cls => {
            const row = this.tbody.querySelector(`tr[data-id="${cls.getID()}"]`);
            if (row) {
                const cell = document.createElement("td");
                let [classe, property] = cls.getProperty(propertyName);
                if (!property) {
                    property = new FormulaProperty("TableFromula_"+name, propertyName);
                }
                cell.appendChild(property.getDisplay(classe, args.args));
                row.appendChild(cell);
            }
        });
        this.createHeaders();
        this.updateHeaderCounts();
    }

    public addDisplayPropertyColumn(name: string, properties : {classe : Classe | SubClass, display : HTMLElement}[]) {
        this.headers.push({ name: name, propertyName: null, filter: "filter", sort: "sort" });
        properties.forEach(({ classe, display }, index) => {
            let id;
            if (!classe){
                id = this.classes[index]?.getID();
            }else {
                id = classe.getID();
            }
            const row = this.tbody.querySelector(`tr[data-id="${id}"]`);
            if (row) {
            const cell = document.createElement("td");
            cell.appendChild(display);
            row.appendChild(cell);
            }
        });
        this.createHeaders();
        this.updateHeaderCounts();
    }

    public addTotalRow(columnName: string, formula: (values: any[]) => any) {
        // Save the formula for the column
        this.totalFormulas = this.totalFormulas.filter(f => f.columnName !== columnName);
        this.totalFormulas.push({ columnName, formula });

        const getColumnIndex = () => this.headers.findIndex(header => header.name === columnName);

        const updateAllTotalRows = () => {
            const totalRows = Array.from(this.tbody.querySelectorAll(".total-row")) as HTMLTableRowElement[];
            totalRows.forEach(totalRow => {
                this.headers.forEach((header, idx) => {
                    if (idx === 0) {
                        totalRow.children[0].textContent = "Total";
                        return;
                    }
                    // Only show total if a formula exists for this column
                    const formulaObj = this.totalFormulas.find(f => f.columnName === header.name);
                    if (formulaObj) {
                        let values: number[] = [];
                        const rows = Array.from(this.tbody.querySelectorAll("tr:not(.total-row)"));
                        rows.forEach(row => {
                            if ((row as HTMLElement).style.display !== "none") {
                                const cellValue = parseFloat(row.children[idx]?.textContent || "0");
                                if (!isNaN(cellValue)) values.push(cellValue);
                            }
                        });
                        totalRow.children[idx].textContent = values.length > 0 ? formulaObj.formula(values).toString() : "";
                    } else if (totalRow.children[idx]){
                        totalRow.children[idx].textContent = "";
                    }
                });
            });
        };

        const columnIndex = getColumnIndex();
        if (columnIndex === -1) return;

        let totalRow = this.tbody.querySelector(".total-row") as HTMLTableRowElement;
        if (!totalRow) {
            totalRow = document.createElement("tr");
            totalRow.classList.add("total-row");
            this.headers.forEach((header, idx) => {
                const cell = document.createElement("td");
                if (idx === 0) cell.textContent = "Total";
                totalRow.appendChild(cell);
            });
            this.tbody.appendChild(totalRow);
        }

        updateAllTotalRows();

        // Observe changes to update all total rows dynamically
        if (!(totalRow as any)._observerAttached) {
            const observer = new MutationObserver(() => updateAllTotalRows());
            observer.observe(this.tbody, { childList: true, subtree: true, attributes: true });
            (totalRow as any)._observerAttached = true;
        }
    }

    private createHeaders() {
        this.thead.innerHTML = ""; // Clear existing headers
        const headerRow = document.createElement("tr");
        headerRow.classList.add("header-row");
        this.headers.forEach((header, index) => {
            const th = document.createElement("th");
            th.classList.add("header-cell");
            th.textContent = header.name;


            const sortButton = document.createElement("button");
            sortButton.classList.add("sort-button");
            let ascending = true;
            setIcon(sortButton, "arrow-down-up");
            sortButton.addEventListener("click", () => {
                this.sortTableByColumn(header.name, ascending);
                ascending = !ascending;
            });
            th.appendChild(sortButton);

            
            if (header.filter == "select"){
                // Create a dropdown filter with all unique values from the column
                const columnIndex = index;
                const select = document.createElement("select");
                select.classList.add("filter-select");
                const optionAll = document.createElement("option");
                optionAll.value = "";
                optionAll.textContent = `Tous (${header.name})`;
                select.appendChild(optionAll);

                // Gather unique values from the column
                const values = new Set<string>();
                Array.from(this.tbody.querySelectorAll("tr")).forEach(row => {
                    const cell = row.children[columnIndex];
                    if (cell) {
                        let cellText = cell.textContent || "";
                        const dropdown = cell.querySelector("select");
                        if (dropdown) {
                            cellText = dropdown.options[(dropdown as HTMLSelectElement).selectedIndex]?.text || "";
                        }
                        values.add(cellText.trim());
                    }
                });

                Array.from(values).sort().forEach(value => {
                    if (value !== "") {
                        const option = document.createElement("option");
                        option.value = value;
                        option.textContent = value;
                        select.appendChild(option);
                    }
                });

                select.addEventListener("change", (event) => {
                    const filterValue = (event.target as HTMLSelectElement).value;
                    this.filterTableByColumn(header.name, filterValue);
                });
                th.appendChild(select);
            }
            else if (header.filter == "multi-select") {
                // Multi-select filter: allow filtering by multiple values with toggle buttons
                const columnIndex = index;
                const values = new Set<string>();
                Array.from(this.tbody.querySelectorAll("tr")).forEach(row => {
                    const cell = row.children[columnIndex];
                    if (cell) {
                        let cellText = cell.textContent || "";
                        const dropdown = cell.querySelector("select");
                        if (dropdown) {
                            cellText = dropdown.options[(dropdown as HTMLSelectElement).selectedIndex]?.text || "";
                        }
                        values.add(cellText.trim());
                    }
                });

                const selectedValues = new Set<string>();

                const buttonContainer = document.createElement("div");
                buttonContainer.classList.add("multi-select-filter");

                Array.from(values).sort().forEach(value => {
                    if (value !== "") {
                        const btn = document.createElement("button");
                        btn.type = "button";
                        btn.textContent = value;
                        btn.classList.add("multi-select-btn");
                        btn.addEventListener("click", () => {
                            if (selectedValues.has(value)) {
                                selectedValues.delete(value);
                                btn.classList.remove("selected");
                            } else {
                                selectedValues.add(value);
                                btn.classList.add("selected");
                            }
                            // Use addFilter to filter rows based on selected values
                            this.filterTableByColumn(header.name, Array.from(selectedValues));
                            this.updateHeaderCounts();
                        });
                        buttonContainer.appendChild(btn);
                    }
                });

                th.appendChild(buttonContainer);
                
            }
            else {
                const filterInput = document.createElement("input");
                filterInput.type = "text";
                filterInput.classList.add("filter-input");
                filterInput.placeholder = `Filter ${header.name}`;
                filterInput.addEventListener("input", (event) => {
                    const filterValue = (event.target as HTMLInputElement).value;
                    this.filterTableByColumn(header.name, filterValue);
                });
                th.appendChild(filterInput);
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
            nameLink.addEventListener("contextmenu", (event) => {
                event.preventDefault();
              });
            nameLink.addEventListener("mousedown", async (event) => {
                event.preventDefault();
                const isMiddleClick = event.button === 1;
                const isLeftClick = event.button === 0;
                const isRightClick = event.button === 2;

                if (isLeftClick || isMiddleClick) {
                    if (cls instanceof SubClass) {
                        const file = await this.vault.createFile(cls.classe, cls.getName(), {parent: cls.getParent()});
                        const leaf = this.app.workspace.getLeaf(isMiddleClick);
                        console.log("Opening file:", file);
                        await leaf.openFile(file);
                    } else {
                        const leaf = this.app.workspace.getLeaf(isMiddleClick);
                        leaf.openFile(cls.file);
                    }
                } else if (isRightClick) {
                    navigator.clipboard.writeText(cls.getName()).then(() => {
                        new Notice("Copié dans le presse-papiers");
                    }).catch(err => {
                        console.error("Failed to copy to clipboard:", err);
                    });
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

    public sortTableByColumn(column: string, ascending = true) {
        const rows = Array.from(this.tbody.querySelectorAll("tr"));
        const columnIndex = this.headers.map(x => x.name).indexOf(column);
        rows.sort((a, b) => {
            const aText = a.children[columnIndex]?.textContent || "";
            const bText = b.children[columnIndex]?.textContent || "";
            
            if (a.classList.contains("total-row")) return 1;
            if (b.classList.contains("total-row")) return -1;

            const aDropdown = a.children[columnIndex]?.querySelector("select");
            const bDropdown = b.children[columnIndex]?.querySelector("select");

            if (aDropdown && bDropdown) {
                console.log(aDropdown, bDropdown);
                const dropdownOptions = Array.from(aDropdown.options).map(option => option.text);
                const aIndex = dropdownOptions.indexOf(aDropdown.options[aDropdown.selectedIndex]?.text || "");
                const bIndex = dropdownOptions.indexOf(bDropdown.options[bDropdown.selectedIndex]?.text || "");
                return aIndex - bIndex;
            }

            const aStars = a.children[columnIndex]?.querySelector(".star-rating");
            const bStars = b.children[columnIndex]?.querySelector(".star-rating");

            if (aStars && bStars) {
                const aRating = aStars.querySelectorAll(".filled-star").length;
                const bRating = bStars.querySelectorAll(".filled-star").length;
                return aRating - bRating;
            }
            
            const aDate = RangeDateProperty.extractFirstDate(aText);
            const bDate = RangeDateProperty.extractFirstDate(bText);

            if (aDate && bDate) {
                return aDate.getTime() - bDate.getTime();
            } else if (aDate) {
                return -1;
            } else if (bDate) {
                return 1;
            } else {
                return aText.localeCompare(bText, undefined, { numeric: true });
            }
        });
        rows.forEach(row => this.tbody.appendChild(row));
        if (!ascending) {
            Array.from(this.tbody.querySelectorAll("tr")).reverse().forEach(row => this.tbody.appendChild(row));
        }
    }

    // Store active filters for each column
    private activeFilters: { [column: string]: any } = {};

    private filterTableByColumn(column: string, filterValue: any) {
        // Update the filter value for the column
        this.activeFilters[column] = filterValue;

        const rows = Array.from(this.tbody.querySelectorAll("tr"));

        console.log("Active Filters:", this.activeFilters);

        rows.forEach(row => {
            if (row.classList.contains("total-row")) {
            row.style.display = ""; // Always display total-row
            return;
            }

            let showRow = true;
            for (const col of Object.keys(this.activeFilters)) {
            const idx = this.headers.map(x => x.name).indexOf(col);
            if (idx === -1) continue;
            let cellText = row.children[idx]?.textContent || "";
            const dropdown = row.children[idx]?.querySelector("select");
            if (dropdown) {
                cellText = dropdown.options[(dropdown as HTMLSelectElement).selectedIndex]?.text || "";
            }
            const filterVal = this.activeFilters[col];
            if (Array.isArray(filterVal)) {
                // If filterVal is an array, show row if cellText is in the array or array is empty
                if (filterVal.length > 0 && !filterVal.includes(cellText)) {
                showRow = false;
                break;
                }
            } else if (filterVal && !cellText.includes(filterVal)) {
                showRow = false;
                break;
            }
            }
            row.style.display = showRow ? "" : "none";
        });

        this.updateHeaderCounts(); // Update header counts after filtering
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
                    if (cellText.trim() !== "" && cellText !== "Aucune date sélectionnée") {
                        nonNullCount++;
                    }
                    if ((index == 0 && this.vault.getFromLink(cellText, false))){
                        existCount++;
                    }
                }
            });
            const headerCell = headerCells[index];
            const headerText = existCount && existCount != rows.length
                ? `${header.name} (${existCount}/${rows.length})`
                : `${header.name} (${nonNullCount})`;

            // Update only the text content, preserving existing child elements (like sort buttons)
            const textNode = Array.from(headerCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (textNode) {
                textNode.textContent = headerText;
            } else {
                headerCell.insertBefore(document.createTextNode(headerText), headerCell.firstChild);
            }
        });
    }

    public getTable(): HTMLElement {
        return this.table;
    }

    public getColumnValues(columnName: string): string[] {
        const columnIndex = this.headers.findIndex(header => header.name === columnName);
        if (columnIndex === -1) return [];
        const values: string[] = [];
        const rows = Array.from(this.tbody.querySelectorAll("tr"));
        rows.forEach(row => {
            if (row.classList.contains("total-row")) return;
            const cell = row.children[columnIndex];
            if (cell) {
                let cellText = cell.textContent || "";
                const dropdown = cell.querySelector("select");
                if (dropdown) {
                    cellText = dropdown.options[(dropdown as HTMLSelectElement).selectedIndex]?.text || "";
                }
                values.push(cellText.trim());
            }
        });
        return values;
    }
}
