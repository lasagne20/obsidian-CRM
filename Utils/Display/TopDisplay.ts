import { Classe } from "Classes/Classe";
import { App, MarkdownView, TFile } from "obsidian";
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

  constructor(app: App, vault: MyVault) {
    this.app = app;
    this.vault = vault;
    this.dv = this.app.plugins.plugins["dataview"]?.api;
    if (!this.dv) {
      throw Error("Le plugin Dataview n'est pas chargé.");
    }
  }

  async show() {
    if (this.inProcess) return;
    this.inProcess = true;
    console.log("TopDisplay show called");
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;
    let container = this.getContainer(activeView);


    const file = activeView.file;
    if (!file) return;
    if (!(file instanceof TFile)) return;

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
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;
    const file = activeView.file;
    if (!file) return;
    if (!(file instanceof TFile)) return;

    let classe = this.vault.getFromFile(file);
    if (classe) {
      if (activeView.contentEl.querySelector("#dataviewjs-container")){
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
