import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";

const TOKEN_BYTES = 32;
const TOKEN_PREFIX = "wlp_";

export function generateApiToken(): string {
  return TOKEN_PREFIX + randomBytes(TOKEN_BYTES).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function verifyApiToken(
  bearerToken: string | null
): Promise<{ userId: string } | null> {
  if (!bearerToken?.startsWith("Bearer ") || !bearerToken.slice(7).startsWith(TOKEN_PREFIX))
    return null;
  const raw = bearerToken.slice(7);
  const hash = hashToken(raw);
  const row = await prisma.apiToken.findUnique({
    where: { tokenHash: hash },
    select: { userId: true },
  });
  if (!row) return null;
  await prisma.apiToken.update({
    where: { tokenHash: hash },
    data: { lastUsedAt: new Date() },
  });
  return { userId: row.userId };
}
