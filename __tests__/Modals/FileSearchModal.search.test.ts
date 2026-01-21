import { App, TFile } from 'obsidian';
import { FileSearchModal } from '../../src/Modals/FileSearchModal';

// Mock Obsidian
jest.mock('obsidian', () => ({
    App: jest.fn().mockImplementation(() => ({
        vault: {
            getMarkdownFiles: jest.fn(() => []),
            getName: jest.fn(() => 'TestVault')
        }
    })),
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

// Helper function to create a mock TFile
function createMockFile(path: string, basename: string): TFile {
    const mockFile = {
        path,
        basename,
        name: basename + '.md',
        extension: 'md',
        parent: null
    };
    Object.setPrototypeOf(mockFile, TFile.prototype);
    return mockFile as TFile;
}

describe('FileSearchModal - Advanced Search Tests', () => {
    let mockApp: any;
    let mockVault: any;
    let mockOnChoose: jest.Mock;
    
    beforeEach(() => {
        mockApp = new App();
        mockVault = {
            getExtendedClasses: jest.fn()
        };
        mockOnChoose = jest.fn();
        jest.clearAllMocks();
    });

    describe('Partial word matching', () => {
        it('should find "Test 15" when searching "test1"', () => {
            const files = [
                createMockFile('Test 15.md', 'Test 15'),
                createMockFile('Test 10.md', 'Test 10'),
                createMockFile('Test 2.md', 'Test 2'),
                createMockFile('Testing 123.md', 'Testing 123')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('test1');
            
            // Should find Test 15, Test 10, Testing 123
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBeGreaterThanOrEqual(3);
            expect(fileResults.some(s => (s.item as TFile).basename === 'Test 15')).toBe(true);
            expect(fileResults.some(s => (s.item as TFile).basename === 'Test 10')).toBe(true);
        });

        it('should find "Jean Dupont" when searching "jea"', () => {
            const files = [
                createMockFile('Jean Dupont.md', 'Jean Dupont'),
                createMockFile('Marie Jean.md', 'Marie Jean'),
                createMockFile('Jean-Pierre Martin.md', 'Jean-Pierre Martin')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('jea');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBeGreaterThanOrEqual(3);
            expect(fileResults.some(s => (s.item as TFile).basename === 'Jean Dupont')).toBe(true);
        });

        it('should find files with partial number matches', () => {
            const files = [
                createMockFile('Action 2024-01-15.md', 'Action 2024-01-15'),
                createMockFile('Meeting 2024.md', 'Meeting 2024'),
                createMockFile('Report 20241231.md', 'Report 20241231')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('2024');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBe(3);
        });
    });

    describe('Out of order word matching', () => {
        it('should find "Jean Pierre Dupont" when searching "pierre jean"', () => {
            const files = [
                createMockFile('Jean Pierre Dupont.md', 'Jean Pierre Dupont'),
                createMockFile('Pierre Jean Martin.md', 'Pierre Jean Martin')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('pierre jean');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBeGreaterThanOrEqual(2);
        });

        it('should find "École Primaire Grenoble" when searching "grenoble ecole"', () => {
            const files = [
                createMockFile('École Primaire Grenoble.md', 'École Primaire Grenoble'),
                createMockFile('Grenoble École Maternelle.md', 'Grenoble École Maternelle')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('grenoble ecole');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Accent insensitive search', () => {
        it('should find "École" when searching "ecole"', () => {
            const files = [
                createMockFile('École Primaire.md', 'École Primaire'),
                createMockFile('Écoles Maternelles.md', 'Écoles Maternelles')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('ecole');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBeGreaterThanOrEqual(2);
        });

        it('should find "François Müller" when searching "francois muller"', () => {
            const files = [
                createMockFile('François Müller.md', 'François Müller'),
                createMockFile('Francoise Mueller.md', 'Francoise Mueller')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('francois muller');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBeGreaterThanOrEqual(1);
            expect(fileResults.some(s => (s.item as TFile).basename.includes('François'))).toBe(true);
        });

        it('should find "École Primaire" when searching with accents "École"', () => {
            const files = [
                createMockFile('École Primaire.md', 'École Primaire'),
                createMockFile('École Maternelle.md', 'École Maternelle'),
                createMockFile('Lycée Jean Moulin.md', 'Lycée Jean Moulin')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('École');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBeGreaterThanOrEqual(2);
            expect(fileResults.some(s => (s.item as TFile).basename === 'École Primaire')).toBe(true);
            expect(fileResults.some(s => (s.item as TFile).basename === 'École Maternelle')).toBe(true);
        });

        it('should find files when searching with mixed accents', () => {
            const files = [
                createMockFile('Théâtre Municipal.md', 'Théâtre Municipal'),
                createMockFile('Médiathèque François Mitterrand.md', 'Médiathèque François Mitterrand')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('Théâtre');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.some(s => (s.item as TFile).basename === 'Théâtre Municipal')).toBe(true);
        });
    });

    describe('Special characters and spaces', () => {
        it('should find files with hyphens', () => {
            const files = [
                createMockFile('Jean-Pierre Martin.md', 'Jean-Pierre Martin'),
                createMockFile('Marie-Claire Dubois.md', 'Marie-Claire Dubois')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('jean pierre');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.some(s => (s.item as TFile).basename === 'Jean-Pierre Martin')).toBe(true);
        });

        it('should find files with apostrophes', () => {
            const files = [
                createMockFile("Centre d'Animation.md", "Centre d'Animation"),
                createMockFile("L'École du Village.md", "L'École du Village")
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('centre animation');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.some(s => (s.item as TFile).basename.includes("d'Animation"))).toBe(true);
        });
    });

    describe('Continuous character matching', () => {
        it('should find "Test 15" when searching "t15" (continuous chars)', () => {
            const files = [
                createMockFile('Test 15.md', 'Test 15'),
                createMockFile('T15 Report.md', 'T15 Report'),
                createMockFile('Testing 155.md', 'Testing 155')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('t15');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBeGreaterThanOrEqual(2);
            expect(fileResults.some(s => (s.item as TFile).basename === 'Test 15')).toBe(true);
        });

        it('should find "Action 123" when searching "a123"', () => {
            const files = [
                createMockFile('Action 123.md', 'Action 123'),
                createMockFile('A123 Report.md', 'A123 Report')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('a123');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            expect(fileResults.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Case insensitive search', () => {
        it('should find files regardless of case', () => {
            const files = [
                createMockFile('TEST.md', 'TEST'),
                createMockFile('Test.md', 'Test'),
                createMockFile('test.md', 'test')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            
            const suggestionsLower = modal.getSuggestions('test');
            const suggestionsUpper = modal.getSuggestions('TEST');
            const suggestionsMixed = modal.getSuggestions('TeSt');
            
            expect(suggestionsLower.filter(s => s.item instanceof TFile).length).toBe(3);
            expect(suggestionsUpper.filter(s => s.item instanceof TFile).length).toBe(3);
            expect(suggestionsMixed.filter(s => s.item instanceof TFile).length).toBe(3);
        });
    });

    describe('Scoring and ranking', () => {
        it('should rank exact matches higher than partial matches', () => {
            const files = [
                createMockFile('Test.md', 'Test'),
                createMockFile('Testing.md', 'Testing'),
                createMockFile('Test Case.md', 'Test Case'),
                createMockFile('Latest Test.md', 'Latest Test')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('test');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            // "Test" should be ranked higher (exact match at start)
            expect((fileResults[0].item as TFile).basename).toBe('Test');
        });

        it('should rank word start matches higher', () => {
            const files = [
                createMockFile('Jean Dupont.md', 'Jean Dupont'),
                createMockFile('Marie Jean.md', 'Marie Jean'),
                createMockFile('Testing Jean.md', 'Testing Jean')
            ];
            mockApp.vault.getMarkdownFiles.mockReturnValue(files);
            
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose);
            const suggestions = modal.getSuggestions('jean');
            
            const fileResults = suggestions.filter(s => s.item instanceof TFile);
            // "Jean Dupont" should rank higher (word starts with "jean")
            expect((fileResults[0].item as TFile).basename).toBe('Jean Dupont');
        });
    });
});