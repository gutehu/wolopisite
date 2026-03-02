# Relier Wolopi Mobile au site (même compte, envoi de données, dashboards)

## 1. Objectif de la communication

- **Communication** = **envoi de données** du mobile vers le site, pour un **utilisateur connecté** (compte lié).
- Les données sont **envoyées par Wolopi Mobile** (sessions, historiques) et stockées côté site pour alimenter les **dashboards** et **historiques**.
- **Envoi sous forme de fichiers** : le mobile envoie les historiques de session (et données associées) en **fichiers SVF** (format dédié) ou en JSON/CSV. Le site les importe et les affiche dans les **dashboards** ; d’autres types de données peuvent être ajoutés plus tard.

---

## 2. Une seule base, un seul backend

- **Serveur** = Wolopi Site (Next.js, ex. sur Vercel).
- **Base de données** = celle du site. Wolopi Mobile **n’a pas** de base dédiée pour la synchro : il envoie les données vers les APIs du site.
- L’utilisateur se **connecte** sur le site (email/mot de passe), **lie** l’app (code à saisir dans l’app), puis le mobile **envoie** les données (sessions, fichiers SVF) pour ce compte.

---

## 3. Côté site (déjà en place)

- Connexion : `/login` (création de compte ou connexion).
- **Mon compte** (`/compte`) : génération du **code de liaison** à saisir dans l’app.
- Réception des données : **sessions en JSON** (`POST /api/sync/sessions`) et **fichiers** (SVF, JSON, CSV) via `POST /api/sync/upload`. Les données alimentent les **historiques de session** et les **dashboards**.

---

## 4. Côté Wolopi Mobile : à implémenter

### 4.1 Liaison du compte

- Écran « Lier à mon compte web » : l’utilisateur saisit le **code** affiché sur le site (Mon compte → Générer un code).
- Appel **POST** `{BASE_URL}/api/sync/link/claim` avec `{ code, mobileUserId, mobileAthleteId?, athleteName? }`.
- **Stocker le token** renvoyé (keychain / keystore) et l’utiliser pour tous les envois suivants.

### 4.2 URL de base (site)

Dans le projet mobile (ex. **`lib/core/sync/sync_config.dart`**), définir l’URL du site :

- **Production** : URL Vercel ou domaine (ex. `https://wolopisite.vercel.app` ou `https://wolopi.fr`).
- **Dev** : tunnel (ngrok) ou machine locale.

Le mobile **n’appelle pas** `POST /api/sync/link/code` (réservé au site, utilisateur connecté).

### 4.3 Envoi des données pour l’utilisateur connecté

Deux façons d’envoyer les données (toujours avec **Authorization: Bearer &lt;token&gt;**) :

#### A) Envoi en JSON (sessions)

| Méthode | URL | Body |
|--------|-----|------|
| POST | `{BASE_URL}/api/sync/sessions` | `{ "sessions": [ { "type", "startedAt", "endedAt?", "repCount?", "rawPayload?" } ], "athleteId?": "string" }` |

Types de session : `velocity` \| `mobility` \| `jump` \| `rula`.

#### B) Envoi en fichiers (historiques, dashboards)

| Méthode | URL | Body |
|--------|-----|------|
| POST | `{BASE_URL}/api/sync/upload` | **multipart/form-data** : champs `files` (ou `file`) = un ou plusieurs fichiers ; optionnel `athleteId` (string). |

**Formats de fichiers acceptés :**

- **SVF** : format dédié Wolopi. Contenu attendu côté site : **JSON** (tableau de sessions ou objet `{ sessions: [...] }`). Extension `.svf` ou contenu JSON.
- **JSON** : tableau de sessions, même structure que dans `POST /api/sync/sessions`.
- **CSV** : lignes avec colonnes `type`, `startedAt` (ou `started_at`), `endedAt`/`ended_at`, `repCount`/`rep_count`, etc.

Les données importées sont stockées comme **sessions** et alimentent les **historiques de session** et les **dashboards** sur le site.

### 4.4 Récupérer les sessions (dashboard, app)

| Méthode | URL | Headers |
|--------|-----|---------|
| GET | `{BASE_URL}/api/sync/sessions` | `Authorization: Bearer <token>` ; optionnel `?athleteId=xxx` |

---

## 5. Flux recommandé côté mobile

1. **Liaison** : saisie du code → `POST /api/sync/link/claim` → stocker le token.
2. **Transfert des historiques de session** : préparer un ou plusieurs **fichiers SVF** (ou JSON/CSV) contenant les sessions à transférer, puis **POST /api/sync/upload** avec `multipart/form-data` (champ `files` ou `file`, optionnel `athleteId`).
3. **Sync temps réel (optionnel)** : après une séance, envoyer aussi **POST /api/sync/sessions** en JSON pour mise à jour immédiate.
4. **Dashboards** : l’utilisateur connecté sur le site voit ses **historiques** et **dashboards** alimentés par les données envoyées (JSON + fichiers SVF/JSON/CSV).

---

## 6. Format fichier SVF (recommandation)

Pour que le site puisse importer correctement les **historiques** et alimenter les **dashboards**, le contenu des fichiers **SVF** peut être :

- Soit un **tableau JSON** de sessions : `[ { "type": "velocity", "startedAt": "...", ... }, ... ]`
- Soit un **objet** : `{ "sessions": [ ... ] }` (éventuellement avec métadonnées supplémentaires pour de futurs autres types de données).

Les champs par session restent : `type`, `startedAt`, `endedAt?`, `repCount?`, `rawPayload?`. Le site parse ce JSON (fichier .svf ou .json) et crée les **Session** en base pour les **historiques** et **dashboards**.

---

## 7. Résumé pour l’équipe Mobile

1. **Communication** = envoi de données (utilisateur connecté / compte lié) du mobile vers le site.
2. **Lier le compte** : écran « Lier à mon compte web », saisie du code → `POST /api/sync/link/claim` → stocker le token.
3. **Envoyer les données** :
   - **Fichiers (historiques)** : **POST /api/sync/upload** avec fichiers **SVF** (ou JSON/CSV). Alimente les **historiques de session** et les **dashboards**.
   - **JSON (sessions)** : **POST /api/sync/sessions** pour envoi direct de sessions.
4. **BASE_URL** = URL du site (Vercel ou domaine).
5. Possibilité d’**autres types** de données plus tard (même mécanisme token + upload ou API dédiée).

Pour le détail du modèle de données et des APIs, voir [CONNEXION-MOBILE-SITE.md](./CONNEXION-MOBILE-SITE.md).
