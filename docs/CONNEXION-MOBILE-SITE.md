# Connexion unique Wolopi Mobile ↔ Wolopi Site

Ce document décrit la **communication** entre l’app mobile et le site pour un **utilisateur connecté** : envoi de données du mobile vers le site (sessions, historiques), **en fichiers** (dont SVF), alimentation des **dashboards** web, et possibilité d’autres types de données.

---

## 1. Principe : communication pour un utilisateur connecté

- **Un compte** = un `User` (email, nom, lié à l’app via `mobileUserId` après liaison).
- **Communication** = l’**envoi de données**, par l’app mobile vers le site, **pour cet utilisateur connecté** (compte lié). Les données sont stockées côté site et servent aux **dashboards** (courbes, historiques) et à d’autres usages futurs.
- **Données envoyées par le mobile** :
  - **Historiques de session** (sessions d’entraînement : velocity, mobility, jump, rula).
  - Envoi **sous forme de fichiers** : **SVF** (format dédié Wolopi) ou JSON/CSV pour l’historique et les métriques.
- **Côté site** : les données reçues alimentent les **dashboards** (visualisation des sessions, courbes, historiques) et peuvent servir à d’**autres fonctionnalités** (export, rapports, etc.).

Résumé : **un même compte** ; le mobile **envoie** les données (sessions, historiques en fichiers SVF ou autres) ; le site **stocke** et **affiche** (dashboards) pour cet utilisateur connecté, avec possibilité d’étendre à d’autres types plus tard.

---

## 2. Modèle de données (côté site)

| Modèle      | Rôle |
|------------|------|
| **User**   | Compte (email, `mobileUserId` = lien avec l’app une fois liée). |
| **Athlete**| Athlète rattaché à un `User` (nom, `mobileAthleteId` optionnel, `isDefault`). |
| **Session**| Une session d’entraînement (type, dates, répétitions, `rawPayload`). Appartient à un `Athlete`. Utilisée pour **historiques** et **dashboards**. |
| **LinkCode** | Code court pour lier l’app au compte (saisi dans l’app). |
| **ApiToken** | Token permettant à l’app d’envoyer les données (transfert). |

Flux : **User** → **Athlete(s)** → **Session(s)**. Les données envoyées par le mobile (fichiers SVF, JSON, etc.) sont transformées en `Session` (et champs associés) pour alimenter les **historiques** et les **dashboards**.

---

## 3. Lier l’app au compte (connexion unique)

1. **Sur le site** (utilisateur connecté) : Mon compte → « Générer un code ».
2. **Sur l’app** : « Lier à mon compte web » → saisie du code.
3. L’app appelle `POST /api/sync/link/claim` avec `code`, `mobileUserId`, etc.
4. Le site renvoie un **token API**. L’app le stocke et l’utilise pour **tous les envois** (sessions, fichiers).

Une fois lié, toutes les données envoyées par le mobile sont associées à ce compte (et à l’athlète choisi).

---

## 4. Transfert des données : Mobile → Site

Deux modes complémentaires pour l’**utilisateur connecté** :

### 4.1 Envoi en JSON (sessions une par une ou en lot)

- **POST /api/sync/sessions**  
  Body : `{ sessions: [ { type, startedAt, endedAt?, repCount?, rawPayload? } ], athleteId? }`  
  Utilisation : envoi direct de sessions (temps réel ou lot).

### 4.2 Envoi en fichiers (historiques, export)

- **POST /api/sync/upload**  
  **Header** : `Authorization: Bearer <token>`  
  **Body** : `multipart/form-data` avec un ou plusieurs **fichiers** :
  - **Fichiers SVF** : format dédié Wolopi (contenu interprété comme historique de sessions / métriques).
  - **Fichiers JSON** : tableau de sessions (même structure que `sessions` ci‑dessus).
  - **Fichiers CSV** : lignes de sessions (colonnes type, startedAt, endedAt, repCount, etc.).

Le site parse les fichiers et crée/met à jour les **Session** correspondantes. Ces données alimentent les **historiques de session** et les **dashboards** (courbes, tableaux, filtres par athlète/date/type).

### 4.3 Dashboards et historiques côté site

- Les **dashboards** (pages web réservées à l’utilisateur connecté) lisent les **Session** (et données dérivées) en base.
- **GET /api/sync/sessions** (avec token) permet de lister les sessions du compte (pour le dashboard ou l’app).
- Les données reçues **par JSON** ou **par fichiers (SVF, JSON, CSV)** sont donc visibles dans les **historiques** et **dashboards** après transfert.

### 4.4 Autres types de données (ultérieur)

- Le même mécanisme (token + upload ou API dédiée) peut être étendu plus tard à d’**autres types** (ex. profils force‑vitesse, exports spécifiques, métadonnées). La structure actuelle (User → Athlete → Session) et l’API d’upload (fichiers SVF/JSON/CSV) restent la base ; de nouvelles routes ou champs pourront s’y ajouter.

---

## 5. APIs disponibles

| Route | Rôle |
|-------|------|
| `POST /api/sync/link/code` | Génère un code de liaison (site, utilisateur connecté). |
| `POST /api/sync/link/claim` | Lie l’app au compte et renvoie le token API. |
| `POST /api/sync/sessions` | Reçoit les sessions en JSON (Bearer token). |
| `POST /api/sync/upload` | Reçoit les **historiques / données en fichiers** (SVF, JSON, CSV) pour alimenter sessions, historiques et dashboards. |
| `GET /api/sync/sessions` | Liste les sessions du compte (dashboards, app). |

---

## 6. Sécurité

- **LinkCode** : courte durée, usage unique.
- **ApiToken** : stocké hashé, transmis une seule fois à l’app à la liaison.
- **HTTPS** en production.
- Toutes les routes de transfert (sessions, upload) exigent **Authorization: Bearer <token>** pour l’**utilisateur connecté** (compte lié).

En résumé : la **communication** = envoi de données (sessions, historiques en **fichiers SVF** ou JSON/CSV) du **mobile vers le site** pour un **utilisateur connecté** ; le site stocke et expose ces données dans les **historiques de session** et les **dashboards**, avec possibilité d’autres types plus tard.
