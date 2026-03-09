import { App, Modal, Notice, Setting } from 'obsidian';
import { Vault } from 'markdown-crm';
import { ExtractedEntity, ExtractionResult } from '../Services/IA';

/**
 * Modal pour valider et compléter les entités extraites par l'IA
 */
export class AIExtractModal extends Modal {
    private result: ExtractionResult;
    private vault: Vault;
    private onConfirm: (entities: ExtractedEntity[]) => Promise<void>;
    private entities: ExtractedEntity[];
    private editedEntities: Map<number, ExtractedEntity> = new Map();

    constructor(
        app: App,
        vault: Vault,
        result: ExtractionResult,
        onConfirm: (entities: ExtractedEntity[]) => Promise<void>
    ) {
        super(app);
        this.vault = vault;
        this.result = result;
        this.onConfirm = onConfirm;
        this.entities = [...result.entities];
        
        // Initialiser les entités modifiées
        this.entities.forEach((entity, index) => {
            this.editedEntities.set(index, { ...entity, properties: { ...entity.properties } });
        });
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('ai-extract-modal');

        // Titre
        contentEl.createEl('h2', { text: '🤖 Extraction IA - Validation' });

        // Afficher une erreur si présente
        if (this.result.error) {
            const errorDiv = contentEl.createDiv({ cls: 'ai-extract-error' });
            errorDiv.createEl('p', { 
                text: `❌ ${this.result.error}`,
                cls: 'error-message'
            });
            
            new Setting(contentEl)
                .addButton(btn => btn
                    .setButtonText('Fermer')
                    .onClick(() => this.close())
                );
            return;
        }

        // Afficher les entités extraites
        if (this.entities.length === 0) {
            contentEl.createEl('p', { 
                text: 'Aucune entité détectée dans le texte.',
                cls: 'no-entities'
            });
            
            new Setting(contentEl)
                .addButton(btn => btn
                    .setButtonText('Fermer')
                    .onClick(() => this.close())
                );
            return;
        }

        // En-tête
        const header = contentEl.createDiv({ cls: 'ai-extract-header' });
        header.createEl('p', { 
            text: `${this.entities.length} entité(s) détectée(s). Vérifiez et complétez les informations ci-dessous :` 
        });

        // Afficher chaque entité
        this.entities.forEach((entity, index) => {
            this.renderEntity(contentEl, entity, index);
        });

        // Boutons d'action
        const actions = contentEl.createDiv({ cls: 'ai-extract-actions' });
        
        new Setting(actions)
            .addButton(btn => btn
                .setButtonText('Annuler')
                .onClick(() => this.close())
            )
            .addButton(btn => btn
                .setButtonText('Créer les entités')
                .setCta()
                .onClick(async () => {
                    await this.handleConfirm();
                })
            );
    }

    private renderEntity(containerEl: HTMLElement, entity: ExtractedEntity, index: number) {
        const entityContainer = containerEl.createDiv({ cls: 'ai-entity-container' });
        
        // En-tête de l'entité
        const entityHeader = entityContainer.createDiv({ cls: 'ai-entity-header' });
        entityHeader.createEl('h3', { 
            text: `${entity.className}`,
            cls: 'ai-entity-title'
        });
        
        // Score de confiance
        const confidence = Math.round(entity.confidence * 100);
        const confidenceEl = entityHeader.createEl('span', { 
            text: `${confidence}% confiance`,
            cls: 'ai-entity-confidence'
        });
        confidenceEl.style.backgroundColor = this.getConfidenceColor(entity.confidence);

        // Checkbox pour activer/désactiver cette entité
        const checkboxSetting = new Setting(entityContainer)
            .setName('Créer cette entité')
            .addToggle(toggle => toggle
                .setValue(true)
                .onChange(enabled => {
                    if (!enabled) {
                        // Marquer l'entité comme désactivée
                        this.editedEntities.delete(index);
                    } else {
                        this.editedEntities.set(index, this.entities[index]);
                    }
                })
            );

        // Propriétés
        const propsContainer = entityContainer.createDiv({ cls: 'ai-entity-properties' });
        
        const editedEntity = this.editedEntities.get(index);
        if (!editedEntity) return;

        Object.entries(editedEntity.properties).forEach(([key, value]) => {
            new Setting(propsContainer)
                .setName(key)
                .addText(text => {
                    const displayValue = typeof value === 'object' 
                        ? JSON.stringify(value) 
                        : String(value);
                    
                    text
                        .setValue(displayValue)
                        .onChange(newValue => {
                            // Mettre à jour la propriété éditée
                            const entity = this.editedEntities.get(index);
                            if (entity) {
                                entity.properties[key] = newValue;
                            }
                        });
                });
        });

        // Bouton pour ajouter une propriété
        new Setting(propsContainer)
            .setName('Ajouter une propriété')
            .addButton(btn => btn
                .setButtonText('+')
                .setTooltip('Ajouter une nouvelle propriété')
                .onClick(() => {
                    this.showAddPropertyModal(index);
                })
            );
    }

    private getConfidenceColor(confidence: number): string {
        if (confidence >= 0.8) return '#4caf50';
        if (confidence >= 0.5) return '#ff9800';
        return '#f44336';
    }

    private showAddPropertyModal(entityIndex: number) {
        // Pour l'instant, on utilise un prompt simple
        // TODO: Créer un modal dédié avec la liste des propriétés disponibles
        const propName = prompt('Nom de la propriété :');
        if (!propName) return;

        const propValue = prompt('Valeur de la propriété :');
        if (propValue === null) return;

        const entity = this.editedEntities.get(entityIndex);
        if (entity) {
            entity.properties[propName] = propValue;
            // Re-render
            this.onOpen();
        }
    }

    private async handleConfirm() {
        const validEntities = Array.from(this.editedEntities.values());
        
        if (validEntities.length === 0) {
            new Notice('Aucune entité sélectionnée');
            return;
        }

        try {
            await this.onConfirm(validEntities);
            new Notice(`✅ ${validEntities.length} entité(s) créée(s)`);
            this.close();
        } catch (error) {
            new Notice(`❌ Erreur: ${error.message}`);
            console.error('Error creating entities:', error);
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
