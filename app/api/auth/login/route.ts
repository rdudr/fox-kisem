import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken, setSessionCookie } from "@/lib/auth/session";
import type { SessionRole } from "@/lib/auth/jwt";

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Clear data to start from blank details as requested
  await prisma.entry.deleteMany();
  await prisma.areaTag.deleteMany();
  await prisma.zoneTag.deleteMany();
  await prisma.companyProfile.deleteMany();
  const token = await signSessionToken({
    sub: user.id,
    email: user.username,
    role: "ADMIN" as SessionRole,
  });
  await setSessionCookie(token);
  return NextResponse.json({
    user: { id: user.id, email: user.username, role: "ADMIN", name: user.displayName },
  });
}
