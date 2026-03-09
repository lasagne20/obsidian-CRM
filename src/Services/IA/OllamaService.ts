import { Notice } from 'obsidian';
import { OllamaOptions, OllamaResponse } from './types';

/**
 * Service pour communiquer avec l'API Ollama
 */
export class OllamaService {
    private options: OllamaOptions;

    constructor(options: OllamaOptions) {
        this.options = options;
    }

    /**
     * Met à jour les options de configuration
     */
    updateOptions(options: Partial<OllamaOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Vérifie si Ollama est accessible
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.options.url}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response.ok;
        } catch (error) {
            console.error('Ollama is not available:', error);
            return false;
        }
    }

    /**
     * Liste les modèles disponibles
     */
    async listModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.options.url}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.models?.map((m: any) => m.name) || [];
        } catch (error) {
            console.error('Error listing models:', error);
            throw new Error(`Impossible de lister les modèles: ${error.message}`);
        }
    }

    /**
     * Génère une complétion avec Ollama
     */
    async generate(prompt: string, systemPrompt?: string): Promise<OllamaResponse> {
        const available = await this.isAvailable();
        if (!available) {
            throw new Error(
                `Ollama n'est pas accessible à ${this.options.url}. Vérifiez qu'Ollama est bien lancé.`
            );
        }

        try {
            const requestBody: any = {
                model: this.options.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: this.options.temperature ?? 0.1,
                },
            };

            if (systemPrompt) {
                requestBody.system = systemPrompt;
            }

            const response = await fetch(`${this.options.url}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data: OllamaResponse = await response.json();
            return data;
        } catch (error) {
            console.error('Error calling Ollama:', error);
            throw new Error(`Erreur lors de l'appel à Ollama: ${error.message}`);
        }
    }

    /**
     * Génère une réponse structurée en JSON
     */
    async generateJSON<T = any>(prompt: string, systemPrompt?: string): Promise<T> {
        const response = await this.generate(prompt, systemPrompt);
        
        try {
            // Extraire le JSON de la réponse
            const jsonMatch = response.response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('No JSON found in response:', response.response);
                throw new Error('Aucun JSON trouvé dans la réponse');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            return parsed as T;
        } catch (error) {
            console.error('Error parsing JSON response:', error);
            console.error('Raw response:', response.response);
            throw new Error(`Erreur lors du parsing JSON: ${error.message}`);
        }
    }

    /**
     * Test de connexion avec notification
     */
    async testConnection(): Promise<void> {
        const notice = new Notice('🔄 Test de connexion à Ollama...', 0);
        
        try {
            const available = await this.isAvailable();
            
            if (!available) {
                notice.hide();
                new Notice(`❌ Ollama n'est pas accessible à ${this.options.url}`, 5000);
                return;
            }

            const models = await this.listModels();
            const modelExists = models.includes(this.options.model);

            notice.hide();

            if (!modelExists) {
                new Notice(
                    `⚠️ Le modèle "${this.options.model}" n'est pas installé. Modèles disponibles: ${models.join(', ')}`,
                    8000
                );
            } else {
                new Notice(
                    `✅ Ollama connecté ! Modèle "${this.options.model}" prêt.`,
                    3000
                );
            }
        } catch (error) {
            notice.hide();
            new Notice(`❌ Erreur: ${error.message}`, 5000);
        }
    }
}
