# Guide de contribution

Merci de votre intérêt pour contribuer à Obsidian CRM ! Ce guide vous explique comment participer efficacement au développement du projet.

## 🎯 Types de contributions

Nous accueillons plusieurs types de contributions :

- **🐛 Rapports de bugs** : Signalez des problèmes ou comportements inattendus
- **✨ Nouvelles fonctionnalités** : Proposez de nouvelles idées ou améliorations
- **📝 Documentation** : Améliorez la documentation existante ou créez de nouveaux guides
- **🧪 Tests** : Ajoutez ou améliorez la couverture de tests
- **🔧 Code** : Corrections de bugs, implémentation de fonctionnalités, optimisations

## 🚀 Démarrage rapide

### 1. Configuration de l'environnement

```bash
# Forker le repository sur GitHub puis cloner votre fork
git clone https://github.com/VOTRE-USERNAME/obsidian-CRM.git
cd obsidian-CRM

# Installer les dépendances
npm install

# Configurer le remote upstream
git remote add upstream https://github.com/lasagne20/obsidian-CRM.git
```

### 2. Configuration pour le développement

```bash
# Lancer en mode développement (watch mode)
npm run dev

# Exécuter les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Vérifier le linting
npm run lint

# Corriger automatiquement le linting
npm run lint:fix
```

### 3. Structure du workflow

```bash
# Créer une branche pour votre fonctionnalité
git checkout -b feature/ma-nouvelle-fonctionnalite

# Faire vos modifications...
# Ajouter des tests si nécessaire

# Commiter vos changements
git add .
git commit -m "feat: ajouter support pour les propriétés personnalisées"

# Pousser vers votre fork
git push origin feature/ma-nouvelle-fonctionnalite

# Créer une Pull Request sur GitHub
```

## 📋 Guidelines de développement

### Standards de code

#### TypeScript
- Utilisez TypeScript strict mode
- Préférez les interfaces aux types pour les objets
- Documentez les APIs publiques avec JSDoc
- Utilisez des noms explicites pour les variables et fonctions

```typescript
// ✅ Bon
interface UserConfiguration {
    /** Nom d'affichage de l'utilisateur */
    displayName: string;
    /** Préférences de notification */
    notifications: NotificationSettings;
}

// ❌ Éviter
type Config = {
    name: string;
    opts: any;
}
```

#### Conventions de nommage
- **Classes** : PascalCase (`ConfigLoader`, `PropertyManager`)
- **Fichiers** : PascalCase pour les classes, camelCase pour les utilitaires
- **Variables/Fonctions** : camelCase (`loadConfiguration`, `isValid`)
- **Constantes** : SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Interfaces** : PascalCase avec descripteur (`UserConfig`, `DatabaseConnection`)

#### Structure des fichiers

```typescript
// En-tête du fichier avec imports groupés
import { StandardLibraryImport } from 'standard-lib';
import { ThirdPartyImport } from 'third-party';

import { LocalImport } from '../local/path';
import { RelativeImport } from './relative-path';

// Types et interfaces
interface LocalInterface {
    // ...
}

// Constantes
const LOCAL_CONSTANT = 'value';

// Classe ou fonction principale
export class MainClass {
    // Propriétés publiques d'abord
    public readonly config: LocalInterface;
    
    // Propriétés privées
    private cache: Map<string, any>;
    
    constructor(config: LocalInterface) {
        this.config = config;
        this.cache = new Map();
    }
    
    // Méthodes publiques
    public async loadData(): Promise<void> {
        // ...
    }
    
    // Méthodes privées
    private validateConfig(): boolean {
        // ...
    }
}
```

### Tests

#### Structure des tests
```typescript
describe('ConfigLoader', () => {
    let configLoader: ConfigLoader;
    let mockApp: jest.Mocked<App>;

    beforeEach(() => {
        mockApp = createMockApp();
        configLoader = new ConfigLoader('./test-config', mockApp);
    });

    describe('loadClassConfig', () => {
        it('should load valid YAML configuration', async () => {
            // Arrange
            const mockConfig = { className: 'Test', properties: {} };
            mockApp.vault.adapter.read.mockResolvedValue('yaml content');
            
            // Act
            const result = await configLoader.loadClassConfig('Test');
            
            // Assert
            expect(result.className).toBe('Test');
        });

        it('should throw error for invalid configuration', async () => {
            // Arrange
            mockApp.vault.adapter.read.mockRejectedValue(new Error('Not found'));
            
            // Act & Assert
            await expect(configLoader.loadClassConfig('Invalid'))
                .rejects.toThrow('Configuration not found');
        });
    });
});
```

#### Couverture de tests
- **Unités critiques** : 90%+ de couverture
- **Intégrations** : Cas nominaux et d'erreur
- **UI** : Tests des interactions utilisateur importantes
- **Mocks** : Isoler les dépendances externes

### Git et commits

#### Format des messages de commit
Nous utilisons la convention [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types** :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Changements qui n'affectent pas le sens du code
- `refactor`: Refactorisation sans ajout de fonctionnalité ni correction
- `test`: Ajout ou correction de tests
- `chore`: Maintenance, configuration, dépendances

**Exemples** :
```bash
feat(config): add support for custom property types
fix(display): resolve table rendering issue with long content
docs: update API documentation for ConfigLoader
test(properties): add unit tests for EmailProperty validation
```

#### Branches

- `main` : Code de production stable
- `develop` : Intégration des nouvelles fonctionnalités
- `feature/*` : Développement de nouvelles fonctionnalités
- `fix/*` : Corrections de bugs
- `release/*` : Préparation des releases

## 🐛 Rapport de bugs

### Template de rapport

```markdown
## Contexte
- **Version d'Obsidian** : 1.4.13
- **Version du plugin** : 1.2.0
- **OS** : Windows 11 / macOS 13 / Ubuntu 22.04

## Description du problème
Description claire et concise du bug.

## Étapes pour reproduire
1. Aller à '...'
2. Cliquer sur '...'
3. Faire défiler vers '...'
4. Voir l'erreur

## Comportement attendu
Description de ce qui devrait se passer.

## Comportement observé
Description de ce qui se passe réellement.

## Captures d'écran
Si applicable, ajouter des captures d'écran.

## Logs d'erreur
```
Coller ici les messages d'erreur de la console développeur
```

## Configuration
```yaml
# Coller ici la configuration pertinente si applicable
```

## Informations supplémentaires
Tout autre contexte utile sur le problème.
```

### Collecte d'informations de débogage

```javascript
// Console développeur (F12) - Exécuter ce code pour obtenir des infos de débogage
console.log('=== Obsidian CRM Debug Info ===');
console.log('Obsidian version:', app.vault.adapter.constructor.name);
console.log('Plugin version:', app.plugins.plugins['obsidian-crm']?.manifest.version);
console.log('Vault path:', app.vault.adapter.basePath);
console.log('Active plugins:', Object.keys(app.plugins.plugins));
console.log('CRM configuration:', app.plugins.plugins['obsidian-crm']?.settings);
```

## ✨ Propositions de fonctionnalités

### Template de proposition

```markdown
## Résumé
Description courte de la fonctionnalité proposée.

## Motivation
Pourquoi cette fonctionnalité est-elle nécessaire ? Quel problème résout-elle ?

## Description détaillée
Description détaillée de la fonctionnalité et de son fonctionnement.

## Exemples d'utilisation
```yaml
# Exemples de configuration
className: "Example"
properties:
  newFeature:
    type: "NewPropertyType"
    options: 
      - option1
      - option2
```

## Interface utilisateur
Mockups ou descriptions de l'interface si applicable.

## Considérations techniques
- Impact sur les performances
- Compatibilité avec les fonctionnalités existantes
- Complexité d'implémentation

## Alternatives considérées
Autres approches envisagées et pourquoi cette solution est préférée.

## Ressources supplémentaires
Liens vers des exemples similaires, documentation, etc.
```

## 🔄 Process de review

### Critères de review

1. **Fonctionnalité** : Le code fait-il ce qu'il est censé faire ?
2. **Tests** : Y a-t-il des tests appropriés ?
3. **Performance** : Y a-t-il des impacts sur les performances ?
4. **Sécurité** : Le code introduit-il des vulnérabilités ?
5. **Maintenabilité** : Le code est-il lisible et maintenable ?
6. **Documentation** : La documentation est-elle à jour ?

### Checklist pour les Pull Requests

#### Avant de soumettre
- [ ] Les tests passent (`npm test`)
- [ ] Le linting passe (`npm run lint`)
- [ ] La build fonctionne (`npm run build`)
- [ ] La documentation est mise à jour si nécessaire
- [ ] Les commits suivent la convention
- [ ] La PR a un titre et une description claire

#### Template de PR
```markdown
## Type de changement
- [ ] Bug fix (non-breaking change qui corrige un problème)
- [ ] Nouvelle fonctionnalité (non-breaking change qui ajoute de la fonctionnalité)
- [ ] Breaking change (fix ou feature qui casserait la fonctionnalité existante)
- [ ] Documentation uniquement

## Description
Description claire de vos changements et de leur motivation.

## Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests d'intégration ajoutés/mis à jour
- [ ] Tests manuels effectués

## Checklist
- [ ] Mon code suit les standards de style du projet
- [ ] J'ai effectué une auto-review de mon code
- [ ] J'ai commenté les parties complexes de mon code
- [ ] J'ai mis à jour la documentation
- [ ] Mes changements ne génèrent pas de nouveaux warnings
- [ ] Tous les tests passent

## Captures d'écran
Si applicable, ajouter des captures d'écran.
```

## 🏗️ Architecture et design

### Principes de design

1. **Modularité** : Code organisé en modules réutilisables
2. **Extensibilité** : Architecture permettant l'ajout facile de fonctionnalités
3. **Performance** : Optimisation pour les gros volumes de données
4. **Compatibilité** : Maintien de la compatibilité avec l'API Obsidian
5. **Simplicité** : Interface utilisateur intuitive

### Patterns utilisés

- **Factory Pattern** : `DynamicClassFactory` pour la création d'objets
- **Observer Pattern** : Système d'événements pour les notifications
- **Strategy Pattern** : Différents types de propriétés et d'affichage
- **Singleton Pattern** : Gestionnaires de configuration globaux

## 📈 Releases et versioning

### Semantic Versioning

- **MAJOR** (X.0.0) : Breaking changes
- **MINOR** (1.X.0) : Nouvelles fonctionnalités, rétrocompatibles
- **PATCH** (1.1.X) : Bug fixes, rétrocompatibles

### Process de release

1. **Develop → Release branch** : Création de `release/vX.X.X`
2. **Tests** : Tests complets, correction des bugs
3. **Documentation** : Mise à jour changelog et documentation
4. **Release → Main** : Merge et tag
5. **Publication** : Release GitHub et mise à jour des canaux de distribution

## 🤝 Communauté

### Channels de communication

- **GitHub Issues** : Bugs et feature requests
- **GitHub Discussions** : Questions générales et discussions
- **Discord** : Chat en temps réel (lien dans le README)
- **Forum Obsidian** : Discussions communautaires

### Code of Conduct

Nous attendons de tous les contributeurs qu'ils respectent notre [Code of Conduct](CODE_OF_CONDUCT.md) basé sur le Contributor Covenant.

### Reconnaissance

Tous les contributeurs sont reconnus dans :
- Le fichier `CONTRIBUTORS.md`
- Les notes de release
- La section remerciements du README

---

Merci de contribuer à rendre Obsidian CRM encore meilleur ! 🎉

N'hésitez pas à poser des questions si quelque chose n'est pas clair. Nous sommes là pour vous aider à contribuer efficacement.