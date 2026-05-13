export const dynamic = 'force-static'
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { profile, zones, areas, entries } = await req.json();

    // Sync Company Profile
    if (profile) {
      await prisma.companyProfile.upsert({
        where: { id: profile.id },
        create: {
          id: profile.id,
          companyName: profile.companyName,
          area: profile.area,
          district: profile.district ?? "",
          state: profile.state ?? "",
          pincode: profile.pincode ?? "",
          overallConsumption: profile.overallConsumption ?? 0,
        },
        update: {
          companyName: profile.companyName,
          area: profile.area,
          district: profile.district ?? "",
          state: profile.state ?? "",
          pincode: profile.pincode ?? "",
          overallConsumption: profile.overallConsumption ?? 0,
        },
      });
    }

    // Sync Zones
    for (const z of (zones ?? [])) {
      await prisma.zoneTag.upsert({
        where: { id: z.id },
        create: { id: z.id, name: z.name, v1: z.v1, v2: z.v2, v3: z.v3, pf: z.pf, totalPower: z.totalPower, pqName: z.pqName, description: z.description, kvarD: z.kvarD, kvarQ: z.kvarQ, kvarLeadLag: z.kvarLeadLag },
        update: { name: z.name, v1: z.v1, v2: z.v2, v3: z.v3, pf: z.pf, totalPower: z.totalPower, pqName: z.pqName, description: z.description, kvarD: z.kvarD, kvarQ: z.kvarQ, kvarLeadLag: z.kvarLeadLag },
      });
    }

    // Sync Areas
    for (const a of (areas ?? [])) {
      await prisma.areaTag.upsert({
        where: { id: a.id },
        create: { id: a.id, zoneId: a.zoneId, name: a.name, v1: a.v1, v2: a.v2, v3: a.v3, pf: a.pf, totalPower: a.totalPower, pqName: a.pqName, description: a.description, kvarD: a.kvarD, kvarQ: a.kvarQ, kvarLeadLag: a.kvarLeadLag },
        update: { name: a.name, v1: a.v1, v2: a.v2, v3: a.v3, pf: a.pf, totalPower: a.totalPower, pqName: a.pqName, description: a.description, kvarD: a.kvarD, kvarQ: a.kvarQ, kvarLeadLag: a.kvarLeadLag },
      });
    }

    // Sync Entries — find or create a user for "local-user"
    let systemUser = await prisma.user.findFirst({ where: { username: "local-offline" } });
    if (!systemUser) {
      const bcrypt = await import("bcryptjs");
      systemUser = await prisma.user.create({
        data: {
          username: "local-offline",
          displayName: "Offline Device",
          passwordHash: await bcrypt.hash("offline-sync-user", 10),
        },
      });
    }

    for (const e of (entries ?? [])) {
      await prisma.entry.upsert({
        where: { id: e.id },
        create: {
          id: e.id,
          areaId: e.areaId,
          machineTag: e.machineTag,
          starterType: e.starterType,
          ratedKw: e.ratedKw,
          ratedHp: e.ratedHp,
          voltage: e.voltage,
          current: e.current,
          kva: e.kva,
          pf: e.pf,
          kvar: e.kvar,
          measuredKw: e.measuredKw,
          calculatedPower: e.calculatedPower,
          loadFactor: e.loadFactor,
          description: e.description,
          createdById: systemUser.id,
        },
        update: {
          machineTag: e.machineTag,
          starterType: e.starterType,
          ratedKw: e.ratedKw,
          measuredKw: e.measuredKw,
          calculatedPower: e.calculatedPower,
          loadFactor: e.loadFactor,
        },
      });
    }

    return NextResponse.json({ ok: true, synced: { zones: zones?.length ?? 0, areas: areas?.length ?? 0, entries: entries?.length ?? 0 } });
  } catch (err) {
    console.error("[SYNC ERROR]", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
