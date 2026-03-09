/**
 * Types for AI-powered entity extraction
 */

/**
 * Configuration d'une classe extraite du fichier YAML
 */
export interface ClassConfig {
    className: string;
    classIcon: string;
    properties: Record<string, PropertyConfig>;
    parent?: {
        property: string;
        folder: string;
    };
    parents?: Array<{
        property: string;
        folder: string;
    }>;
}

/**
 * Configuration d'une propriété
 */
export interface PropertyConfig {
    type: string;
    aliases?: string[];
    title?: string;
    tooltip?: string;
    icon?: string;
    options?: Array<{ name: string; color?: string }>;
    classes?: string[];
    properties?: Record<string, PropertyConfig>;
    unit?: string;
}

/**
 * Entité extraite du texte
 */
export interface ExtractedEntity {
    className: string;
    confidence: number; // 0-1
    properties: Record<string, any>;
    rawText?: string;
}

/**
 * Résultat de l'extraction
 */
export interface ExtractionResult {
    entities: ExtractedEntity[];
    rawResponse?: string;
    error?: string;
}

/**
 * Requête d'extraction
 */
export interface ExtractionRequest {
    text: string;
    availableClasses: ClassConfig[];
    context?: {
        currentFile?: string;
        currentClass?: string;
    };
}

/**
 * Options pour Ollama
 */
export interface OllamaOptions {
    url: string;
    model: string;
    temperature?: number;
}

/**
 * Réponse de l'API Ollama
 */
export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

/**
 * Réponse structurée attendue de Ollama pour l'extraction
 */
export interface OllamaExtractionResponse {
    entities: Array<{
        type: string; //ClassName
        confidence: number;
        data: Record<string, any>;
    }>;
    reasoning?: string;
}
