import { App, Notice, PluginSettingTab, Setting } from "obsidian";
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
    
    const loadedClasses = this.plugin.loadedClassNames;
    if (loadedClasses && loadedClasses.length > 0) {
      classesInfo.innerHTML = `<strong>Classes chargées :</strong> ${loadedClasses.join(", ")}`;
    } else {
      classesInfo.innerHTML = `<strong>⚠️</strong> Aucune classe chargée`;
    }

    // Bouton pour refresh complet du vault
    new Setting(containerEl)
      .setName("Actualiser tout le vault")
      .setDesc("Actualise tous les fichiers et recalcule les relations et propriétés.")
      .addButton((button) => {
        button
          .setButtonText("🔄 Actualiser")
          .setTooltip("Actualise tous les objets du vault")
          .onClick(async () => {
            try {
              console.log("🔄 Launching refreshAll from settings...");
              button.setButtonText("⏳ En cours...");
              button.setDisabled(true);
              
              await this.plugin.vault.refreshAll();
              
              button.setButtonText("✅ Terminé!");
              setTimeout(() => {
                button.setButtonText("🔄 Actualiser");
                button.setDisabled(false);
              }, 2000);
            } catch (error) {
              console.error("❌ Error during refreshAll:", error);
              button.setButtonText("❌ Erreur");
              setTimeout(() => {
                button.setButtonText("🔄 Actualiser");
                button.setDisabled(false);
              }, 2000);
            }
          });
      });

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

    // Nom de la propriété de classe
    new Setting(containerEl)
      .setName("Nom de la propriété de classe")
      .setDesc("Nom de la propriété dans le frontmatter qui indique la classe d'un fichier (par défaut: Classe).")
      .addText((text) => {
        text
          .setPlaceholder("Classe")
          .setValue(this.plugin.settings.classePropertyName || "Classe")
          .onChange(async (value) => {
            this.plugin.settings.classePropertyName = value;
            await this.plugin.saveSettings();
          });
      });

    // Aliases de la propriété de classe
    new Setting(containerEl)
      .setName("Aliases de la propriété de classe")
      .setDesc("Noms alternatifs pour la propriété de classe (séparés par des virgules, ex: Classe, Class, Type).")
      .addText((text) => {
        text
          .setPlaceholder("Classe")
          .setValue((this.plugin.settings.classePropertyAliases || ["Classe"]).join(", "))
          .onChange(async (value) => {
            // Convertir la chaîne en tableau, en supprimant les espaces
            this.plugin.settings.classePropertyAliases = value
              .split(",")
              .map(alias => alias.trim())
              .filter(alias => alias.length > 0);
            await this.plugin.saveSettings();
          });
      });

    // Supprimer les aliases après migration
    new Setting(containerEl)
      .setName("Supprimer les aliases après migration")
      .setDesc("Supprimer automatiquement les anciennes propriétés après migration vers le nouveau format (recommandé).")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.deleteAliasesAfterMigration ?? true)
          .onChange(async (value) => {
            this.plugin.settings.deleteAliasesAfterMigration = value;
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

    // Section pour Ollama (IA)
    containerEl.createEl("h3", { text: "Intelligence Artificielle (Ollama)" });

    // Activer Ollama
    new Setting(containerEl)
      .setName("Activer l'extraction IA")
      .setDesc("Activer l'extraction automatique d'entités avec Ollama.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.ollamaEnabled)
          .onChange(async (value) => {
            this.plugin.settings.ollamaEnabled = value;
            await this.plugin.saveSettings();
          });
      });

    // URL Ollama
    new Setting(containerEl)
      .setName("URL Ollama")
      .setDesc("URL de l'API Ollama (ex: http://localhost:11434).")
      .addText((text) => {
        text
          .setPlaceholder("http://localhost:11434")
          .setValue(this.plugin.settings.ollamaUrl || "http://localhost:11434")
          .onChange(async (value) => {
            this.plugin.settings.ollamaUrl = value;
            await this.plugin.saveSettings();
          });
      });

    // Modèle Ollama
    new Setting(containerEl)
      .setName("Modèle Ollama")
      .setDesc("Nom du modèle à utiliser (ex: mistral, llama3, qwen2.5:7b).")
      .addText((text) => {
        text
          .setPlaceholder("mistral")
          .setValue(this.plugin.settings.ollamaModel || "mistral")
          .onChange(async (value) => {
            this.plugin.settings.ollamaModel = value;
            await this.plugin.saveSettings();
          });
      });

    // Température
    new Setting(containerEl)
      .setName("Température")
      .setDesc("Créativité du modèle (0.0 = précis, 1.0 = créatif). Recommandé: 0.1 pour l'extraction de données.")
      .addSlider((slider) => {
        slider
          .setLimits(0, 1, 0.1)
          .setValue(this.plugin.settings.ollamaTemperature ?? 0.1)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.ollamaTemperature = value;
            await this.plugin.saveSettings();
          });
      });

    // Bouton pour tester la connexion
    new Setting(containerEl)
      .setName("Tester la connexion")
      .setDesc("Vérifier qu'Ollama est accessible et que le modèle est disponible.")
      .addButton((button) => {
        button
          .setButtonText("🔍 Tester")
          .onClick(async () => {
            // Accéder au service Ollama via le plugin
            const ollamaService = (this.plugin as any).ollamaService;
            if (ollamaService) {
              await ollamaService.testConnection();
            } else {
              new Notice("⚠️ Les services IA ne sont pas initialisés. Activez l'extraction IA.");
            }
          });
      });
  }
}
