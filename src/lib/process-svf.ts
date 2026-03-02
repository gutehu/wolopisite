/**
 * Traitement des données SVF (Wolopi Session File).
 * Architecture extensible : ajouter des handlers pour de nouvelles clés
 * (ex: "mobility_tests": []) sans modifier la route principale.
 */

import { prisma } from "@/lib/db";

const ALLOWED_SESSION_TYPES = ["velocity", "mobility", "jump", "rula"] as const;

export type SvfStructure = {
  sessions?: unknown[];
  dashboards?: unknown[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ProcessSvfContext = {
  userId: string;
  athleteId: string;
};

export type ProcessSvfResult = {
  importedSessions: number;
  importedDashboards: boolean;
  importedMetadata: boolean;
  errors: string[];
};

/**
 * Point d'entrée unique pour traiter les données SVF.
 * Extensible : ajouter des appels à process* pour de nouvelles clés.
 */
export async function processSvfData(
  data: SvfStructure,
  ctx: ProcessSvfContext
): Promise<ProcessSvfResult> {
  const result: ProcessSvfResult = {
    importedSessions: 0,
    importedDashboards: false,
    importedMetadata: false,
    errors: [],
  };

  if (data.sessions && Array.isArray(data.sessions)) {
    const count = await processSessions(data.sessions, ctx);
    result.importedSessions = count;
  }

  if (data.dashboards && Array.isArray(data.dashboards)) {
    result.importedDashboards = await processDashboards(data.dashboards, ctx);
  }

  if (data.metadata && typeof data.metadata === "object") {
    result.importedMetadata = await processMetadata(data.metadata, ctx);
  }

  // Extensibilité : ajouter ici pour de futures clés sans modifier la route
  // Exemple : if (data.mobility_tests && Array.isArray(data.mobility_tests)) {
  //   result.importedMobilityTests = await processMobilityTests(data.mobility_tests, ctx);
  // }

  return result;
}

async function processSessions(
  sessions: unknown[],
  ctx: ProcessSvfContext
): Promise<number> {
  let count = 0;
  for (const item of sessions) {
    const s = item as Record<string, unknown>;
    const type = String(s?.type ?? "").toLowerCase();
    const startedAt = s?.startedAt ?? s?.started_at;
    if (!type || !startedAt) continue;
    if (!ALLOWED_SESSION_TYPES.includes(type as (typeof ALLOWED_SESSION_TYPES)[number])) continue;
    try {
      await prisma.session.create({
        data: {
          athleteId: ctx.athleteId,
          type,
          startedAt: new Date(String(startedAt)),
          endedAt: s?.endedAt || s?.ended_at ? new Date(String(s.endedAt ?? s.ended_at)) : null,
          repCount: typeof s?.repCount === "number" ? s.repCount : typeof s?.rep_count === "number" ? s.rep_count : null,
          rawPayload:
            typeof s?.rawPayload === "string"
              ? s.rawPayload
              : JSON.stringify(s?.rawPayload ?? {}),
        },
      });
      count++;
    } catch (e) {
      // continue
    }
  }
  return count;
}

async function processDashboards(
  dashboards: unknown[],
  ctx: ProcessSvfContext
): Promise<boolean> {
  try {
    await prisma.syncData.upsert({
      where: {
        userId_athleteId_kind: {
          userId: ctx.userId,
          athleteId: ctx.athleteId,
          kind: "dashboards",
        },
      },
      create: {
        userId: ctx.userId,
        athleteId: ctx.athleteId,
        kind: "dashboards",
        payload: JSON.stringify(dashboards),
      },
      update: {
        payload: JSON.stringify(dashboards),
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function processMetadata(
  metadata: Record<string, unknown>,
  ctx: ProcessSvfContext
): Promise<boolean> {
  try {
    await prisma.syncData.upsert({
      where: {
        userId_athleteId_kind: {
          userId: ctx.userId,
          athleteId: ctx.athleteId,
          kind: "metadata",
        },
      },
      create: {
        userId: ctx.userId,
        athleteId: ctx.athleteId,
        kind: "metadata",
        payload: JSON.stringify(metadata),
      },
      update: {
        payload: JSON.stringify(metadata),
      },
    });
    return true;
  } catch {
    return false;
  }
}
