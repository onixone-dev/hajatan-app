import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SESSION_OPTIONS, SessionData } from "./session";

export async function getSession(): Promise<SessionData | null> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.role) return null;
  return session;
}

// Cek apakah panitia punya akses ke fitur tertentu
export function bolehAkses(session: SessionData, fitur: string): boolean {
  if (session.role === "admin" || session.role === "user") return true;
  return session.fitur_akses?.includes(fitur) ?? false;
}