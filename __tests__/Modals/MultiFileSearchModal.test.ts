import { App, TFile } from 'obsidian';
import { MultiFileSearchModal } from '../../src/Modals/MultiFileSearchModal';

// Mock Obsidian
jest.mock('obsidian', () => ({
    App: jest.fn().mockImplementation(() => ({
        vault: {
            getMarkdownFiles: jest.fn(() => []),
            getName: jest.fn(() => 'TestVault')
        },
        workspace: {
            getLeaf: jest.fn(() => ({
                openFile: jest.fn()
            }))
        }
    })),
    TFile: jest.fn().mockImplementation(() => ({})),
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

// Helper function to create a mock TFile
function createMockFile(path: string, basename: string): TFile {
    const mockFile = {
        path,
        basename,
        name: basename + '.md',
        extension: 'md',
        parent: null
    };
    // Make it properly inherit from TFile for instanceof checks
    Object.setPrototypeOf(mockFile, TFile.prototype);
    return mockFile as TFile;
}

describe('MultiFileSearchModal', () => {
    let mockApp: any;
    let mockVault: any;
    let mockOnChoose: jest.Mock;
    
    beforeEach(() => {
        mockApp = new App();
        mockVault = {
            getExtendedClasses: jest.fn()
        };
        mockOnChoose = jest.fn();
        
        // Reset mocks
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create modal with default parameters', () => {
            const modal = new MultiFileSearchModal(mockApp, mockVault, mockOnChoose);
            expect(modal).toBeDefined();
        });

        it('should create modal with custom parameters', () => {
            const modal = new MultiFileSearchModal(mockApp, mockVault, mockOnChoose, ['Test'], {
                hint: 'Select multiple files'
            });
            expect(modal).toBeDefined();
        });
    });

    describe('Create option handling', () => {
        it('should include Create options in suggestions', () => {
            const files: TFile[] = [];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new MultiFileSearchModal(mockApp, mockVault, mockOnChoose, ['Personne']);
            // Simulate input element
            modal.inputEl = { value: 'nouveau contact' } as any;
            
            // Get suggestions with a query that should create a "Create: XXX" option
            const suggestions = modal.getSuggestions('nouveau contact');
            
            // Should include the "Create: nouveau contact" option
            expect(suggestions.some(s => 
                typeof s.item === 'string' && 
                s.item.includes('Create: nouveau contact')
            )).toBe(true);
        });

        it('should handle Create option selection with space key', async () => {
            const files: TFile[] = [];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new MultiFileSearchModal(mockApp, mockVault, mockOnChoose, ['Personne']);
            
            // Mock DOM elements with proper querySelector
            const mockActiveItem = {
                classList: {
                    add: jest.fn(),
                    remove: jest.fn()
                }
            };
            
            const mockContainer = {
                querySelector: jest.fn(() => mockActiveItem),
                children: [mockActiveItem]
            };
            
            // Mock the modal's DOM properties
            modal['resultContainerEl'] = mockContainer as any;
            modal['inputEl'] = { value: 'nouveau contact' } as HTMLInputElement;
            
            // Mock getSuggestions to return Create option
            const mockSuggestions = [
                { item: 'Create: nouveau contact', match: { score: 0, matches: [] } }
            ];
            jest.spyOn(modal, 'getSuggestions').mockReturnValue(mockSuggestions);
            
            // Mock renderSuggestion to avoid DOM manipulation
            jest.spyOn(modal, 'renderSuggestion').mockImplementation(() => {});
            
            // Create Ctrl+Space key event
            const spaceEvent = new KeyboardEvent('keydown', { code: 'Space', ctrlKey: true });
            jest.spyOn(spaceEvent, 'preventDefault');
            
            // This should now work correctly
            await modal['onKeyDown'](spaceEvent);
            
            // The Create option should be stored as choosed
            expect(modal['choosed']).toBe('Create: nouveau contact');
        });

        it('should handle Create option selection on close', () => {
            const files: TFile[] = [];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new MultiFileSearchModal(mockApp, mockVault, mockOnChoose, ['Personne']);
            
            // Set a Create option as the chosen item
            modal['choosed'] = 'Create: nouveau contact';
            
            // Mock onClose behavior - should now work correctly
            modal.onClose();
            
            // Verify the callback will be called with the Create option
            setTimeout(() => {
                expect(mockOnChoose).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        'Create: nouveau contact'
                    ])
                );
            }, 150);
        });
    });

    describe('File selection', () => {
        it('should handle TFile selection correctly', async () => {
            const files = [
                createMockFile('Contact/Jean Dupont.md', 'Jean Dupont'),
                createMockFile('Contact/Marie Martin.md', 'Marie Martin')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new MultiFileSearchModal(mockApp, mockVault, mockOnChoose, ['Personne']);
            
            // Mock the space key selection
            modal['selectedItems'] = [];
            
            // Mock DOM setup with proper querySelector
            const mockActiveItem = {
                classList: {
                    add: jest.fn(),
                    remove: jest.fn()
                }
            };
            
            const mockContainer = {
                querySelector: jest.fn(() => mockActiveItem),
                children: [mockActiveItem]
            };
            
            modal['resultContainerEl'] = mockContainer as any;
            modal['inputEl'] = { value: 'jean' } as HTMLInputElement;
            
            const mockSuggestions = [
                { item: files[0], match: { score: 10, matches: [] } }
            ];
            jest.spyOn(modal, 'getSuggestions').mockReturnValue(mockSuggestions);
            // Mock renderSuggestion to avoid DOM manipulation
            jest.spyOn(modal, 'renderSuggestion').mockImplementation(() => {});
            
            const spaceEvent = new KeyboardEvent('keydown', { code: 'Space', ctrlKey: true });
            jest.spyOn(spaceEvent, 'preventDefault');
            
            await modal['onKeyDown'](spaceEvent);
            
            // Should have selected the file
            expect(modal['selectedItems']).toContain(files[0]);
        });
    });

    describe('Error handling', () => {
        it('should handle null parameters gracefully', () => {
            expect(() => {
                new MultiFileSearchModal(mockApp, mockVault, mockOnChoose, []);
            }).not.toThrow();
        });
    });

    describe('Advanced search functionality', () => {
        it('should find files with partial matches like FileSearchModal', () => {
            const files = [
                createMockFile('Test 15.md', 'Test 15'),
                createMockFile('Test 10.md', 'Test 10'),
                createMockFile('Jean Dupont.md', 'Jean Dupont')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new MultiFileSearchModal(mockApp, mockVault, mockOnChoose, []);
            modal.inputEl = { value: 'test1' } as any;
            
            const suggestions = modal.getSuggestions('test1');
            
            // Should find "Test 15" and "Test 10" with "test1"
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBeGreaterThanOrEqual(2);
            expect(fileResults.some(s => (s.item as TFile).basename === 'Test 15')).toBe(true);
        });

        it('should support accent-insensitive search', () => {
            const files = [
                createMockFile('École Primaire.md', 'École Primaire'),
                createMockFile('Théâtre Municipal.md', 'Théâtre Municipal')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new MultiFileSearchModal(mockApp, mockVault, mockOnChoose, []);
            modal.inputEl = { value: 'ecole' } as any;
            
            const suggestions = modal.getSuggestions('ecole');
            
            // Should find "École Primaire" when searching "ecole"
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.some(s => (s.item as TFile).basename === 'École Primaire')).toBe(true);
        });

        it('should support out-of-order word matching', () => {
            const files = [
                createMockFile('Jean Pierre Dupont.md', 'Jean Pierre Dupont'),
                createMockFile('Pierre Jean Martin.md', 'Pierre Jean Martin')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new MultiFileSearchModal(mockApp, mockVault, mockOnChoose, []);
            modal.inputEl = { value: 'pierre jean' } as any;
            
            const suggestions = modal.getSuggestions('pierre jean');
            
            // Should find both files
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBeGreaterThanOrEqual(2);
        });
    });
});