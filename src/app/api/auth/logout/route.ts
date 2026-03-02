import { NextResponse } from "next/server";
import { deleteWebSessionByToken, clearSessionCookieHeader } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookie = request.headers.get("Cookie") ?? null;
    await deleteWebSessionByToken(cookie);
    const res = NextResponse.json({ message: "Déconnexion réussie." });
    res.headers.set("Set-Cookie", clearSessionCookieHeader());
    return res;
  } catch (e) {
    console.error("Logout failed:", e);
    const res = NextResponse.json({ message: "Déconnexion effectuée." });
    res.headers.set("Set-Cookie", clearSessionCookieHeader());
    return res;
  }
}
