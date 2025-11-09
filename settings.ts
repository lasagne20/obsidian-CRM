import { App, PluginSettingTab, Setting } from "obsidian";
import CRM from "./main";

export class CRMSettingTab extends PluginSettingTab {
  plugin: CRM;

  constructor(app: App, plugin: CRM) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Configuration du plugin CRM" });

    // Nom personnalisé
    new Setting(containerEl)
      .setName("Nom personnalisé")
      .setDesc("Sélectionner un nom personnalisé pour l'utilisateur.")
      .addDropdown((dropdown) => {
        const options = ["Léo", "Sylvie"];
        options.forEach((option) => {
          dropdown.addOption(option, option);
        });
        dropdown.setValue(this.plugin.settings.personalName).onChange(async (value) => {
          this.plugin.settings.personalName = value;
          await this.plugin.saveSettings();
        });
      });

    // Dossier des templates
    new Setting(containerEl)
      .setName("Dossier des templates")
      .setDesc("Chemin vers le dossier contenant les templates.")
      .addText((text) => {
        text.setValue(this.plugin.settings.templateFolder).onChange(async (value) => {
          this.plugin.settings.templateFolder = value;
          await this.plugin.saveSettings();
        });
      });

    // Fichier de données
    new Setting(containerEl)
      .setName("Fichier de données")
      .setDesc("Chemin vers le fichier de données (ex: geo.json).")
      .addText((text) => {
        text.setValue(this.plugin.settings.dataFile).onChange(async (value) => {
          this.plugin.settings.dataFile = value;
          await this.plugin.saveSettings();
        });
      });
  }
}
