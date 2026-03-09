import { EntityExtractor } from '../../src/Services/IA/EntityExtractor';
import { OllamaService } from '../../src/Services/IA/OllamaService';
import { Vault } from 'markdown-crm';
import {
    ClassConfig,
    ExtractedEntity,
    OllamaExtractionResponse
} from '../../src/Services/IA/types';

describe('EntityExtractor', () => {
    let entityExtractor: EntityExtractor;
    let mockOllamaService: jest.Mocked<OllamaService>;
    let mockVault: jest.Mocked<Vault>;

    const mockClassConfig: ClassConfig = {
        className: 'Personne',
        classIcon: 'user',
        properties: {
            nom: {
                type: 'Property',
                aliases: ['Nom', 'Name']
            },
            email: {
                type: 'EmailProperty',
                aliases: ['Email']
            },
            telephone: {
                type: 'PhoneProperty',
                aliases: ['Téléphone', 'Phone']
            }
        }
    };

    const mockInstitutionConfig: ClassConfig = {
        className: 'Institution',
        classIcon: 'building',
        properties: {
            nom: {
                type: 'Property',
                aliases: ['Nom']
            },
            type: {
                type: 'SelectProperty',
                aliases: ['Type'],
                options: [
                    { name: 'Entreprise' },
                    { name: 'Association' },
                    { name: 'Collectivité' }
                ]
            }
        }
    };

    beforeEach(() => {
        // Mock OllamaService
        mockOllamaService = {
            generateJSON: jest.fn(),
            isAvailable: jest.fn(),
            listModels: jest.fn(),
            generate: jest.fn(),
            testConnection: jest.fn(),
            updateOptions: jest.fn()
        } as any;

        // Mock Vault
        const mockConfigManager = {
            getClassConfig: jest.fn().mockImplementation((className: string) => {
                if (className === 'Personne') return Promise.resolve(mockClassConfig);
                if (className === 'Institution') return Promise.resolve(mockInstitutionConfig);
                throw new Error(`Unknown class: ${className}`);
            }),
            configs: {
                'Personne': mockClassConfig,
                'Institution': mockInstitutionConfig
            }
        };

        const mockFactory = {
            configManager: mockConfigManager
        };

        mockVault = {
            getDynamicClassFactory: jest.fn().mockReturnValue(mockFactory)
        } as any;

        entityExtractor = new EntityExtractor(mockOllamaService, mockVault, ['Personne', 'Institution']);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create EntityExtractor instance', () => {
            expect(entityExtractor).toBeDefined();
            expect(entityExtractor).toBeInstanceOf(EntityExtractor);
        });

        it('should accept class names in constructor', () => {
            const extractor = new EntityExtractor(mockOllamaService, mockVault, ['TestClass']);
            expect(extractor).toBeDefined();
        });
    });

    describe('setAvailableClassNames', () => {
        it('should update available class names', () => {
            entityExtractor.setAvailableClassNames(['NewClass1', 'NewClass2']);
            // Can't test directly but at least verify it doesn't throw
            expect(entityExtractor).toBeDefined();
        });
    });

    describe('loadAvailableClasses', () => {
        it('should load all available class configurations', async () => {
            const classes = await entityExtractor.loadAvailableClasses();
            
            expect(classes).toHaveLength(2);
            expect(classes[0].className).toBe('Personne');
            expect(classes[1].className).toBe('Institution');
        });

        it('should return empty array when no factory available', async () => {
            mockVault.getDynamicClassFactory.mockReturnValue(null);
            
            const classes = await entityExtractor.loadAvailableClasses();
            expect(classes).toEqual([]);
        });

        it('should handle errors when loading class configs', async () => {
            const factory = mockVault.getDynamicClassFactory();
            (factory as any).configManager.getClassConfig.mockRejectedValue(
                new Error('Config not found')
            );

            const classes = await entityExtractor.loadAvailableClasses();
            // Should return empty array but not throw
            expect(classes).toEqual([]);
        });
    });

    describe('extractFromText', () => {
        const mockExtractionResponse: OllamaExtractionResponse = {
            entities: [
                {
                    type: 'Personne',
                    confidence: 0.95,
                    data: {
                        nom: 'Marie Le Moine',
                        telephone: '+33102040552',
                        email: 'marie@example.com'
                    }
                },
                {
                    type: 'Institution',
                    confidence: 0.85,
                    data: {
                        nom: 'Mairie de Saint Marcel',
                        type: 'Collectivité'
                    }
                }
            ],
            reasoning: 'Detected person with contact at institution'
        };

        it('should extract entities from text successfully', async () => {
            mockOllamaService.generateJSON.mockResolvedValue(mockExtractionResponse);

            const text = '10/02 Appelé Marie Le Moine, de la mairie de Saint Marcel, me recontacte la semaine prochaine : 01.02.04.05.52';
            const result = await entityExtractor.extractFromText(text);

            expect(result.entities).toHaveLength(2);
            expect(result.entities[0].className).toBe('Personne');
            expect(result.entities[0].properties.nom).toBe('Marie Le Moine');
            expect(result.entities[0].confidence).toBe(0.95);
            expect(result.entities[1].className).toBe('Institution');
            expect(result.error).toBeUndefined();
        });

        it('should include context in extraction', async () => {
            mockOllamaService.generateJSON.mockResolvedValue(mockExtractionResponse);

            const text = 'Test text';
            await entityExtractor.extractFromText(text, {
                currentFile: 'test.md',
                currentClass: 'Personne'
            });

            expect(mockOllamaService.generateJSON).toHaveBeenCalled();
            const callArgs = mockOllamaService.generateJSON.mock.calls[0];
            expect(callArgs[0]).toContain('test.md');
        });

        it('should return error when no classes available', async () => {
            // Create a new extractor with no class names
            const emptyExtractor = new EntityExtractor(mockOllamaService, mockVault, []);

            const result = await emptyExtractor.extractFromText('test');

            expect(result.entities).toEqual([]);
            expect(result.error).toContain('Aucune classe disponible');
        });

        it('should handle extraction errors gracefully', async () => {
            mockOllamaService.generateJSON.mockRejectedValue(
                new Error('Ollama connection failed')
            );

            const result = await entityExtractor.extractFromText('test');

            expect(result.entities).toEqual([]);
            expect(result.error).toContain('Erreur');
        });

        it('should preserve raw text in extracted entities', async () => {
            mockOllamaService.generateJSON.mockResolvedValue(mockExtractionResponse);

            const text = 'Original text';
            const result = await entityExtractor.extractFromText(text);

            expect(result.entities[0].rawText).toBe(text);
            expect(result.entities[1].rawText).toBe(text);
        });
    });

    describe('validateEntity', () => {
        const validEntity: ExtractedEntity = {
            className: 'Personne',
            confidence: 0.9,
            properties: {
                nom: 'John Doe',
                email: 'john@example.com'
            }
        };

        it('should validate entity with correct properties', async () => {
            const result = await entityExtractor.validateEntity(validEntity);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should warn about undefined properties', async () => {
            const entityWithExtra: ExtractedEntity = {
                className: 'Personne',
                confidence: 0.9,
                properties: {
                    nom: 'John Doe',
                    unknownProp: 'value'
                }
            };

            const result = await entityExtractor.validateEntity(entityWithExtra);

            expect(result.valid).toBe(true); // Still valid, just warnings
            expect(result.warnings).toContainEqual(
                expect.stringContaining('unknownProp')
            );
        });

        it('should return error when no factory available', async () => {
            mockVault.getDynamicClassFactory.mockReturnValue(null);

            const result = await entityExtractor.validateEntity(validEntity);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('No factory available');
        });

        it('should handle config loading errors', async () => {
            const factory = mockVault.getDynamicClassFactory();
            (factory as any).configManager.getClassConfig.mockRejectedValue(
                new Error('Class not found')
            );

            const result = await entityExtractor.validateEntity(validEntity);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('enrichEntity', () => {
        it('should return entity unchanged (placeholder implementation)', async () => {
            const entity: ExtractedEntity = {
                className: 'Personne',
                confidence: 0.9,
                properties: { nom: 'Test' }
            };

            const result = await entityExtractor.enrichEntity(entity, ['email']);

            expect(result).toEqual(entity);
        });
    });
});
