import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyToken, type SessionPayload } from "./jwt";

export { SESSION_COOKIE, signSession, verifyToken } from "./jwt";
export type { SessionPayload } from "./jwt";

/** Read and verify the admin session cookie (server components / route handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
