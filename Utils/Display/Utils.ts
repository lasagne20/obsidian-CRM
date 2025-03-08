import { Classe } from "Classes/Classe";
import { SubClass } from "Classes/SubClasses/SubClass";
import { App, setIcon } from "obsidian";
import { FormulaProperty } from "Utils/Properties/FormulaProperty";



export function addFold(parentContainer: HTMLElement, childContainer: HTMLElement) {
    let isFolded = false;
    const arrow = document.createElement("span");
    arrow.style.cursor = "pointer";
    arrow.style.marginRight = "5px";
    parentContainer.insertBefore(arrow, parentContainer.firstChild);

    const updateArrow = () => {
        arrow.innerHTML = '';
        const iconName = isFolded ? 'chevron-right' : 'chevron-down';
        setIcon(arrow, iconName);
    };

    updateArrow();

    parentContainer.addEventListener("click", () => {
        isFolded = !isFolded;
        childContainer.style.display = isFolded ? "none" : "block";
        updateArrow();
    });
}

export function generateTabs(elements: { [key: string]: HTMLElement }): HTMLElement {
    const container = document.createElement("div");
    const tabContainer = document.createElement("div");
    const contentContainer = document.createElement("div");

    tabContainer.style.display = "flex";
    tabContainer.style.marginBottom = "10px";

    Object.keys(elements).forEach(key => {
        const tab = document.createElement("div");
        tab.textContent = key;
        tab.style.cursor = "pointer";
        tab.style.padding = "5px 10px";
        tab.style.border = "1px solid #ccc";
        tab.style.borderBottom = "none";
        tab.style.marginRight = "5px";

        tab.addEventListener("click", () => {
            // Hide all elements
            Object.values(elements).forEach(el => el.style.display = "none");
            // Show the selected element
            elements[key].style.display = "block";

            // Remove active class from all tabs
            Array.from(tabContainer.children).forEach(child => child.classList.remove("active-tab"));
            // Add active class to the clicked tab
            tab.classList.add("active-tab");
        });

        tabContainer.appendChild(tab);
    });

    // Append all elements to the content container
    Object.values(elements).forEach(el => {
        el.style.display = "none";
        contentContainer.appendChild(el);
    });

    // Select the first tab by default
    if (tabContainer.children.length > 0) {
        const firstTab = tabContainer.children[0] as HTMLElement;
        firstTab.classList.add("active-tab");
        elements[Object.keys(elements)[0]].style.display = "block";
    }
    container.appendChild(tabContainer);
    container.appendChild(contentContainer);

    return container;
}

export function generateTableFromClasses(vault: any, classe: typeof Classe, classes: (SubClass | Classe)[], propertiesnames: { [key: string]: any }): HTMLElement {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Create table headers
    const headerRow = document.createElement("tr");
    const headers = ["Nom", ...Object.keys(propertiesnames)];
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;

        // Create sort button
        const sortButton = document.createElement("button");
        sortButton.textContent = "Sort";
        sortButton.addEventListener("click", () => {
            sortTableByColumn(header);
        });
        th.appendChild(sortButton);

        // Create filter input
        const filterInput = document.createElement("input");
        filterInput.type = "text";
        filterInput.placeholder = "Filter";
        filterInput.addEventListener("input", () => {
            filterTableByColumn(header, filterInput.value);
        });
        th.appendChild(filterInput);

        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table rows
    classes.forEach(cls => {
        const row = document.createElement("tr");

        // Create clickable name cell
        const nameCell = document.createElement("td");
        const nameLink = document.createElement("a");
        nameLink.textContent = typeof (cls) === "string" ? cls : cls.getName(false);
        nameLink.href = `#`;
        nameLink.addEventListener("click", async (event) => {
            event.preventDefault();
            if (cls instanceof SubClass) {
                let file = await vault.createFile(classe, cls.getName());
                this.app.workspace.getLeaf().openFile(file);
            } else {
                this.app.workspace.getLeaf().openFile(cls.file);
            }
        });
        if (cls instanceof SubClass) {
            nameLink.classList.add("new-link")
        }
        nameCell.appendChild(nameLink);
        row.appendChild(nameCell);

        // Create property cells
        Object.keys(propertiesnames).forEach((name: string) => {
            let properties = cls.getAllProperties();
            let property = null;
            if (Object.keys(properties).includes(propertiesnames[name])) {
                property = properties[propertiesnames[name]];
            } else {
                property = new FormulaProperty(name, propertiesnames[name]);
            }
            const cell = document.createElement("td");
            cell.appendChild(property.getDisplay(cls));
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    function sortTableByColumn(column: string) {
        const rows = Array.from(tbody.querySelectorAll("tr"));
        const columnIndex = headers.indexOf(column);
        rows.sort((a, b) => {
            const aText = a.children[columnIndex].textContent || "";
            const bText = b.children[columnIndex].textContent || "";
            return aText.localeCompare(bText);
        });
        rows.forEach(row => tbody.appendChild(row));
    }

    function filterTableByColumn(column: string, filterValue: string) {
        const rows = Array.from(tbody.querySelectorAll("tr"));
        const columnIndex = headers.indexOf(column);
        rows.forEach(row => {
            const cellText = row.children[columnIndex].textContent || "";
            row.style.display = cellText.includes(filterValue) ? "" : "none";
        });
    }

    return table;
}
