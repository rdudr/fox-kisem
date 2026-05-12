import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { requireApiSession } from "@/lib/api/guard";

export async function GET() {
  const gate = await requireApiSession();
  if (gate instanceof NextResponse) return gate;
  
  const user = await prisma.user.findUnique({ where: { id: gate.sub } });
  const profile = await prisma.companyProfile.findFirst();

  const entries = await prisma.entry.findMany({
    include: {
      area: {
        include: {
          zone: true,
        },
      },
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const reporterName = user?.displayName || user?.username || "Unknown";
  const companyName = profile?.companyName ? profile.companyName.toUpperCase() : "UNKNOWN COMPANY";
  
  // Prepare metadata rows
  const metadataRows = [
    [companyName],
    [
      `Area: ${profile?.area || "N/A"}`,
      `District: ${profile?.district || "N/A"}`,
      `State: ${profile?.state || "N/A"}`,
      `Pincode: ${profile?.pincode || "N/A"}`
    ].join(" | "),
    [`Reported By: ${reporterName}`],
    [], // Blank line before data
  ];

  const headers = [
    "Zone", "Area", "MachineTag", "StarterType", 
    "RatedKw", "RatedHp", "Voltage(V1)", "Current(I1)", 
    "KVA", "PF", "KVAr", "MeasuredKw", "CalculatedPower", 
    "LoadFactor", "Time"
  ];

  const dataRows = entries.map((e) => [
    e.area?.zone?.name || "",
    e.area?.name || "",
    e.machineTag || "",
    e.starterType || "",
    e.ratedKw || 0,
    e.ratedHp || 0,
    e.voltage || 0,
    e.current || 0,
    e.kva || 0,
    e.pf || 0,
    e.kvar || 0,
    e.measuredKw || 0,
    Number(e.calculatedPower.toFixed(2)),
    Number(e.loadFactor.toFixed(3)),
    new Date(e.createdAt).toLocaleString()
  ]);

  // Combine all rows
  const allRows = [
    ...metadataRows.map(row => (Array.isArray(row) ? row : [row])),
    headers,
    ...dataRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(allRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Feed");

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
