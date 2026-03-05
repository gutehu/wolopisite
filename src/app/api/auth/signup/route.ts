import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  createWebSession,
  setSessionCookieHeader,
} from "@/lib/auth";
import {
  DEFAULT_BIOMETRICS_MALE,
  DEFAULT_BIOMETRICS_FEMALE,
  DEFAULT_ATHLETE_NAMES,
  toAthleteBiometricFields,
} from "@/lib/biometrics";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email as string)?.trim().toLowerCase();
    const password = body.password as string;
    const name = (body.name as string)?.trim() || null;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email et password requis" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit faire au moins 8 caractères" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
    });

    // Profil Homme (par défaut) et Profil Femme avec mesures biométriques classiques
    const maleFields = toAthleteBiometricFields(DEFAULT_BIOMETRICS_MALE);
    const femaleFields = toAthleteBiometricFields(DEFAULT_BIOMETRICS_FEMALE);
    await prisma.athlete.createMany({
      data: [
        {
          userId: user.id,
          name: DEFAULT_ATHLETE_NAMES.male,
          isDefault: true,
          ...maleFields,
        },
        {
          userId: user.id,
          name: DEFAULT_ATHLETE_NAMES.female,
          isDefault: false,
          ...femaleFields,
        },
      ],
    });

    const { token } = await createWebSession(user.id);
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      message: "Compte créé. Vous êtes connecté.",
    });
    res.headers.set("Set-Cookie", setSessionCookieHeader(token));
    return res;
  } catch (e) {
    console.error("Signup failed:", e);
    const msg =
      e instanceof Error && (
        e.message.includes("DATABASE_URL") ||
        e.message.includes("connect") ||
        e.message.includes("ECONNREFUSED") ||
        (e as { code?: string }).code === "P1001"
      )
        ? "Connexion à la base de données impossible. Vérifiez DATABASE_URL dans .env (ou les variables Vercel)."
        : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
