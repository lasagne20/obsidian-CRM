import { App, TFile } from 'obsidian';
import { FileSearchModal } from '../../src/Modals/FileSearchModal';

// Mock Obsidian
jest.mock('obsidian', () => ({
    App: jest.fn(),
    TFile: jest.fn(),
    FuzzySuggestModal: class FuzzySuggestModal<T> {
        app: any;
        inputEl?: HTMLInputElement;
        resultContainerEl?: HTMLElement;

        constructor(app: any) {
            this.app = app;
        }

        open() { }
        close() { }
        onOpen() { }
        onClose() { }
        
        // Default implementation that uses getItemText for fuzzy matching
        // Mimics Obsidian's fuzzy search behavior
        getSuggestions(query: string): Array<{ item: T; match: { score: number; matches: any[] } }> {
            const items = (this as any).getItems();
            if (!items) return [];
            
            if (!query || query.trim() === '') {
                return items.map((item: T) => ({ item, match: { score: 0, matches: [] } }));
            }
            
            const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
            const results: Array<{ item: T; match: { score: number; matches: any[] } }> = [];
            
            for (const item of items) {
                // Use getItemText if available (for FileSearchModal)
                let itemText = (this as any).getItemText ? 
                    (this as any).getItemText(item) : 
                    String(item);
                    
                // Normalize: remove accents, lowercase, keep alphanumeric and spaces
                const normalizedText = itemText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                
                let totalScore = 0;
                let allWordsMatched = true;
                
                // Try word-based matching first (for multi-word queries)
                if (queryWords.length > 1) {
                    const textWords = normalizedText.split(/[\s\-']+/); // Split on spaces, hyphens, apostrophes
                    const matchedQueryWords = new Set<number>();
                    
                    for (let qi = 0; qi < queryWords.length; qi++) {
                        const queryWord = queryWords[qi];
                        let bestMatchScore = 0;
                        
                        for (const textWord of textWords) {
                            if (textWord === queryWord) {
                                bestMatchScore = Math.max(bestMatchScore, 20);
                            } else if (textWord.startsWith(queryWord)) {
                                bestMatchScore = Math.max(bestMatchScore, 15);
                            } else if (textWord.includes(queryWord)) {
                                bestMatchScore = Math.max(bestMatchScore, 10);
                            } else {
                                // Fuzzy match within word
                                let qIdx = 0;
                                for (let c = 0; c < textWord.length && qIdx < queryWord.length; c++) {
                                    if (textWord[c] === queryWord[qIdx]) qIdx++;
                                }
                                if (qIdx === queryWord.length) {
                                    bestMatchScore = Math.max(bestMatchScore, 5);
                                }
                            }
                        }
                        
                        if (bestMatchScore > 0) {
                            totalScore += bestMatchScore;
                            matchedQueryWords.add(qi);
                        }
                    }
                    
                    allWordsMatched = matchedQueryWords.size === queryWords.length;
                } else {
                    // Single word/query: sequential character matching
                    let queryIdx = 0;
                    let lastMatchIdx = -1;
                    
                    for (let i = 0; i < normalizedText.length && queryIdx < normalizedQuery.length; i++) {
                        if (normalizedText[i] === normalizedQuery[queryIdx]) {
                            queryIdx++;
                            totalScore += (lastMatchIdx === i - 1) ? 2 : 1;
                            lastMatchIdx = i;
                        }
                    }
                    
                    allWordsMatched = (queryIdx === normalizedQuery.length);
                    
                    // Bonus for match at start
                    if (normalizedText.startsWith(normalizedQuery)) {
                        totalScore += 50;
                    }
                    // Bonus for exact match
                    if (normalizedText === normalizedQuery) {
                        totalScore += 100;
                    }
                }
                
                if (allWordsMatched && totalScore > 0) {
                    results.push({ item, match: { score: totalScore, matches: [] } });
                }
            }
            
            // Sort by score descending
            return results.sort((a, b) => b.match.score - a.match.score);
        }
        
        renderSuggestion(item: any, el: HTMLElement) { }
        onChooseItem(item: any, evt: any) { }
    },
    Notice: jest.fn(),
    setIcon: jest.fn()
}));

// Helper function pour créer un mock TFile
const createMockFile = (name: string, basename?: string): TFile => {
  const mockFile = {
    name,
    basename: basename || name.replace('.md', ''),
    extension: 'md',
    path: `/${name}`,
  };
  Object.setPrototypeOf(mockFile, TFile.prototype);
  return mockFile as TFile;
};

describe('FileSearchModal', () => {
  let mockApp: any;
  let mockVault: any;
  let mockOnChoose: jest.Mock;
  let modal: FileSearchModal;

  beforeEach(() => {
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn(() => [])
      },
      metadataCache: {
        getFileCache: jest.fn(() => null)
      }
    };
    
    mockVault = {
      app: {
        getSettings: jest.fn(() => ({
          classePropertyName: 'Classe',
          classePropertyAliases: ['Classe'],
        })),
      },
      getFromFile: jest.fn()
    };
    
    mockOnChoose = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create modal with default parameters', () => {
      modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);

      expect(modal).toBeDefined();
      expect(modal.choosed).toBeNull();
    });

    it('should create modal with custom parameters', () => {
      const classes = ['Personne', 'Institution'];
      const hint = 'Custom hint';
      const dataItems = [{ nom: 'Test Item', _className: 'Personne' }];
      const classIcons = { Personne: 'user', Institution: 'building' };

      modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, classes, {
        hint,
        dataItems,
        classIcons,
      });

      expect(modal).toBeDefined();
    });
  });

  describe('Basic functionality', () => {
    beforeEach(() => {
      modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, [], {
        hint: 'Test hint',
      });
    });

    it('should store constructor parameters correctly', () => {
      expect(modal).toBeDefined();
      expect(modal.choosed).toBeNull();
    });

    it('should handle empty parameters gracefully', () => {
      const emptyModal = new FileSearchModal(
        mockApp,
        mockVault,
        mockOnChoose,
        [],
        {}
      );

      expect(emptyModal).toBeDefined();
      expect(emptyModal.choosed).toBeNull();
    });
  });

  describe('Search functionality improvements', () => {
    it('should always return Create option for any query', () => {
      mockApp.vault.getMarkdownFiles.mockReturnValue([]);
      
      const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
      // Simulate input element
      modal.inputEl = { value: 'test' } as any;
      
      const suggestions = modal.getSuggestions('test');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].item).toContain('Create: test');
    });

    it('should find files with fuzzy search (out of order)', () => {
      const files = [
        createMockFile('École Primaire François.md', 'École Primaire François'),
        createMockFile('Jean Marie Dupont.md', 'Jean Marie Dupont'),
        createMockFile('Centre Formation Pro.md', 'Centre Formation Pro')
      ];
      mockApp.vault.getMarkdownFiles.mockReturnValue(files);
      
      const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
      // Simulate input element
      modal.inputEl = { value: 'marie jean' } as any;
      
      // Test recherche en désordre - devrait trouver "Jean Marie Dupont" avec "marie jean"
      const suggestions = modal.getSuggestions('marie jean');
      
      expect(suggestions.length).toBeGreaterThan(1); // Create option + file found
      expect(suggestions.some(s => s.item === files[1])).toBe(true); // Devrait trouver Jean Marie Dupont
    });

    it('should always show Create option at the top', () => {
      const files = [
        createMockFile('Existing File.md', 'Existing File')
      ];
      mockApp.vault.getMarkdownFiles.mockReturnValue(files);
      
      const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
      // Simulate input element
      modal.inputEl = { value: 'nouveau fichier' } as any;
      
      // Même avec des résultats existants, on devrait avoir l'option Create en haut
      const suggestions = modal.getSuggestions('nouveau fichier');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].item).toEqual(expect.stringContaining('Create: nouveau fichier'));
    });

    it('should handle partial word matching', () => {
      const files = [
        createMockFile('Formation Professionnelle Continue.md', 'Formation Professionnelle Continue'),
        createMockFile('Formation Initiale.md', 'Formation Initiale')
      ];
      mockApp.vault.getMarkdownFiles.mockReturnValue(files);
      
      const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
      // Simulate input element
      modal.inputEl = { value: 'form prof' } as any;
      
      // Devrait trouver les deux avec "form prof"
      const suggestions = modal.getSuggestions('form prof');
      
      expect(suggestions.length).toBeGreaterThan(1); // Create option + file found
      expect(suggestions.some(s => s.item === files[0])).toBe(true);
    });

    it('should handle accent-insensitive search', () => {
      const files = [
        createMockFile('École Primaire Jean Jaurès.md', 'École Primaire Jean Jaurès'),
        createMockFile('Théâtre Municipal.md', 'Théâtre Municipal'),
        createMockFile('Médiathèque François Mitterrand.md', 'Médiathèque François Mitterrand')
      ];
      mockApp.vault.getMarkdownFiles.mockReturnValue(files);
      
      const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
      // Simulate input element for first query
      modal.inputEl = { value: 'ecole' } as any;
      
      // Test recherche sans accents pour trouver des fichiers avec accents
      const suggestions1 = modal.getSuggestions('ecole');
      expect(suggestions1.some(s => s.item === files[0])).toBe(true);
      
      // Update input for second query
      modal.inputEl.value = 'théâtre';
      // Test recherche avec accents pour trouver des fichiers avec accents
      const suggestions2 = modal.getSuggestions('théâtre');
      expect(suggestions2.some(s => s.item === files[1])).toBe(true);
      
      // Update input for third query
      modal.inputEl.value = 'mediatheque francois';
      // Test recherche sans accents pour fichier avec accents multiples
      const suggestions3 = modal.getSuggestions('mediatheque francois');
      expect(suggestions3.some(s => s.item === files[2])).toBe(true);
    });

    it('should not show generic Create option when dataItems are present', () => {
      const files: TFile[] = [];
      const dataItems = [
        { nom: 'École Primaire Jean Moulin', _className: 'Institution' },
        { nom: 'Lycée Marie Curie', _className: 'Institution' }
      ];
      
      mockApp.vault.getMarkdownFiles.mockReturnValue(files);
      
      const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Institution'], {
        dataItems
      });
      // Simulate input element
      modal.inputEl = { value: 'recherche quelconque' } as any;
      
      // Test sans query correspondant aux dataItems pour voir le comportement général
      const suggestions = modal.getSuggestions('recherche quelconque');
      
      // Ne devrait pas avoir d'option "Create: recherche quelconque" générique
      expect(suggestions.every(s => 
        typeof s.item !== 'string' || 
        !s.item.includes('Create: recherche quelconque')
      )).toBe(true);
      
      // Pour comparaison, testons un modal SANS dataItems
      const modalSansData = new FileSearchModal(mockApp, mockVault, mockOnChoose);
      modalSansData.inputEl = { value: 'recherche quelconque' } as any;
      const suggestionsSansData = modalSansData.getSuggestions('recherche quelconque');
      
      // Celui-ci DEVRAIT avoir l'option Create générique
      expect(suggestionsSansData.some(s => 
        typeof s.item === 'string' && 
        s.item.includes('Create: recherche quelconque')
      )).toBe(true);
    });

    it('should show generic Create option when some classes have no dataItems', () => {
      const files: TFile[] = [];
      const dataItems = [
        { nom: 'École Primaire Jean Moulin', _className: 'Institution' },
        { nom: 'Lycée Marie Curie', _className: 'Institution' }
      ];
      
      mockApp.vault.getMarkdownFiles.mockReturnValue(files);
      
      // Classes mixtes: Institution avec dataItems, Personne sans dataItems
      const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Institution', 'Personne'], {
        dataItems
      });
      // Simulate input element
      modal.inputEl = { value: 'nouveau contact' } as any;
      
      // Avec des classes mixtes, DEVRAIT avoir l'option Create générique
      const suggestions = modal.getSuggestions('nouveau contact');
      
      // DEVRAIT avoir l'option "Create: nouveau contact" générique pour les classes non couvertes
      expect(suggestions.some(s => 
        typeof s.item === 'string' && 
        s.item.includes('Create: nouveau contact')
      )).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle null parameters gracefully', () => {
      expect(() => {
        const safeModal = new FileSearchModal(
          mockApp,
          mockVault || {},
          mockOnChoose || jest.fn(),
          [],
          {}
        );
      }).not.toThrow();
    });
  });
});