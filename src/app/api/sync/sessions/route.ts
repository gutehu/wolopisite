import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyApiToken } from "@/lib/sync-auth";

const ALLOWED_SESSION_TYPES = ["velocity", "mobility", "jump", "rula"] as const;

type SessionPayload = {
  type: string;
  startedAt: string;
  endedAt?: string | null;
  repCount?: number | null;
  rawPayload?: string | null;
};

/**
 * Reçoit les sessions envoyées par Wolopi Mobile (transfert / sync).
 * Header: Authorization: Bearer <token> (obtenu via /api/sync/link/claim).
 * Body: { sessions: [ { type, startedAt, endedAt?, repCount?, rawPayload? } ], athleteId?: string }
 * type = "velocity" | "mobility" | "jump" | "rula". athleteId optionnel (string).
 */
export async function POST(request: Request) {
  try {
    const auth = await verifyApiToken(request.headers.get("Authorization"));
    if (!auth) {
      return NextResponse.json({ error: "Token invalide ou manquant" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sessions = body.sessions as SessionPayload[] | undefined;
    const athleteId = body.athleteId as string | undefined;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json(
        { error: "body.sessions doit être un tableau non vide" },
        { status: 400 }
      );
    }

    let targetAthleteId = athleteId;
    if (!targetAthleteId) {
      const defaultAthlete = await prisma.athlete.findFirst({
        where: { userId: auth.userId, isDefault: true },
      });
      if (!defaultAthlete) {
        return NextResponse.json(
          { error: "Aucun athlète par défaut pour ce compte" },
          { status: 400 }
        );
      }
      targetAthleteId = defaultAthlete.id;
    } else {
      const athlete = await prisma.athlete.findFirst({
        where: { id: targetAthleteId, userId: auth.userId },
      });
      if (!athlete) {
        return NextResponse.json({ error: "Athlète introuvable pour ce compte" }, { status: 404 });
      }
    }

    const created: string[] = [];
    for (const s of sessions) {
      if (!s.type || !s.startedAt) continue;
      const type = String(s.type).toLowerCase();
      if (!ALLOWED_SESSION_TYPES.includes(type as (typeof ALLOWED_SESSION_TYPES)[number])) {
        continue;
      }
      const session = await prisma.session.create({
        data: {
          athleteId: targetAthleteId,
          type,
          startedAt: new Date(s.startedAt),
          endedAt: s.endedAt ? new Date(s.endedAt) : null,
          repCount: s.repCount ?? null,
          rawPayload: typeof s.rawPayload === "string" ? s.rawPayload : JSON.stringify(s.rawPayload ?? {}),
        },
      });
      created.push(session.id);
    }

    return NextResponse.json({
      ok: true,
      created: created.length,
      sessionIds: created,
      message: `${created.length} session(s) enregistrée(s) sur le site.`,
    });
  } catch (e) {
    console.error("Sync sessions failed:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Liste les sessions du compte (pour dashboard ou app).
 * Header: Authorization: Bearer <token>
 * Query: ?athleteId=xxx (optionnel)
 */
export async function GET(request: Request) {
  try {
    const auth = await verifyApiToken(request.headers.get("Authorization"));
    if (!auth) {
      return NextResponse.json({ error: "Token invalide ou manquant" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get("athleteId");

    const where: { athlete: { userId: string }; athleteId?: string } = {
      athlete: { userId: auth.userId },
    };
    if (athleteId) where.athleteId = athleteId;

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        startedAt: true,
        endedAt: true,
        repCount: true,
        rawPayload: true,
        athleteId: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (e) {
    console.error("List sessions failed:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
