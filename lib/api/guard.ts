import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/jwt";

export async function requireApiSession(): Promise<SessionPayload | NextResponse> {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return session;
}

export function requireRoles() {
  return null;
}
