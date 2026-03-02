# Déploiement Wolopi sur Vercel (compte GitHub : gutehu)

Guide pas à pas pour voir le site en ligne via une URL, en utilisant le compte GitHub **gutehu**.

---

## Étape 1 — Pousser le code sur GitHub (gutehu)

Le projet est déjà commité en local. Il reste à créer le dépôt sur GitHub et à pousser.

1. **Créer un dépôt sur GitHub**
   - Connecte-toi sur [github.com](https://github.com) avec le compte **gutehu**.
   - Clique sur **New repository**.
   - Nom suggéré : `wolopisite` (ou autre).
   - Ne coche pas « Initialize with README » (le projet en a déjà un).
   - Crée le dépôt.

2. **Lier le projet local et pousser** (à exécuter dans le dossier du projet) :

   ```bash
   git remote add origin https://github.com/gutehu/wolopisite.git
   git branch -M main
   git push -u origin main
   ```

   Si le dépôt a un autre nom que `wolopisite`, remplace dans l’URL : `gutehu/NOM_DU_REPO.git`.

---

## Étape 2 — Importer le projet sur Vercel

1. Va sur [vercel.com/new](https://vercel.com/new).
2. Connecte-toi à Vercel avec le compte lié à **gutehu** (ou « Import » depuis GitHub).
3. **Import Git Repository** : choisis le dépôt du site (ex. `gutehu/wolopisite`).
4. **Framework Preset** : Next.js (détecté automatiquement).
5. **Root Directory** : laisser par défaut.
6. Ne clique pas encore sur Deploy : passe à l’étape 3 pour les variables d’environnement.

---

## Étape 3 — Base PostgreSQL et variables d’environnement

1. **Créer une base PostgreSQL**
   - **Option A** : Dans le projet Vercel → **Storage → Create Database → Postgres**. Puis connecter la base au projet (Vercel ajoute les variables).
   - **Option B** : Créer un projet sur [neon.tech](https://neon.tech) et copier l’URL de connexion.

2. **Renseigner les variables**
   - Dans le projet Vercel : **Settings → Environment Variables**. Ajouter :

   | Variable | Valeur | Environnement |
   |----------|--------|----------------|
   | `DATABASE_URL` | URL PostgreSQL (Vercel Postgres ou Neon) | Production, Preview |
   | `NEXT_PUBLIC_APP_URL` | `https://ton-projet.vercel.app` (à ajuster après le 1er déploiement) | Production |
   | `CORS_ALLOWED_ORIGINS` | `https://ton-projet.vercel.app` (même URL, pour l’app mobile) | Optionnel |

   **Important** : le schéma Prisma est en **SQLite** par défaut. Pour la production sur Vercel il faut une base **PostgreSQL** et, si besoin, adapter le schéma et les migrations (voir `docs/DEPLOY-VERCEL.md`, section 4).

---

## Étape 4 — Déployer

1. Dans Vercel, clique sur **Deploy**.
2. Une fois le déploiement terminé, l’URL du site s’affiche (ex. `https://wolopisite-xxx.vercel.app`).
3. Ouvre cette URL dans le navigateur pour voir le site en ligne.

---

## Étape 5 — Ajuster l’URL (après le 1er déploiement)

1. Copie l’URL réelle fournie par Vercel (ex. `https://wolopisite-xxx.vercel.app`).
2. Dans **Settings → Environment Variables**, mets à jour :
   - `NEXT_PUBLIC_APP_URL` = cette URL
   - `CORS_ALLOWED_ORIGINS` = cette URL
3. Redéploie si besoin (ou laisse Vercel redéployer au prochain push).

---

## Étape 6 (optionnel) — Domaine personnalisé

Dans **Settings → Domains**, ajoute ton domaine (ex. `wolopi.fr`). Puis mets à jour `NEXT_PUBLIC_APP_URL` et `CORS_ALLOWED_ORIGINS` avec cette URL.

---

## Référence détaillée

Pour plus de détails (Postgres, migrations, lien avec Wolopi Mobile) : **`docs/DEPLOY-VERCEL.md`**.
