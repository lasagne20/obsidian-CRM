# Guide de Contribution

Merci de votre intérêt pour contribuer à Obsidian CRM ! 🎉

Ce guide vous aidera à contribuer efficacement au projet.

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** 16+ et **npm**
- **Git** configuré
- **Obsidian** installé (pour tests)
- **TypeScript** familiarité recommandée

### Installation Développeur
```bash
# 1. Fork et clone
git clone https://github.com/VOTRE-USERNAME/obsidian-CRM.git
cd obsidian-CRM

# 2. Installation dépendances
npm install

# 3. Configuration développement
npm run dev

# 4. Lancer les tests
npm test
```

## 📋 Processus de Contribution

### 1. Créer une Issue
Avant tout code, créez une **[GitHub Issue](https://github.com/lasagne20/obsidian-CRM/issues)** pour :
- 🐛 **Bug reports**
- ✨ **Feature requests**  
- 📝 **Documentation improvements**
- 🤔 **Questions**

### 2. Workflow Git
```bash
# Créer une branche feature
git checkout -b feature/ma-nouvelle-fonctionnalite

# Ou une branche bugfix
git checkout -b fix/correction-bug-xyz

# Développer et commiter
git add .
git commit -m "feat: ajoute nouvelle fonctionnalité XYZ"

# Push et créer PR
git push origin feature/ma-nouvelle-fonctionnalite
```

### 3. Standards de Code

#### Commits Conventionnels
Utilisez le format **[Conventional Commits](https://www.conventionalcommits.org/)** :

```bash
feat: ajoute nouvelle propriété GeoProperty
fix: corrige validation email dans EmailProperty  
docs: met à jour guide installation
test: ajoute tests pour DateProperty
refactor: améliore performance ConfigLoader
style: formate code selon prettier
chore: met à jour dépendances
```

#### Code Style
- **TypeScript** strict
- **ESLint** + **Prettier** 
- **4 espaces** d'indentation
- **Commentaires JSDoc** pour fonctions publiques

```typescript
/**
 * Valide une adresse email selon RFC 5322
 * @param email L'adresse email à valider
 * @returns true si valide, false sinon
 */
public validate(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
```

## 🧪 Tests Obligatoires

**CRITIQUE** : Tous les PRs doivent maintenir **395 tests à 100%** de réussite !

### Avant de Submit
```bash
# Tests complets
npm test

# Vérification TypeScript
npx tsc --noEmit

# Linting
npm run lint

# Format code
npm run format
```

### Ajouter des Tests
Pour toute nouvelle fonctionnalité :

```typescript
// __tests__/Properties/MaNouvellePropriete.test.ts
describe('MaNouvellePropriete', () => {
    let propriete: MaNouvellePropriete;
    
    beforeEach(() => {
        propriete = new MaNouvellePropriete('test');
    });
    
    it('should validate input correctly', () => {
        expect(propriete.validate('valid-input')).toBe(true);
        expect(propriete.validate('invalid-input')).toBe(false);
    });
    
    it('should format output properly', () => {
        const result = propriete.format('test-value');
        expect(result).toBe('expected-format');
    });
});
```

## 📁 Structure du Projet

```
obsidian-CRM/
├── Classes/                 # Classes métier principales
│   ├── Classe.ts           # Classe abstraite de base
│   ├── Personne.ts         # Implémentation Personne
│   └── SubClasses/         # Sous-classes spécialisées
├── Utils/                  # Utilitaires et configuration
│   ├── Config/            # Système configuration YAML
│   ├── Properties/        # Types de propriétés
│   ├── Display/          # Système affichage
│   └── App.ts            # Point d'entrée principal
├── __tests__/             # Suite de tests (395 tests)
│   ├── Properties/        # Tests propriétés
│   ├── Config/           # Tests configuration
│   └── Integration/      # Tests d'intégration
├── docs/                 # Documentation wiki
├── jest-config/          # Configuration Jest
└── main.ts              # Entry point plugin Obsidian
```

## 🎯 Domaines de Contribution

### 🐛 Bug Fixes
- Recherchez les **[Issues "bug"](https://github.com/lasagne20/obsidian-CRM/labels/bug)**
- Reproduisez le problème localement
- Créez un test qui échoue
- Corrigez le bug
- Vérifiez que le test passe

### ✨ Nouvelles Fonctionnalités
Domaines prioritaires :
- **Nouvelles propriétés** (ex: GeoProperty, ColorProperty)
- **Amélioration UI/UX** 
- **Intégrations tierces** (APIs externes)
- **Performance optimizations**
- **Accessibilité**

### 📝 Documentation
- Améliorer le **README**
- Compléter le **Wiki**
- Ajouter des **exemples concrets**
- Traduire en **autres langues**

### 🧪 Tests et Qualité
- Augmenter la **couverture de code**
- Ajouter des **tests edge cases**
- Améliorer les **mocks DOM**
- Optimiser la **vitesse des tests**

## 🔍 Guidelines Techniques

### Création d'une Nouvelle Propriété

1. **Créer la classe** dans `Utils/Properties/`
```typescript
// Utils/Properties/MaPropriete.ts
export class MaPropriete extends Property {
    constructor(name: string) {
        super(name);
    }
    
    validate(value: string): boolean {
        // Logique de validation
        return true;
    }
    
    createFieldContainerContent(update: Function, value: string): HTMLDivElement {
        // Création de l'UI
    }
}
```

2. **Ajouter les tests** dans `__tests__/Properties/`
```typescript
// __tests__/Properties/MaPropriete.test.ts
describe('MaPropriete', () => {
    // Tests complets avec mocks DOM
});
```

3. **Exporter** dans l'index approprié
4. **Documenter** dans le wiki

### Configuration YAML
Pour ajouter une configuration :
```yaml
# config/exemple.yaml
className: "Exemple"
classIcon: "star"
properties:
  maPropriete:
    type: "MaPropriete"
    name: "maPropriete"
    icon: "settings"
    # Autres options spécifiques
```

## 🔄 Processus de Review

### Checklist PR
Votre PR doit avoir :
- [ ] **Description claire** du changement
- [ ] **Tests passants** (395/395)
- [ ] **Code formatté** (prettier)
- [ ] **Documentation mise à jour**
- [ ] **Pas de breaking changes** (sauf version majeure)
- [ ] **Performance acceptable** (benchmarks si nécessaire)

### Review Criteria
Nous vérifions :
1. **Fonctionnalité** - Le code fait ce qu'il doit faire
2. **Tests** - Couverture complète et pertinente  
3. **Performance** - Pas de régression
4. **Sécurité** - Pas de vulnérabilités
5. **UX** - Expérience utilisateur cohérente
6. **Documentation** - Mise à jour appropriée

## 🏷️ Labels GitHub

| Label | Description |
|-------|-------------|
| `bug` | Bug confirmé nécessitant correction |
| `enhancement` | Nouvelle fonctionnalité |
| `documentation` | Amélioration docs |
| `good first issue` | Parfait pour débutants |
| `help wanted` | Besoin d'aide communauté |
| `priority: high` | Priorité élevée |
| `breaking change` | Changement incompatible |
| `performance` | Amélioration performance |

## 🤝 Communauté

### Où Obtenir de l'Aide
- **[GitHub Discussions](https://github.com/lasagne20/obsidian-CRM/discussions)** - Questions générales
- **[Discord](https://discord.gg/obsidian-crm)** - Chat en temps réel
- **[Issues](https://github.com/lasagne20/obsidian-CRM/issues)** - Bugs et features

### Code de Conduite
- 🤝 **Respectueux** et **inclusif**
- 💡 **Constructif** dans les feedbacks
- 🎯 **Focus** sur l'amélioration du projet
- 📚 **Partage** des connaissances

## 🎉 Reconnaissance

### Contributeurs
Tous les contributeurs sont listés dans :
- **[README Contributors](https://github.com/lasagne20/obsidian-CRM#contributors)**
- **[CONTRIBUTORS.md](CONTRIBUTORS.md)**
- **Changelog** pour chaque version

### Types de Contributions Reconnues
- 💻 **Code** (fonctionnalités, fixes)
- 🐛 **Bug reports** (issues détaillées)  
- 📝 **Documentation** (wiki, guides)
- 🎨 **Design** (UI/UX, icons)
- 💡 **Ideas** (suggestions, brainstorming)
- 📢 **Promotion** (articles, talks)

## 📞 Contact Mainteneurs

- **@lasagne20** - Créateur et mainteneur principal
- **Team CRM** - Équipe de développement

---

**🎯 Prêt à contribuer ?** 

Choisissez une **[good first issue](https://github.com/lasagne20/obsidian-CRM/labels/good%20first%20issue)** et lancez-vous ! 🚀

**Ensemble, construisons le meilleur CRM pour Obsidian !** 💪