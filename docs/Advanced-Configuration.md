# Configuration avancée

Ce guide couvre les fonctionnalités avancées et les options de configuration pour les utilisateurs expérimentés.

## 🏗️ Architecture des classes

### Héritage et sous-classes

```yaml
# config/Personne.yaml
className: "Personne"
classIcon: "user"
properties:
  nom: { type: "Property", name: "nom" }
  prenom: { type: "Property", name: "prenom" }
  email: { type: "EmailProperty", name: "email" }

# Définition des sous-classes
subClassesProperty:
  name: "type"
  subClasses:
    - name: "Client"
      icon: "star"
      properties:
        numeroClient: { type: "Property", name: "numeroClient" }
        chiffreAffaires: { type: "NumberProperty", name: "chiffreAffaires" }
    - name: "Fournisseur" 
      icon: "truck"
      properties:
        numeroSiret: { type: "Property", name: "numeroSiret" }
        conditionsPaiement: { type: "SelectProperty", name: "conditionsPaiement" }
```

### Propriétés complexes

#### ObjectProperty avec tableau
```yaml
properties:
  adresse:
    type: "ObjectProperty"
    name: "adresse"
    display: "table"
    properties:
      - name: "rue"
        type: "Property"
        displayName: "Rue"
      - name: "ville" 
        type: "Property"
        displayName: "Ville"
      - name: "codePostal"
        type: "Property"
        displayName: "Code postal"
      - name: "pays"
        type: "SelectProperty"
        displayName: "Pays"
        options: ["France", "Belgique", "Suisse", "Canada"]
```

#### FormulaProperty pour calculs automatiques
```yaml
properties:
  chiffreAffairesAnnuel:
    type: "FormulaProperty"
    name: "chiffreAffairesAnnuel"
    formula: "commandes.sum(montant).where(date.year == 2024)"
    icon: "calculator"
```

## 🎨 Système d'affichage avancé

### Layout personnalisé avec conteneurs
```yaml
display:
  layout: "custom"
  containers:
    - type: "tabs"
      tabs:
        - name: "Informations générales"
          properties: ["nom", "prenom", "email", "telephone"]
        - name: "Adresse"
          properties: ["adresse"]
        - name: "Professionnel"
          properties: ["entreprise", "poste", "secteur"]
        - name: "Historique"
          properties: ["dateCreation", "dernierContact", "notes"]
    
    - type: "fold"
      foldTitle: "Métadonnées"
      className: "metadata-section"
      properties: ["id", "dateCreation", "dateModification"]
```

### Templates Handlebars personnalisés
Créez `templates/classes/Personne.hbs` :

```handlebars
<div class="personne-card" data-type="{{type}}">
  <header class="card-header">
    <div class="avatar">
      {{#if photo}}
        <img src="{{photo}}" alt="{{nom}}">
      {{else}}
        <div class="avatar-placeholder">{{initiales}}</div>
      {{/if}}
    </div>
    <div class="identity">
      <h1>{{nom}} {{prenom}}</h1>
      {{#if poste}}<p class="title">{{poste}}</p>{{/if}}
      {{#if entreprise}}<p class="company">{{entreprise.nom}}</p>{{/if}}
    </div>
    <div class="status">
      <span class="badge status-{{statut.toLowerCase}}">{{statut}}</span>
    </div>
  </header>

  <section class="contact-methods">
    {{#if email}}
      <a href="mailto:{{email}}" class="contact-link email">
        <span class="icon">📧</span> {{email}}
      </a>
    {{/if}}
    {{#if telephone}}
      <a href="tel:{{telephone}}" class="contact-link phone">
        <span class="icon">📞</span> {{telephone}}
      </a>
    {{/if}}
  </section>

  {{#if adresse}}
  <section class="address">
    <h3>Adresse</h3>
    <address>
      {{adresse.rue}}<br>
      {{adresse.codePostal}} {{adresse.ville}}<br>
      {{adresse.pays}}
    </address>
  </section>
  {{/if}}

  <section class="relationships">
    {{#if projets}}
    <div class="related-items">
      <h3>Projets ({{projets.length}})</h3>
      <ul class="item-list">
        {{#each projets}}
        <li><a href="{{path}}">{{nom}} ({{statut}})</a></li>
        {{/each}}
      </ul>
    </div>
    {{/if}}

    {{#if commandes}}
    <div class="related-items">
      <h3>Commandes récentes</h3>
      <ul class="item-list">
        {{#each (limit commandes 5)}}
        <li>
          <a href="{{path}}">{{numero}}</a> 
          <span class="amount">{{montant}}€</span>
          <span class="date">{{date}}</span>
        </li>
        {{/each}}
      </ul>
    </div>
    {{/if}}
  </section>
</div>
```

### CSS personnalisé
Créez `styles/classes/Personne.css` :

```css
.personne-card {
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--background-modifier-border);
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-placeholder {
  background: var(--interactive-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  width: 100%;
  height: 100%;
}

.identity h1 {
  margin: 0;
  font-size: 1.2rem;
}

.status .badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.status-client { background: #4CAF50; color: white; }
.status-prospect { background: #FF9800; color: white; }
.status-inactif { background: #9E9E9E; color: white; }

.contact-methods {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--background-secondary);
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.2s;
}

.contact-link:hover {
  background: var(--background-modifier-hover);
}
```

## 🔗 Relations et liaisons automatiques

### Configuration des relations bidirectionnelles
```yaml
# Dans Contact.yaml
properties:
  entreprise:
    type: "FileProperty"
    name: "entreprise"
    classes: ["Entreprise"]
    # Configuration de la relation inverse
    inverseRelation:
      property: "contacts"
      type: "auto" # auto, manual, computed

# Dans Entreprise.yaml  
properties:
  contacts:
    type: "MultiFileProperty"
    name: "contacts"
    classes: ["Contact"]
    computed: true # Propriété calculée automatiquement
```

### Relations conditionnelles
```yaml
properties:
  manager:
    type: "FileProperty"
    name: "manager"
    classes: ["Personne"]
    conditions:
      - property: "type"
        operator: "equals"
        value: "Employe"
      - property: "entreprise"
        operator: "same_as"
        target: "this.entreprise"
```

## 📊 Vues et tableaux personnalisés

### Configuration de vues personnalisées
```yaml
# config/views/ContactsActifs.yaml
viewName: "Contacts Actifs"
viewType: "table"
targetClass: "Contact"
filters:
  - property: "statut"
    operator: "in"
    values: ["Client", "Prospect"]
  - property: "dernierContact"
    operator: "within"
    value: "6 months"
columns:
  - property: "nom"
    width: "200px"
    sortable: true
  - property: "entreprise.nom"
    title: "Entreprise"
    width: "150px"
  - property: "statut"
    width: "100px"
    renderer: "badge"
  - property: "dernierContact"
    width: "120px"
    renderer: "date-relative"
  - property: "chiffreAffaires"
    width: "120px"
    renderer: "currency"
    aggregation: "sum"
sorting:
  - property: "dernierContact"
    direction: "desc"
groupBy: "statut"
```

### Tableaux dynamiques avec agrégations
```yaml
# config/dashboards/VentesParMois.yaml
dashboardName: "Ventes par mois"
widgets:
  - type: "chart"
    title: "Évolution du CA"
    chartType: "line"
    dataSource:
      class: "Commande"
      groupBy: "date.month"
      aggregation:
        field: "montant"
        function: "sum"
      
  - type: "table"
    title: "Top clients"
    dataSource:
      class: "Contact"
      joins:
        - class: "Commande"
          on: "contact"
      aggregation:
        field: "commandes.montant"
        function: "sum"
        alias: "totalCA"
      orderBy: "totalCA desc"
      limit: 10
```

## 🔍 Recherche et indexation

### Configuration de l'indexation
```yaml
# config/search/index.yaml
indexing:
  classes:
    Contact:
      fields: ["nom", "prenom", "email", "entreprise.nom"]
      weights:
        nom: 3.0
        prenom: 2.0
        email: 1.5
        entreprise.nom: 1.0
      stemming: true
      synonyms:
        - ["CEO", "PDG", "Directeur Général"]
        - ["Dev", "Développeur", "Programmeur"]
```

### Recherche géospatiale
```yaml
properties:
  adresse:
    type: "AdressProperty" 
    name: "adresse"
    geocoding: true # Active la géolocalisation automatique
    
# Configuration de la recherche géospatiale
spatial:
  enabled: true
  defaultRadius: "10km"
  providers:
    - name: "nominatim"
      apiKey: null # Gratuit
    - name: "google"
      apiKey: "${GOOGLE_MAPS_API_KEY}"
```

## 🔐 Sécurité et permissions

### Configuration des permissions par classe
```yaml
# config/security/permissions.yaml
permissions:
  Contact:
    read: ["admin", "sales", "manager"]
    write: ["admin", "sales"]
    delete: ["admin"]
    fields:
      chiffreAffaires:
        read: ["admin", "manager"]
        write: ["admin"]
        
  Commande:
    read: ["admin", "sales", "accounting"]
    write: ["admin", "sales"]
    approve: ["admin", "manager"]
```

### Audit et historique
```yaml
# config/audit/settings.yaml
audit:
  enabled: true
  trackChanges: true
  trackAccess: false
  retention: "2 years"
  excludeFields: ["dateModification", "vues"]
  
  notifications:
    onDelete: 
      classes: ["Contact", "Commande"]
      recipients: ["admin"]
    onHighValueChange:
      threshold: 10000
      field: "montant"
      recipients: ["manager", "admin"]
```

## 🚀 Intégrations externes

### API REST
```yaml
# config/integrations/api.yaml
api:
  enabled: true
  port: 3000
  authentication: "token"
  
  endpoints:
    contacts:
      path: "/api/contacts"
      methods: ["GET", "POST", "PUT", "DELETE"]
      rateLimit: 100 # requêtes par minute
      
  webhooks:
    - url: "https://mon-crm.com/webhooks/contact"
      events: ["contact.created", "contact.updated"]
      secret: "${WEBHOOK_SECRET}"
```

### Synchronisation avec services externes
```yaml
# config/sync/external.yaml
synchronization:
  hubspot:
    enabled: true
    apiKey: "${HUBSPOT_API_KEY}"
    mappings:
      Contact:
        externalId: "hubspot_id"
        fields:
          nom: "lastname"
          prenom: "firstname" 
          email: "email"
          telephone: "phone"
    syncDirection: "bidirectional" # pull, push, bidirectional
    
  google_contacts:
    enabled: true
    credentialsFile: "google-credentials.json"
    mappings:
      Contact:
        fields:
          nom: "familyName"
          prenom: "givenName"
          email: "emailAddresses[0].value"
```

## ⚡ Performance et optimisation

### Configuration du cache
```yaml
# config/performance/cache.yaml
cache:
  enabled: true
  strategy: "lru" # lru, fifo, ttl
  maxSize: "100MB"
  ttl: "1 hour"
  
  preload:
    - class: "Contact"
      condition: "statut = 'Client'"
    - class: "Entreprise"
      
  indexes:
    - class: "Contact"
      fields: ["nom", "entreprise"]
    - class: "Commande" 
      fields: ["date", "montant"]
```

### Optimisation des requêtes
```yaml
# config/performance/queries.yaml
queryOptimization:
  enableQueryPlanning: true
  maxJoinDepth: 3
  timeoutMs: 5000
  
  slowQueryLogging:
    enabled: true
    thresholdMs: 1000
    
  pagination:
    defaultSize: 50
    maxSize: 500
```

## 🔄 Migrations et versioning

### Script de migration
```yaml
# config/migrations/001_add_client_number.yaml
migration:
  version: "001"
  description: "Ajouter numéro client automatique"
  
  steps:
    - type: "add_property"
      class: "Contact"
      property:
        name: "numeroClient"
        type: "Property"
        formula: "AUTO_INCREMENT('CLIENT', 4)" # CLIENT0001, CLIENT0002...
        
    - type: "update_data"
      class: "Contact"
      condition: "type = 'Client'"
      set:
        numeroClient: "AUTO_ASSIGN"
```

### Configuration du versioning
```yaml
# config/versioning/settings.yaml
versioning:
  enabled: true
  strategy: "semantic" # semantic, sequential, timestamp
  
  autoBackup:
    enabled: true
    frequency: "daily"
    retention: "30 days"
    
  changeTracking:
    enabled: true
    includeMetadata: true
    compressOldVersions: true
```

---

Ces configurations avancées permettent de créer des systèmes CRM très sophistiqués tout en conservant la flexibilité d'Obsidian. Commencez par les fonctionnalités de base puis ajoutez progressivement la complexité selon vos besoins.