import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateApiToken, hashToken } from "@/lib/sync-auth";

/**
 * Lie l’app mobile au compte site via le code, enregistre mobileUserId
 * et crée un token API pour les transferts de sessions.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = (body.code as string)?.trim().toUpperCase();
    const mobileUserId = body.mobileUserId as string | undefined;
    const mobileAthleteId = body.mobileAthleteId as string | undefined;
    const athleteName = (body.athleteName as string) || "Athlète";

    if (!code || !mobileUserId) {
      return NextResponse.json(
        { error: "code et mobileUserId requis" },
        { status: 400 }
      );
    }

    const linkCode = await prisma.linkCode.findUnique({
      where: { code },
      include: { user: true },
    });

    if (!linkCode) {
      return NextResponse.json({ error: "Code invalide" }, { status: 404 });
    }
    if (linkCode.usedAt) {
      return NextResponse.json({ error: "Code déjà utilisé" }, { status: 400 });
    }
    if (linkCode.expiresAt < new Date()) {
      return NextResponse.json({ error: "Code expiré" }, { status: 400 });
    }

    const userId = linkCode.userId;
    const token = generateApiToken();
    const tokenHash = hashToken(token);

    await prisma.$transaction(async (tx) => {
      await tx.linkCode.update({
        where: { id: linkCode.id },
        data: { usedAt: new Date() },
      });

      await tx.user.update({
        where: { id: userId },
        data: { mobileUserId },
      });

      let athlete = await tx.athlete.findFirst({
        where: { userId, mobileAthleteId: mobileAthleteId ?? null },
      });
      if (!athlete) {
        const defaultExists = await tx.athlete.findFirst({
          where: { userId, isDefault: true },
        });
        athlete = await tx.athlete.create({
          data: {
            userId,
            name: athleteName,
            mobileAthleteId: mobileAthleteId ?? undefined,
            isDefault: !defaultExists,
          },
        });
      }

      await tx.apiToken.create({
        data: {
          userId,
          name: "Wolopi Mobile",
          tokenHash,
        },
      });
    });

    const athlete = await prisma.athlete.findFirst({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({
      token,
      userId,
      athleteId: athlete?.id ?? null,
      message: "Compte lié. Utilisez le token dans Authorization: Bearer <token>.",
    });
  } catch (e) {
    console.error("Link claim failed:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
