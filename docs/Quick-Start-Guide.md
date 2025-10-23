# Guide de Démarrage Rapide

Ce guide vous permettra d'être opérationnel avec Obsidian CRM en moins de 5 minutes ! 🚀

## 📦 Installation

### Option 1 : Via BRAT (Recommandé)
1. Installez le plugin **[BRAT](https://github.com/TfTHacker/obsidian42-brat)**
2. Dans BRAT, ajoutez `lasagne20/obsidian-CRM`
3. Activez le plugin dans Paramètres → Plugins communautaires

### Option 2 : Installation Manuelle
1. Téléchargez depuis **[Releases](https://github.com/lasagne20/obsidian-CRM/releases)**
2. Extrayez dans `.obsidian/plugins/obsidian-CRM/`
3. Activez le plugin dans les paramètres

## ⚡ Premier Usage en 3 Étapes

### Étape 1 : Configuration de Base
Une fois installé, le plugin crée automatiquement :
- 📁 Dossier `Classes/` avec les modèles de base
- 📁 Dossier `config/` avec les configurations YAML
- 📄 Fichiers d'exemple pour commencer

### Étape 2 : Créer Votre Première Personne
1. Ouvrez la palette de commandes (`Ctrl+P`)
2. Tapez "CRM: Nouvelle Personne"
3. Remplissez les champs (nom, email, téléphone)
4. Sauvegardez !

### Étape 3 : Explorer les Fonctionnalités
- **Tableau de bord** : Vue d'ensemble de vos contacts
- **Recherche avancée** : Filtrez par critères
- **Liaison automatique** : Créez des relations entre entités

## 🎯 Exemple Concret : Gestion de Contacts

### Configuration Personne (automatique)
```yaml
# config/Personne.yaml
className: "Personne"
classIcon: "user"
properties:
  nom:
    type: "Property"
    name: "nom" 
    icon: "user"
  email:
    type: "EmailProperty"
    name: "email"
    icon: "mail"
  telephone:
    type: "PhoneProperty" 
    name: "telephone"
    icon: "phone"
  dateNaissance:
    type: "DateProperty"
    name: "dateNaissance"
    icon: "calendar"
```

### Utilisation dans une Note
```markdown
---
classe: Personne
nom: Jean Dupont
email: jean.dupont@email.com
telephone: +33123456789
dateNaissance: 1985-03-15
---

# Jean Dupont

## Notes de Contact
- Premier contact : Très intéressé par nos services
- Secteur : Technologie
- Budget : 50k€

## Prochaines Actions
- [ ] Envoyer devis
- [ ] Programmer démo
- [ ] Suivre dans 1 semaine
```

## 🏗️ Structure Automatique Créée

```
VotreVault/
├── Classes/
│   ├── Personne.md          # Template Personne
│   ├── Institution.md       # Template Institution  
│   └── Evenement.md         # Template Événement
├── config/
│   ├── Personne.yaml        # Config Personne
│   ├── Institution.yaml     # Config Institution
│   └── classes.yaml         # Config globale
├── Contacts/                # Dossier contacts (auto-créé)
├── Institutions/            # Dossier institutions
└── Dashboard.md             # Tableau de bord principal
```

## 🎨 Personnalisation Rapide

### Ajouter un Champ Personnalisé
1. Éditez `config/Personne.yaml`
2. Ajoutez votre propriété :
```yaml
secteurActivite:
  type: "SelectProperty"
  name: "secteurActivite"
  icon: "briefcase"
  options: ["Tech", "Finance", "Santé", "Éducation"]
```
3. Utilisez immédiatement dans vos notes !

### Types de Propriétés Disponibles
- **Property** : Texte simple
- **EmailProperty** : Email avec validation
- **PhoneProperty** : Téléphone avec formatage
- **DateProperty** : Date avec sélecteur
- **SelectProperty** : Liste déroulante
- **BooleanProperty** : Case à cocher
- **NumberProperty** : Nombre avec validation
- **FileProperty** : Lien vers fichier
- **LinkProperty** : Lien vers autre note

## 📊 Tableaux Dynamiques

Le plugin génère automatiquement des tableaux :
```markdown
\`\`\`crm-table
classe: Personne
colonnes: [nom, email, telephone, secteurActivite]
filtre: secteurActivite = "Tech"
tri: nom
\`\`\`
```

## ⚙️ Raccourcis Utiles

| Raccourci | Action |
|-----------|--------|
| `Ctrl+P` → "CRM: Nouvelle Personne" | Créer contact |
| `Ctrl+P` → "CRM: Tableau de bord" | Ouvrir dashboard |
| `Ctrl+P` → "CRM: Recherche avancée" | Rechercher |
| `Ctrl+P` → "CRM: Statistiques" | Voir métriques |

## 🎉 Vous êtes Prêt !

**Félicitations !** Vous maîtrisez maintenant les bases d'Obsidian CRM.

### Prochaines Étapes
1. 📖 Lisez la **[Configuration Avancée](Advanced-Configuration)** pour plus de personnalisation
2. 💡 Consultez les **[Exemples](Examples)** pour des cas d'usage concrets
3. 🤝 Rejoignez notre **[Communauté](https://github.com/lasagne20/obsidian-CRM/discussions)**

### Besoin d'Aide ?
- 🐛 **Bug ?** → [Signaler ici](https://github.com/lasagne20/obsidian-CRM/issues)
- ❓ **Question ?** → [Forum de discussion](https://github.com/lasagne20/obsidian-CRM/discussions)
- 📚 **Documentation complète** → [Wiki](https://github.com/lasagne20/obsidian-CRM/wiki)

---

**🚀 Bon CRM !** Transformez votre Obsidian en machine à gérer vos relations !