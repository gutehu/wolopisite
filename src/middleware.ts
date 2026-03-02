import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Répond aux preflight CORS (OPTIONS) pour les routes /api/*
 * et ajoute les en-têtes CORS aux réponses API.
 */
export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const origin = request.headers.get("origin") || "";
  const allowOrigin =
    isDev ? "*" : process.env.CORS_ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).includes(origin)
      ? origin
      : process.env.CORS_ALLOWED_ORIGINS?.split(",")[0]?.trim() ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "*");

  if (request.nextUrl.pathname.startsWith("/api/") && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", allowOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept"
    );
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
