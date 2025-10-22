# Format CSV pour les propriétés YAML

Le nouveau format CSV permet de définir les propriétés sous forme de tableau pour une meilleure lisibilité :

## Format ancien (objet)
```yaml
properties:
  email:
    type: "EmailProperty"
    name: "Email"
    icon: "mail"
    defaultValue: ""
  
  relation:
    type: "MultiSelectProperty"
    name: "Type de relation"
    options:
      - name: "client"
        color: ""
      - name: "vecteur"  
        color: ""
```

## Nouveau format (tableau CSV)
```yaml
properties:
  - name: "email"
    type: "EmailProperty"
    icon: "mail"
    default: ""
  
  - name: "relation"
    type: "MultiSelectProperty"
    icon: "users"
    default: ""
    options: "client:,vecteur:,expert:"
    
  - name: "lieu"
    type: "FileProperty" 
    icon: "map-pin"
    default: ""
    classes: "Lieu,Institution"
```

## Règles de formatage CSV

### Classes multiples
```yaml
classes: "Lieu,Institution,Personne"
```

### Options multiples  
```yaml
options: "client:blue,vecteur:red,expert:green"
# Ou sans couleur :
options: "option1:,option2:,option3:"
```

### Formules
```yaml
formula: "proprieté1 + proprieté2"
```

### Affichage
```yaml
display: "fold"  # ou "tabs", "line", etc.
```

## Avantages
- Plus lisible et compact
- Facilite la maintenance
- Compatible avec l'ancien format (les deux peuvent coexister)
- Meilleure organisation des données