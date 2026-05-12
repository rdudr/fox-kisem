import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api/guard";

const areaSchema = z.object({
  zoneId: z.string().min(1),
  name: z.string().min(1),
});

export async function GET() {
  const gate = await requireApiSession();
  if (gate instanceof NextResponse) return gate;
  const areas = await prisma.areaTag.findMany({
    include: { zone: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ areas });
}

export async function POST(req: Request) {
  const gate = await requireApiSession();
  if (gate instanceof NextResponse) return gate;
  const json = await req.json();
  const body = areaSchema.parse(json);
  const area = await prisma.areaTag.create({ data: body });
  return NextResponse.json({ area });
}
