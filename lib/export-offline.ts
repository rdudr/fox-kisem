import * as XLSX from "xlsx";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { CompanyProfile, ZoneTag, AreaTag, Entry, ApfcTag, EnergySource } from "@/lib/store";

// ─────────────────────────────────────────────────────────────────────────────
// Workbook builder — shared between local export and server email attachment
// ─────────────────────────────────────────────────────────────────────────────
export function buildWorkbook(
  profile: CompanyProfile | null,
  zones: ZoneTag[],
  areas: AreaTag[],
  entries: Entry[],
  apfcs: ApfcTag[] = [],
  energySources: EnergySource[] = []
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Company Profile
  if (profile) {
    const profileRows = [
      ["Company Name", profile.companyName],
      ["Area / Zone", profile.area],
      ["District", profile.district],
      ["State", profile.state],
      ["Pincode", profile.pincode],
      ["Overall Consumption (kW)", profile.overallConsumption],
      ["Export Date", new Date().toLocaleString("en-IN")],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(profileRows), "Company Profile");
  }

  // Sheet 2: Plant Main Inputs (Zones)
  const zoneHeaders = [
    "Name", "PQ Name", "Recording ID", "V1", "V2", "V3",
    "Uthd1", "Uthd2", "Uthd3",
    "I1", "I2", "I3",
    "Ithd1", "Ithd2", "Ithd3",
    "Power Factor", "KVAr (D)", "KVAr (Q)", "KVAr Lead/Lag",
    "Total Power (kW)", "Description", "Photo Path", "Recorded By", "Date",
  ];
  const zoneRows = zones.map((z) => [
    z.name, z.pqName ?? "", z.recordingNameId ?? "",
    z.v1 ?? "", z.v2 ?? "", z.v3 ?? "",
    z.uthd1 ?? "", z.uthd2 ?? "", z.uthd3 ?? "",
    z.i1 ?? "", z.i2 ?? "", z.i3 ?? "",
    z.ithd1 ?? "", z.ithd2 ?? "", z.ithd3 ?? "",
    z.pf ?? "", z.kvarD ?? "", z.kvarQ ?? "", z.kvarLeadLag ?? "",
    z.totalPower ?? "", z.description ?? "", z.photoPath ?? "", z.recordedBy ?? "Unknown",
    new Date(z.createdAt).toLocaleString("en-IN"),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([zoneHeaders, ...zoneRows]), "Plant Main Inputs");

  // Sheet 3: PCC Panels
  const pccHeaders = [
    "Plant Main Input", "PCC Name", "PQ Name", "Recording ID",
    "V1", "V2", "V3",
    "Uthd1", "Uthd2", "Uthd3",
    "I1", "I2", "I3",
    "Ithd1", "Ithd2", "Ithd3",
    "Power Factor", "KVAr (D)", "KVAr (Q)", "KVAr Lead/Lag",
    "Total Power (kW)", "Description", "Photo Path", "Recorded By", "Date",
  ];
  const pccRows = areas.filter(a => a.type === "PCC").map((a) => [
    zones.find((z) => z.id === a.zoneId)?.name ?? "Unknown",
    a.name, a.pqName ?? "", a.recordingNameId ?? "",
    a.v1 ?? "", a.v2 ?? "", a.v3 ?? "",
    a.uthd1 ?? "", a.uthd2 ?? "", a.uthd3 ?? "",
    a.i1 ?? "", a.i2 ?? "", a.i3 ?? "",
    a.ithd1 ?? "", a.ithd2 ?? "", a.ithd3 ?? "",
    a.pf ?? "", a.kvarD ?? "", a.kvarQ ?? "", a.kvarLeadLag ?? "",
    a.totalPower ?? "", a.description ?? "", a.photoPath ?? "", a.recordedBy ?? "Unknown",
    new Date(a.createdAt).toLocaleString("en-IN"),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([pccHeaders, ...pccRows]), "PCC Panels");

  // Sheet 4: MCC Panels
  const mccHeaders = [
    "Plant Main Input", "Parent PCC Panel", "MCC Name", "PQ Name", "Recording ID",
    "V1", "V2", "V3",
    "Uthd1", "Uthd2", "Uthd3",
    "I1", "I2", "I3",
    "Ithd1", "Ithd2", "Ithd3",
    "Power Factor", "KVAr (D)", "KVAr (Q)", "KVAr Lead/Lag",
    "Total Power (kW)", "Description", "Photo Path", "Recorded By", "Date",
  ];
  const mccRows = areas.filter(a => a.type === "MCC").map((a) => {
    const parentPcc = areas.find(p => p.id === a.pccId);
    return [
      zones.find((z) => z.id === a.zoneId)?.name ?? "Unknown",
      parentPcc ? parentPcc.name : "Direct Feed",
      a.name, a.pqName ?? "", a.recordingNameId ?? "",
      a.v1 ?? "", a.v2 ?? "", a.v3 ?? "",
      a.uthd1 ?? "", a.uthd2 ?? "", a.uthd3 ?? "",
      a.i1 ?? "", a.i2 ?? "", a.i3 ?? "",
      a.ithd1 ?? "", a.ithd2 ?? "", a.ithd3 ?? "",
      a.pf ?? "", a.kvarD ?? "", a.kvarQ ?? "", a.kvarLeadLag ?? "",
      a.totalPower ?? "", a.description ?? "", a.photoPath ?? "", a.recordedBy ?? "Unknown",
      new Date(a.createdAt).toLocaleString("en-IN"),
    ];
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([mccHeaders, ...mccRows]), "MCC Panels");

  // Sheet 5: Motor Loads Clamp (Entries)
  const clampEntries = entries.filter(e => !e.entryType || e.entryType === "CLAMP");
  const clampHeaders = [
    "Zone (Plant Input)", "Parent PCC Panel", "MCC Panel Name", "Machine Tag", "Starter Type", "VFD Frequency",
    "Rated kW", "Rated HP", "Voltage (V)", "Current (A)",
    "KVA", "Power Factor", "KVAr",
    "Measured kW", "Calculated Power (kW)", "Load Factor",
    "Description", "Photo Path", "Recorded By", "Date",
  ];
  const clampRows = clampEntries.map((e) => {
    const area = areas.find((a) => a.id === e.areaId);
    const zone = zones.find((z) => z.id === area?.zoneId);
    
    let pccName = "";
    let mccName = "";
    if (area) {
      if (area.type === "MCC") {
        mccName = area.name;
        const parentPcc = areas.find(p => p.id === area.pccId);
        pccName = parentPcc ? parentPcc.name : "Direct Feed";
      } else {
        pccName = area.name;
        mccName = "Direct (No MCC)";
      }
    }

    return [
      zone?.name ?? "Unknown",
      pccName || "Unknown",
      mccName || "Unknown",
      e.machineTag, e.starterType, e.vfdFrequency ?? "",
      e.ratedKw, e.ratedHp ?? "", e.voltage ?? "", e.current ?? "",
      e.kva ?? "", e.pf ?? "", e.kvar ?? "",
      e.measuredKw,
      Number(e.calculatedPower).toFixed(2),
      Number(e.loadFactor).toFixed(3),
      e.description ?? "", e.photoPath ?? "", e.recordedBy ?? "Unknown",
      new Date(e.createdAt).toLocaleString("en-IN"),
    ];
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([clampHeaders, ...clampRows]), "Motor Loads Clamp");

  // Sheet 6: Motor Loads PQ (Entries)
  const pqEntries = entries.filter(e => e.entryType === "PQ");
  const pqHeaders = [
    "Zone (Plant Input)", "Parent PCC Panel", "MCC Panel Name", "Machine Tag", "PQ Name", "Recording ID",
    "Starter Type", "VFD Frequency",
    "V1", "V2", "V3", "Uthd1", "Uthd2", "Uthd3",
    "I1", "I2", "I3", "Ithd1", "Ithd2", "Ithd3",
    "Power Factor", "KVAr (D)", "KVAr (Q)", "KVAr Lead/Lag",
    "Rated kW", "Rated HP", "Voltage (Avg)", "Current (Avg)", "KVA",
    "Measured kW", "Calculated Power (kW)", "Load Factor",
    "Description", "Photo Path", "Recorded By", "Date"
  ];
  const pqRows = pqEntries.map((e) => {
    const area = areas.find((a) => a.id === e.areaId);
    const zone = zones.find((z) => z.id === area?.zoneId);
    
    let pccName = "";
    let mccName = "";
    if (area) {
      if (area.type === "MCC") {
        mccName = area.name;
        const parentPcc = areas.find(p => p.id === area.pccId);
        pccName = parentPcc ? parentPcc.name : "Direct Feed";
      } else {
        pccName = area.name;
        mccName = "Direct (No MCC)";
      }
    }

    return [
      zone?.name ?? "Unknown",
      pccName || "Unknown",
      mccName || "Unknown",
      e.machineTag, e.pqName ?? "", e.recordingNameId ?? "",
      e.starterType, e.vfdFrequency ?? "",
      e.v1 ?? "", e.v2 ?? "", e.v3 ?? "",
      e.uthd1 ?? "", e.uthd2 ?? "", e.uthd3 ?? "",
      e.i1 ?? "", e.i2 ?? "", e.i3 ?? "",
      e.ithd1 ?? "", e.ithd2 ?? "", e.ithd3 ?? "",
      e.pf ?? "", e.kvarD ?? "", e.kvarQ ?? "", e.kvarLeadLag ?? "",
      e.ratedKw, e.ratedHp ?? "", e.voltage ?? "", e.current ?? "",
      e.kva ?? "",
      e.measuredKw,
      Number(e.calculatedPower).toFixed(2),
      Number(e.loadFactor).toFixed(3),
      e.description ?? "", e.photoPath ?? "", e.recordedBy ?? "Unknown",
      new Date(e.createdAt).toLocaleString("en-IN"),
    ];
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([pqHeaders, ...pqRows]), "Motor Loads PQ");

  // Sheet 6: APFC
  const apfcHeaders = [
    "Location Plant Input", "Location Panel", "Stage", "Rated Capacitor Value", "Voltage",
    "I-R", "I-Y", "I-B",
    "Remark", "Description", "Photo Path", "Recorded By", "Date"
  ];
  const apfcRows = apfcs.map((a) => {
    const zone = zones.find(z => z.id === a.zoneId);
    const panel = areas.find(p => p.id === a.areaId);
    const locationPanel = panel ? `[${panel.type}] ${panel.name}` : "Direct Feed";

    return [
      zone?.name ?? "Unknown",
      locationPanel,
      a.stage ?? "", a.ratedCapacitorValue ?? "", a.voltage ?? "",
      a.iR ?? "", a.iY ?? "", a.iB ?? "",
      a.remark ?? "", a.description ?? "", a.photoPath ?? "", a.recordedBy ?? "Unknown",
      new Date(a.createdAt).toLocaleString("en-IN")
    ];
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([apfcHeaders, ...apfcRows]), "APFC");

  // Sheet 7: Energy Sources
  const energySourceHeaders = [
    "Source Name", "Source Type", "PQ Name", "Recording ID",
    "V1", "V2", "V3", "Uthd1", "Uthd2", "Uthd3",
    "I1", "I2", "I3", "Ithd1", "Ithd2", "Ithd3",
    "Power Factor", "KVAr (D)", "KVAr (Q)", "KVAr Lead/Lag",
    "Total Power (kW)", "Date"
  ];
  const energySourceRows = energySources.map((es) => [
    es.name, es.sourceType, es.pqName ?? "", es.recordingNameId ?? "",
    es.v1 ?? "", es.v2 ?? "", es.v3 ?? "",
    es.uthd1 ?? "", es.uthd2 ?? "", es.uthd3 ?? "",
    es.i1 ?? "", es.i2 ?? "", es.i3 ?? "",
    es.ithd1 ?? "", es.ithd2 ?? "", es.ithd3 ?? "",
    es.pf ?? "", es.kvarD ?? "", es.kvarQ ?? "", es.kvarLeadLag ?? "",
    es.totalPower ?? "",
    es.createdAt ? new Date(es.createdAt).toLocaleString("en-IN") : new Date().toLocaleString("en-IN")
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([energySourceHeaders, ...energySourceRows]), "Energy Sources");

  return wb;
}

export function getFilename(profile: CompanyProfile | null): string {
  const company = profile?.companyName?.replace(/\s+/g, "_") ?? "export";
  const today = new Date();
  const ddmm = `${String(today.getDate()).padStart(2, "0")}${String(today.getMonth() + 1).padStart(2, "0")}`;
  return `${company}_${ddmm}.xlsx`;
}

/**
 * exportOfflineExcel
 * ─────────────────
 * Android: Silently saves the Excel file to the device's Documents folder.
 *          Returns the URI of the saved file so the caller can use it.
 *          Does NOT open a Share sheet (user gets it in Files/Downloads).
 * Web:     Triggers a browser Blob download.
 */
export async function exportOfflineExcel(
  profile: CompanyProfile | null,
  zones: ZoneTag[],
  areas: AreaTag[],
  entries: Entry[],
  apfcs: ApfcTag[] = [],
  energySources: EnergySource[] = []
): Promise<string | null> {
  const wb = buildWorkbook(profile, zones, areas, entries, apfcs, energySources);
  const filename = getFilename(profile);

  if (Capacitor.isNativePlatform()) {
    const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

    // Try saving to Documents first (visible in Files app), fall back to Cache
    const targets = [Directory.Documents, Directory.Cache];
    for (const dir of targets) {
      try {
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: dir,
          recursive: true,
        });
        console.log(`[export] File saved to ${dir}:`, result.uri);
        return result.uri;
      } catch (e) {
        console.warn(`[export] Write to ${dir} failed, trying next:`, e);
      }
    }
    console.error("[export] All write targets failed");
    return null;
  } else {
    // Web browser fallback
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
    return filename;
  }
}

/**
 * buildExcelBase64 — used by the sync job to send the file as an email attachment
 */
export function buildExcelBase64(
  profile: CompanyProfile | null,
  zones: ZoneTag[],
  areas: AreaTag[],
  entries: Entry[],
  apfcs: ApfcTag[] = [],
  energySources: EnergySource[] = []
): { base64: string; filename: string } {
  const wb = buildWorkbook(profile, zones, areas, entries, apfcs, energySources);
  const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
  return { base64, filename: getFilename(profile) };
}
