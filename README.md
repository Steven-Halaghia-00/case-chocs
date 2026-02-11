# Case à Chocs – Billetterie & Suivi des Tickets (Petzi + Supabase + Horizon)

Ce document décrit l'architecture technique et le fonctionnement de l'application de suivi de tickets pour la **Case à Chocs**, construite autour de :

- **Hostinger Horizon** – front-end, UI, logique applicative low-code
- **Supabase** – base PostgreSQL, Edge Functions, secrets, authentification
- **Petzi** – fournisseur externe de billetterie, intégré via webhooks (ou simulateur Python)

L'objectif du projet est de recevoir les webhooks Petzi, de les persister dans une base structurée, puis de fournir une interface moderne pour :

- suivre les ventes de tickets,
- visualiser des KPIs et courbes de tendance,
- gérer les capacités par session,
- diagnostiquer et tester le flux webhook.

---

## 1. Architecture globale de l'application

### 1.1 Vue d'ensemble

Architecture logique :

```text
+-----------------------------+
|        Petzi (SaaS)         |
|  - Webhooks ticket_created  |
|  - Webhooks ticket_updated  |
+--------------+--------------+
               |
               | HTTPS (POST) + Petzi-Signature
               v
+-----------------------------+         +------------------------------+
|        Supabase Edge       |         |         Supabase DB          |
|   (Deno / TypeScript)      |         |      (PostgreSQL + JSONB)    |
|                             |        |                              |
|  petzi-webhook              |  --->  |  petzi_webhook_calls         |
|  process-petzi-webhook      |        |  petzi_events                |
|  process-webhook-queue      |        |  petzi_sessions              |
|  cleanup-database           |        |  petzi_session_capacity      |
|  export-tickets-csv         |        |  petzi_tickets               |
|  get-webhook-alerts         |        |  petzi_webhook_logs          |
+--------------+--------------+        |  webhook_logs                |
               |                       +------------------------------+
               |
               | Supabase client (service role / anon)
               v
+-----------------------------+
|      Hostinger Horizon      |
|  - UI / pages / dashboards  |
|  - Admin, logs, tests       |
|  - Authentification         |
+-----------------------------+
```

### 1.2 Rôles des composants

#### Hostinger Horizon

Construction visuelle de l'UI et de la logique front-end.

Pages principales :

- Dashboard global
- Analyse par événement / sessions
- Gestion de capacité
- Page Admin (Logs, Débogage, Test du flux Webhook)

Consomme l'API Supabase (PostgREST + RPC) pour :

- lire les tickets, événements, sessions, capacités,
- déclencher des Edge Functions (export CSV, tests, nettoyage, etc.).

Gère l'authentification et l'accès à la page Admin (rôle "admin" / utilisateurs internes).

#### Supabase (backend)

**PostgreSQL** : stockage structuré et relationnel des données Petzi.

**Edge Functions** :

- exposent des endpoints HTTP (notamment le webhook public et des fonctions d'admin),
- encapsulent la logique métier côté serveur.

**Secrets Edge** :

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `PETZI_WEBHOOK_SECRET` (secret HMAC partagé avec Petzi / simulateur)
- `PETZI_TOLERANCE_SECONDS` (fenêtre de tolérance temporelle pour la signature)

#### Flux général de données

1. Petzi (ou le simulateur Python) appelle `https://<project>.supabase.co/functions/v1/petzi-webhook`.
2. L'Edge Function :
   - vérifie la signature HMAC,
   - logue l'appel dans `petzi_webhook_calls` et éventuellement `webhook_logs`,
   - place le webhook dans une file de traitement (`petzi_webhook_logs` / queue interne),
   - appelle `process-petzi-webhook` ou laisse `process-webhook-queue` consommer la file.
3. `process-petzi-webhook` :
   - parse le payload,
   - upsert les événements et sessions,
   - insère / met à jour les tickets,
   - met à jour la capacité par session.
4. L'UI Horizon lit les données dans `petzi_events`, `petzi_sessions`, `petzi_session_capacity`, `petzi_tickets` pour construire :
   - KPIs globaux,
   - graphiques de tendance,
   - pages de gestion de capacité.

---

## 2. Fonctionnement du call Python (simulateur Petzi)

Le script `petzi_simulator.py` sert à simuler les webhooks Petzi sans dépendre de l'environnement de production.

### 2.1 Rôle du script

- Générer un payload JSON conforme au format Petzi.
- Générer l'en-tête de signature `Petzi-Signature`.
- Envoyer un POST sur l'URL du webhook Supabase.
- Permettre de tester les Edge Functions et la persistance en base.

### 2.2 Génération du payload JSON

Le script contient un JSON en dur, de la forme :

```json
{
  "event": "ticket_created",
  "details": {
    "ticket": {
      "number": "XXXX2941J6SABA",
      "type": "online_presale",
      "title": "Test To Delete",
      "category": "Prélocation",
      "eventId": 54694,
      "event": "Test To Delete",
      "cancellationReason": "",
      "generatedAt": "2025-02-03T10:21:21.925529+00:00",
      "sessions": [
        {
          "name": "Test To Delete",
          "date": "2026-03-27",
          "time": "21:00:00",
          "doors": "21:00:00",
          "location": {
            "name": "Case à Chocs",
            "street": "Quai Philipe Godet 20",
            "city": "Neuchatel",
            "postcode": "2000"
          }
        }
      ],
      "promoter": "Case à Chocs",
      "price": { "amount": "25.00", "currency": "CHF" }
    },
    "buyer": {
      "role": "customer",
      "firstName": "Jane",
      "lastName": "Doe",
      "postcode": "1234"
    }
  }
}
```

Avant l'envoi, le script :

- charge ce JSON avec `json.loads`,
- génère un `ticket["number"]` random via `generate_random_string`,
- re-sérialise en `data = json.dumps(data_dict, indent=4)`.

### 2.3 Signature HMAC – Petzi-Signature

Le header est construit ainsi :

```python
unix_timestamp = str(datetime.datetime.timestamp(datetime.datetime.now())).split('.')[0]
body_to_sign = f'{unix_timestamp}.{body}'.encode()

digest = hmac.new(secret.encode(), body_to_sign, "sha256").hexdigest()
headers = {
    'Petzi-Signature': f't={unix_timestamp},v1={digest}',
    'Petzi-Version': '2',
    'Content-Type': 'application/json',
    'User-Agent': 'PETZI webhook'
}
```

- `secret` est `PETZI_WEBHOOK_SECRET` (ou la valeur par défaut dans le script).
- La fonction de hachage est **HMAC-SHA256** avec digest hexadécimal.
- Le serveur doit refaire exactement le même calcul avec le raw body pour valider la signature.

### 2.4 Envoi vers Supabase

L'appel est réalisé avec `requests.post` :

```python
response = requests.post(url, data=data.encode('utf-8'), headers=headers)
```

- `url` est typiquement `https://<ref>.supabase.co/functions/v1/petzi-webhook`.
- En cas de succès (HTTP 200), la fonction affiche la réponse JSON (et un champ `valid:true/false` selon la vérification).

### 2.5 Vérification côté serveur

Côté `petzi-webhook` :

1. Lecture des headers et extraction de `Petzi-Signature`.
2. Parsing de la valeur en `t` (timestamp) et `v1` (digest).
3. Lecture du raw body texte (sans reformatage).
4. Recalcule `HMAC_SHA256(PETZI_WEBHOOK_SECRET, f"{t}.{raw_body}")`.
5. Compare en temps constant avec `v1`.
6. Retourne un JSON indiquant si la signature est valide (`valid:true/false`).

---

## 3. Interaction réelle avec Petzi en production

En production, le script Python est remplacé par Petzi :

### Configuration du webhook dans Petzi

- **URL** : `https://<project>.supabase.co/functions/v1/petzi-webhook`
- **Secret partagé** = `PETZI_WEBHOOK_SECRET`
- **Version de signature** : header `Petzi-Signature` (format `t=...,v1=...`).

### Types d'événements

- `ticket_created` : création de billet (achat).
- `ticket_updated` : annulation, changement de statut, etc.
- Éventuellement d'autres événements de test.

### Vérification de la signature

Supabase réutilise la même logique que pour le simulateur.

Si signature invalide → log + réponse `valid:false` (mais HTTP 200 pour ne pas provoquer de retry agressif).

### Traitement asynchrone via Edge Functions

- `petzi-webhook` enregistre immédiatement l'appel (`petzi_webhook_calls`) et marque la signature (`signature_valid`).
- L'événement est placé dans une file ou log (`petzi_webhook_logs`).
- `process-petzi-webhook` (ou `process-webhook-queue`) est déclenché pour :
  - valider le payload,
  - upserter les entités métier,
  - mettre à jour les capacités.

---

## 4. Étapes détaillées du traitement d'un webhook

### 4.1 Réception HTTP

Petzi appelle `POST /functions/v1/petzi-webhook`. Supabase Edge reçoit la requête Deno.

### 4.2 Lecture du raw body

La fonction lit le body brut via `await req.text()`.

Ce body est :

- stocké tel quel dans `petzi_webhook_calls.raw_payload`,
- réutilisé pour le calcul HMAC.

### 4.3 Vérification HMAC

1. Lecture de `Petzi-Signature` ou `X-Petzi-Signature`.
2. Parsing en `{ t, v1 }`.
3. Recalcul du digest attendu.
4. Mise à jour de `signature_valid` dans `petzi_webhook_calls`.

Si en-tête manquant ou format incorrect :

- log d'erreur (`webhook_logs`),
- réponse JSON avec `valid:false` et `status:"received_with_error"`.

### 4.4 Validation du payload

Le payload JSON est parsé et stocké dans :

- `petzi_webhook_calls.payload` (copie brute formatée),
- `petzi_webhook_logs.payload` pour l'historique métier.

Contrôles typiques :

- Présence de `event`, `details.ticket`, `details.ticket.number`.
- Sessions dans `details.ticket.sessions[]` (date, heure, location).
- Prix (`price.amount`, `price.currency`).
- Date d'achat réelle = `ticket.generatedAt` si disponible.

### 4.5 Enregistrement en base métier

`process-petzi-webhook` se charge :

#### Événement (`petzi_events`)

- `id` logique = `details.ticket.eventId` (id Petzi).
- `name` = `details.ticket.event`.
- `promoter`, `location`, `description` dérivés du payload.

#### Sessions (`petzi_sessions`)

Pour chaque élément de `ticket.sessions` :

- calcul d'un `starts_at` = date + time,
- `doors_at` à partir de `doors`,
- `location_*` à partir de `location`.
- Déduplication des sessions (même date + heure + lieu + événement).

#### Capacité (`petzi_session_capacity`)

Création / mise à jour d'une ligne par session :

- `capacity` (manuelle ou future synchronisation avec Petzi),
- `booked_spots` = nombre de tickets payés pour cette session,
- `available_spots` = capacity - booked_spots.
- Gestion d'un toggle "capacity_mode" ou d'un champ indiquant si la capacité est gérée manuellement ou automatiquement.

#### Tickets (`petzi_tickets`)

Un enregistrement par ticket :

- `ticket_number` = `ticket.number`,
- `session_id` = session correspondante,
- `event_id` = événement parent,
- `title`, `ticket_type`, `category`, `price`, `currency`,
- `holder_name` (concat de buyer ou champs dédiés),
- `payment_status` (ex: "paid", "cancelled"),
- `purchase_date` = `ticket.generatedAt` (la vraie date d'achat),
- `received_at` = `received_at` du webhook (timestamp du serveur),
- `webhook_call_id` = clé étrangère vers `petzi_webhook_calls.id`.

### 4.6 Mise à jour du dashboard

Une fois les données persistées :

- les vues Horizon se basent sur des `SELECT` sur `petzi_events`, `petzi_sessions`, `petzi_tickets`, `petzi_session_capacity`.
- Le dashboard reconstruit :
  - KPIs globaux (tickets vendus, revenus, événements actifs),
  - courbes de tendance (ventes cumulées dans le temps),
  - états de remplissage par session.

---

## 5. Structure de la base de données

### 5.1 Tables principales

#### `public.petzi_events`

Représente un événement Petzi (concert, soirée, festival).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | bigint (PK) | id externe Petzi |
| `name` | text | nom de l'événement |
| `promoter` | text | |
| `location` | text | |
| `description` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `public.petzi_sessions`

Sessions / dates associées à un événement.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | bigint (PK auto) | |
| `event_id` | bigint FK | → `petzi_events.id` |
| `name` | text | |
| `starts_at` | timestamptz | date/heure de début |
| `doors_at` | timestamptz | |
| `capacity` | int | optionnel |
| `capacity_mode` | text | `'limited'` ou autre |
| `location_name` | text | |
| `location_street` | text | |
| `location_city` | text | |
| `location_postcode` | text | |
| `location` | jsonb | copie complète du bloc location |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `public.petzi_session_capacity`

Capacité logique par session. **Table centrale pour la gestion de capacité.**

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | PK | |
| `session_id` | bigint FK UNIQUE | → `petzi_sessions.id` |
| `event_id` | bigint FK | → `petzi_events.id` |
| `capacity` | int | places totales |
| `available_spots` | int | places restantes |
| `booked_spots` | int | places réservées |
| `notes` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `public.petzi_tickets`

Entité "ticket" consolidée.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | PK | |
| `ticket_number` | text UNIQUE | |
| `session_id` | FK | → `petzi_sessions.id` |
| `event_id` | FK | → `petzi_events.id` |
| `title` | text | |
| `ticket_type` | text | |
| `category` | text | |
| `price` | numeric | |
| `currency` | text | |
| `holder_name` | text | |
| `holder_email` | text | |
| `holder_phone` | text | |
| `holder_postcode` | text | |
| `buyer` | jsonb | détails bruts de l'acheteur |
| `promoter` | text | |
| `payment_status` | text | `'pending'`, `'paid'`, `'cancelled'` |
| `purchase_date` | timestamptz | date d'achat réelle (`ticket.generatedAt`) |
| `received_at` | timestamptz | date de réception du webhook |
| `webhook_call_id` | uuid FK logique | → `petzi_webhook_calls.id` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

#### `public.petzi_webhook_calls`

Suivi technique d'un appel webhook.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | |
| `received_at` | timestamptz | |
| `headers` | jsonb | |
| `raw_payload` | text | |
| `signature_valid` | boolean | |
| `petzi_version` | text | |
| `event_type` | text | |
| `error_message` | text | |
| `processed_at` | timestamptz | |
| `processing_status` | enum | `'pending'`, `'processed'`, `'failed'`, … |
| `processing_error` | text | |
| `payload` | jsonb | version parsée |

#### `public.petzi_webhook_logs`

Journaux métier sur les événements webhook.

| Colonne | Type |
|---------|------|
| `id` | PK |
| `event_type` | text |
| `payload` | jsonb |
| `status` | text (`'pending'`, `'processed'`, `'error'`) |
| `error_message` | text |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

#### `public.webhook_logs`

Logs techniques centralisés (multi Edge Functions).

| Colonne | Type |
|---------|------|
| `id` | PK |
| `timestamp` | timestamptz |
| `function_name` | text |
| `log_level` | text |
| `message` | text |
| `data` | jsonb |
| `created_at` | timestamptz |

### 5.2 Relations

```
petzi_events        1 ──> N  petzi_sessions
petzi_sessions      1 ──> 1  petzi_session_capacity
petzi_sessions      1 ──> N  petzi_tickets
petzi_events        1 ──> N  petzi_tickets
petzi_webhook_calls 1 ──> N  petzi_tickets (via webhook_call_id, logique)
```

Ces relations permettent :

- d'agréger les ventes par événement, session, période,
- de calculer les taux de remplissage par session,
- de tracer l'historique côté webhooks.

---

## 6. Construction de l'application (Horizon + Edge Functions)

### 6.1 Côté Horizon

L'application Horizon est organisée en plusieurs pages / sections :

#### Dashboard

- KPIs globaux (tickets vendus, revenus, événements actifs).
- Zones de sélection d'événements et graphiques de tendance.

#### Analyse par événement

- Multi-sélection d'événements (actifs / archivés).
- Affichage de : nombre de sessions, tickets vendus, chiffre d'affaires par événement, remplissage par session (en %).
- Graphique "J0 / J-1 / J-2 …" comparant les courbes de ventes.

#### Gestion de capacité

- Sélection d'un événement (liste d'événements actifs / archivés).
- Liste des sessions (par date) pour cet événement.
- Pour chaque session : visualisation de `capacity`, `booked_spots`, `available_spots`, toggle "capacité manuelle / automatique (Petzi)", mise à jour des capacités persistée dans `petzi_session_capacity`.

#### Admin

Navigation latérale (menu réduit) :

- Logs Webhook
- Débogage
- Test du flux Webhook
- Autres outils (export CSV, nettoyage).

Zone de test : bouton "Lancer un test personnalisé" ouvrant un formulaire permettant de simuler un webhook avec des valeurs paramétrables (titre d'événement, session, catégorie, acheteur, prix, statut, date, nombre d'envois, etc.).

### 6.2 Edge Functions

| Fonction | Rôle |
|----------|------|
| `petzi-webhook` | Endpoint HTTP principal. Vérifie la signature, stocke dans `petzi_webhook_calls`, enregistre des logs techniques. Retourne toujours HTTP 2xx. |
| `process-petzi-webhook` | Traitement métier. Met à jour `petzi_events`, `petzi_sessions`, `petzi_tickets`, `petzi_session_capacity`. |
| `process-webhook-queue` | Consomme la file de webhooks en attente, permet le traitement asynchrone et le rejoué. |
| `export-tickets-csv` | Génère un export CSV des tickets pour Excel / reporting externe. |
| `get-webhook-alerts` | Repère les erreurs dans `petzi_webhook_calls` / `webhook_logs` (signatures invalides, échecs). |
| `cleanup-database` | Purge de logs anciens, nettoyage de webhooks obsolètes, archivage. |

### 6.3 Authentification / rôles

L'accès à la page Admin et aux fonctionnalités sensibles est restreint :

- soit via des rôles utilisateur dans Horizon,
- soit via des règles Row-Level Security (RLS) côté Supabase couplées aux JWT.

Les requêtes internes côté Edge Functions utilisent `SUPABASE_SERVICE_ROLE_KEY` pour bypasser les RLS lorsque nécessaire (traitement système).

---

## 7. Interfaces UI & fonctionnalités

### 7.1 Dashboard global

**Vue globale** : nombre total de tickets vendus, nombre d'événements actifs (dont dernière session ≥ aujourd'hui), chiffre d'affaires total, statistiques complémentaires (nombre de sessions, remplissage moyen, top événements).

**Sélection d'événements** : deux listes (événements actifs / archivés), multi-sélection possible pour comparer plusieurs événements.

### 7.2 Analyse par événement

Pour chaque événement sélectionné : nombre de sessions, tickets vendus, revenu total (somme des `price` des tickets "paid"), remplissage (%) par session = `booked_spots / capacity * 100`.

**Graphique "Tickets Tracker" (J0 / J-1 / J-2 …)** :

- Axe X = jours relatifs, J0 = date de la dernière session de l'événement.
- Axe Y = nombre cumulé de tickets vendus.
- Les courbes de plusieurs événements peuvent être superposées.

### 7.3 Gestion de capacité par session

Pour un événement choisi : liste des sessions ordonnées par date/heure, capacité par session, nombre de tickets réservés, indicateur de places restantes.

Toggle par session :

- **Mode manuel** : capacité éditable dans l'UI, enregistrée dans `petzi_session_capacity`.
- **Mode automatique** : capacité éventuellement synchronisée avec Petzi ou une logique par défaut.

### 7.4 Logs Webhook & Débogage

**Page "Logs Webhook"** : listage de `petzi_webhook_calls` / `webhook_logs`, filtrage par date, type d'événement, statut de traitement.

**Page "Débogage"** : affichage détaillé du payload d'un webhook, messages d'erreur de `process-petzi-webhook`, informations sur les signatures invalides.

### 7.5 Test du flux Webhook (manuel)

**Bouton "Lancer un test personnalisé"** – ouvre un formulaire permettant de :

- choisir ou saisir un titre d'événement (ou sélectionner un existant),
- définir la session (date/heure, ou choisir une session existante),
- choisir la catégorie, le prix, le statut de paiement,
- renseigner l'acheteur (nom, prénom),
- fixer la date d'achat,
- indiquer combien de fois envoyer le webhook (pour peupler massivement la BD).

Le formulaire génère un payload similaire au script Python et passe par le même pipeline (`petzi-webhook` → `process-petzi-webhook`).

### 7.6 Authentification / rôles

- Utilisateurs internes (staff Case à Chocs) pour l'Admin.
- Éventuellement un mode "read-only" pour certaines vues de monitoring.

---

## 8. Conclusion technique

### 8.1 Choix d'architecture

**Supabase** : base PostgreSQL relationnelle et typée, intégration native d'Edge Functions, gestion centralisée des secrets.

**Hostinger Horizon** : accélère le développement UI, permet d'organiser rapidement un dashboard riche, simplifie la construction de formulaires d'admin / test.

**Webhooks Petzi + HMAC** : choix sécurisé et standard pour pousser les données de billetterie ; simulateur Python pour tester localement et en laboratoire.

### 8.2 Points forts

- **Pipeline de webhooks structuré et traçable** : logs techniques + logs métier, stockage du payload brut et du payload parsé.
- **Modèle de données explicite** : séparation nette entre événements, sessions, tickets, capacités.
- **Dashboard orienté métier** : KPIs globaux, comparaisons d'événements, courbes de tendance alignées sur l'échéance (J0).
- **Outils Admin** : export CSV, nettoyage, reprocess & debug des webhooks, tests personnalisés end-to-end.

### 8.3 Évolutions possibles

- Synchronisation automatique de la capacité depuis l'API Petzi (et non plus seulement depuis l'UI).
- Ajout d'alertes temps réel (mail / Slack) via `get-webhook-alerts` pour : ventes dépassant un seuil, sessions en surcapacité, erreurs récurrentes de webhook.
- Mise en place d'une historisation plus avancée (archivage des événements anciens, partitions de table PostgreSQL).
- Exposition d'API publiques documentées (via OpenAPI) pour partager certains indicateurs avec d'autres systèmes de la Case à Chocs.
