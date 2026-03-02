/**
 * Configuration centralisée des variables d'environnement.
 * Utiliser ces constantes au lieu de process.env directement pour un typage et une doc clairs.
 */

const isDev = process.env.NODE_ENV === "development";

/** URL publique du site (pour liens, redirections, CORS). En prod : URL Vercel ou domaine custom. */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (isDev ? "http://localhost:3000" : "https://wolopi.fr");

/** URL de l’API (même que APP_URL si monolith). Utile si API déployée ailleurs plus tard. */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || APP_URL;

/** Origines autorisées pour CORS (séparées par des virgules en prod). En dev on autorise tout via "*". */
export const CORS_ALLOWED_ORIGINS =
  process.env.CORS_ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];

/** En développement : autoriser toutes les origines (tests USB, simulateurs). */
export const CORS_ALLOW_ALL_ORIGINS = isDev;

/** Chaîne de connexion base de données (Prisma). */
export const DATABASE_URL = process.env.DATABASE_URL;
