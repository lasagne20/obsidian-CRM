import { Classe } from "Classes/Classe";
import AppShim, { TFile, isTFile } from "../App";
import { ModalMap } from "Utils/Modals/ModalMap";
import { MyVault } from "Utils/MyVault";

declare global {
  interface Window {
    mapViewAPIv0?: any;
  }
}

export class TopDisplay {
  public app: any;
  public dv: any;
  public vault: MyVault;
  public content: HTMLElement;
  public inProcess: boolean = false;

  constructor(app: AppShim, vault: MyVault) {
    this.app = app;
    this.vault = vault;
    this.dv = this.app.plugins?.plugins?.["dataview"]?.api;
    if (!this.dv) {
      console.warn("Le plugin Dataview n'est pas chargé. Certaines fonctionnalités peuvent être limitées.");
    }
  }

  async show() {
    if (this.inProcess) return;
    this.inProcess = true;
    console.log("TopDisplay show called");
    const file = this.app.workspace.getActiveFile();
    if (!file) return;
    if (!isTFile(file)) return;
    
    // Obtenir la vue active (leaf) qui contient le fichier
    const activeLeaf = this.app.workspace.getLeaf();
    if (!activeLeaf || !activeLeaf.view) return;
    
    let container = this.getContainer(activeLeaf.view);

    let classe = this.vault.getFromFile(file);
    if (classe) {
      container.innerHTML = "";
      this.content = await classe.getTopDisplayContent();
      
      if (this.content && this.content instanceof Node) {
        container.appendChild(this.content);
      } else {
        console.error("Invalid content returned by getTopDisplayContent");
        console.log(this.content)
      }
      this.inProcess = false;
      console.log("TopDisplay content updated");
    }
  }

  async update() {
    const file = this.app.workspace.getActiveFile();
    if (!file || !isTFile(file)) return;

    let classe = this.vault.getFromFile(file);
    if (classe) {
      if (document.querySelector("#dataviewjs-container")){
        await classe.reloadTopDisplayContent();
      }
      else {
        this.inProcess = false;
        await this.show();
      }
      
    }
  }

  getContainer(activeView: any) {
    let container = activeView.contentEl.querySelector("#dataviewjs-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "dataviewjs-container";

      const metadataContainer = activeView.contentEl.querySelector(".metadata-container");
      if (metadataContainer) metadataContainer.style.display = "none";

      if (metadataContainer?.parentNode) {
        metadataContainer.parentNode.insertBefore(container, metadataContainer.nextSibling);
      } else {
        activeView.contentEl.appendChild(container);
      }
    } else {
      container.innerHTML = "";
    }
    return container;
  }
}
