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
  const energySources = await prisma.energySource.findMany({ orderBy: { createdAt: "desc" } });

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
    "Name", "PQ Name", "Recording ID",
    "V1", "V2", "V3", "Uthd1", "Uthd2", "Uthd3", 
    "I1", "I2", "I3", "Ithd1", "Ithd2", "Ithd3", 
    "PF", "KVAr (D)", "KVAr (Q)", "Lead/Lag", "Total Power (kW)", "Description", "Photo Path", "Recorded By", "Time"
  ];
  const zoneDataRows = zones.map(z => [
    z.name, z.pqName || "", z.recordingNameId || "",
    f2(z.v1), f2(z.v2), f2(z.v3), f2(z.uthd1), f2(z.uthd2), f2(z.uthd3),
    f2(z.i1), f2(z.i2), f2(z.i3), f2(z.ithd1), f2(z.ithd2), f2(z.ithd3),
    f3(z.pf), f2(z.kvarD), f2(z.kvarQ), z.kvarLeadLag || "", f2(z.totalPower), z.description || "", z.photoPath || "", z.recordedBy || "Unknown",
    new Date(z.createdAt).toLocaleString()
  ]);
  const ws1 = XLSX.utils.aoa_to_sheet([...metadataRows, zoneHeaders, ...zoneDataRows]);

  // --- SHEET 2: PCC Panels ---
  const pccHeaders = [
    "Plant Main Input", "PCC Name", "PQ Name", "Recording ID",
    "V1", "V2", "V3", "Uthd1", "Uthd2", "Uthd3", 
    "I1", "I2", "I3", "Ithd1", "Ithd2", "Ithd3", 
    "PF", "KVAr (D)", "KVAr (Q)", "Lead/Lag", "Total Power (kW)", "Description", "Photo Path", "Recorded By", "Time"
  ];
  const pccDataRows = areas.filter(a => a.type === "PCC").map(a => [
    a.zone?.name || "", a.name, a.pqName || "", a.recordingNameId || "",
    f2(a.v1), f2(a.v2), f2(a.v3), f2(a.uthd1), f2(a.uthd2), f2(a.uthd3),
    f2(a.i1), f2(a.i2), f2(a.i3), f2(a.ithd1), f2(a.ithd2), f2(a.ithd3),
    f3(a.pf), f2(a.kvarD), f2(a.kvarQ), a.kvarLeadLag || "", f2(a.totalPower), a.description || "", a.photoPath || "", a.recordedBy || "Unknown",
    new Date(a.createdAt).toLocaleString()
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([pccHeaders, ...pccDataRows]);

  // --- SHEET 3: MCC Panels ---
  const mccHeaders = [
    "Plant Main Input", "Parent PCC Panel", "MCC Name", "PQ Name", "Recording ID",
    "V1", "V2", "V3", "Uthd1", "Uthd2", "Uthd3", 
    "I1", "I2", "I3", "Ithd1", "Ithd2", "Ithd3", 
    "PF", "KVAr (D)", "KVAr (Q)", "Lead/Lag", "Total Power (kW)", "Description", "Photo Path", "Recorded By", "Time"
  ];
  const mccDataRows = areas.filter(a => a.type === "MCC").map(a => {
    const parentPcc = areas.find(p => p.id === a.pccId);
    return [
      a.zone?.name || "", parentPcc ? parentPcc.name : "Direct Feed", a.name, a.pqName || "", a.recordingNameId || "",
      f2(a.v1), f2(a.v2), f2(a.v3), f2(a.uthd1), f2(a.uthd2), f2(a.uthd3),
      f2(a.i1), f2(a.i2), f2(a.i3), f2(a.ithd1), f2(a.ithd2), f2(a.ithd3),
      f3(a.pf), f2(a.kvarD), f2(a.kvarQ), a.kvarLeadLag || "", f2(a.totalPower), a.description || "", a.photoPath || "", a.recordedBy || "Unknown",
      new Date(a.createdAt).toLocaleString()
    ];
  });
  const ws3 = XLSX.utils.aoa_to_sheet([mccHeaders, ...mccDataRows]);

  // --- SHEET 4: Motor Load ---
  const entryHeaders = [
    "Plant Main Input", "Parent PCC Panel", "MCC Panel Name", "MachineTag", "StarterType", 
    "RatedKw", "RatedHp", "Voltage(V)", "Current(I)", 
    "KVA", "PF", "KVAr", "MeasuredKw", "CalculatedPower(kW)", 
    "LoadFactor", "Description", "Photo Path", "Recorded By", "Time"
  ];
  const entryDataRows = entries.map(e => {
    let pccName = "";
    let mccName = "";
    if (e.area) {
      if (e.area.type === "MCC") {
        mccName = e.area.name;
        const parentPcc = areas.find(p => p.id === e.area.pccId);
        pccName = parentPcc ? parentPcc.name : "Direct Feed";
      } else {
        pccName = e.area.name;
        mccName = "Direct (No MCC)";
      }
    }
    return [
      e.area?.zone?.name || "", pccName || "Unknown", mccName || "Unknown", e.machineTag || "", e.starterType || "",
      f2(e.ratedKw), f2(e.ratedHp), f2(e.voltage), f2(e.current),
      f2(e.kva), f3(e.pf), f2(e.kvar), f2(e.measuredKw), f2(e.calculatedPower),
      f3(e.loadFactor), e.description || "", e.photoPath || "", e.recordedBy || "Unknown", new Date(e.createdAt).toLocaleString()
    ];
  });
  const ws4 = XLSX.utils.aoa_to_sheet([entryHeaders, ...entryDataRows]);

  // --- SHEET 5: APFC ---
  const apfcs = await prisma.apfcTag.findMany({ orderBy: { createdAt: "desc" } });
  const apfcHeaders = [
    "Location Plant Input", "Location Panel", "Stage", "Rated Capacitor Value", "Voltage",
    "I-R", "I-Y", "I-B", "Remark", "Description", "Photo Path", "Recorded By", "Time"
  ];
  const apfcDataRows = apfcs.map(ap => {
    const zone = zones.find(z => z.id === ap.zoneId);
    const panel = areas.find(p => p.id === ap.areaId);
    const panelStr = panel ? `[${panel.type}] ${panel.name}` : "Direct Feed";
    return [
      zone?.name || "", panelStr, ap.stage || "", ap.ratedCapacitorValue || "", ap.voltage || "",
      f2(ap.iR), f2(ap.iY), f2(ap.iB), ap.remark || "", ap.description || "", ap.photoPath || "", ap.recordedBy || "Unknown",
      new Date(ap.createdAt).toLocaleString()
    ];
  });
  const ws5 = XLSX.utils.aoa_to_sheet([apfcHeaders, ...apfcDataRows]);

  // --- SHEET 6: Energy Sources ---
  const energySourceHeaders = [
    "Source Name", "Source Type", "PQ Name", "Recording ID",
    "V1", "V2", "V3", "Uthd1", "Uthd2", "Uthd3",
    "I1", "I2", "I3", "Ithd1", "Ithd2", "Ithd3",
    "Power Factor", "KVAr (D)", "KVAr (Q)", "KVAr Lead/Lag",
    "Total Power (kW)", "Date"
  ];
  const energySourceDataRows = energySources.map(es => [
    es.name,
    es.sourceType,
    es.pqName || "",
    es.recordingNameId || "",
    f2(es.v1), f2(es.v2), f2(es.v3),
    f2(es.uthd1), f2(es.uthd2), f2(es.uthd3),
    f2(es.i1), f2(es.i2), f2(es.i3),
    f2(es.ithd1), f2(es.ithd2), f2(es.ithd3),
    f3(es.pf), f2(es.kvarD), f2(es.kvarQ),
    es.kvarLeadLag || "",
    f2(es.totalPower),
    new Date(es.createdAt).toLocaleString("en-IN")
  ]);
  const ws6 = XLSX.utils.aoa_to_sheet([energySourceHeaders, ...energySourceDataRows]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, "Plant Main Input");
  XLSX.utils.book_append_sheet(wb, ws2, "PCC Panels");
  XLSX.utils.book_append_sheet(wb, ws3, "MCC Panels");
  XLSX.utils.book_append_sheet(wb, ws4, "Motor Load");
  XLSX.utils.book_append_sheet(wb, ws5, "APFC");
  XLSX.utils.book_append_sheet(wb, ws6, "Energy Sources");

  // Output buffer
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  // Wipe data after successful export!
  await prisma.entry.deleteMany();
  await prisma.areaTag.deleteMany();
  await prisma.zoneTag.deleteMany();
  await prisma.apfcTag.deleteMany();
  await prisma.energySource.deleteMany();
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
