import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/me/athletes — Liste des athlètes du compte connecté (avec biométrie).
 */
export async function GET(request: Request) {
  const cookie = request.headers.get("Cookie") ?? null;
  const session = await getSessionFromCookie(cookie);
  if (!session) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const athletes = await prisma.athlete.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      isDefault: true,
      gender: true,
      dateOfBirth: true,
      heightCm: true,
      weightKg: true,
      armSpanCm: true,
      sittingHeightCm: true,
      bodyFatPercent: true,
      restingHeartRate: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ athletes });
}
