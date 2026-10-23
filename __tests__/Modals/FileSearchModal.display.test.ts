/**
 * FileSearchModal - personnalisation de l'affichage des résultats :
 * chips de propriétés (icône + valeur colorée), tri par config à vide,
 * titre nettoyé du préfixe du template de renommage.
 *
 * Config search (par classe) :
 *   search:
 *     properties: [date, etat]   # chips affichées sur la ligne
 *     sort: date                 # tri quand la recherche est vide
 *     sortDirection: desc
 *     titleTemplate: "{animations[0].date} - Action - {current}"
 *
 * Le préfixe du titleTemplate avant {current} est retiré du titre affiché.
 */

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

        getSuggestions(query: string): Array<{ item: T; match: { score: number; matches: any[] } }> {
            const items = (this as any).getItems();
            if (!items) return [];
            if (!query || query.trim() === '') {
                return items.map((item: T) => ({ item, match: { score: 0, matches: [] } }));
            }
            return items.map((item: T) => ({ item, match: { score: 1, matches: [] } }));
        }

        renderSuggestion(item: any, el: HTMLElement) { }
        onChooseItem(item: any, evt: any) { }
    },
    Notice: jest.fn(),
    setIcon: jest.fn()
}));

function createMockFile(path: string, basename: string, frontmatter: any = {}): TFile {
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

const SEARCH_CONFIG = {
    properties: [
        { name: 'date', icon: 'calendar', type: 'date', derivedFrom: 'animations.date' },
        { name: 'etat', icon: 'clipboard-list', display: 'dot' as const, options: [
            { name: 'Piste', color: 'gray' },
            { name: 'Payé', color: 'gold' },
            { name: 'Devis envoyé', color: 'orange' }
        ] }
    ],
    sort: 'date',
    sortDirection: 'desc' as const,
    titleTemplate: '{animations[0].date} - Action - {current}'
};

describe('FileSearchModal - affichage personnalisé (config search)', () => {
    let mockApp: any;
    let mockVault: any;
    let mockOnChoose: jest.Mock;

    beforeAll(() => {
        // Obsidian patche HTMLElement.prototype en production (createDiv/createSpan)
        (HTMLElement.prototype as any).createDiv = function (opts: any) {
            const div = document.createElement('div');
            if (typeof opts === 'string') div.className = opts;
            else if (opts?.cls) div.className = opts.cls;
            if (opts?.text) div.textContent = opts.text;
            this.appendChild(div);
            return div;
        };
        (HTMLElement.prototype as any).createSpan = function (opts: any) {
            const span = document.createElement('span');
            if (typeof opts === 'string') span.className = opts;
            else if (opts?.cls) span.className = opts.cls;
            if (opts?.text) span.textContent = opts.text;
            this.appendChild(span);
            return span;
        };
    });

    beforeEach(() => {
        mockApp = new App();
        mockApp.metadataCache = {
            getFileCache: jest.fn().mockImplementation((file: any) => ({
                frontmatter: { classe: 'Action', ...({} as any) }
            }))
        };
        mockVault = {
            getFromFile: jest.fn(),
            app: { getSettings: jest.fn(() => ({ classePropertyName: 'classe' })) }
        };
        mockOnChoose = jest.fn();
        jest.clearAllMocks();
    });

    // Un classe mock dont property.read() renvoie les valeurs de la fiche
    const makeClasse = (values: Record<string, any>) => ({
        getProperty: (name: string) => ({
            name,
            read: async () => values[name]
        })
    });

    describe('Titre nettoyé par titleTemplate', () => {
        it('PLANTE : le préfixe avant {current} est retiré du titre affiché', () => {
            const file = createMockFile('Actions/2026-11-15 - Action - Saint didier ITW.md', '2026-11-15 - Action - Saint didier ITW');
            mockApp.vault.getMarkdownFiles.mockReturnValue([file]);

            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Action'], {
                searchConfig: SEARCH_CONFIG
            });

            const el = document.createElement('div');
            modal.renderSuggestion({ item: file, match: { score: 0, matches: [] } }, el);

            const title = el.querySelector('.suggestion-title') as HTMLElement;
            expect(title).toBeTruthy();
            expect(title.textContent).toBe('Saint didier ITW');
            // La date brute n'apparaît plus dans le titre
            expect(title.textContent).not.toContain('2026-11-15');
        });

        it('sans titleTemplate, le basename complet reste affiché', () => {
            const file = createMockFile('Actions/2026-11-15 - Action - Saint didier ITW.md', '2026-11-15 - Action - Saint didier ITW');
            mockApp.vault.getMarkdownFiles.mockReturnValue([file]);

            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Action'], {
                searchConfig: { ...SEARCH_CONFIG, titleTemplate: undefined }
            });

            const el = document.createElement('div');
            modal.renderSuggestion({ item: file, match: { score: 0, matches: [] } }, el);

            const title = el.querySelector('.suggestion-title') as HTMLElement;
            expect(title.textContent).toBe('2026-11-15 - Action - Saint didier ITW');
        });
    });

    describe('Chips de propriétés sur la ligne (option 1 : date à gauche, état en point)', () => {
        it('PLANTE : la date s\'affiche formatée en première colonne, l\'état en point coloré sans libellé', async () => {
            const file = createMockFile('Actions/2026-11-15 - Action - Saint didier ITW.md', '2026-11-15 - Action - Saint didier ITW');
            mockApp.vault.getMarkdownFiles.mockReturnValue([file]);
            mockVault.getFromFile.mockResolvedValue(makeClasse({
                date: '2026-11-15',
                etat: 'Payé'
            }));

            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Action'], {
                searchConfig: SEARCH_CONFIG
            });
            await (modal as any).preloadSearchValues();

            const el = document.createElement('div');
            modal.renderSuggestion({ item: file, match: { score: 0, matches: [] } }, el);

            // Date : chip avec valeur formatée en français court
            const dateChip = el.querySelector('.suggestion-chip') as HTMLElement;
            expect(dateChip).toBeTruthy();
            expect(dateChip.textContent).toContain('15 nov. 2026');

            // État : point coloré SANS libellé
            const dot = el.querySelector('.suggestion-chip-dot') as HTMLElement;
            expect(dot).toBeTruthy();
            expect(el.textContent).not.toContain('Payé');
            // Le libellé reste disponible en info-bulle
            expect(dot.title).toBe('Payé');
        });

        it('PLANTE : le point d\'état prend la couleur de l\'option mappée sur le thème (Payé -> yellow)', async () => {
            const file = createMockFile('Actions/2026-11-15 - Action - Saint didier ITW.md', '2026-11-15 - Action - Saint didier ITW');
            mockApp.vault.getMarkdownFiles.mockReturnValue([file]);
            mockVault.getFromFile.mockResolvedValue(makeClasse({
                date: '2026-11-15',
                etat: 'Payé'
            }));

            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Action'], {
                searchConfig: SEARCH_CONFIG
            });
            await (modal as any).preloadSearchValues();

            const el = document.createElement('div');
            modal.renderSuggestion({ item: file, match: { score: 0, matches: [] } }, el);

            const dot = el.querySelector('.suggestion-chip-dot') as HTMLElement;
            expect(dot).toBeTruthy();
            expect(dot.style.getPropertyValue('--chip-color')).toBe('rgb(var(--color-yellow, 244, 226, 141))');
        });

        it('la couleur explicite d\'une chip est appliquée quand la config en fournit une', async () => {
            const file = createMockFile('Actions/2026-11-15 - Action - Saint didier ITW.md', '2026-11-15 - Action - Saint didier ITW');
            mockApp.vault.getMarkdownFiles.mockReturnValue([file]);
            mockVault.getFromFile.mockResolvedValue(makeClasse({
                date: '2026-11-15',
                etat: 'Piste'
            }));

            const configWithColor = {
                ...SEARCH_CONFIG,
                properties: [
                    { ...SEARCH_CONFIG.properties[0], color: 'red' },
                    SEARCH_CONFIG.properties[1]
                ]
            };
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Action'], {
                searchConfig: configWithColor
            });
            await (modal as any).preloadSearchValues();

            const el = document.createElement('div');
            modal.renderSuggestion({ item: file, match: { score: 0, matches: [] } }, el);

            const dateChip = el.querySelector('.suggestion-chip') as HTMLElement;
            expect(dateChip).toBeTruthy();
            expect(dateChip.style.getPropertyValue('--chip-color')).toBe('rgb(var(--color-red, 185, 93, 93))');
        });

        it('PLANTE : une plage de dates s\'affiche en format compact "14 → 16 nov. 2026"', async () => {
            const file = createMockFile('Actions/2026-11-14 - Action - Plage.md', '2026-11-14 - Action - Plage');
            mockApp.vault.getMarkdownFiles.mockReturnValue([file]);
            mockVault.getFromFile.mockResolvedValue(makeClasse({
                date: '2026-11-14 to 2026-11-16',
                etat: 'Piste'
            }));

            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Action'], {
                searchConfig: SEARCH_CONFIG
            });
            await (modal as any).preloadSearchValues();

            const el = document.createElement('div');
            modal.renderSuggestion({ item: file, match: { score: 0, matches: [] } }, el);

            const dateChip = el.querySelector('.suggestion-chip') as HTMLElement;
            expect(dateChip.textContent).toContain('14 → 16 nov. 2026');
        });
    });

    describe('Chemin rapide : valeurs lues depuis le metadataCache d\'Obsidian', () => {
        it('PLANTE : la date dérivée et l\'état sont calculés depuis le frontmatter, sans instancier de Classe', async () => {
            const file = createMockFile('Actions/2026-11-15 - Action - Saint didier ITW.md', '2026-11-15 - Action - Saint didier ITW');
            mockApp.vault.getMarkdownFiles.mockReturnValue([file]);
            // Le frontmatter contient animations (date dérivée) et etat directement
            mockApp.metadataCache.getFileCache.mockReturnValue({
                frontmatter: {
                    classe: 'Action',
                    etat: 'Payé',
                    animations: [{ date: '2026-11-15' }]
                }
            });
            mockVault.getFromFile.mockImplementation(async () => {
                throw new Error('getFromFile ne doit pas être appelé sur le chemin rapide');
            });

            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Action'], {
                searchConfig: SEARCH_CONFIG
            });
            await (modal as any).preloadSearchValues();

            const el = document.createElement('div');
            modal.renderSuggestion({ item: file, match: { score: 0, matches: [] } }, el);

            // Date dérivée calculée depuis animations.date
            const dateChip = el.querySelector('.suggestion-chip') as HTMLElement;
            expect(dateChip).toBeTruthy();
            expect(dateChip.textContent).toContain('15 nov. 2026');

            // État : point doré (Payé -> yellow)
            const dot = el.querySelector('.suggestion-chip-dot') as HTMLElement;
            expect(dot).toBeTruthy();
            expect(dot.style.getPropertyValue('--chip-color')).toBe('rgb(var(--color-yellow, 244, 226, 141))');
        });

        it('PLANTE : display: "value" force le libellé pour un chip select', async () => {
            const file = createMockFile('Actions/2026-11-15 - Action - Saint didier ITW.md', '2026-11-15 - Action - Saint didier ITW');
            mockApp.vault.getMarkdownFiles.mockReturnValue([file]);
            mockApp.metadataCache.getFileCache.mockReturnValue({
                frontmatter: {
                    classe: 'Action',
                    etat: 'Payé'
                }
            });

            const configWithValue = {
                ...SEARCH_CONFIG,
                properties: [
                    SEARCH_CONFIG.properties[0],
                    { ...SEARCH_CONFIG.properties[1], display: 'value' as const }
                ]
            };
            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Action'], {
                searchConfig: configWithValue
            });
            await (modal as any).preloadSearchValues();

            const el = document.createElement('div');
            modal.renderSuggestion({ item: file, match: { score: 0, matches: [] } }, el);

            // display: value -> pas de point, le libellé est affiché
            expect(el.querySelector('.suggestion-chip-dot')).toBeNull();
            const etatChip = Array.from(el.querySelectorAll('.suggestion-chip'))
                .find(chip => chip.textContent?.includes('Payé')) as HTMLElement;
            expect(etatChip).toBeTruthy();
            expect(etatChip.style.getPropertyValue('--chip-color')).toBe('rgb(var(--color-yellow, 244, 226, 141))');
        });
    });

    describe('Tri par config quand la recherche est vide', () => {
        it('PLANTE : résultats triés par date décroissante', async () => {
            const fileNov = createMockFile('Actions/2026-11-15 - Action - Nov.md', '2026-11-15 - Action - Nov');
            const fileMar = createMockFile('Actions/2026-03-31 - Action - Mar.md', '2026-03-31 - Action - Mar');
            const fileJul = createMockFile('Actions/2026-07-01 - Action - Jul.md', '2026-07-01 - Action - Jul');
            mockApp.vault.getMarkdownFiles.mockReturnValue([fileMar, fileNov, fileJul]);
            mockVault.getFromFile.mockImplementation(async (iFile: any) => {
                const dates: Record<string, any> = {
                    'Nov': { date: '2026-11-15', etat: 'Payé' },
                    'Mar': { date: '2026-03-31', etat: 'Piste' },
                    'Jul': { date: '2026-07-01', etat: 'Devis envoyé' }
                };
                const key = iFile.basename.split(' - ')[2];
                return makeClasse(dates[key]);
            });

            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Action'], {
                searchConfig: SEARCH_CONFIG
            });
            await (modal as any).preloadSearchValues();

            const suggestions = modal.getSuggestions('');
            const files = suggestions
                .map(s => s.item)
                .filter((i): i is TFile => typeof i !== 'string');

            expect(files.map(f => f.basename)).toEqual([
                '2026-11-15 - Action - Nov',
                '2026-07-01 - Action - Jul',
                '2026-03-31 - Action - Mar'
            ]);
        });

        it('les valeurs manquantes vont en fin de tri', async () => {
            const withDate = createMockFile('Actions/2026-07-01 - Action - Jul.md', '2026-07-01 - Action - Jul');
            const noDate = createMockFile('Actions/Action sans date.md', 'Action sans date');
            mockApp.vault.getMarkdownFiles.mockReturnValue([noDate, withDate]);
            mockVault.getFromFile.mockImplementation(async (iFile: any) => {
                if (iFile.basename === 'Action sans date') {
                    return makeClasse({ etat: 'Piste' });
                }
                return makeClasse({ date: '2026-07-01', etat: 'Payé' });
            });

            const modal = new FileSearchModal(mockApp, mockVault, mockOnChoose, ['Action'], {
                searchConfig: SEARCH_CONFIG
            });
            await (modal as any).preloadSearchValues();

            const suggestions = modal.getSuggestions('');
            const files = suggestions
                .map(s => s.item)
                .filter((i): i is TFile => typeof i !== 'string');

            expect(files[0].basename).toBe('2026-07-01 - Action - Jul');
            expect(files[files.length - 1].basename).toBe('Action sans date');
        });
    });
});
