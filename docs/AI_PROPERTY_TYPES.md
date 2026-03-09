# AI Entity Extraction - Property Type Handling

## Vue d'ensemble

Le système d'extraction IA gère désormais correctement tous les types de propriétés définis dans les fichiers de configuration YAML, notamment :

- **FileProperty** : Liens vers d'autres entités (création automatique si inexistante)
- **ObjectProperty** : Propriétés avec sous-propriétés imbriquées
- **MultiSelectProperty** : Tableaux de valeurs
- **PhoneProperty, EmailProperty, etc.** : Types spécialisés avec formatage

## Architecture

### 1. Prompt système amélioré

Le prompt système généré par `EntityExtractor.buildSystemPrompt()` décrit maintenant précisément chaque type de propriété :

```typescript
// Exemple de description générée
Personne:
  - postes: ObjectProperty {institution: lien vers Institution/Lieu, poste: Property}
  - relation: MultiSelectProperty [options: client, vecteur, expert, ...]
  - email: EmailProperty
  - phone: PhoneProperty
```

### 2. Conversion de propriétés

La méthode `convertPropertyValue()` dans `main.ts` gère la conversion intelligente des valeurs extraites :

#### FileProperty (Liens vers entités)

```typescript
// Extrait : "Mairie de Saint Marcel"
// 1. Cherche si l'entité existe déjà
// 2. Si oui : retourne le lien wikilink [[Nom]]
// 3. Si non : crée automatiquement l'entité
// 4. Retourne le lien wikilink [[Nom]]
```

**Format de retour** : Chaîne de caractères au format wikilink `[[NomEntité]]`

**Exemple concret** :
```yaml
# Propriété dans Personne.yaml
postes:
  type: "ObjectProperty"
  properties:
    institution:
      type: "FileProperty"
      classes: ["Institution", "Lieu"]
    poste:
      type: "Property"
```

**Texte** : "Marie Le Moine, Directrice à la Mairie de Saint Marcel"

**Résultat** :
- Crée `Personne/Marie Le Moine.md`
- Crée `Institution/Mairie de Saint Marcel.md` (si inexistante)
- Lie les deux entités via le champ `postes`

**Important** : Les FileProperty retournent des liens au format wikilink `[[...]]` pour une intégration parfaite avec Obsidian.

#### ObjectProperty (Propriétés imbriquées)

```typescript
// Gestion récursive des sous-propriétés
postes: {
  institution: "[[Mairie de Saint Marcel]]",  // FileProperty → wikilink
  poste: "Directrice"                         // Property → texte simple
}
```

#### MultiSelectProperty

```typescript
// Conversion automatique en tableau
relation: "client" → ["client"]
relation: ["client", "expert"] → ["client", "expert"]
```

### 3. Création d'entités avec markdown-crm

Le système utilise désormais `vault.createFile()` au lieu de la création manuelle :
Nouvelle méthode (via markdown-crm)
const dataObject = {
  name: entityName,  // ← IMPORTANT: Required by markdown-crm
  _className: className,
  ...convertedProperties
};

const instance = await factory.createInstanceFromDataObject(
  className,
  dataObject,
  this.vault
);
```

**Avantages** :
- ✅ Gère automatiquement les templates de classe
- ✅ Applique les règles de parent/folder définies dans YAML
- ✅ Crée les métadonnées correctement formatées
- ✅ Supporte les hooks et validations de markdown-crm

**Note importante** : La propriété `name` est **obligatoire** dans le `dataObject` pour que markdown-crm puisse créer le fichier avec le bon nom.s YAML
- ✅ Crée les métadonnées correctement formatées
- ✅ Supporte les hooks et validations de markdown-crm

### 4. Gestion des entités liées

Le Map `createdEntities` permet d'éviter les doublons lors de la création batch :

```typescript
const createdEntities = new Map<string, any>();

// Première entité avec lien
await createEntityFile(personne1, createdEntities);
// Crée Institution X et la stocke dans createdEntities

// Deuxième entité avec le même lien
await createEntityFile(personne2, createdEntities);
// Réutilise Institution X depuis createdEntities au lieu de recréer
```

## Flux de travail complet

1. **Utilisateur sélectionne du texte** et clique "✨ Extraire avec IA"

2. **EntityExtractor analyse** le texte avec le prompt système enrichi

3. **IA extrait** les entités avec types corrects :
   ```json
   {
     "entities": [
       {
         "type": "Personne",
         "data": {
           "nom": "Marie Le Moine",
           "postes": {
             "institution": "Mairie de Saint Marcel",
             "poste": "Directrice"
           }
         }
       }
     ]
   }
   ```

4. **AIExtractModal** affiche pour validation

5. **Conversion des propriétés** :
   - `postes.institution` : FileProperty → cherche/crée Institution
   - `postes.poste` : Property → garde "Directrice" tel quel

6. **Création via markdown-crm** :
   - Configure selon YAML (parent, folder, template)
   - Crée les fichiers avec métadonnées correctes
   - Établit les liens entre entités

## Tests

Le fichier `__tests__/Services/PropertyConverter.test.ts` contient 12 tests couvrant :

- ✅ FileProperty avec fichier existant
- ✅ FileProperty avec création de nouveau fichier
- ✅ FileProperty avec cache d'entités créées
- ✅ ObjectProperty avec propriétés imbriquées
- ✅ MultiSelectProperty (valeur unique → array)
- ✅ MultiSelectProperty (array → array)
- ✅ Types basiques (Phone, Email, Property)
- ✅ Cas limites (null, undefined)

## Exemple d'utilisation

### Texte d'entrée

```
10/02 Appelé Marie Le Moine, de la mairie de Saint Marcel, 
me recontacte la semaine prochaine : 01.02.04.05.52
```

### Entités créées

**1. Personne/Marie Le Moine.md**
```yaml
---
Classe: Personne
nom: Marie Le Moine
phone: +33102040552
postes:
  institution: "[[Mairie de Saint Marcel]]"
  poste: "Contact"
---
```

**2. Institution/Mairie de Saint Marcel.md**
```yaml
---
Classe: Institution
nom: Mairie de Saint Marcel
type: Collectivité
---
```

### Relations établies

- Personne → Institution via `postes.institution`
- Institution créée automatiquement si inexistante
- Lien bidirectionnel géré par markdown-crm

## Configuration requise

Pour que l'extraction fonctionne correctement, les fichiers YAML doivent définir :

```yaml
properties:
  # FileProperty : spécifier les classes cibles
  institution:
    type: "FileProperty"
    classes: ["Institution", "Lieu"]
  
  # ObjectProperty : définir les sous-propriétés
  postes:
    type: "ObjectProperty"
    properties:
      institution:
        type: "FileProperty"
        classes: ["Institution"]
      poste:
        type: "Property"
  
  # MultiSelectProperty : lister les options
  relation:
    type: "MultiSelectProperty"
    options:
      - name: "client"
      - name: "expert"
```

## Améliorations futures possibles

- [ ] Désambiguïsation intelligente (plusieurs entités avec le même nom)
- [ ] Suggestions basées sur l'historique
- [ ] Extraction de relations inverses (Institution → Personnes)
- [ ] Support des ArrayProperty et autres types complexes
- [ ] UI pour éditer les ObjectProperty dans la modal
