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

    // Afficher les classes chargées
    const classesInfo = containerEl.createDiv({ cls: "setting-item-description" });
    classesInfo.style.marginBottom = "20px";
    classesInfo.style.padding = "10px";
    classesInfo.style.backgroundColor = "var(--background-secondary)";
    classesInfo.style.borderRadius = "5px";
    
    const vault = this.plugin.vault;
    if (vault) {
      const factory = vault.getDynamicClassFactory();
      if (factory) {
        const classes = (vault.constructor as any).classes;
        const classNames = Object.keys(classes || {});
        classesInfo.innerHTML = `<strong>Classes chargées :</strong> ${classNames.length > 0 ? classNames.join(", ") : "Aucune classe chargée"}`;
      } else {
        classesInfo.innerHTML = `<strong>⚠️</strong> Factory de classes non initialisée`;
      }
    } else {
      classesInfo.innerHTML = `<strong>⚠️</strong> Vault non initialisé`;
    }

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

    // Dossier de configuration des classes
    new Setting(containerEl)
      .setName("Dossier de configuration des classes")
      .setDesc("Chemin vers le dossier contenant les fichiers YAML de configuration des classes (ex: Personne.yaml, Institution.yaml).")
      .addText((text) => {
        text
          .setPlaceholder("Outils/Obsidian/Config")
          .setValue(this.plugin.settings.configPath)
          .onChange(async (value) => {
            this.plugin.settings.configPath = value;
            await this.plugin.saveSettings();
          });
      })
      .addButton((button) => {
        button
          .setButtonText("Recharger les classes")
          .setTooltip("Recharger les configurations des classes depuis le dossier")
          .onClick(async () => {
            // Réinitialiser le vault avec le nouveau chemin
            await this.plugin.initializePlugin();
            button.setButtonText("✓ Rechargé!");
            setTimeout(() => {
              button.setButtonText("Recharger les classes");
            }, 2000);
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

    // Section pour les paramètres de formatage
    containerEl.createEl("h3", { text: "Paramètres de formatage" });

    // Format de téléphone
    new Setting(containerEl)
      .setName("Format de téléphone")
      .setDesc("Format d'affichage des numéros de téléphone.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("FR", "France (+33)")
          .addOption("US", "États-Unis (+1)")
          .addOption("UK", "Royaume-Uni (+44)")
          .addOption("DE", "Allemagne (+49)")
          .addOption("ES", "Espagne (+34)")
          .addOption("IT", "Italie (+39)")
          .addOption("INTL", "International")
          .setValue(this.plugin.settings.phoneFormat || "FR")
          .onChange(async (value) => {
            this.plugin.settings.phoneFormat = value as any;
            await this.plugin.saveSettings();
          });
      });

    // Format de date
    new Setting(containerEl)
      .setName("Format de date")
      .setDesc("Format d'affichage des dates (ex: DD/MM/YYYY, MM/DD/YYYY).")
      .addText((text) => {
        text
          .setPlaceholder("DD/MM/YYYY")
          .setValue(this.plugin.settings.dateFormat || "DD/MM/YYYY")
          .onChange(async (value) => {
            this.plugin.settings.dateFormat = value;
            await this.plugin.saveSettings();
          });
      });

    // Format de temps
    new Setting(containerEl)
      .setName("Format de temps")
      .setDesc("Format d'affichage des heures.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("24h", "24 heures")
          .addOption("12h", "12 heures (AM/PM)")
          .setValue(this.plugin.settings.timeFormat || "24h")
          .onChange(async (value) => {
            this.plugin.settings.timeFormat = value as any;
            await this.plugin.saveSettings();
          });
      });

    // Locale pour les nombres
    new Setting(containerEl)
      .setName("Locale pour les nombres")
      .setDesc("Locale pour le formatage des nombres (ex: fr-FR, en-US).")
      .addText((text) => {
        text
          .setPlaceholder("fr-FR")
          .setValue(this.plugin.settings.numberLocale || "fr-FR")
          .onChange(async (value) => {
            this.plugin.settings.numberLocale = value;
            await this.plugin.saveSettings();
          });
      });

    // Symbole de devise
    new Setting(containerEl)
      .setName("Symbole de devise")
      .setDesc("Symbole à utiliser pour les montants (ex: €, $, £).")
      .addText((text) => {
        text
          .setPlaceholder("€")
          .setValue(this.plugin.settings.currencySymbol || "€")
          .onChange(async (value) => {
            this.plugin.settings.currencySymbol = value;
            await this.plugin.saveSettings();
          });
      });

    // Section pour les folder notes
    containerEl.createEl("h3", { text: "Notes de dossier" });

    // Activer les folder notes
    new Setting(containerEl)
      .setName("Activer les notes de dossier")
      .setDesc("Créer automatiquement une note pour chaque nouveau dossier.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enableFolderNotes)
          .onChange(async (value) => {
            this.plugin.settings.enableFolderNotes = value;
            await this.plugin.saveSettings();
          });
      });

    // Position de la note
    new Setting(containerEl)
      .setName("Position de la note de dossier")
      .setDesc("Position de la note par rapport au dossier.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("inside", "À l'intérieur (Dossier/Dossier.md)")
          .addOption("outside", "À l'extérieur (Dossier.md)")
          .setValue(this.plugin.settings.folderNotePosition)
          .onChange(async (value) => {
            this.plugin.settings.folderNotePosition = value as 'inside' | 'outside';
            await this.plugin.saveSettings();
          });
      });

    // Masquer les notes de dossier dans l'arbre
    new Setting(containerEl)
      .setName("Masquer les notes de dossier dans l'explorateur")
      .setDesc("Cacher les notes de dossier dans l'arbre de fichiers.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.hideInFileExplorer)
          .onChange(async (value) => {
            this.plugin.settings.hideInFileExplorer = value;
            await this.plugin.saveSettings();
          });
      });

    // Souligner les dossiers avec note
    new Setting(containerEl)
      .setName("Souligner les dossiers avec note")
      .setDesc("Afficher un soulignement sur les noms de dossiers qui ont une note associée.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.underlineFolderWithNote)
          .onChange(async (value) => {
            this.plugin.settings.underlineFolderWithNote = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
