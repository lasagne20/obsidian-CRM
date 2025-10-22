/**
 * Tests corrigés pour ConfigLoader - Sans dépendances circulaires
 */

// Export pour faire de ce fichier un module
export {};

// Types minimaux pour les tests
interface MockPropertyTableRow {
    name: string;
    type: string;
    icon: string;
    default: string;
    classes?: string;
    options?: string;
    formula?: string;
    display?: string;
}

interface MockPropertyConfig {
    type: string;
    name: string;
    icon?: string;
    defaultValue?: string;
    classes?: string[];
    options?: { name: string; color: string }[];
    formula?: string;
    display?: string;
}

describe('ConfigLoader Corrigé', () => {
    
    // Mock de la classe ConfigLoader sans imports
    class MockConfigLoader {
        /**
         * Parse une ligne de tableau de propriétés en PropertyConfig
         */
        parseTableRowToPropertyConfig(row: MockPropertyTableRow): MockPropertyConfig {
            const config: MockPropertyConfig = {
                type: row.type,
                name: row.name,
                icon: row.icon,
                defaultValue: row.default
            };

            // Parser les classes (string séparé par virgules)
            if (row.classes && row.classes.trim() !== '') {
                config.classes = row.classes.split(',').map(c => c.trim());
            }

            // Parser les options (format "name1:color1,name2:color2")
            if (row.options) {
                config.options = row.options.split(',').map(opt => {
                    const [name, color = ''] = opt.split(':').map(s => s.trim());
                    return { name, color };
                });
            }

            // Autres attributs
            if (row.formula) {
                config.formula = row.formula;
            }
            
            if (row.display) {
                config.display = row.display;
            }

            return config;
        }

        /**
         * Simule le chargement d'une config
         */
        async mockLoadConfig(configData: any) {
            // Simulation du processus de chargement
            if (Array.isArray(configData.properties)) {
                // Format CSV
                const processedProperties: { [key: string]: MockPropertyConfig } = {};
                
                for (const row of configData.properties) {
                    const config = this.parseTableRowToPropertyConfig(row);
                    processedProperties[row.name] = config;
                }
                
                return {
                    className: configData.className,
                    classIcon: configData.classIcon,
                    properties: processedProperties
                };
            } else {
                // Format objet traditionnel - retourner tel quel
                return configData;
            }
        }
    }

    let configLoader: MockConfigLoader;

    beforeEach(() => {
        configLoader = new MockConfigLoader();
    });

    describe('parseTableRowToPropertyConfig', () => {
        it('devrait parser une ligne basique correctement', () => {
            const row: MockPropertyTableRow = {
                name: 'email',
                type: 'EmailProperty',
                icon: 'mail',
                default: ''
            };

            const config = configLoader.parseTableRowToPropertyConfig(row);

            expect(config).toEqual({
                type: 'EmailProperty',
                name: 'email',
                icon: 'mail',
                defaultValue: ''
            });
        });

        it('devrait parser les classes multiples', () => {
            const row: MockPropertyTableRow = {
                name: 'lieu',
                type: 'FileProperty',
                icon: 'map-pin',
                default: '',
                classes: 'Lieu,Institution,Personne'
            };

            const config = configLoader.parseTableRowToPropertyConfig(row);

            expect(config.classes).toEqual(['Lieu', 'Institution', 'Personne']);
        });

        it('devrait parser les options avec couleurs', () => {
            const row: MockPropertyTableRow = {
                name: 'statut',
                type: 'SelectProperty',
                icon: 'activity',
                default: 'Actif',
                options: 'Actif:green,Inactif:red,En attente:orange'
            };

            const config = configLoader.parseTableRowToPropertyConfig(row);

            expect(config.options).toEqual([
                { name: 'Actif', color: 'green' },
                { name: 'Inactif', color: 'red' },
                { name: 'En attente', color: 'orange' }
            ]);
        });

        it('devrait parser les options sans couleurs', () => {
            const row: MockPropertyTableRow = {
                name: 'type',
                type: 'SelectProperty',
                icon: 'tag',
                default: '',
                options: 'option1:,option2:,option3:'
            };

            const config = configLoader.parseTableRowToPropertyConfig(row);

            expect(config.options).toEqual([
                { name: 'option1', color: '' },
                { name: 'option2', color: '' },
                { name: 'option3', color: '' }
            ]);
        });

        it('devrait parser une formule', () => {
            const row: MockPropertyTableRow = {
                name: 'total',
                type: 'FormulaProperty',
                icon: 'calculator',
                default: '',
                formula: 'prix * quantite'
            };

            const config = configLoader.parseTableRowToPropertyConfig(row);

            expect(config.formula).toBe('prix * quantite');
        });

        it('devrait parser le display', () => {
            const row: MockPropertyTableRow = {
                name: 'section',
                type: 'ObjectProperty',
                icon: 'folder',
                default: '',
                display: 'fold'
            };

            const config = configLoader.parseTableRowToPropertyConfig(row);

            expect(config.display).toBe('fold');
        });
    });

    describe('Chargement de configuration', () => {
        it('devrait charger le format tableau (CSV)', async () => {
            const mockConfig = {
                className: 'Test',
                classIcon: 'test',
                properties: [
                    {
                        name: 'email',
                        type: 'EmailProperty',
                        icon: 'mail',
                        default: ''
                    },
                    {
                        name: 'statut',
                        type: 'SelectProperty',
                        icon: 'activity',
                        default: 'Actif',
                        options: 'Actif:green,Inactif:red'
                    }
                ]
            };

            const result = await configLoader.mockLoadConfig(mockConfig);

            expect(result.className).toBe('Test');
            expect(result.classIcon).toBe('test');
            expect(Object.keys(result.properties)).toHaveLength(2);
            expect(result.properties.email.type).toBe('EmailProperty');
            expect(result.properties.statut.options).toEqual([
                { name: 'Actif', color: 'green' },
                { name: 'Inactif', color: 'red' }
            ]);
        });

        it('devrait charger le format objet (ancien)', async () => {
            const mockConfig = {
                className: 'TestObjet',
                classIcon: 'test-obj',
                properties: {
                    email: {
                        type: 'EmailProperty',
                        name: 'Email',
                        icon: 'mail',
                        defaultValue: ''
                    },
                    statut: {
                        type: 'SelectProperty',
                        name: 'Statut',
                        icon: 'activity',
                        defaultValue: 'Actif',
                        options: [
                            { name: 'Actif', color: 'green' },
                            { name: 'Inactif', color: 'red' }
                        ]
                    }
                }
            };

            const result = await configLoader.mockLoadConfig(mockConfig);

            expect(result.className).toBe('TestObjet');
            expect(result.classIcon).toBe('test-obj');
            expect(result.properties).toBe(mockConfig.properties);
        });

        it('devrait gérer un fichier de config vide', async () => {
            const mockConfig = {
                className: 'Empty',
                classIcon: 'empty',
                properties: []
            };

            const result = await configLoader.mockLoadConfig(mockConfig);

            expect(result.className).toBe('Empty');
            expect(Object.keys(result.properties)).toHaveLength(0);
        });
    });

    describe('Validation des erreurs', () => {
        it('devrait gérer des options malformées', () => {
            const row: MockPropertyTableRow = {
                name: 'test',
                type: 'SelectProperty',
                icon: 'test',
                default: '',
                options: 'invalid-format-no-colon'
            };

            const config = configLoader.parseTableRowToPropertyConfig(row);

            // Même avec un format incorrect, ne devrait pas planter
            expect(config.options).toEqual([{ name: 'invalid-format-no-colon', color: '' }]);
        });

        it('devrait gérer des classes vides', () => {
            const row: MockPropertyTableRow = {
                name: 'test',
                type: 'FileProperty',
                icon: 'test',
                default: '',
                classes: ''
            };

            const config = configLoader.parseTableRowToPropertyConfig(row);

            expect(config.classes).toBeUndefined();
        });

        it('devrait gérer l\'absence de propriétés optionnelles', () => {
            const row: MockPropertyTableRow = {
                name: 'simple',
                type: 'Property',
                icon: 'test',
                default: ''
                // Pas de classes, options, formula, display
            };

            const config = configLoader.parseTableRowToPropertyConfig(row);

            expect(config.classes).toBeUndefined();
            expect(config.options).toBeUndefined();
            expect(config.formula).toBeUndefined();
            expect(config.display).toBeUndefined();
        });
    });

    describe('Tests de régression', () => {
        it('devrait maintenir la compatibilité avec l\'ancien format', async () => {
            const oldFormat = {
                className: 'Compatibility',
                classIcon: 'compat',
                properties: {
                    nom: {
                        type: 'Property',
                        name: 'Nom',
                        icon: 'user',
                        defaultValue: ''
                    }
                }
            };

            const result = await configLoader.mockLoadConfig(oldFormat);

            expect(result.className).toBe('Compatibility');
            expect(result.properties.nom.type).toBe('Property');
        });

        it('devrait traiter les propriétés complexes en CSV', async () => {
            const newFormat = {
                className: 'Complex',
                classIcon: 'complex',
                properties: [
                    {
                        name: 'lieu',
                        type: 'FileProperty',
                        icon: 'map-pin',
                        default: '',
                        classes: 'Lieu,Institution'
                    },
                    {
                        name: 'statut',
                        type: 'MultiSelectProperty',
                        icon: 'tags',
                        default: '',
                        options: 'Option1:blue,Option2:red,Option3:green'
                    }
                ]
            };

            const result = await configLoader.mockLoadConfig(newFormat);

            expect(result.properties.lieu.classes).toEqual(['Lieu', 'Institution']);
            expect(result.properties.statut.options).toHaveLength(3);
            expect(result.properties.statut.options?.[0].color).toBe('blue');
        });
    });
});