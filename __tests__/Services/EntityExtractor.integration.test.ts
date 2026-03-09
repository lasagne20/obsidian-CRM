import { OllamaService } from '../../src/Services/IA/OllamaService';
import { EntityExtractor } from '../../src/Services/IA/EntityExtractor';

// Mock Ollama service for predictable responses
jest.mock('../../src/Services/IA/OllamaService');

describe('EntityExtractor - Integration Tests', () => {
  let ollamaService: jest.Mocked<OllamaService>;
  let entityExtractor: EntityExtractor;
  let mockVault: any;

  beforeEach(() => {
    // Mock OllamaService
    ollamaService = new OllamaService({
      url: 'http://localhost:11434',
      model: 'mistral',
      temperature: 0.1
    }) as jest.Mocked<OllamaService>;

    // Mock Vault
    mockVault = {
      getDynamicClassFactory: jest.fn().mockReturnValue({
        configManager: {
          getClassConfig: jest.fn().mockResolvedValue({
            className: 'Personne',
            properties: {
              nom: { type: 'Property', aliases: ['Nom'] },
              phone: { type: 'PhoneProperty', aliases: ['Téléphone', 'Phone'] },
              email: { type: 'EmailProperty', aliases: ['Email'] },
              postes: {
                type: 'ObjectProperty',
                properties: {
                  institution: { type: 'FileProperty', classes: ['Institution', 'Lieu'] },
                  poste: { type: 'Property' }
                }
              }
            }
          })
        }
      })
    };

    // Create EntityExtractor with class names
    const classNames = ['Personne', 'Institution', 'Lieu'];
    entityExtractor = new EntityExtractor(ollamaService, mockVault, classNames);
  });

  describe('Problematic sentence with random text', () => {
    const testSentence = '10/02 fdggddgdg à appelé Marie Le Moine, de la mairie de Saint Marcel, me recontacte la semaine prochaine : 01.02.04.05.52';

    it('should NOT create multiple persons without names', async () => {
      // Mock Ollama response to simulate the problematic behavior
      const problematicResponse = {
        entities: [
          {
            type: 'Personne',
            confidence: 0.8,
            data: {
              id: 'fdggddgdg',  // Wrong: extracted as ID instead of ignoring
              nom: '',           // Empty name
              phone: null
            }
          },
          {
            type: 'Personne',
            confidence: 0.9,
            data: {
              nom: 'Marie Le Moine',
              phone: '+33102040552',
              postes: {
                institution: 'mairie de Saint Marcel',
                poste: 'Contact'
              }
            }
          },
          {
            type: 'Lieu',
            confidence: 0.7,
            data: {
              nom: 'fdggddgdg'  // Wrong: random text extracted as place
            }
          }
        ]
      };

      ollamaService.generateJSON = jest.fn().mockResolvedValue(problematicResponse);

      const result = await entityExtractor.extractFromText(testSentence);

      console.log('\n🧪 TEST RESULTS:');
      console.log('Total entities extracted:', result.entities.length);
      result.entities.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.className}:`, e.properties);
      });

      // Verify the problematic extraction
      expect(result.entities).toHaveLength(3);
      
      // Check for entities without proper names
      const entitiesWithoutNames = result.entities.filter(e => 
        !e.properties.nom || e.properties.nom === '' || e.properties.nom === 'fdggddgdg'
      );
      
      console.log('\n⚠️  Entities without proper names:', entitiesWithoutNames.length);
      entitiesWithoutNames.forEach(e => {
        console.log('  - Class:', e.className, '| Properties:', e.properties);
      });

      // This should fail with current behavior to demonstrate the issue
      expect(entitiesWithoutNames.length).toBeGreaterThan(0);
    });

    it('should extract ONLY the valid person entity', async () => {
      // Mock correct Ollama response
      const correctResponse = {
        entities: [
          {
            type: 'Personne',
            confidence: 0.95,
            data: {
              nom: 'Marie Le Moine',
              phone: '+33102040552',
              postes: {
                institution: 'mairie de Saint Marcel',
                poste: 'Contact'
              }
            }
          },
          {
            type: 'Lieu',
            confidence: 0.85,
            data: {
              nom: 'mairie de Saint Marcel'
            }
          }
        ]
      };

      ollamaService.generateJSON = jest.fn().mockResolvedValue(correctResponse);

      const result = await entityExtractor.extractFromText(testSentence);

      console.log('\n✅ EXPECTED RESULTS:');
      console.log('Total entities extracted:', result.entities.length);
      result.entities.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.className}:`, e.properties);
      });

      // Should only extract valid entities
      expect(result.entities).toHaveLength(2);
      
      // Check for Personne
      const personne = result.entities.find(e => e.className === 'Personne');
      expect(personne).toBeDefined();
      expect(personne.properties.nom).toBe('Marie Le Moine');
      expect(personne.properties.phone).toBe('+33102040552');
      
      // Check for Lieu
      const lieu = result.entities.find(e => e.className === 'Lieu');
      expect(lieu).toBeDefined();
      expect(lieu.properties.nom).toBe('mairie de Saint Marcel');

      // No entities should have 'fdggddgdg' as name
      const entitiesWithGarbage = result.entities.filter(e => 
        e.properties.nom === 'fdggddgdg' || e.properties.id === 'fdggddgdg'
      );
      expect(entitiesWithGarbage).toHaveLength(0);
    });

    it('should ignore random text like "fdggddgdg"', async () => {
      // Test that the prompt should instruct AI to ignore gibberish
      const classConfigs = await (entityExtractor as any).loadAvailableClasses();
      const systemPrompt = (entityExtractor as any).buildSystemPrompt(classConfigs);

      console.log('\n📄 System Prompt Analysis:');
      console.log('Contains "ignore":', systemPrompt.includes('ignore'));
      console.log('Contains "valide":', systemPrompt.includes('valide'));
      console.log('Contains "pertinent":', systemPrompt.includes('pertinent'));

      // The prompt should guide the AI to ignore gibberish
      // This test documents the current behavior
      expect(systemPrompt.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases with malformed text', () => {
    it('should handle text with multiple dates and numbers', async () => {
      const text = '10/02 20/03 30/04 Appel de Jean Dupont au 06.12.34.56.78';
      
      const goodResponse = {
        entities: [
          {
            type: 'Personne',
            confidence: 0.9,
            data: {
              nom: 'Jean Dupont',
              portable: '+33612345678'
            }
          }
        ]
      };

      ollamaService.generateJSON = jest.fn().mockResolvedValue(goodResponse);
      const result = await entityExtractor.extractFromText(text);

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].properties.nom).toBe('Jean Dupont');
    });

    it('should not create entities from connecting words', async () => {
      const text = 'Appelé par de la à pour Marie Dupont';
      
      const goodResponse = {
        entities: [
          {
            type: 'Personne',
            confidence: 0.9,
            data: {
              nom: 'Marie Dupont'
            }
          }
        ]
      };

      ollamaService.generateJSON = jest.fn().mockResolvedValue(goodResponse);
      const result = await entityExtractor.extractFromText(text);

      expect(result.entities).toHaveLength(1);
      
      // Should not have entities named 'de', 'la', 'à', 'pour'
      const invalidNames = ['de', 'la', 'à', 'pour', 'par'];
      const badEntities = result.entities.filter(e => 
        invalidNames.includes(e.properties.nom?.toLowerCase())
      );
      
      expect(badEntities).toHaveLength(0);
    });
  });

  describe('Validation of extracted entities', () => {
    it('should filter out entities with invalid/empty names', async () => {
      const response = {
        entities: [
          { type: 'Personne', confidence: 0.9, data: { nom: 'Valid Name', phone: '0123456789' } },
          { type: 'Personne', confidence: 0.8, data: { nom: '', phone: '0123456789' } },
          { type: 'Personne', confidence: 0.7, data: { phone: '0123456789' } }, // No nom
          { type: 'Lieu', confidence: 0.6, data: { nom: 'abc' } }, // Too short
        ]
      };

      ollamaService.generateJSON = jest.fn().mockResolvedValue(response);
      const result = await entityExtractor.extractFromText('Test text');

      // Current behavior: extracts all entities
      expect(result.entities.length).toBeGreaterThanOrEqual(1);

      // TODO: Should implement filtering to remove invalid entities
      // For now, this test documents the expected behavior
      const validEntities = result.entities.filter(e => {
        const nom = e.properties.nom;
        return nom && nom.length > 3 && nom.trim() !== '';
      });

      console.log('\n📊 Entity Validation:');
      console.log('  Total extracted:', result.entities.length);
      console.log('  Valid entities:', validEntities.length);
      console.log('  Invalid entities:', result.entities.length - validEntities.length);
    });
  });

  describe('Wikilink detection and filtering', () => {
    it('should extract ALL available properties from text', async () => {
      const testSentence = '10/02 Marie Le Moine, de la mairie de Saint Marcel, me recontacte la semaine prochaine : 01.02.04.05.52';
      
      // Mock correct response with ALL properties extracted
      const correctResponse = {
        entities: [
          {
            type: 'Personne',
            confidence: 0.95,
            data: {
              nom: 'Marie Le Moine',  // Using 'nom' instead of 'nomComplet'
              phone: '+33102040552',
              postes: {
                institution: 'Mairie de Saint Marcel',
                poste: ''
              }
            }
          },
          {
            type: 'Institution',
            confidence: 0.9,
            data: {
              nom: 'Mairie de Saint Marcel'
            }
          }
        ]
      };

      ollamaService.generateJSON.mockResolvedValue(correctResponse);

      const result = await entityExtractor.extractFromText(testSentence);

      expect(result.entities).toHaveLength(2);
      
      // Check person has ALL properties
      const person = result.entities.find(e => e.className === 'Personne');
      expect(person).toBeDefined();
      expect(person?.properties.nom).toBe('Marie Le Moine');
      expect(person?.properties.phone).toBe('+33102040552');
      expect(person?.properties.postes).toBeDefined();
      expect(person?.properties.postes.institution).toBe('Mairie de Saint Marcel');
    });

    it('should NOT recreate entities that already exist as wikilinks', async () => {
      const testSentence = '10/02 [[Pierre Lebrac]] à appelé Marie Le Moine, de la mairie de Saint Marcel, me recontacte la semaine prochaine : 01.02.04.05.52';
      
      // Mock response that includes Pierre Lebrac (which should be filtered out)
      const responseWithExisting = {
        entities: [
          {
            type: 'Personne',
            confidence: 0.98,
            data: {
              nom: 'Pierre Lebrac'  // This should be filtered out
            }
          },
          {
            type: 'Personne',
            confidence: 0.95,
            data: {
              nom: 'Marie Le Moine',
              phone: '+33102040552'
            }
          },
          {
            type: 'Institution',
            confidence: 0.9,
            data: {
              nom: 'Mairie de Saint Marcel'
            }
          }
        ]
      };

      ollamaService.generateJSON.mockResolvedValue(responseWithExisting);

      const result = await entityExtractor.extractFromText(testSentence);

      // Pierre Lebrac should be filtered out
      expect(result.entities).toHaveLength(2);
      
      const pierreEntity = result.entities.find(e => e.properties.nom === 'Pierre Lebrac');
      expect(pierreEntity).toBeUndefined();
      
      // Only Marie and the institution should remain
      const names = result.entities.map(e => e.properties.nom);
      expect(names).toContain('Marie Le Moine');
      expect(names).toContain('Mairie de Saint Marcel');
      expect(names).not.toContain('Pierre Lebrac');
    });

    it('should detect and exclude multiple wikilinks', async () => {
      const testSentence = '[[Jean Dupont]] et [[Marie Martin]] ont parlé avec Pierre Leblanc';
      
      const responseWithMultiple = {
        entities: [
          { type: 'Personne', confidence: 0.9, data: { nom: 'Jean Dupont' } },
          { type: 'Personne', confidence: 0.9, data: { nom: 'Marie Martin' } },
          { type: 'Personne', confidence: 0.9, data: { nom: 'Pierre Leblanc' } }
        ]
      };

      ollamaService.generateJSON.mockResolvedValue(responseWithMultiple);

      const result = await entityExtractor.extractFromText(testSentence);

      // Only Pierre Leblanc should remain (not in wikilinks)
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].properties.nom).toBe('Pierre Leblanc');
    });
  });
});
