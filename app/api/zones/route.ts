import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api/guard";

const zoneSchema = z.object({
  name: z.string().min(1),
  consumption: z.number(),
  v1: z.number().optional(),
  v2: z.number().optional(),
  v3: z.number().optional(),
  uhtd1: z.number().optional(),
  uhtd2: z.number().optional(),
  uhtd3: z.number().optional(),
  i1: z.number().optional(),
  i2: z.number().optional(),
  i3: z.number().optional(),
  ihtd1: z.number().optional(),
  ihtd2: z.number().optional(),
  ihtd3: z.number().optional(),
  pqName: z.string().optional(),
  description: z.string().optional(),
});

export async function GET() {
  const gate = await requireApiSession();
  if (gate instanceof NextResponse) return gate;
  const zones = await prisma.zoneTag.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ zones });
}

export async function POST(req: Request) {
  const gate = await requireApiSession();
  if (gate instanceof NextResponse) return gate;
  const json = await req.json();
  const body = zoneSchema.parse(json);
  const zone = await prisma.zoneTag.create({ data: body });
  return NextResponse.json({ zone });
}
