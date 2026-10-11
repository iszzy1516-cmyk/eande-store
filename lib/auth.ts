import { cookies } from "next/headers";
import { prisma } from "./db";
import { SESSION_COOKIE, verifyToken, type SessionPayload } from "./jwt";

export { SESSION_COOKIE, signSession, verifyToken } from "./jwt";
export type { SessionPayload } from "./jwt";

/**
 * Read and verify the admin session (server components / route handlers).
 * Also checks tokenVersion against the database, so changing the admin
 * password revokes every existing session immediately.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: { tokenVersion: true },
  });
  if (!admin || admin.tokenVersion !== payload.tv) return null;

  return payload;
}
