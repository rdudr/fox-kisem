import * as XLSX from "xlsx";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { CompanyProfile, ZoneTag, AreaTag, Entry, ApfcTag } from "@/lib/store";

// ─────────────────────────────────────────────────────────────────────────────
// Workbook builder — shared between local export and server email attachment
// ─────────────────────────────────────────────────────────────────────────────
export function buildWorkbook(
  profile: CompanyProfile | null,
  zones: ZoneTag[],
  areas: AreaTag[],
  entries: Entry[],
  apfcs: ApfcTag[] = []
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
    "Total Power (kW)", "Description", "Date",
  ];
  const zoneRows = zones.map((z) => [
    z.name, z.pqName ?? "", z.recordingNameId ?? "",
    z.v1 ?? "", z.v2 ?? "", z.v3 ?? "",
    z.uthd1 ?? "", z.uthd2 ?? "", z.uthd3 ?? "",
    z.i1 ?? "", z.i2 ?? "", z.i3 ?? "",
    z.ithd1 ?? "", z.ithd2 ?? "", z.ithd3 ?? "",
    z.pf ?? "", z.kvarD ?? "", z.kvarQ ?? "", z.kvarLeadLag ?? "",
    z.totalPower ?? "", z.description ?? "",
    new Date(z.createdAt).toLocaleString("en-IN"),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([zoneHeaders, ...zoneRows]), "Plant Main Inputs");

  // Sheet 3: MCC/PCC (Areas)
  const areaHeaders = [
    "Plant Main Input", "MCC/PCC Name", "PQ Name", "Recording ID",
    "V1", "V2", "V3",
    "Uthd1", "Uthd2", "Uthd3",
    "I1", "I2", "I3",
    "Ithd1", "Ithd2", "Ithd3",
    "Power Factor", "KVAr (D)", "KVAr (Q)", "KVAr Lead/Lag",
    "Total Power (kW)", "Description", "Date",
  ];
  const areaRows = areas.map((a) => [
    zones.find((z) => z.id === a.zoneId)?.name ?? "Unknown",
    a.name, a.pqName ?? "", a.recordingNameId ?? "",
    a.v1 ?? "", a.v2 ?? "", a.v3 ?? "",
    a.uthd1 ?? "", a.uthd2 ?? "", a.uthd3 ?? "",
    a.i1 ?? "", a.i2 ?? "", a.i3 ?? "",
    a.ithd1 ?? "", a.ithd2 ?? "", a.ithd3 ?? "",
    a.pf ?? "", a.kvarD ?? "", a.kvarQ ?? "", a.kvarLeadLag ?? "",
    a.totalPower ?? "", a.description ?? "",
    new Date(a.createdAt).toLocaleString("en-IN"),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([areaHeaders, ...areaRows]), "MCC-PCC Areas");

  // Sheet 4: Motor Loads (Entries)
  const entryHeaders = [
    "Zone", "Area (MCC/PCC)", "Machine Tag", "Starter Type", "VFD Frequency",
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
      e.machineTag, e.starterType, e.vfdFrequency ?? "",
      e.ratedKw, e.ratedHp ?? "", e.voltage ?? "", e.current ?? "",
      e.kva ?? "", e.pf ?? "", e.kvar ?? "",
      e.measuredKw,
      Number(e.calculatedPower).toFixed(2),
      Number(e.loadFactor).toFixed(3),
      e.description ?? "",
      new Date(e.createdAt).toLocaleString("en-IN"),
    ];
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([entryHeaders, ...entryRows]), "Motor Loads");

  // Sheet 5: APFC
  const apfcHeaders = [
    "Stage", "Rated Capacitor Value", "Voltage",
    "I-R", "I-Y", "I-B",
    "Remark", "Description", "Date"
  ];
  const apfcRows = apfcs.map((a) => [
    a.stage ?? "", a.ratedCapacitorValue ?? "", a.voltage ?? "",
    a.iR ?? "", a.iY ?? "", a.iB ?? "",
    a.remark ?? "", a.description ?? "",
    new Date(a.createdAt).toLocaleString("en-IN")
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([apfcHeaders, ...apfcRows]), "APFC");

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
  apfcs: ApfcTag[] = []
): Promise<string | null> {
  const wb = buildWorkbook(profile, zones, areas, entries, apfcs);
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
  apfcs: ApfcTag[] = []
): { base64: string; filename: string } {
  const wb = buildWorkbook(profile, zones, areas, entries, apfcs);
  const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
  return { base64, filename: getFilename(profile) };
}
