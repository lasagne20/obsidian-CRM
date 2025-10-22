# Migration d'Obsidian vers App.ts - Documentation

## Résumé

Ce projet a été migré pour utiliser un shim personnalisé (`App.ts`) au lieu des dépendances directes d'Obsidian. Cela permet:

- ✅ **Tests plus faciles** - Mocking simplifié sans dépendances Obsidian
- ✅ **Développement isolé** - Pas besoin d'Obsidian pour développer
- ✅ **Compatibilité maintenue** - API identique à Obsidian
- ✅ **Types sécurisés** - TypeScript support complet

## Utilisation

### Import de base

```typescript
import AppShim, { TFile, Notice, setIcon } from "./Utils/App";
```

### Création d'une instance

```typescript
// Instance basique
const app = new AppShim();

// Instance avec options personnalisées
const app = AppShim.create({
  vault: {
    read: async (file) => "contenu personnalisé",
    getName: () => "Mon Vault"
  }
});

// Instance mock pour tests
const app = AppShim.createMock();
```

### Utilisation avec MyVault

```typescript
import { MyVault } from "./Utils/MyVault";

const settings = { dataFile: "data.json", additionalFiles: [] };
const vault = new MyVault(app, settings);
```

### Mock de TFile pour tests

```typescript
// TFile basique
const file = TFileClass.createMock();

// TFile personnalisé
const file = TFileClass.createMock({
  path: "mon/fichier.md",
  name: "fichier.md",
  basename: "fichier"
});
```

## API Disponible

### AppShim

- `vault` - Gestion des fichiers
- `workspace` - Interface workspace
- `metadataCache` - Cache des métadonnées
- `commands` - Système de commandes
- `plugins` - Gestion plugins
- `notice` - Système de notifications

### Fonctions utilitaires

- `Notice(message)` - Affiche une notification
- `setIcon(element, iconId)` - Définit une icône
- `isTFile(file)` - Type guard pour TFile
- `isTFolder(file)` - Type guard pour TFolder

### Classes disponibles

- `Modal` - Modales basiques
- `FuzzySuggestModal<T>` - Modales de suggestion
- `Setting` - Paramètres UI
- `TFileClass` - Implémentation TFile

## Migration effectuée

Tous les imports `from "obsidian"` ont été remplacés par `from "./Utils/App"` dans:

- ✅ Classes/ (Note.ts, Classe.ts)
- ✅ Utils/ (File.ts, MyVault.ts, Utils.ts)
- ✅ Utils/Properties/ (tous les fichiers)
- ✅ Utils/Modals/ (tous les fichiers)
- ✅ Utils/Display/ (tous les fichiers)
- ✅ __tests__/ (tous les tests)

## Compatibilité

Le shim est conçu pour être **100% compatible** avec l'API d'Obsidian. Les signatures de méthodes sont identiques, permettant une transition transparente.

## Tests

```bash
npm test
```

Tous les tests utilisent maintenant le système de mock intégré, rendant les tests plus rapides et plus fiables.