import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { requireApiSession } from "@/lib/api/guard";

export async function GET() {
  const gate = await requireApiSession();
  if (gate instanceof NextResponse) return gate;
  
  const user = await prisma.user.findUnique({ where: { id: gate.sub } });
  const profile = await prisma.companyProfile.findFirst();

  const zones = await prisma.zoneTag.findMany({ orderBy: { createdAt: "desc" } });
  const areas = await prisma.areaTag.findMany({ include: { zone: true }, orderBy: { createdAt: "desc" } });
  const entries = await prisma.entry.findMany({
    include: { area: { include: { zone: true } }, createdBy: true },
    orderBy: { createdAt: "desc" },
  });

  const reporterName = user?.displayName || user?.username || "Unknown";
  const companyName = profile?.companyName ? profile.companyName.toUpperCase() : "UNKNOWN COMPANY";
  
  // Format helpers
  const f2 = (n: number | null | undefined) => n ? Number(n.toFixed(2)) : 0;
  const f3 = (n: number | null | undefined) => n ? Number(n.toFixed(3)) : 0;

  // Metadata rows (Only for Sheet 1)
  const metadataRows = [
    [companyName],
    [`Area: ${profile?.area || "N/A"} | District: ${profile?.district || "N/A"} | State: ${profile?.state || "N/A"} | Pincode: ${profile?.pincode || "N/A"}`],
    [`Reported By: ${reporterName}`],
    [],
  ];

  // --- SHEET 1: Plant Main Input ---
  const zoneHeaders = [
    "Name", "PQ Name", 
    "V1", "V2", "V3", "Uhtd1", "Uhtd2", "Uhtd3", 
    "I1", "I2", "I3", "Ihtd1", "Ihtd2", "Ihtd3", 
    "PF", "KVAr (D)", "KVAr (Q)", "Lead/Lag", "Total Power (kW)", "Description", "Time"
  ];
  const zoneDataRows = zones.map(z => [
    z.name, z.pqName || "",
    f2(z.v1), f2(z.v2), f2(z.v3), f2(z.uhtd1), f2(z.uhtd2), f2(z.uhtd3),
    f2(z.i1), f2(z.i2), f2(z.i3), f2(z.ihtd1), f2(z.ihtd2), f2(z.ihtd3),
    f3(z.pf), f2(z.kvarD), f2(z.kvarQ), z.kvarLeadLag || "", f2(z.totalPower), z.description || "",
    new Date(z.createdAt).toLocaleString()
  ]);
  const ws1 = XLSX.utils.aoa_to_sheet([...metadataRows, zoneHeaders, ...zoneDataRows]);

  // --- SHEET 2: MCC/PCC ---
  const areaHeaders = [
    "Plant Main Input", "MCC/PCC Name", "PQ Name", 
    "V1", "V2", "V3", "Uhtd1", "Uhtd2", "Uhtd3", 
    "I1", "I2", "I3", "Ihtd1", "Ihtd2", "Ihtd3", 
    "PF", "KVAr (D)", "KVAr (Q)", "Lead/Lag", "Total Power (kW)", "Description", "Time"
  ];
  const areaDataRows = areas.map(a => [
    a.zone?.name || "", a.name, a.pqName || "",
    f2(a.v1), f2(a.v2), f2(a.v3), f2(a.uhtd1), f2(a.uhtd2), f2(a.uhtd3),
    f2(a.i1), f2(a.i2), f2(a.i3), f2(a.ihtd1), f2(a.ihtd2), f2(a.ihtd3),
    f3(a.pf), f2(a.kvarD), f2(a.kvarQ), a.kvarLeadLag || "", f2(a.totalPower), a.description || "",
    new Date(a.createdAt).toLocaleString()
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([areaHeaders, ...areaDataRows]);

  // --- SHEET 3: Motor Load ---
  const entryHeaders = [
    "Plant Main Input", "MCC/PCC", "MachineTag", "StarterType", 
    "RatedKw", "RatedHp", "Voltage(V)", "Current(I)", 
    "KVA", "PF", "KVAr", "MeasuredKw", "CalculatedPower(kW)", 
    "LoadFactor", "Description", "Time"
  ];
  const entryDataRows = entries.map(e => [
    e.area?.zone?.name || "", e.area?.name || "", e.machineTag || "", e.starterType || "",
    f2(e.ratedKw), f2(e.ratedHp), f2(e.voltage), f2(e.current),
    f2(e.kva), f3(e.pf), f2(e.kvar), f2(e.measuredKw), f2(e.calculatedPower),
    f3(e.loadFactor), e.description || "", new Date(e.createdAt).toLocaleString()
  ]);
  const ws3 = XLSX.utils.aoa_to_sheet([entryHeaders, ...entryDataRows]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, "Plant Main Input");
  XLSX.utils.book_append_sheet(wb, ws2, "MCC-PCC");
  XLSX.utils.book_append_sheet(wb, ws3, "Motor Load");

  // Output buffer
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  // Wipe data after successful export!
  await prisma.entry.deleteMany();
  await prisma.areaTag.deleteMany();
  await prisma.zoneTag.deleteMany();
  await prisma.companyProfile.deleteMany();

  const now = new Date();
  const ddmm = String(now.getDate()).padStart(2, "0") + String(now.getMonth() + 1).padStart(2, "0");
  const companyStr = profile?.companyName ? profile.companyName.replace(/[^a-z0-9]/gi, "-").toLowerCase() : reporterName.toLowerCase();
  
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${companyStr}_${ddmm}.xlsx"`,
    },
  });
}
