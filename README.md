# Wolopi — Site officiel

Site vitrine et futur portail pour **Wolopi**, application mobile d'analyse performance par IA (VBT, Mobilité, Profil Force-Vitesse, Sauts).

## Stack

- **Next.js** (App Router), **TypeScript**, **Tailwind CSS** (v3)
- **Prisma** + SQLite (dev) / PostgreSQL (prod) — prêt pour synchro avec Wolopi Mobile
- **Framer Motion**, **Lucide Icons**, **Recharts** (Phase 2)
- Design system : dark mode par défaut, accents néon/sport

## Prérequis

- Node.js **>= 20.9.0** (obligatoire pour Next.js 16). Voir [INSTALL-NODE.md](./INSTALL-NODE.md) si besoin.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Structure (Phase 1)

| Route | Description |
|-------|-------------|
| `/` | Landing page : Hero, Features, How it Works, CTA, Footer |
| `/login` | Connexion / Création de compte |
| `/compte` | Mon compte (générer code de liaison pour l’app mobile) |
| `/dashboard` | Dashboard — Coming Soon (Phase 2) |

### Composants (`/src/components`)

- `Navbar.tsx` — Navigation responsive avec menu mobile
- `Hero.tsx` — Titre, sous-titre, CTAs, mockup
- `FeatureCard.tsx` — Carte de fonctionnalité (réutilisable)
- `Features.tsx` — Section des 3 piliers (Vélocité, Mobilité, Sauts)
- `HowItWorks.tsx` — 3 étapes (Filmez, Analysez, Progressez)
- `CTA.tsx` — Bloc téléchargement
- `Footer.tsx` — Légal, contact, réseaux

Phase 2 : dashboard avec Recharts, authentification et données issues de l’app mobile.

## Base de données (synchro Wolopi Mobile)

Le site est branché à une base **Prisma** (SQLite en dev, PostgreSQL en prod possible).

- **Modèles** : `User` (compte, lien app via `mobileUserId`), `Athlete` (athlètes par compte), `Session` (entraînements), `LinkCode` (liaison mobile), `ApiToken` (transfert).
- **Connexion unique Mobile ↔ Site** : voir [docs/CONNEXION-MOBILE-SITE.md](docs/CONNEXION-MOBILE-SITE.md) (liaison par code, transfert de sessions, mêmes données par compte).
- **Config** : `.env` avec `DATABASE_URL` (ex. `file:./prisma/dev.db`).
- **Commandes** : `npm run db:migrate`, `npm run db:studio`, `npm run db:generate`.
- **APIs sync** : `POST /api/sync/link/code`, `POST /api/sync/link/claim`, `POST /api/sync/sessions` (JSON), **`POST /api/sync/upload`** (fichiers SVF/JSON/CSV pour historiques et dashboards), `GET /api/sync/sessions`.
