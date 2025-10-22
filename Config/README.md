# Système de Configuration Dynamique pour les Classes

Ce nouveau système permet de configurer les propriétés et l'affichage des classes via des fichiers YAML, éliminant le besoin de classes TypeScript héritées pour chaque type d'entité.

## Architecture

### Classes de Base
- `Classe` - Classe de base inchangée
- `SubClass` - Classe de base pour les sous-classes inchangée

### Nouveau Système de Configuration
- `ConfigLoader` - Charge et parse les fichiers YAML
- `ClassConfigManager` - Crée les classes dynamiques à partir des configurations
- `DynamicClassFactory` - Factory singleton pour gérer les classes dynamiques
- `VaultClassAdapter` - Adaptateur pour intégrer avec MyVault

## Structure des Fichiers de Configuration

Les fichiers YAML sont stockés dans le dossier `config/` à la racine du plugin.

### Format d'un fichier de configuration (exemple: `config/Personne.yaml`)

```yaml
className: "Personne"
classIcon: "circle-user-round"

parentProperty:
  type: "ObjectProperty"
  name: "Postes"
  properties:
    institution:
      type: "FileProperty"
      name: "Institution"
      classes: ["Institution", "Lieu"]
      icon: "building-2"

properties:
  email:
    type: "EmailProperty"
    name: "Email"
  
  phone:
    type: "PhoneProperty"
    name: "Téléphone"

subClassesProperty:
  name: "Type"
  subClasses:
    - name: "Animateur"
      icon: "user-check"

display:
  layout: "custom"
  containers:
    - type: "line"
      className: "metadata-line"
      properties: ["email", "phone"]
```

## Types de Propriétés Supportés

- `Property` - Propriété de base
- `FileProperty` - Référence vers un autre fichier
- `MultiFileProperty` - Références multiples
- `SelectProperty` - Liste de sélection
- `MultiSelectProperty` - Sélection multiple
- `EmailProperty` - Email avec validation
- `PhoneProperty` - Téléphone
- `LinkProperty` - Lien web
- `ObjectProperty` - Objet avec sous-propriétés
- `RatingProperty` - Notation (étoiles)
- `DateProperty` - Date
- `RangeDateProperty` - Plage de dates
- `AdressProperty` - Adresse
- `ClasseProperty` - Type de classe
- `TextProperty` - Texte libre
- `BooleanProperty` - Booléen
- `NumberProperty` - Nombre
- `MediaProperty` - Fichier média
- `FormulaProperty` - Formule calculée

## Configuration de l'Affichage

Le système supporte différents types de conteneurs pour organiser l'affichage :

- `line` - Propriétés en ligne horizontale
- `column` - Propriétés en colonne verticale
- `custom` - Affichage personnalisé

## Utilisation

### Initialisation du Système

```typescript
import { DynamicClassFactory } from './Config';

// Initialiser avec le chemin vers les configs et l'instance Obsidian
const factory = await DynamicClassFactory.initialize(pluginPath, app);

// Obtenir une classe dynamique
const PersonneClass = await factory.getClass('Personne');

// Créer une instance
const personne = await factory.createInstance('Personne', app, vault, file);
```

### Intégration avec MyVault

```typescript
import { VaultClassAdapter } from './Utils/VaultClassAdapter';

// Dans MyVault constructor
this.classAdapter = new VaultClassAdapter(this, configPath);

// Utilisation
const classe = await this.classAdapter.getFromFile(file);
```

## Migration depuis l'Ancien Système

1. **Classes existantes** → **Fichiers YAML** : Chaque classe héritée devient un fichier YAML
2. **Propriétés statiques** → **Configuration dynamique** : Les propriétés sont définies en YAML
3. **Méthodes d'affichage** → **Configuration d'affichage** : L'affichage est configuré dans le YAML
4. **Sous-classes** → **Configuration de sous-classes** : Les sous-classes deviennent des entrées YAML

## Tests et Validation

```typescript
import { runConfigTest, ConfigMigrationTester } from './Config';

// Test rapide
await runConfigTest();

// Test complet avec comparaison
const tester = new ConfigMigrationTester(configPath);
await tester.runFullTest(app, vault, legacyClasses);
```

## Fichiers de Configuration Disponibles

- `config/Personne.yaml` - Gestion des personnes/contacts
- `config/Institution.yaml` - Organisations et institutions
- `config/Lieu.yaml` - Lieux géographiques
- `config/Action.yaml` - Actions et activités
- `config/Evenement.yaml` - Événements
- `config/Partenariat.yaml` - Partenariats
- `config/Animateur.yaml` - Animateurs
- `config/Note.yaml` - Notes et rapports

## Avantages du Nouveau Système

1. **Maintenabilité** - Plus de classes TypeScript à maintenir
2. **Flexibilité** - Modification des propriétés sans recompilation
3. **Consistance** - Format uniforme pour toutes les classes
4. **Évolutivité** - Ajout facile de nouvelles propriétés ou classes
5. **Configuration** - Modification de l'affichage via configuration

## Rétrocompatibilité

Le système est conçu pour fonctionner en parallèle avec l'ancien système pendant la migration, permettant une transition progressive.