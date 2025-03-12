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
