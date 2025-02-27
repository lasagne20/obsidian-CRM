import { App, PluginSettingTab, Setting, TFile } from "obsidian";
import GestionManager from "./main";
import { Institution } from "Classes/Institution";
import { Personne } from "Classes/Personne";
import { Lieu } from "Classes/Lieux";

export class GestionManagerSettingTab extends PluginSettingTab {
  plugin: GestionManager;

  constructor(app: App, plugin: GestionManager) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Configuration du plugin" });

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

    new Setting(containerEl)
      .setName("Refresh vault")
      .setDesc("Recharge tous les fichiers de la vault")
      .addButton( (button) => {
            button.setButtonText("Refresh vault")
            .setCta() // Rend le bouton plus visible
            .onClick(async () => {
                 await this.plugin.refreshVault();
            })
      })
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
