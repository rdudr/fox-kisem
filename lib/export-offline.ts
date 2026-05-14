import * as XLSX from "xlsx";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { CompanyProfile, ZoneTag, AreaTag, Entry } from "@/lib/store";

function buildWorkbook(
  profile: CompanyProfile | null,
  zones: ZoneTag[],
  areas: AreaTag[],
  entries: Entry[]
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Company Profile ──────────────────────────────────────────
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

  // ── Sheet 2: Plant Main Inputs (Zones) ───────────────────────────────
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
    new Date(z.createdAt).toLocaleString("en-IN"),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([zoneHeaders, ...zoneRows]), "Plant Main Inputs");

  // ── Sheet 3: MCC / PCC (Areas) ───────────────────────────────────────
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
    new Date(a.createdAt).toLocaleString("en-IN"),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([areaHeaders, ...areaRows]), "MCC-PCC Areas");

  // ── Sheet 4: Motor Loads (Entries) ───────────────────────────────────
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
      e.measuredKw,
      Number(e.calculatedPower).toFixed(2),
      Number(e.loadFactor).toFixed(3),
      e.description ?? "",
      new Date(e.createdAt).toLocaleString("en-IN"),
    ];
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([entryHeaders, ...entryRows]), "Motor Loads");

  return wb;
}

function getFilename(profile: CompanyProfile | null): string {
  const company = profile?.companyName?.replace(/\s+/g, "_") ?? "export";
  const today = new Date();
  const ddmm = `${String(today.getDate()).padStart(2, "0")}${String(today.getMonth() + 1).padStart(2, "0")}`;
  return `${company}_${ddmm}.xlsx`;
}

/**
 * Download Excel using Native Share sheet (Android) or Blob URL (Web browser).
 */
export async function exportOfflineExcel(
  profile: CompanyProfile | null,
  zones: ZoneTag[],
  areas: AreaTag[],
  entries: Entry[]
): Promise<void> {
  const wb = buildWorkbook(profile, zones, areas, entries);
  const filename = getFilename(profile);

  if (Capacitor.isNativePlatform()) {
    try {
      // Write as base64 to a device-visible directory (prefer Documents/External)
      const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

      // Attempt writing to external Documents/Downloads so file is visible to user
      let result;
      try {
        result = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Documents,
        });
      } catch (e) {
        // Fallback to cache if external write fails
        console.warn('Write to Documents failed, falling back to Cache:', e);
        result = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Cache,
        });
      }

      // On native we try not to force the share sheet; the file is written to device storage
      // but we still provide a quick Share option so user can immediately send or save elsewhere.
      try {
        await Share.share({
          title: "Fox Kisem — Exported Report",
          text: `Excel Report for ${profile?.companyName ?? "Company"}`,
          url: result.uri,
          dialogTitle: "Save or Share Report",
        });
      } catch (shareErr) {
        // Non-blocking: if share is dismissed or fails, ignore — file is already saved.
        console.info('Share sheet not opened or dismissed:', shareErr);
      }
    } catch (err) {
      console.error("Native export failed", err);
      alert("Export failed: " + JSON.stringify(err));
    }
  } else {
    // Fallback for standard web browser
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
  }
}

/**
 * Return the workbook as a base64 string (useful for attaching to emails client-side).
 */
export function buildExcelBase64(
  profile: CompanyProfile | null,
  zones: ZoneTag[],
  areas: AreaTag[],
  entries: Entry[]
): { base64: string; filename: string } {
  const wb = buildWorkbook(profile, zones, areas, entries);
  const base64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
  return { base64, filename: getFilename(profile) };
}
