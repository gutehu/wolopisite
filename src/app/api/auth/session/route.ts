import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const cookie = request.headers.get("Cookie") ?? null;
  const session = await getSessionFromCookie(cookie);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: session.user });
}
