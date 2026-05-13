import * as XLSX from "xlsx";
import { CompanyProfile, ZoneTag, AreaTag, Entry } from "@/lib/store";

export function exportOfflineExcel(
  profile: CompanyProfile | null,
  zones: ZoneTag[],
  areas: AreaTag[],
  entries: Entry[]
) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Company Profile ───────────────────────────────────────────
  if (profile) {
    const profileRows = [
      ["Company Name", profile.companyName],
      ["Area / Zone", profile.area],
      ["District", profile.district],
      ["State", profile.state],
      ["Pincode", profile.pincode],
      ["Overall Consumption", profile.overallConsumption],
      ["Last Updated", new Date(profile.updatedAt).toLocaleString()],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(profileRows);
    XLSX.utils.book_append_sheet(wb, ws1, "Company Profile");
  }

  // ── Sheet 2: Plant Main Inputs (Zones) ────────────────────────────────
  const zoneHeaders = [
    "Name", "PQ Name", "V1", "V2", "V3",
    "Uhtd1", "Uhtd2", "Uhtd3",
    "I1", "I2", "I3",
    "Ihtd1", "Ihtd2", "Ihtd3",
    "Power Factor", "KVAr (D)", "KVAr (Q)", "KVAr Lead/Lag",
    "Total Power (kW)", "Description", "Date",
  ];
  const zoneRows = zones.map((z) => [
    z.name, z.pqName ?? "",
    z.v1 ?? "", z.v2 ?? "", z.v3 ?? "",
    z.uhtd1 ?? "", z.uhtd2 ?? "", z.uhtd3 ?? "",
    z.i1 ?? "", z.i2 ?? "", z.i3 ?? "",
    z.ihtd1 ?? "", z.ihtd2 ?? "", z.ihtd3 ?? "",
    z.pf ?? "", z.kvarD ?? "", z.kvarQ ?? "", z.kvarLeadLag ?? "",
    z.totalPower ?? "", z.description ?? "",
    new Date(z.createdAt).toLocaleString(),
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([zoneHeaders, ...zoneRows]);
  XLSX.utils.book_append_sheet(wb, ws2, "Plant Main Inputs");

  // ── Sheet 3: MCC / PCC (Areas) ────────────────────────────────────────
  const areaHeaders = [
    "Plant Main Input", "MCC/PCC Name", "PQ Name",
    "V1", "V2", "V3",
    "Uhtd1", "Uhtd2", "Uhtd3",
    "I1", "I2", "I3",
    "Ihtd1", "Ihtd2", "Ihtd3",
    "Power Factor", "KVAr (D)", "KVAr (Q)", "KVAr Lead/Lag",
    "Total Power (kW)", "Description", "Date",
  ];
  const areaRows = areas.map((a) => [
    zones.find((z) => z.id === a.zoneId)?.name ?? "Unknown",
    a.name, a.pqName ?? "",
    a.v1 ?? "", a.v2 ?? "", a.v3 ?? "",
    a.uhtd1 ?? "", a.uhtd2 ?? "", a.uhtd3 ?? "",
    a.i1 ?? "", a.i2 ?? "", a.i3 ?? "",
    a.ihtd1 ?? "", a.ihtd2 ?? "", a.ihtd3 ?? "",
    a.pf ?? "", a.kvarD ?? "", a.kvarQ ?? "", a.kvarLeadLag ?? "",
    a.totalPower ?? "", a.description ?? "",
    new Date(a.createdAt).toLocaleString(),
  ]);
  const ws3 = XLSX.utils.aoa_to_sheet([areaHeaders, ...areaRows]);
  XLSX.utils.book_append_sheet(wb, ws3, "MCC-PCC Areas");

  // ── Sheet 4: Motor Loads (Entries) ────────────────────────────────────
  const entryHeaders = [
    "Zone", "Area (MCC/PCC)", "Machine Tag", "Starter Type",
    "Rated kW", "Rated HP", "Voltage (V)", "Current (A)",
    "KVA", "Power Factor", "KVAr",
    "Measured kW", "Calculated Power (kW)", "Load Factor",
    "Description", "Date",
  ];
  const entryRows = entries.map((e) => {
    const area = areas.find((a) => a.id === e.areaId);
    const zone = zones.find((z) => z.id === area?.zoneId);
    return [
      zone?.name ?? "Unknown",
      area?.name ?? "Unknown",
      e.machineTag, e.starterType,
      e.ratedKw, e.ratedHp ?? "", e.voltage ?? "", e.current ?? "",
      e.kva ?? "", e.pf ?? "", e.kvar ?? "",
      e.measuredKw, e.calculatedPower.toFixed(2), e.loadFactor.toFixed(3),
      e.description ?? "",
      new Date(e.createdAt).toLocaleString(),
    ];
  });
  const ws4 = XLSX.utils.aoa_to_sheet([entryHeaders, ...entryRows]);
  XLSX.utils.book_append_sheet(wb, ws4, "Motor Loads");

  // ── Generate filename & download ──────────────────────────────────────
  const company = profile?.companyName?.replace(/\s+/g, "_") ?? "export";
  const today   = new Date();
  const ddmm    = `${String(today.getDate()).padStart(2, "0")}${String(today.getMonth() + 1).padStart(2, "0")}`;
  const filename = `${company}_${ddmm}.xlsx`;

  XLSX.writeFile(wb, filename);
}
