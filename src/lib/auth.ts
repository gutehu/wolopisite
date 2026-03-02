import { randomBytes, scrypt, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { prisma } from "@/lib/db";

const scryptAsync = promisify(scrypt);
const SESSION_TOKEN_BYTES = 32;
const SESSION_COOKIE = "wolopi_web_session";
const SESSION_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hashHex, "hex");
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("hex");
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function getSessionCookieMaxAge(): number {
  return SESSION_DAYS * 24 * 60 * 60;
}

export async function createWebSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.webSession.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });
  return { token, expiresAt };
}

export async function getSessionFromCookie(cookieHeader: string | null): Promise<{
  user: { id: string; email: string; name: string | null };
} | null> {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1]?.trim();
  if (!token) return null;
  const hash = hashSessionToken(token);
  const session = await prisma.webSession.findUnique({
    where: { tokenHash: hash },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.webSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return { user: session.user };
}

export async function deleteWebSessionByToken(cookieHeader: string | null): Promise<void> {
  if (!cookieHeader) return;
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1]?.trim();
  if (!token) return;
  const hash = hashSessionToken(token);
  await prisma.webSession.deleteMany({ where: { tokenHash: hash } });
}

export function setSessionCookieHeader(token: string): string {
  const maxAge = getSessionCookieMaxAge();
  return `${getSessionCookieName()}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function clearSessionCookieHeader(): string {
  return `${getSessionCookieName()}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

