import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createWebSession,
  setSessionCookieHeader,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email as string)?.trim().toLowerCase();
    const password = body.password as string;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email et password requis" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const { token } = await createWebSession(user.id);
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      message: "Connexion réussie.",
    });
    res.headers.set("Set-Cookie", setSessionCookieHeader(token));
    return res;
  } catch (e) {
    console.error("Login failed:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
