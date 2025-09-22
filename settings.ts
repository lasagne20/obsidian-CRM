import { App, PluginSettingTab, Setting, TFile } from "obsidian";
import CRM from "./main";
import { MyVault } from "Utils/MyVault";
import { SubClassProperty } from "Utils/Properties/SubClassProperty";

export class CRMSettingTab extends PluginSettingTab {
  plugin: CRM;

  constructor(app: App, plugin: CRM) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Configuration du plugin" });

    // Crée la configuration pour le nom personnalisé
    new Setting(containerEl)
      .setName("Nom personnalisé")
      .setDesc("Sélectionner un nom personnalisé pour l'utilisateur.")
      .addDropdown((dropdown) => {
      const options = ["Léo", "Sylvie"]; // Liste des noms disponibles
      options.forEach((option) => {
        dropdown.addOption(option, option);
      });
      dropdown.setValue(this.plugin.settings.personalName).onChange(async (value) => {
        this.plugin.settings.personalName = value;
        await this.plugin.saveSettings();
      });
      });

    // Crée la configuration du dossier des templates
    new Setting(containerEl)
      .setName("Dossier des templates")
      .setDesc("Sélectionner le dossier où sont stockés les templates.")
      .addText((text) => {
        // Affiche le chemin actuel du dossier
        text.setValue(this.plugin.settings.templateFolder).onChange(async (value) => {
          this.plugin.settings.templateFolder = value;
          await this.plugin.saveSettings();
        });

        // Autocomplétion basée sur les dossiers dans le vault
        text.inputEl.addEventListener("input", () => {
          this.showFolderSuggestions(text.inputEl);
        });
      })
      .setClass("folder-path-selector"); // Ajoute une classe pour le style (facultatif)

    // Crée la configuration du fichier geo.json
    new Setting(containerEl)
      .setName("Fichier geo.json")
      .setDesc("Sélectionner le chemin du fichier geo.json.")
      .addText((text) => {
        // Affiche le chemin actuel du fichier
        text.setValue(this.plugin.settings.dataFile).onChange(async (value) => {
          this.plugin.settings.dataFile = value;
          await this.plugin.saveSettings();
        });

        // Autocomplétion basée sur les fichiers dans le vault
        text.inputEl.addEventListener("input", () => {
          this.showFolderSuggestions(text.inputEl);
        });
      })
      .setClass("file-path-selector"); // Ajoute une classe pour le style (facultatif)

    // Crée la configuration pour les autres fichiers
    const filesContainer = containerEl.createDiv();
    this.plugin.settings.additionalFiles.forEach((fileSetting: { class: string, subClass : string, path: string }, index: number) => {
      this.createFileSetting(filesContainer, fileSetting, index);
    });

    // Bouton pour ajouter un nouveau fichier
    new Setting(containerEl)
      .addButton((button) => {
      button.setButtonText("Ajouter un fichier")
        .setCta()
        .onClick(() => {
        const newFileSetting = { class: "", subClass : "", path: "" };
        this.plugin.settings.additionalFiles.push(newFileSetting);
        this.createFileSetting(filesContainer, newFileSetting, this.plugin.settings.additionalFiles.length - 1);
        });
      })
      .setClass("add-file-button"); // Ajoute une classe pour le style (facultatif)

    new Setting(containerEl)
      .setName("Refresh vault")
      .setDesc("Recharge tous les fichiers de la vault")
      .addButton((button) => {
        button.setButtonText("Refresh vault")
          .setCta() // Rend le bouton plus visible
          .onClick(async () => {
            await this.plugin.refreshVault();
          });
      });
  }

  createFileSetting (containerEl: HTMLElement, fileSetting: { class: string, subClass : string, path: string }, index: number) {
    const settingDiv = containerEl.createDiv();
    settingDiv.addClass("settings-line");
    const nameSetting = new Setting(settingDiv)
      .setName("Classe")
      .addDropdown((dropdown) => {
      const classOptions = this.getClassOptions();
      classOptions.forEach((option) => {
        dropdown.addOption(option, option);
      });
      dropdown.setValue(fileSetting.class).onChange(async (value) => {
        fileSetting.class = value;
        await this.plugin.saveSettings();
        // Update subClass options when class changes
        const subClassOptions = this.getSubClassOptions(value);
        subClassOptions.forEach((option) => {
          dropdown.addOption(option, option);
        });
      });
      });

    const subClassSetting = new Setting(settingDiv)
      .setName("Sous-classe")
      .addDropdown((dropdown) => {
      const subClassOptions = this.getSubClassOptions(fileSetting.class);
      subClassOptions.forEach((option) => {
        dropdown.addOption(option, option);
      });
      dropdown.setValue(fileSetting.subClass || "").onChange(async (value) => {
        fileSetting.subClass = value;
        await this.plugin.saveSettings();
      });
      });

    const pathSetting = new Setting(settingDiv)
      .setName("Chemin du fichier")
      .addText((text) => {
        text.setValue(fileSetting.path).onChange(async (value) => {
          fileSetting.path = value;
          await this.plugin.saveSettings();
        });

        // Autocomplétion basée sur les fichiers dans le vault
        text.inputEl.addEventListener("input", () => {
          this.showFolderSuggestions(text.inputEl);
        });
      });

    // Bouton pour supprimer le fichier
    const deleteButton = new Setting(settingDiv)
      .addButton((button) => {
        button.setButtonText("Supprimer")
          .setCta()
          .onClick(async () => {
            this.plugin.settings.additionalFiles.splice(index, 1);
            settingDiv.remove();
          });
      });

    // Ajouter les classes pour l'affichage en ligne
    nameSetting.settingEl.addClass("inline-setting");
    subClassSetting.settingEl.addClass("inline-setting");
    pathSetting.settingEl.addClass("inline-setting");
    deleteButton.settingEl.addClass("inline-setting");
  }

  getClassOptions(){
    return Object.keys(MyVault.classes)
  }

  getSubClassOptions(classe : string){
    if (!classe){return []}
    let properties = MyVault.classes[classe].Properties
    const subClasses: string[] = [];
    for (const property in properties) {
      if (properties[property] instanceof SubClassProperty) {
        properties[property].subClasses.forEach((subClass : any) => {
          subClasses.push(subClass.getsubClassName());
        });
      }
    }
    console.log(subClasses) 
    return subClasses;
  }


  // Afficher les suggestions des dossiers dans Obsidian
  showFolderSuggestions(inputElement: HTMLInputElement) {
    const vault = this.plugin.app.vault;
    const currentInput = inputElement.value.toLowerCase();

    // Trouve tous les dossiers dans le vault
    const folders = this.getAllFolders(vault);

    // Filtrer les dossiers qui correspondent à l'input
    const suggestions = folders.filter((folderPath) => folderPath.toLowerCase().includes(currentInput));

    // Affiche les suggestions dans un encart sous le champ texte (similaire à Templater)
    this.showSuggestions(inputElement, suggestions);
  }

  // Retourner tous les dossiers du vault
  getAllFolders(vault: any): string[] {
    const folders: string[] = [];
    const files = vault.getFiles();

    files.forEach((file: TFile) => {
      const pathParts = file.path.split('/');
      pathParts.pop(); // Retirer le fichier, ne garder que les dossiers
      const folderPath = pathParts.join('/');
      if (!folders.includes(folderPath)) {
        folders.push(folderPath);
      }
    });

    return folders;
  }

  // Afficher les suggestions sous le champ texte avec un joli encart
  showSuggestions(inputElement: HTMLInputElement, suggestions: string[]) {
    // Supprime les suggestions précédentes
    const existingSuggestions = document.querySelector(".suggestion-list");
    if (existingSuggestions) {
      existingSuggestions.remove();
    }

    // Si aucune suggestion, on ne fait rien
    if (suggestions.length === 0) return;

    const suggestionList = document.createElement("div");
    suggestionList.classList.add("suggestion-list");

    // Ajouter les suggestions sous le champ texte
    suggestions.forEach((suggestion) => {
      const suggestionItem = document.createElement("div");
      suggestionItem.textContent = suggestion;
      suggestionItem.classList.add("suggestion-item");

      suggestionItem.onclick = () => {
        inputElement.value = suggestion; // Mettre la suggestion dans le champ texte
        suggestionList.remove(); // Retirer la liste des suggestions après sélection
      };

      suggestionList.appendChild(suggestionItem);
    });

    // Ajouter la liste de suggestions sous l'élément parent du champ texte
    inputElement.parentElement?.appendChild(suggestionList);
  }
}
