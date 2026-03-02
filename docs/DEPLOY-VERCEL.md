# Déployer Wolopi Site sur Vercel

Ce guide permet de déployer le site sur Vercel pour le lier ensuite à Wolopi Mobile (même backend, même base).

---

## 1. Prérequis

- Un compte [Vercel](https://vercel.com)
- Le code poussé sur **GitHub** (ou GitLab / Bitbucket)

---

## 2. Créer le projet sur Vercel

1. Allez sur [vercel.com/new](https://vercel.com/new).
2. **Import Git Repository** : choisissez le dépôt du site (ex. `wolopisite`).
3. **Framework Preset** : Next.js (détecté automatiquement).
4. **Root Directory** : laissez par défaut si le dépôt est dédié au site.
5. Ne déployez pas tout de suite : configurez d’abord les variables d’environnement (étape 3), puis **Deploy**.

---

## 3. Variables d’environnement (Vercel)

Dans le projet Vercel : **Settings → Environment Variables**. Ajoutez :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `DATABASE_URL` | *(obligatoire en prod)* Voir section 4 | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://votre-projet.vercel.app` (ou votre domaine custom) | Production |
| `CORS_ALLOWED_ORIGINS` | `https://votre-projet.vercel.app` (ou `*` en dev si besoin) | Optionnel |

**Important** : sans `DATABASE_URL` valide, le site build mais les APIs (auth, sync, liaison mobile) échoueront. Il faut une base **PostgreSQL** en production (SQLite en local ne convient pas à Vercel serverless).

---

## 4. Base de données en production (obligatoire pour auth + sync)

En local vous utilisez **SQLite**. Sur Vercel, il faut une base **PostgreSQL** (une par environnement si vous voulez séparer prod / preview).

### Option A : Vercel Postgres

1. Dans le projet Vercel : **Storage → Create Database → Postgres**.
2. Une fois créé, connectez la base au projet : les variables (ex. `POSTGRES_URL`) sont ajoutées automatiquement.
3. Utilisez **`POSTGRES_URL`** (ou la variable indiquée) comme **`DATABASE_URL`** dans les Environment Variables du projet (ou renommez en `DATABASE_URL` si le connecteur ne l’ajoute pas).

### Option B : Neon (PostgreSQL)

1. Créez un projet sur [neon.tech](https://neon.tech).
2. Récupérez l’URL de connexion (ex. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
3. Dans Vercel, ajoutez **`DATABASE_URL`** = cette URL.

### Schéma et migrations

Le projet est configuré pour **SQLite** en local. Pour la **production avec PostgreSQL** :

1. **Soit** vous basculez tout le projet sur PostgreSQL (schéma Prisma + `DATABASE_URL` Postgres en local et sur Vercel), et vous exécutez les migrations Postgres (ex. `prisma migrate deploy`) au build ou à la main.
2. **Soit** vous gardez SQLite en local et vous avez un schéma / un job séparé pour appliquer les migrations sur la base Postgres de prod (avancé).

Pour une première mise en ligne rapide : créez une base Postgres (Vercel Postgres ou Neon), définissez **`DATABASE_URL`** sur Vercel, puis déployez. Si les migrations ne sont pas encore adaptées à Postgres, il faudra aligner le schéma Prisma et les migrations (provider `postgresql` et `prisma migrate deploy`).

---

## 5. Build et déploiement

- **Build Command** : `prisma generate && next build` (déjà dans `package.json`).
- **Output Directory** : géré par Next.js.
- **Install Command** : `npm install`.

Après avoir enregistré les variables, lancez **Deploy**. Une fois le déploiement vert, l’URL du site sera du type `https://wolopisite-xxx.vercel.app`.

---

## 6. Domaine personnalisé (optionnel)

Dans **Settings → Domains**, ajoutez votre domaine (ex. `wolopi.fr`). Mettez à jour **`NEXT_PUBLIC_APP_URL`** et **`CORS_ALLOWED_ORIGINS`** avec cette URL pour que le site et l’app mobile utilisent la même origine.

---

## 7. Après le déploiement

- **Site** : `https://votre-projet.vercel.app`
- **Connexion** : `/login`
- **Mon compte (générer un code pour l’app)** : `/compte`
- **API santé** : `https://votre-projet.vercel.app/api/health`

Pour **Wolopi Mobile** : utilisez cette URL comme **BASE_URL** (voir `docs/WOLOPI-MOBILE-RELIER-SITE.md`). L’app appellera `https://votre-projet.vercel.app/api/sync/link/claim` et `https://votre-projet.vercel.app/api/sync/sessions`.

---

## Résumé

1. Repo sur GitHub → Import sur Vercel.
2. Créer une base **PostgreSQL** (Vercel Postgres ou Neon) et définir **`DATABASE_URL`**.
3. Définir **`NEXT_PUBLIC_APP_URL`** (URL Vercel ou domaine custom).
4. Déployer, puis configurer Wolopi Mobile avec l’URL du site (voir doc mobile).
