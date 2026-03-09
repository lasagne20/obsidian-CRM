import { Vault } from 'markdown-crm';
import { OllamaService } from './OllamaService';
import {
    ClassConfig,
    ExtractedEntity,
    ExtractionResult,
    OllamaExtractionResponse,
    PropertyConfig
} from './types';

/**
 * Service d'extraction intelligente d'entités à partir de texte
 * Utilise les configurations YAML des classes pour guider l'extraction
 */
export class EntityExtractor {
    private ollamaService: OllamaService;
    private vault: Vault;
    private availableClassNames: string[] = [];
    private classNamesExplicitlySet: boolean = false;

    constructor(ollamaService: OllamaService, vault: Vault, availableClassNames?: string[]) {
        this.ollamaService = ollamaService;
        this.vault = vault;
        if (availableClassNames !== undefined) {
            this.availableClassNames = availableClassNames;
            this.classNamesExplicitlySet = true;
        }
    }

    /**
     * Définit les noms de classes disponibles
     */
    setAvailableClassNames(classNames: string[]): void {
        this.availableClassNames = classNames;
        this.classNamesExplicitlySet = true;
    }

    /**
     * Charge toutes les configurations de classes disponibles
     */
    async loadAvailableClasses(): Promise<ClassConfig[]> {
        const factory = this.vault.getDynamicClassFactory();
        if (!factory) {
            console.warn('❌ No dynamic class factory available');
            return [];
        }

        const configManager = (factory as any).configManager;
        if (!configManager) {
            console.warn('❌ No config manager available');
            return [];
        }

        const classConfigs: ClassConfig[] = [];

        // Si les noms de classes ont été explicitement définis, les utiliser
        if (this.classNamesExplicitlySet) {
            if (this.availableClassNames.length === 0) {
                console.log('⚠️ Class names explicitly set to empty array');
                return [];
            }
            
            console.log(`📋 Loading ${this.availableClassNames.length} classes:`, this.availableClassNames);
            for (const className of this.availableClassNames) {
                try {
                    const config = await configManager.getClassConfig(className);
                    classConfigs.push(config);
                    console.log(`✅ Loaded config for ${className}`);
                } catch (error) {
                    console.warn(`⚠️ Could not load config for class ${className}:`, error);
                }
            }
            return classConfigs;
        }

        // Fallback: essayer de détecter automatiquement
        console.log('⚠️ No class names provided, trying auto-detection...');
        try {
            // Essayer de récupérer depuis configManager.configs
            if (configManager.configs && typeof configManager.configs === 'object') {
                const configKeys = Object.keys(configManager.configs);
                console.log(`📋 Found ${configKeys.length} configs in configManager:`, configKeys);
                for (const className of configKeys) {
                    try {
                        const config = await configManager.getClassConfig(className);
                        classConfigs.push(config);
                    } catch (error) {
                        console.warn(`Could not load config for class ${className}:`, error);
                    }
                }
            }
        } catch(error) {
            console.error('❌ Error loading classes:', error);
        }

        console.log(`✅ Loaded ${classConfigs.length} class configs`);
        return classConfigs;
    }

    /**
     * Construit un prompt système pour Ollama basé sur les classes disponibles
     */
    private buildSystemPrompt(classConfigs: ClassConfig[]): string {
        const classDescriptions = classConfigs.map(config => {
            const properties = Object.entries(config.properties)
                .map(([key, prop]) => {
                    const aliases = prop.aliases?.join(', ') || '';
                    const aliasesStr = aliases ? ` (aliases: ${aliases})` : '';
                    
                    // Describe options for SelectProperty/MultiSelectProperty
                    const optionsStr = prop.options 
                        ? ` [options: ${prop.options.map(o => o.name).join(', ')}]`
                        : '';
                    
                    // Describe FileProperty (link to another entity)
                    let typeDescription = prop.type;
                    if (prop.type === 'FileProperty' && prop.classes) {
                        typeDescription = `${prop.type} (lien vers ${prop.classes.join(' ou ')})`;
                    }
                    
                    // Describe ObjectProperty (nested properties)
                    if (prop.type === 'ObjectProperty' && prop.properties) {
                        const subProps = Object.entries(prop.properties)
                            .map(([subKey, subProp]: [string, any]) => {
                                let subTypeDesc = subProp.type;
                                if (subProp.type === 'FileProperty' && subProp.classes) {
                                    subTypeDesc = `lien vers ${subProp.classes.join('/')}`;
                                }
                                return `${subKey}: ${subTypeDesc}`;
                            })
                            .join(', ');
                        typeDescription = `${prop.type} {${subProps}}`;
                    }
                    
                    return `    - ${key}: ${typeDescription}${aliasesStr}${optionsStr}`;
                })
                .join('\n');

            return `  ${config.className}:\n${properties}`;
        }).join('\n\n');

        return `Tu es un assistant spécialisé dans l'extraction d'informations structurées depuis du texte en français.

CLASSES DISPONIBLES:
${classDescriptions}

INSTRUCTIONS:
1. Analyse le texte fourni et identifie UNIQUEMENT les entités valides qui correspondent aux classes ci-dessus
2. IGNORE le texte aléatoire, les mots de liaison, et les chaînes sans sens (ex: "fdggddgdg", "abc123")
3. N'extrait QUE les entités avec des informations complètes et pertinentes
4. Une Personne DOIT avoir au minimum un nom complet (prénom + nom) ou un email valide
5. Un Lieu/Institution DOIT avoir un nom significatif (pas juste des lettres aléatoires)
6. Donne un score de confiance (0-1) pour chaque entité - utilise < 0.6 pour les entités douteuses
7. Si une propriété a des options définies, utilise UNIQUEMENT ces valeurs
8. Pour les dates, utilise le format DD/MM/YYYY
9. Pour les téléphones français, normalise au format international (+33...)
10. Si tu détectes plusieurs entités liées (ex: Personne + Institution), extrais-les toutes
11. **CRITIQUE**: Utilise UNIQUEMENT les noms de propriétés EXACTS listés dans les schémas ci-dessus
12. **CRITIQUE**: Pour le nom principal de l'entité, utilise la propriété "nom" (pas "nomComplet", "name", etc.)
13. **EXTRAIS TOUTES LES PROPRIÉTÉS** que tu peux trouver dans le texte (téléphone, email, adresse, etc.)
14. **NE CRÉE PAS** d'entités pour les wikilinks existants [[Nom]] - ils existent déjà

RÈGLES DE VALIDATION:
- Un nom de Personne doit contenir au moins 2 mots avec des majuscules (ex: "Marie Le Moine" ✓, "fdggddgdg" ✗)
- Ignore les mots de liaison isolés: "de", "la", "à", "pour", "dans", "avec", etc.
- Ignore les chaînes aléatoires de caractères sans signification
- Si une information est incertaine ou incomplète, NE PAS créer l'entité
- Si tu vois un wikilink [[NomEntité]], cette entité EXISTE DÉJÀ, ne la crée PAS
- Tu peux créer des relations vers les entités existantes en wikilinks

GESTION DES TYPES SPÉCIAUX:
- FileProperty (lien vers entité): Extrais juste le nom de l'entité liée (ex: "Mairie de Saint Marcel")
- ObjectProperty (objet avec sous-propriétés): Utilise un objet avec les sous-propriétés
  Exemple pour "postes": {"institution": "Mairie de Saint Marcel", "poste": "Directrice"}
- MultiSelectProperty: Utilise un tableau (ex: ["client", "expert"])
- EmailProperty, PhoneProperty: Normalise le format et extrait TOUS les téléphones/emails trouvés

EXEMPLES D'EXTRACTION COMPLÈTE:
Texte: "Marie Le Moine, de la mairie de Saint Marcel, me recontacte : 01.02.04.05.52"
Résultat attendu:
{
  "entities": [
    {
      "type": "Personne",
      "confidence": 0.95,
      "data": {
        "nom": "Marie Le Moine",
        "phone": "+33102040552",
        "postes": {"institution": "Mairie de Saint Marcel", "poste": ""}
      }
    },
    {
      "type": "Institution",
      "confidence": 0.9,
      "data": {
        "nom": "Mairie de Saint Marcel"
      }
    }
  ]
}

IMPORTANT:
- Réponds UNIQUEMENT avec un objet JSON valide
- Ne pas ajouter de commentaires ou d'explications
- Privilégie la QUALITÉ sur la QUANTITÉ - mieux vaut 1 entité valide que 3 entités douteuses
- Format de réponse:
{
  "entities": [
    {
      "type": "NomClasse",
      "confidence": 0.95,
      "data": {
        "propriete1": "valeur",
        "propriete2": "valeur"
      }
    }
  ],
  "reasoning": "Explication courte optionnelle"
}`;
    }

    /**
     * Extrait les wikilinks existants du texte
     */
    private extractExistingWikilinks(text: string): string[] {
        const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
        const wikilinks: string[] = [];
        let match;
        
        while ((match = wikilinkRegex.exec(text)) !== null) {
            wikilinks.push(match[1]);
        }
        
        return wikilinks;
    }

    /**
     * Construit le prompt utilisateur pour l'extraction
     */
    private buildUserPrompt(text: string, context?: { currentFile?: string }): string {
        let prompt = `Extrait les entités de ce texte:\n\n"${text}"`;
        
        // Detect existing wikilinks
        const existingEntities = this.extractExistingWikilinks(text);
        if (existingEntities.length > 0) {
            prompt += `\n\n⚠️ ENTITÉS EXISTANTES (ne pas recréer):\n`;
            existingEntities.forEach(entity => {
                prompt += `  - [[${entity}]] (existe déjà)\n`;
            });
        }
        
        if (context?.currentFile) {
            prompt += `\nContexte: Ce texte provient du fichier "${context.currentFile}"`;
        }

        return prompt;
    }

    /**
     * Extrait les entités d'un texte
     */
    async extractFromText(
        text: string,
        context?: { currentFile?: string; currentClass?: string }
    ): Promise<ExtractionResult> {
        console.log('\n🔍 ===== ENTITY EXTRACTION START =====');
        console.log('📝 Input text:', text);
        console.log('📋 Context:', context);
        
        try {
            // Charger les classes disponibles
            const classConfigs = await this.loadAvailableClasses();
            console.log('📦 Available classes:', classConfigs.map(c => c.className));
            
            if (classConfigs.length === 0) {
                console.error('❌ No classes available!');
                return {
                    entities: [],
                    error: 'Aucune classe disponible. Vérifiez la configuration des classes YAML.'
                };
            }

            // Construire les prompts
            const systemPrompt = this.buildSystemPrompt(classConfigs);
            const userPrompt = this.buildUserPrompt(text, context);
            
            console.log('📄 System prompt length:', systemPrompt.length);
            console.log('📄 User prompt:', userPrompt);

            // Appeler Ollama
            console.log('🤖 Calling Ollama API...');
            const response = await this.ollamaService.generateJSON<OllamaExtractionResponse>(
                userPrompt,
                systemPrompt
            );
            
            console.log('📥 Raw Ollama response:', JSON.stringify(response, null, 2));

            // Detect existing wikilinks to filter them out
            const existingWikilinks = this.extractExistingWikilinks(text);
            console.log('🔗 Existing wikilinks to exclude:', existingWikilinks);

            // Transformer la réponse en ExtractedEntity[]
            const entities: ExtractedEntity[] = response.entities
                .map((entity, i) => {
                    console.log(`\n📦 Entity ${i + 1}:`, {
                        type: entity.type,
                        confidence: entity.confidence,
                        data: entity.data
                    });
                    
                    return {
                        className: entity.type,
                        confidence: entity.confidence,
                        properties: entity.data,
                        rawText: text
                    };
                })
                .filter((entity) => {
                    // Filter out entities that match existing wikilinks
                    const entityName = entity.properties.nom || entity.properties.name;
                    if (entityName && existingWikilinks.includes(entityName)) {
                        console.log(`⚠️  Filtering out existing entity: ${entityName}`);
                        return false;
                    }
                    return true;
                });
            
            console.log('\n🎯 EXTRACTION SUMMARY:');
            console.log('  Total entities:', entities.length);
            entities.forEach((e, i) => {
                console.log(`  ${i + 1}. ${e.className} (confidence: ${e.confidence})`);
                console.log('     Properties:', Object.keys(e.properties));
            });
            console.log('🔍 ===== ENTITY EXTRACTION END =====\n');

            return {
                entities,
                rawResponse: JSON.stringify(response)
            };

        } catch (error) {
            console.error('❌ Error extracting entities:', error);
            console.error('   Stack:', error.stack);
            console.log('🔍 ===== ENTITY EXTRACTION END (ERROR) =====\n');
            return {
                entities: [],
                error: `Erreur lors de l'extraction: ${error.message}`
            };
        }
    }

    /**
     * Valide qu'une entité extraite est conforme à la config de sa classe
     */
    async validateEntity(entity: ExtractedEntity): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const factory = this.vault.getDynamicClassFactory();
        if (!factory) {
            return { valid: false, errors: ['No factory available'], warnings: [] };
        }

        const configManager = (factory as any).configManager;
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            const config: ClassConfig = await configManager.getClassConfig(entity.className);
            
            // Vérifier que les propriétés existent dans la config
            for (const [propKey, propValue] of Object.entries(entity.properties)) {
                if (!config.properties[propKey]) {
                    warnings.push(`Propriété "${propKey}" non définie dans la classe ${entity.className}`);
                }
            }

            // Vérifier les propriétés obligatoires (si définies)
            // Note: Vous pouvez étendre la config YAML pour définir des propriétés required

            return {
                valid: errors.length === 0,
                errors,
                warnings
            };

        } catch (error) {
            return {
                valid: false,
                errors: [`Impossible de valider: ${error.message}`],
                warnings
            };
        }
    }

    /**
     * Enrichit une entité extraite avec les propriétés manquantes
     * en posant des questions interactives (à implémenter dans le modal)
     */
    async enrichEntity(
        entity: ExtractedEntity,
        missingProperties: string[]
    ): Promise<ExtractedEntity> {
        // Cette méthode sera utilisée par le modal pour compléter l'entité
        // Pour l'instant, on retourne l'entité telle quelle
        return entity;
    }
}
