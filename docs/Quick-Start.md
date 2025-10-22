# Guide de démarrage rapide

Bienvenue dans Obsidian CRM ! Ce guide vous permettra de prendre en main rapidement le plugin.

## 📋 Prérequis

- Obsidian v1.4.0 ou plus récent
- Connaissances de base d'Obsidian et du format Markdown
- (Optionnel) Connaissances de base du format YAML pour la configuration avancée

## 🚀 Premier démarrage

### 1. Installation

Une fois le plugin installé et activé :

1. Redémarrez Obsidian
2. Vous devriez voir apparaître de nouveaux outils dans la palette de commandes (Ctrl+P)
3. Le plugin créera automatiquement un dossier `CRM/` dans votre vault

### 2. Création de votre première classe

Le plugin vient avec des classes prédéfinies, mais créons une classe personnalisée :

#### Méthode simple (Interface graphique)
1. Ouvrez la palette de commandes (Ctrl+P)
2. Tapez "CRM: Nouvelle classe"
3. Suivez l'assistant de création

#### Méthode avancée (Configuration YAML)
Créez un fichier `config/MonEntreprise.yaml` :

```yaml
className: "MonEntreprise"
classIcon: "building"
properties:
  nom:
    type: "Property"
    name: "nom"
    icon: "tag"
  secteur:
    type: "SelectProperty"
    name: "secteur"
    options:
      - name: "Technologie"
        color: "blue"
      - name: "Finance"
        color: "green"
      - name: "Santé"
        color: "red"
  siteWeb:
    type: "LinkProperty"
    name: "siteWeb"
    icon: "external-link"
  contact:
    type: "FileProperty"
    name: "contact"
    classes: ["Personne"]
display:
  layout: "custom"
  containers:
    - type: "line"
      properties: ["nom", "secteur"]
    - type: "line"
      properties: ["siteWeb", "contact"]
```

### 3. Créer votre premier objet

1. Dans votre vault, créez un nouveau fichier : `CRM/Entreprises/Apple.md`
2. Le plugin détectera automatiquement qu'il s'agit d'une entreprise
3. Utilisez Ctrl+P puis "CRM: Éditer propriétés" pour remplir les informations

### 4. Utiliser les vues et tableaux

- **Vue liste** : `Ctrl+P` → "CRM: Afficher la liste des entreprises"
- **Vue tableau** : `Ctrl+P` → "CRM: Tableau des entreprises"
- **Vue carte** : `Ctrl+P` → "CRM: Carte des entreprises" (si propriété adresse configurée)

## 🎯 Cas d'usage typiques

### 1. CRM simple
```yaml
# Contact.yaml
className: "Contact"
properties:
  nom: { type: "Property" }
  email: { type: "EmailProperty" }
  telephone: { type: "PhoneProperty" }
  entreprise: { type: "FileProperty", classes: ["Entreprise"] }
  statut: 
    type: "SelectProperty"
    options:
      - { name: "Prospect", color: "yellow" }
      - { name: "Client", color: "green" }
      - { name: "Inactif", color: "gray" }
```

### 2. Gestion de projet
```yaml
# Projet.yaml
className: "Projet"
properties:
  nom: { type: "Property" }
  description: { type: "TextProperty" }
  dateDebut: { type: "DateProperty" }
  dateFin: { type: "DateProperty" }
  budget: { type: "NumberProperty" }
  responsable: { type: "FileProperty", classes: ["Personne"] }
  equipe: { type: "MultiFileProperty", classes: ["Personne"] }
  statut:
    type: "SelectProperty"
    options:
      - { name: "En attente", color: "gray" }
      - { name: "En cours", color: "blue" }
      - { name: "Terminé", color: "green" }
      - { name: "Annulé", color: "red" }
```

### 3. Inventaire
```yaml
# Produit.yaml
className: "Produit"
properties:
  nom: { type: "Property" }
  sku: { type: "Property" }
  prix: { type: "NumberProperty" }
  stock: { type: "NumberProperty" }
  categorie: { type: "SelectProperty" }
  fournisseur: { type: "FileProperty", classes: ["Fournisseur"] }
  photos: { type: "MediaProperty" }
```

## 🔗 Liens entre objets

Le plugin gère automatiquement les relations bidirectionnelles :

1. Si vous liez un Contact à une Entreprise
2. L'Entreprise affichera automatiquement ce Contact dans sa liste de contacts
3. Les modifications se propagent automatiquement

## 📊 Tableaux et statistiques

### Tableau automatique
Tout dossier contenant des objets d'une même classe génère automatiquement :
- Un tableau de synthèse
- Des statistiques de base
- Des filtres par propriété

### Tableaux personnalisés
Créez des vues personnalisées avec la syntaxe :

```markdown
```crm-table
classe: Contact
filtres:
  statut: Client
  entreprise.secteur: Technologie
colonnes: [nom, email, entreprise, dernierContact]
tri: dernierContact desc
```
```

## 🎨 Personnalisation de l'affichage

### Templates personnalisés
Créez des templates dans `templates/classes/` :

```handlebars
<!-- templates/classes/Contact.hbs -->
<div class="contact-card">
  <h3>{{nom}}</h3>
  <div class="contact-info">
    <span class="email">{{email}}</span>
    <span class="phone">{{telephone}}</span>
  </div>
  {{#if entreprise}}
  <div class="company">{{entreprise.nom}}</div>
  {{/if}}
</div>
```

## 🔍 Recherche avancée

### Recherche par propriété
```
crm:nom:"John Doe"
crm:statut:Client
crm:entreprise.secteur:Technologie
```

### Recherche géographique (si configurée)
```
crm:adresse.ville:Paris
crm:adresse.distance:10km
```

## ⚙️ Configuration globale

Accédez aux paramètres via : Paramètres → Options du plugin → Obsidian CRM

Options importantes :
- **Dossier CRM** : Dossier racine pour les données CRM
- **Auto-organisation** : Réorganise automatiquement les fichiers
- **Synchronisation** : Active la sync bidirectionnelle des liens
- **Géolocalisation** : Active les fonctionnalités de carte

## 🚨 Problèmes courants

### Le plugin ne détecte pas mes classes
- Vérifiez que les fichiers YAML sont dans le dossier `config/`
- Redémarrez Obsidian après modification des configurations
- Vérifiez la syntaxe YAML avec un validateur

### Les propriétés ne s'affichent pas
- Assurez-vous que le fichier est dans le bon dossier (ex: `CRM/Contacts/`)
- Vérifiez que le nom de classe correspond exactement
- Utilisez la commande "CRM: Recharger les configurations"

### Les liens ne fonctionnent pas
- Vérifiez que les classes liées sont bien définies
- Assurez-vous que les fichiers existent
- Utilisez la commande "CRM: Réparer les liens"

## 📞 Support

- [Issues GitHub](https://github.com/lasagne20/obsidian-CRM/issues) pour les bugs
- [Discussions](https://github.com/lasagne20/obsidian-CRM/discussions) pour les questions
- [Wiki](https://github.com/lasagne20/obsidian-CRM/wiki) pour la documentation complète

## 📈 Étapes suivantes

1. Consultez la [Configuration avancée](Advanced-Configuration.md) pour personnaliser davantage
2. Explorez les [Exemples](Examples.md) pour d'autres cas d'usage
3. Rejoignez la communauté pour partager vos configurations !

---

Prêt à créer votre premier CRM dans Obsidian ? Commencez par créer une classe simple et expérimentez !