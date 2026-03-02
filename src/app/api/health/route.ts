import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Vérifie que l’app et la base sont OK.
 * Utilisée par le site et pourra l’être par Wolopi Mobile (sync / API).
 */
export async function GET() {
  try {
    await prisma.$connect();
    const [userCount, athleteCount, sessionCount] = await Promise.all([
      prisma.user.count(),
      prisma.athlete.count(),
      prisma.session.count(),
    ]);
    return NextResponse.json({
      ok: true,
      database: "connected",
      stats: { users: userCount, athletes: athleteCount, sessions: sessionCount },
    });
  } catch (e) {
    console.error("Health check failed:", e);
    return NextResponse.json(
      { ok: false, database: "error", error: String(e) },
      { status: 503 }
    );
  }
}
