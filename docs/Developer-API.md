# API de développement

Guide complet pour les développeurs souhaitant étendre ou contribuer au plugin Obsidian CRM.

## 🏗️ Architecture technique

### Structure des modules

```
Utils/
├── Config/
│   ├── ConfigLoader.ts          # Chargement des configurations YAML
│   ├── ClassConfigManager.ts    # Gestion des classes dynamiques  
│   └── DynamicClassFactory.ts   # Factory pour instanciation
├── Properties/
│   ├── Property.ts              # Classe de base des propriétés
│   ├── EmailProperty.ts         # Propriété email avec validation
│   ├── FileProperty.ts          # Propriété de liaison vers fichiers
│   └── ...                      # Autres types de propriétés
├── Display/
│   ├── DisplayManager.ts        # Gestionnaire d'affichage
│   ├── DynamicTable.ts          # Tableaux dynamiques
│   └── ChartDisplay.ts          # Graphiques et visualisations
└── Data/
    ├── GeoData.ts               # Données géographiques
    └── GenerativeData.ts        # Génération de données
```

## 🔧 API Core

### ConfigLoader

Le `ConfigLoader` est responsable du chargement et de l'interprétation des fichiers de configuration YAML.

```typescript
import { ConfigLoader } from './Utils/Config/ConfigLoader';

// Initialisation
const configLoader = new ConfigLoader('./config', app);

// Charger une configuration de classe
const config = await configLoader.loadClassConfig('Contact');

// Créer une propriété depuis la configuration
const property = configLoader.createProperty({
    type: 'EmailProperty',
    name: 'email',
    icon: 'mail'
});
```

### ClassConfigManager

Le `ClassConfigManager` gère la création dynamique de classes à partir des configurations.

```typescript
import { ClassConfigManager } from './Utils/Config/ClassConfigManager';

// Initialisation
const manager = new ClassConfigManager('./config', app);

// Créer une classe dynamique
const DynamicContactClass = await manager.createDynamicClasse('Contact');

// Instancier la classe
const contact = new DynamicContactClass(app, vault, file);

// Obtenir les classes disponibles
const availableClasses = await manager.getAvailableClasses();
```

### DynamicClassFactory

Le `DynamicClassFactory` fournit une interface singleton pour la gestion globale des classes.

```typescript
import { DynamicClassFactory } from './Utils/Config/DynamicClassFactory';

// Initialisation (singleton)
const factory = DynamicClassFactory.getInstance('./config', app);

// Obtenir ou créer une classe
const ContactClass = await factory.getClass('Contact');

// Créer une instance depuis un fichier
const contact = await factory.createInstance('Contact', app, vault, file);

// Nettoyer le cache
factory.clearCache();
```

## 🎨 Système de propriétés

### Créer une propriété personnalisée

```typescript
import { Property } from './Utils/Properties/Property';

export class CustomProperty extends Property {
    constructor(
        name: string,
        private customOptions: any = {},
        options: any = {}
    ) {
        super(name, options);
    }

    // Validation des données
    validate(value: any): boolean {
        // Logique de validation personnalisée
        return typeof value === 'string' && value.length > 0;
    }

    // Rendu de l'interface de saisie
    getInputElement(container: HTMLElement, value?: any): HTMLElement {
        const input = container.createEl('input');
        input.type = 'text';
        input.value = value || '';
        
        // Logique personnalisée
        input.addEventListener('change', (e) => {
            this.updateValue((e.target as HTMLInputElement).value);
        });
        
        return input;
    }

    // Rendu de l'affichage
    getDisplayElement(container: HTMLElement, value?: any): HTMLElement {
        const span = container.createEl('span');
        span.textContent = this.formatValue(value);
        span.addClass('custom-property-display');
        return span;
    }

    // Formatage pour l'affichage
    formatValue(value: any): string {
        // Logique de formatage personnalisée
        return value ? value.toString().toUpperCase() : '';
    }

    // Conversion pour l'export
    serialize(value: any): any {
        return {
            type: 'CustomProperty',
            value: value,
            options: this.customOptions
        };
    }

    // Conversion depuis l'import
    static deserialize(data: any): CustomProperty {
        return new CustomProperty(
            data.name,
            data.options,
            data.config
        );
    }
}
```

### Enregistrer la propriété personnalisée

```typescript
// Dans ConfigLoader.ts, ajouter au switch case
case 'CustomProperty':
    return new CustomProperty(
        config.name,
        config.customOptions,
        options
    );
```

## 🖼️ Système d'affichage

### Créer un conteneur personnalisé

```typescript
import { DisplayContainer } from './Utils/Display/DisplayManager';

export class CustomDisplayContainer extends DisplayContainer {
    constructor(
        type: string,
        properties: string[],
        private customConfig: any = {}
    ) {
        super(type, properties);
    }

    render(data: any, container: HTMLElement): void {
        const wrapper = container.createEl('div');
        wrapper.addClass('custom-container');

        // En-tête personnalisé
        if (this.customConfig.title) {
            const header = wrapper.createEl('h3');
            header.textContent = this.customConfig.title;
        }

        // Rendu des propriétés
        this.properties.forEach(propName => {
            const propContainer = wrapper.createEl('div');
            propContainer.addClass('custom-property');

            const label = propContainer.createEl('label');
            label.textContent = propName;

            const value = propContainer.createEl('div');
            value.textContent = data[propName] || '';
        });
    }
}
```

### Templates Handlebars personnalisés

```typescript
import Handlebars from 'handlebars';

// Enregistrer un helper personnalisé
Handlebars.registerHelper('formatCurrency', function(amount: number) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
});

Handlebars.registerHelper('dateRelative', function(date: Date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
});

// Utilisation dans un template
const template = `
<div class="financial-summary">
    <span class="amount">{{formatCurrency montant}}</span>
    <span class="date">{{dateRelative date}}</span>
</div>
`;
```

## 📊 API de données

### Requêtes personnalisées

```typescript
import { DataQuery } from './Utils/Data/DataQuery';

// Créer une requête
const query = new DataQuery('Contact')
    .where('statut', 'equals', 'Client')
    .where('entreprise.secteur', 'in', ['Tech', 'Finance'])
    .join('Commande', 'contact')
    .groupBy('entreprise.secteur')
    .aggregate('commandes.montant', 'sum', 'totalCA')
    .orderBy('totalCA', 'desc')
    .limit(10);

// Exécuter la requête
const results = await query.execute();

// Requête avec conditions complexes
const advancedQuery = new DataQuery('Contact')
    .where((q) => {
        return q.where('statut', 'equals', 'Client')
               .or()
               .group((subQ) => {
                   return subQ.where('statut', 'equals', 'Prospect')
                             .and('scoreQualification', 'gte', 80);
               });
    })
    .include(['entreprise', 'commandes'])
    .execute();
```

### Cache et performance

```typescript
import { CacheManager } from './Utils/Cache/CacheManager';

// Configuration du cache
const cacheManager = new CacheManager({
    strategy: 'lru',
    maxSize: '100MB',
    ttl: 3600000 // 1 heure
});

// Utilisation avec requêtes
const getCachedContacts = async (filters: any) => {
    const cacheKey = `contacts:${JSON.stringify(filters)}`;
    
    let result = cacheManager.get(cacheKey);
    if (!result) {
        result = await executeContactQuery(filters);
        cacheManager.set(cacheKey, result);
    }
    
    return result;
};

// Invalidation sélective
const invalidateContactCache = (contactId: string) => {
    cacheManager.invalidatePattern(`contacts:*`);
    cacheManager.invalidate(`contact:${contactId}`);
};
```

## 🔌 Hooks et événements

### Système d'événements

```typescript
import { EventEmitter } from 'events';

export class CRMEventBus extends EventEmitter {
    // Événements disponibles
    static readonly EVENTS = {
        OBJECT_CREATED: 'object:created',
        OBJECT_UPDATED: 'object:updated', 
        OBJECT_DELETED: 'object:deleted',
        PROPERTY_CHANGED: 'property:changed',
        RELATION_ADDED: 'relation:added',
        RELATION_REMOVED: 'relation:removed'
    };

    constructor() {
        super();
        this.setMaxListeners(50); // Augmenter si nécessaire
    }

    // Émettre un événement avec données typées
    emitObjectEvent(eventType: string, data: {
        className: string;
        objectId: string;
        object?: any;
        previousValue?: any;
        newValue?: any;
        property?: string;
    }) {
        this.emit(eventType, data);
    }
}

// Utilisation
const eventBus = new CRMEventBus();

// Écouter les événements
eventBus.on(CRMEventBus.EVENTS.OBJECT_CREATED, (data) => {
    console.log(`Nouvel objet ${data.className} créé:`, data.objectId);
});

// Émettre un événement
eventBus.emitObjectEvent(CRMEventBus.EVENTS.OBJECT_CREATED, {
    className: 'Contact',
    objectId: 'contact-123',
    object: contactData
});
```

### Middleware et intercepteurs

```typescript
interface CRMMiddleware {
    beforeCreate?(data: any, context: any): Promise<any>;
    afterCreate?(object: any, context: any): Promise<void>;
    beforeUpdate?(object: any, changes: any, context: any): Promise<any>;
    afterUpdate?(object: any, previousValue: any, context: any): Promise<void>;
    beforeDelete?(object: any, context: any): Promise<boolean>;
    afterDelete?(object: any, context: any): Promise<void>;
}

export class MiddlewareManager {
    private middlewares: CRMMiddleware[] = [];

    register(middleware: CRMMiddleware) {
        this.middlewares.push(middleware);
    }

    async executeBeforeCreate(data: any, context: any) {
        for (const middleware of this.middlewares) {
            if (middleware.beforeCreate) {
                data = await middleware.beforeCreate(data, context);
            }
        }
        return data;
    }

    // Autres méthodes d'exécution...
}

// Exemple de middleware
const auditMiddleware: CRMMiddleware = {
    afterCreate: async (object, context) => {
        await logAuditEvent('CREATE', object.className, object.id, context.user);
    },
    
    afterUpdate: async (object, previousValue, context) => {
        const changes = calculateChanges(previousValue, object);
        await logAuditEvent('UPDATE', object.className, object.id, context.user, changes);
    }
};
```

## 🧪 Tests et développement

### Tests unitaires

```typescript
import { ConfigLoader } from '../Utils/Config/ConfigLoader';
import { mockObsidianApp } from '../__mocks__/obsidian';

describe('ConfigLoader', () => {
    let configLoader: ConfigLoader;
    let mockApp: any;

    beforeEach(() => {
        mockApp = mockObsidianApp();
        configLoader = new ConfigLoader('./test-config', mockApp);
    });

    it('should load YAML configuration', async () => {
        const mockConfig = {
            className: 'TestClass',
            properties: {
                name: { type: 'Property', name: 'name' }
            }
        };

        mockApp.vault.adapter.read.mockResolvedValue('yaml content');
        jest.doMock('js-yaml', () => ({
            load: jest.fn().mockReturnValue(mockConfig)
        }));

        const config = await configLoader.loadClassConfig('TestClass');

        expect(config.className).toBe('TestClass');
        expect(config.properties.name).toBeDefined();
    });
});
```

### Mocks pour développement

```typescript
// __mocks__/obsidian.ts
export const mockObsidianApp = () => ({
    vault: {
        adapter: {
            read: jest.fn(),
            write: jest.fn()
        },
        getAbstractFileByPath: jest.fn(),
        read: jest.fn(),
        modify: jest.fn()
    },
    metadataCache: {
        getFileCache: jest.fn()
    },
    workspace: {
        getActiveFile: jest.fn()
    }
});

export const mockVault = () => ({
    files: new Map(),
    getFromFile: jest.fn(),
    createInstance: jest.fn()
});
```

### Environnement de développement

```typescript
// dev/DevEnvironment.ts
export class DevEnvironment {
    private static instance: DevEnvironment;
    
    public debugMode = true;
    public mockData = true;
    public logLevel = 'debug';

    static getInstance() {
        if (!DevEnvironment.instance) {
            DevEnvironment.instance = new DevEnvironment();
        }
        return DevEnvironment.instance;
    }

    // Génération de données de test
    generateMockData(className: string, count: number = 10) {
        // Logique de génération de données factices
        return Array.from({ length: count }, (_, i) => 
            this.generateMockObject(className, i)
        );
    }

    // Outils de débogage
    logQuery(query: string, params: any, duration: number) {
        if (this.debugMode) {
            console.log(`[Query] ${query}`, { params, duration });
        }
    }
}
```

## 📚 Utilitaires et helpers

### Validation de schéma

```typescript
import Joi from 'joi';

export class SchemaValidator {
    private static schemas = new Map<string, Joi.Schema>();

    static registerSchema(className: string, schema: Joi.Schema) {
        this.schemas.set(className, schema);
    }

    static validate(className: string, data: any): Joi.ValidationResult {
        const schema = this.schemas.get(className);
        if (!schema) {
            throw new Error(`No schema registered for ${className}`);
        }
        return schema.validate(data);
    }
}

// Exemple d'utilisation
const contactSchema = Joi.object({
    nom: Joi.string().required(),
    email: Joi.string().email(),
    telephone: Joi.string().pattern(/^[+]?[\d\s-()]+$/)
});

SchemaValidator.registerSchema('Contact', contactSchema);
```

### Migration de données

```typescript
export class DataMigration {
    constructor(
        public version: string,
        public description: string,
        private upFunction: () => Promise<void>,
        private downFunction: () => Promise<void>
    ) {}

    async up() {
        console.log(`Applying migration ${this.version}: ${this.description}`);
        await this.upFunction();
    }

    async down() {
        console.log(`Rolling back migration ${this.version}: ${this.description}`);
        await this.downFunction();
    }
}

// Exemple de migration
const addClientNumberMigration = new DataMigration(
    '001',
    'Add automatic client numbers',
    async () => {
        // Logique de mise à jour
        const contacts = await getAllContacts();
        for (const contact of contacts) {
            if (!contact.numeroClient) {
                contact.numeroClient = generateClientNumber();
                await contact.save();
            }
        }
    },
    async () => {
        // Logique de rollback
        const contacts = await getAllContacts();
        for (const contact of contacts) {
            delete contact.numeroClient;
            await contact.save();
        }
    }
);
```

---

Cette API offre une base solide pour étendre le plugin. Consultez les tests existants pour des exemples concrets d'utilisation et n'hésitez pas à contribuer avec vos propres extensions !