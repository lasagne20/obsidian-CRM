import { Classe } from "Classes/Classe";
import { App, MarkdownView, TFile} from "obsidian";
import { MyVault } from "Utils/MyVault";

export class TopDisplay {

    public app: any;
    public dv : any;
    public vault: MyVault

    constructor(app : App, vault: MyVault){
        this.app = app
        this.vault = vault
        this.dv = this.app.plugins.plugins["dataview"]?.api;
        if (!this.dv){
            throw Error("Le plugin Dataview n'est pas chargé.")
        }
    }

    show() {  
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) return;
        let container = this.getContainer(activeView)
        const file = activeView.file; 
        if (!file) return;
        if (!(file instanceof TFile)) return;
    
        let classe = this.vault.getFromFile(file)
        if (classe){
            let content = classe.getTopDisplayContent()
            container.appendChild(content);
        } 
    }
    
    getContainer(activeView: any){
        let container = activeView.contentEl.querySelector("#dataviewjs-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "dataviewjs-container";

            const metadataContainer = activeView.contentEl.querySelector(".metadata-container");
            if (metadataContainer?.parentNode) {
                metadataContainer.parentNode.insertBefore(container, metadataContainer.nextSibling);
            } else {
                activeView.contentEl.appendChild(container);
            }
        } else {
            container.innerHTML = "";
        }
        return container
    }

}
