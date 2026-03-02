import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

const CODE_LENGTH = 6;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EXPIRES_MINUTES = 10;

function generateCode(): string {
  let s = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return s;
}

/**
 * Génère un code de liaison pour que l’app mobile lie ce compte.
 * Requiert une session utilisateur (connexion sur le site).
 */
export async function POST(request: Request) {
  try {
    const cookie = request.headers.get("Cookie") ?? null;
    const session = await getSessionFromCookie(cookie);
    if (!session) {
      return NextResponse.json(
        { error: "Connexion requise. Connectez-vous sur le site puis réessayez." },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000);

    await prisma.linkCode.create({
      data: { userId, code, expiresAt },
    });

    return NextResponse.json({
      code,
      expiresAt: expiresAt.toISOString(),
      message: "Saisissez ce code dans Wolopi Mobile pour lier le compte.",
    });
  } catch (e) {
    console.error("Link code creation failed:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
