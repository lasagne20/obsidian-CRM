# 📚 Configuration du Wiki GitHub

Ce document explique comment configurer le wiki GitHub pour le projet Obsidian CRM.

## 🎯 Étapes de Configuration

### 1. Activer le Wiki GitHub
1. Allez dans **Settings** du repository GitHub
2. Scrollez jusqu'à **Features**
3. Cochez **Wiki** pour l'activer
4. Cliquez **Save changes**

### 2. Créer les Pages du Wiki
Le dossier `docs/` contient toutes les pages préparées :

#### Pages Principales
- **`Home.md`** → Page d'accueil du wiki
- **`Quick-Start-Guide.md`** → Guide de démarrage rapide  
- **`Testing-Guide.md`** → Documentation des tests (395 tests)
- **`Contributing-Guide.md`** → Guide de contribution
- **`FAQ.md`** → Questions fréquemment posées
- **`_Sidebar.md`** → Navigation latérale du wiki

### 3. Upload des Pages
Pour chaque fichier dans `docs/` :

1. **Aller dans le Wiki** : `https://github.com/lasagne20/obsidian-CRM/wiki`
2. **Créer une nouvelle page** avec le même nom (sans `.md`)
3. **Copier le contenu** du fichier correspondant
4. **Sauvegarder** la page

#### Mapping des Fichiers
```
docs/Home.md              → Wiki: Home (page d'accueil)
docs/Quick-Start-Guide.md → Wiki: Quick-Start-Guide  
docs/Testing-Guide.md     → Wiki: Testing-Guide
docs/Contributing-Guide.md → Wiki: Contributing-Guide
docs/FAQ.md               → Wiki: FAQ
docs/_Sidebar.md          → Wiki: _Sidebar (navigation)
```

### 4. Configuration de la Navigation
1. **Créer `_Sidebar`** avec le contenu de `docs/_Sidebar.md`
2. **Définir `Home` comme page d'accueil**
3. **Vérifier les liens internes** entre pages

### 5. Pages Additionnelles à Créer

#### Advanced-Configuration
```markdown
# Configuration Avancée

Guide complet pour personnaliser Obsidian CRM selon vos besoins.

[Contenu à développer avec exemples YAML, propriétés custom, etc.]
```

#### Property-Types
```markdown
# Types de Propriétés

Documentation complète de tous les types de propriétés disponibles.

[Liste détaillée : Property, EmailProperty, PhoneProperty, DateProperty, etc.]
```

#### Architecture
```markdown
# Architecture du Projet

Vision technique de l'architecture interne du plugin.

[Diagrammes, flux de données, patterns utilisés, etc.]
```

#### Examples
```markdown
# Exemples d'Utilisation

Cas pratiques concrets d'utilisation d'Obsidian CRM.

[Scénarios réels : freelance, PME, association, etc.]
```

## 🔗 Configuration des Liens

### Liens Internes Wiki
Format : `[Texte](Nom-Page-Wiki)`
```markdown
[Guide de démarrage](Quick-Start-Guide)
[Tests](Testing-Guide)
[Contribution](Contributing-Guide)
```

### Liens vers GitHub
```markdown
[Dépôt GitHub](https://github.com/lasagne20/obsidian-CRM)
[Issues](https://github.com/lasagne20/obsidian-CRM/issues)
[Discussions](https://github.com/lasagne20/obsidian-CRM/discussions)
```

## 🎨 Personnalisation

### Ajouter des Images
1. Uploader dans un issue GitHub pour obtenir URL
2. Utiliser `![Alt text](URL)` dans les pages wiki

### Badges et Métriques
```markdown
![Tests](https://img.shields.io/badge/tests-395%20passing-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
```

## ✅ Checklist de Configuration

- [ ] Wiki activé dans Settings GitHub
- [ ] Page `Home` créée (page d'accueil)
- [ ] Page `_Sidebar` créée (navigation)
- [ ] Page `Quick-Start-Guide` créée
- [ ] Page `Testing-Guide` créée  
- [ ] Page `Contributing-Guide` créée
- [ ] Page `FAQ` créée
- [ ] Liens internes testés
- [ ] Navigation fonctionnelle
- [ ] Pages additionnelles créées si nécessaire

## 🔄 Maintenance du Wiki

### Synchronisation avec les Docs
Quand vous modifiez `docs/*.md` :
1. Copiez le nouveau contenu
2. Mettez à jour la page wiki correspondante
3. Vérifiez les liens cassés

### Ajout de Nouvelles Pages
1. Créez d'abord dans `docs/`
2. Ajoutez à `docs/_Sidebar.md`
3. Créez la page wiki correspondante
4. Mettez à jour la navigation

## 📞 Support Wiki

Si vous avez des questions sur la configuration du wiki :
- **Issues GitHub** pour problèmes techniques
- **Discussions GitHub** pour questions générales

---

**🎉 Une fois configuré, votre wiki sera accessible à :**
`https://github.com/lasagne20/obsidian-CRM/wiki`

**Documentation complète et professionnelle pour tous les utilisateurs !** 📚