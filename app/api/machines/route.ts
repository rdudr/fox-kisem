import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/lib/api/guard";

const entrySchema = z.object({
  areaId: z.string().min(1),
  machineTag: z.string().min(1),
  starterType: z.enum(["VFD", "SD", "DOL"]),
  ratedKw: z.number(),
  ratedHp: z.number().optional(),
  voltage: z.number().optional(),
  current: z.number().optional(),
  kva: z.number().optional(),
  pf: z.number().optional(),
  kvar: z.number().optional(),
  measuredKw: z.number(),
});

export async function GET() {
  const gate = await requireApiSession();
  if (gate instanceof NextResponse) return gate;
  const entries = await prisma.entry.findMany({
    include: { area: { include: { zone: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const gate = await requireApiSession();
  if (gate instanceof NextResponse) return gate;
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = entrySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });

  const { areaId, machineTag, starterType, ratedKw, ratedHp, voltage, current, kva, pf, kvar, measuredKw } = parsed.data;

  // Real calculations
  const calculatedPower = (voltage && current && pf) ? (1.732 * voltage * current * pf) / 1000 : 0;
  const loadFactor = ratedKw > 0 ? measuredKw / ratedKw : 0;

  const entry = await prisma.entry.create({
    data: {
      areaId, machineTag, starterType,
      ratedKw, ratedHp, voltage, current, kva, pf, kvar, measuredKw,
      calculatedPower, loadFactor,
      createdById: gate.sub,
    },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
