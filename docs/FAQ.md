# FAQ - Questions Fréquemment Posées

## 🤔 Questions Générales

### Q: Qu'est-ce que Obsidian CRM ?
**R:** Obsidian CRM est un plugin pour Obsidian qui transforme votre vault en système de gestion de relations client (CRM) puissant. Il permet de créer des classes personnalisables (Personne, Institution, etc.) avec des propriétés riches et des affichages sur mesure.

### Q: Pourquoi utiliser Obsidian CRM plutôt qu'un CRM traditionnel ?
**R:** 
- ✅ **Données sous votre contrôle** - Pas de cloud obligatoire
- ✅ **Intégration native Obsidian** - Liens bidirectionnels, graph view, etc.
- ✅ **Personnalisation totale** - Classes et propriétés configurables
- ✅ **Open source** - Code transparent et extensible
- ✅ **Performance** - Aucune limite de données

### Q: Est-ce que mes données sont sécurisées ?
**R:** Oui ! Vos données restent dans votre vault Obsidian local. Le plugin ne transmet aucune information vers des serveurs externes. Vous gardez un contrôle total sur vos données.

## 📦 Installation & Configuration

### Q: Comment installer le plugin ?
**R:** Deux méthodes :
1. **BRAT** (recommandé) : Installez BRAT, puis ajoutez `lasagne20/obsidian-CRM`
2. **Manuel** : Téléchargez depuis GitHub Releases et extrayez dans `.obsidian/plugins/`

### Q: Le plugin fonctionne sur mobile ?
**R:** Oui ! Le plugin est compatible avec Obsidian mobile (iOS/Android). Toutes les fonctionnalités sont disponibles.

### Q: Puis-je personnaliser les classes ?
**R:** Absolument ! Éditez les fichiers YAML dans le dossier `config/` pour :
- Ajouter/supprimer des propriétés
- Changer les types de champs
- Modifier l'affichage
- Créer de nouvelles classes

### Q: Comment sauvegarder ma configuration ?
**R:** Votre configuration est dans les fichiers `config/*.yaml`. Sauvegardez ce dossier pour préserver vos personnalisations.

## 🔧 Utilisation

### Q: Comment créer un nouveau contact ?
**R:** 
1. Palette de commandes (`Ctrl+P`)
2. Tapez "CRM: Nouvelle Personne" 
3. Ou créez manuellement avec `classe: Personne` dans le frontmatter

### Q: Puis-je importer mes contacts existants ?
**R:** Oui ! Créez des notes Markdown avec le bon frontmatter :
```markdown
---
classe: Personne
nom: Jean Dupont
email: jean@example.com
---
```

### Q: Comment créer des relations entre entités ?
**R:** Utilisez les liens Obsidian standard `[[Nom de la personne]]` ou les propriétés LinkProperty pour des relations typées.

### Q: Les tableaux sont-ils automatiques ?
**R:** Oui ! Utilisez les blocs code `crm-table` :
```markdown
\`\`\`crm-table
classe: Personne
colonnes: [nom, email, telephone]
\`\`\`
```

## 🐛 Problèmes Courants

### Q: Le plugin ne s'active pas
**R:** Vérifiez :
1. Version Obsidian 1.4.0+ requise
2. Plugin activé dans Paramètres → Plugins communautaires
3. Pas de conflit avec d'autres plugins
4. Console développeur pour messages d'erreur

### Q: Les propriétés ne s'affichent pas
**R:** 
1. Vérifiez le frontmatter avec `classe: NomDeClasse`
2. Contrôlez la configuration YAML dans `config/`
3. Rechargez le plugin (désactiver/réactiver)

### Q: Erreur "Class not found"
**R:** 
1. Le fichier `config/NomClasse.yaml` existe ?
2. La syntaxe YAML est correcte ?
3. Essayez de recharger les configurations

### Q: Performance lente avec beaucoup de données
**R:** 
1. Utilisez les filtres dans les tableaux
2. Organisez en sous-dossiers
3. Limitez les colonnes affichées
4. Consultez le [Guide Performance](Performance)

## 💡 Astuces & Bonnes Pratiques

### Q: Comment organiser mes données ?
**R:** Structure recommandée :
```
VotreVault/
├── Contacts/           # Personnes physiques
├── Entreprises/        # Institutions
├── Projets/           # Événements/projets  
├── Templates/         # Modèles de notes
└── Dashboard.md       # Vue d'ensemble
```

### Q: Puis-je utiliser des templates ?
**R:** Oui ! Le plugin génère automatiquement des templates dans `Classes/`. Vous pouvez les personnaliser ou créer vos propres templates Templater/Core.

### Q: Comment faire du reporting ?
**R:** 
- Utilisez les tableaux dynamiques avec filtres
- Combinez avec les plugins Dataview pour des requêtes avancées
- Créez un Dashboard avec métriques clés

### Q: Intégration avec d'autres plugins ?
**R:** Compatible avec :
- **Dataview** - Requêtes avancées
- **Templater** - Templates dynamiques  
- **Calendar** - Événements datés
- **Kanban** - Gestion de pipeline
- **Graph Analysis** - Analyse de réseau

## 🚀 Développement & Contribution

### Q: Puis-je contribuer au projet ?
**R:** Bien sûr ! Consultez le [Guide de Contribution](Contributing-Guide). Nous cherchons :
- Nouvelles propriétés
- Améliorations UI/UX
- Tests supplémentaires
- Documentation
- Traductions

### Q: Comment créer une propriété personnalisée ?
**R:** Consultez le [Developer API](Developer-API) pour créer des propriétés custom héritant de la classe `Property`.

### Q: Le code est-il testé ?
**R:** Oui ! **395 tests automatisés** avec 100% de réussite. Voir [Testing Guide](Testing-Guide).

## 📞 Support

### Q: Où obtenir de l'aide ?
**R:** 
- **GitHub Issues** - Bugs et feature requests
- **GitHub Discussions** - Questions générales
- **Discord** - Chat communauté (lien dans README)
- **Wiki** - Documentation complète

### Q: Comment signaler un bug ?
**R:** 
1. Créez une **[GitHub Issue](https://github.com/lasagne20/obsidian-CRM/issues)**
2. Incluez : version plugin, version Obsidian, steps to reproduce
3. Ajoutez logs console si possible

### Q: Le projet est-il maintenu ?
**R:** Oui ! Développement actif avec releases régulières. Consultez le [Changelog](Changelog) et [Roadmap](Roadmap).

---

## 🤝 Votre Question N'est Pas Listée ?

**Posez-la !** 
- 💬 **[GitHub Discussions](https://github.com/lasagne20/obsidian-CRM/discussions)**
- 🐛 **[Issues](https://github.com/lasagne20/obsidian-CRM/issues)** (pour bugs)

Nous mettons à jour régulièrement cette FAQ avec les nouvelles questions de la communauté !