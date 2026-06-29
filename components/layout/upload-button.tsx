"use client";

import React, { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, CompanyProfile, ZoneTag, AreaTag, Entry, ApfcTag, EnergySource } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export function UploadButton() {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const zones = useAppStore((s) => s.zones);
  const areas = useAppStore((s) => s.areas);
  const entries = useAppStore((s) => s.entries);
  const apfcs = useAppStore((s) => s.apfcs);
  const profile = useAppStore((s) => s.profile);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const ab = e.target?.result;
        if (!ab) throw new Error("Failed to read file buffer");

        const wb = XLSX.read(ab, { type: "array" });
        const summary = importWorkbookData(wb);
        toast.success(
          `Import successful!\n` +
          `• Zones: ${summary.zonesAdded} added, ${summary.zonesUpdated} updated\n` +
          `• Areas: ${summary.areasAdded} added, ${summary.areasUpdated} updated\n` +
          `• Motor Loads: ${summary.entriesAdded} added, ${summary.entriesUpdated} updated\n` +
          `• APFCs: ${summary.apfcAdded} added, ${summary.apfcUpdated} updated\n` +
          `• Energy Sources: ${summary.energySourcesAdded} added, ${summary.energySourcesUpdated} updated\n` +
          `No duplicate records were created.`,
          { duration: 6000 }
        );
      } catch (err: any) {
        console.error("[IMPORT ERROR]", err);
        toast.error(`Import failed: ${err.message || "Invalid Excel file"}`);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
      setImporting(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Helper to parse dates in various formats safely
  const parseExcelDate = (val: any): string => {
    if (val === undefined || val === null || val === "") {
      return new Date().toISOString();
    }

    // Handle numeric Excel date (serial number)
    if (typeof val === "number") {
      try {
        const date = new Date((val - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {}
    }

    const str = String(val).trim();
    if (!str) return new Date().toISOString();

    // Try standard JS date parsing
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    } catch {}

    // Fallback parsing for Indian Standard Time string format: "DD/MM/YYYY, HH:MM:SS" or "DD/MM/YYYY"
    try {
      const parts = str.split(/[\/\-\,\s\:]+/);
      if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const year = parseInt(parts[2], 10);

        let hour = 0;
        let minute = 0;
        let second = 0;

        if (parts.length >= 6) {
          hour = parseInt(parts[3], 10);
          minute = parseInt(parts[4], 10);
          second = parseInt(parts[5], 10);
        }

        // Adjust for AM/PM if present in string
        const lowerStr = str.toLowerCase();
        if (lowerStr.includes("pm") && hour < 12) hour += 12;
        if (lowerStr.includes("am") && hour === 12) hour = 0;

        const date = new Date(year, month, day, hour, minute, second);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    } catch {}

    // Graceful fallback to current time rather than crash
    return new Date().toISOString();
  };

  // Main importing and duplicate protection utility
  const importWorkbookData = (wb: XLSX.WorkBook) => {
    const parsedProfile: Partial<CompanyProfile> = {};
    const parsedZones: any[] = [];
    const parsedAreas: any[] = [];
    const parsedEntries: any[] = [];
    const parsedApfcs: any[] = [];
    const parsedEnergySources: any[] = [];

    // Iterate through sheet names and identify formats
    wb.SheetNames.forEach((sheetName) => {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
      if (rows.length === 0) return;

      const normName = sheetName.trim().toLowerCase();

      // 1. Company Profile sheet
      if (normName === "company profile") {
        rows.forEach((row) => {
          if (!row || row.length < 2) return;
          const key = String(row[0]).trim().toLowerCase();
          const val = String(row[1]).trim();
          if (key.includes("company name")) parsedProfile.companyName = val;
          else if (key.includes("area / zone") || key.includes("area")) parsedProfile.area = val;
          else if (key.includes("district")) parsedProfile.district = val;
          else if (key.includes("state")) parsedProfile.state = val;
          else if (key.includes("pincode")) parsedProfile.pincode = val;
          else if (key.includes("overall consumption")) parsedProfile.overallConsumption = parseFloat(val) || val;
        });
      }

      // 2. Plant Main Inputs / Zones sheet
      else if (normName === "plant main inputs" || normName === "plant main input") {
        // Look for metadata at top (Online export format)
        let dataStartRow = 0;
        let foundHeader = false;

        // Scan first 10 rows for headers
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const row = rows[i];
          if (!row) continue;

          // Check if it's the metadata profile row
          if (i === 0 && row[0] && String(row[0]).toUpperCase() !== "NAME") {
            parsedProfile.companyName = String(row[0]).trim();
          }
          if (i === 1 && row[0] && String(row[0]).startsWith("Area:")) {
            const text = String(row[0]);
            const matchArea = text.match(/Area:\s*(.*?)\s*\|/);
            const matchDistrict = text.match(/District:\s*(.*?)\s*\|/);
            const matchState = text.match(/State:\s*(.*?)\s*\|/);
            const matchPincode = text.match(/Pincode:\s*(.*?)\s*$/);
            if (matchArea) parsedProfile.area = matchArea[1].trim();
            if (matchDistrict) parsedProfile.district = matchDistrict[1].trim();
            if (matchState) parsedProfile.state = matchState[1].trim();
            if (matchPincode) parsedProfile.pincode = matchPincode[1].trim();
          }

          // Search for columns matching Plant Input Zone keys
          const cols = row.map((c) => String(c || "").trim().toLowerCase());
          if (cols.includes("name") || cols.includes("pq name")) {
            dataStartRow = i + 1;
            foundHeader = true;
            break;
          }
        }

        const headerRowIndex = foundHeader ? dataStartRow - 1 : 0;
        const headers = rows[headerRowIndex].map((h: any) => String(h || "").trim());

        for (let i = dataStartRow; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[0]) continue;
          
          const z: any = {};
          headers.forEach((h: string, idx: number) => {
            const val = row[idx];
            const cleanHeader = h.toLowerCase();
            if (cleanHeader === "name") z.name = String(val || "").trim();
            else if (cleanHeader === "pq name") z.pqName = val ? String(val).trim() : null;
            else if (cleanHeader === "recording id" || cleanHeader === "recording name id") z.recordingNameId = val ? String(val).trim() : null;
            else if (cleanHeader === "v1") z.v1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "v2") z.v2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "v3") z.v3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "uthd1") z.uthd1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "uthd2") z.uthd2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "uthd3") z.uthd3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i1") z.i1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i2") z.i2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i3") z.i3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "ithd1") z.ithd1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "ithd2") z.ithd2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "ithd3") z.ithd3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "power factor" || cleanHeader === "pf") z.pf = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "kvar (d)" || cleanHeader === "kvard") z.kvarD = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "kvar (q)" || cleanHeader === "kvarq") z.kvarQ = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "kvar lead/lag" || cleanHeader === "lead/lag") z.kvarLeadLag = val ? String(val).trim() : "Lead";
            else if (cleanHeader === "total power (kw)" || cleanHeader === "total power") z.totalPower = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "description") z.description = val ? String(val).trim() : null;
            else if (cleanHeader === "recorded by") z.recordedBy = val ? String(val).trim() : null;
            else if (cleanHeader === "date" || cleanHeader === "time") z.createdAt = parseExcelDate(val);
          });

          if (z.name) {
            if (!z.createdAt) z.createdAt = new Date().toISOString();
            parsedZones.push(z);
          }
        }
      }

      // 3. PCC Panels or MCC Panels or legacy MCC/PCC Areas sheet
      else if (
        normName === "mcc-pcc areas" ||
        normName === "mcc-pcc" ||
        normName === "pcc panels" ||
        normName === "pcc panel" ||
        normName === "mcc panels" ||
        normName === "mcc panel"
      ) {
        const isMccSheet = normName.includes("mcc") && !normName.includes("pcc");
        const defaultType = isMccSheet ? "MCC" : "PCC";

        const headers = rows[0].map((h: any) => String(h || "").trim());
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[0]) continue;

          const a: any = { type: defaultType };
          headers.forEach((h: string, idx: number) => {
            const val = row[idx];
            const cleanHeader = h.toLowerCase();
            if (cleanHeader === "plant main input" || cleanHeader === "zone") a.parentZoneName = String(val || "").trim();
            else if (cleanHeader === "parent pcc panel" || cleanHeader === "parent pcc") a.parentPccName = String(val || "").trim();
            else if (cleanHeader === "pcc name" || cleanHeader === "mcc name" || cleanHeader === "mcc/pcc name" || cleanHeader === "mcc/pcc" || cleanHeader === "name") a.name = String(val || "").trim();
            else if (cleanHeader === "pq name") a.pqName = val ? String(val).trim() : null;
            else if (cleanHeader === "recording id" || cleanHeader === "recording name id") a.recordingNameId = val ? String(val).trim() : null;
            else if (cleanHeader === "v1") a.v1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "v2") a.v2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "v3") a.v3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "uthd1") a.uthd1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "uthd2") a.uthd2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "uthd3") a.uthd3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i1") a.i1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i2") a.i2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i3") a.i3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "ithd1") a.ithd1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "ithd2") a.ithd2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "ithd3") a.ithd3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "power factor" || cleanHeader === "pf") a.pf = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "kvar (d)" || cleanHeader === "kvard") a.kvarD = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "kvar (q)" || cleanHeader === "kvarq") a.kvarQ = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "kvar lead/lag" || cleanHeader === "lead/lag") a.kvarLeadLag = val ? String(val).trim() : "Lag";
            else if (cleanHeader === "total power (kw)" || cleanHeader === "total power") a.totalPower = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "description") a.description = val ? String(val).trim() : null;
            else if (cleanHeader === "photo path") a.photoPath = val ? String(val).trim() : null;
            else if (cleanHeader === "recorded by") a.recordedBy = val ? String(val).trim() : null;
            else if (cleanHeader === "date" || cleanHeader === "time") a.createdAt = parseExcelDate(val);
          });

          if (a.name && a.parentZoneName) {
            if (!a.createdAt) a.createdAt = new Date().toISOString();
            parsedAreas.push(a);
          }
        }
      }

      // 4. Motor Loads / Entries sheet
      else if (normName === "motor loads" || normName === "motor load") {
        const headers = rows[0].map((h: any) => String(h || "").trim());
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[2]) continue; // tag must be present

          const e: any = {};
          headers.forEach((h: string, idx: number) => {
            const val = row[idx];
            const cleanHeader = h.toLowerCase();
            if (cleanHeader === "zone" || cleanHeader === "plant main input" || cleanHeader === "zone (plant input)") e.parentZoneName = String(val || "").trim();
            else if (cleanHeader === "area (mcc/pcc)" || cleanHeader === "mcc/pcc" || cleanHeader === "mcc-pcc" || cleanHeader === "mcc panel name" || cleanHeader === "mcc panel") e.parentAreaName = String(val || "").trim();
            else if (cleanHeader === "parent pcc panel" || cleanHeader === "pcc panel") e.parentPccName = String(val || "").trim();
            else if (cleanHeader === "machine tag" || cleanHeader === "machinetag") e.machineTag = String(val || "").trim();
            else if (cleanHeader === "starter type" || cleanHeader === "startertype") e.starterType = String(val || "DOL").trim().toUpperCase();
            else if (cleanHeader === "vfd frequency") e.vfdFrequency = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "rated kw" || cleanHeader === "ratedkw") e.ratedKw = Number(val) || 0;
            else if (cleanHeader === "rated hp" || cleanHeader === "ratedhp") e.ratedHp = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "voltage (v)" || cleanHeader === "voltage(v)" || cleanHeader === "voltage") e.voltage = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "current (a)" || cleanHeader === "current(i)" || cleanHeader === "current") e.current = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "kva") e.kva = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "power factor" || cleanHeader === "pf") e.pf = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "kvar") e.kvar = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "measured kw" || cleanHeader === "measuredkw") e.measuredKw = Number(val) || 0;
            else if (cleanHeader === "calculated power (kw)" || cleanHeader === "calculatedpower(kw)") e.calculatedPower = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "load factor") e.loadFactor = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "description") e.description = val ? String(val).trim() : null;
            else if (cleanHeader === "photo path") e.photoPath = val ? String(val).trim() : null;
            else if (cleanHeader === "recorded by") e.recordedBy = val ? String(val).trim() : null;
            else if (cleanHeader === "date" || cleanHeader === "time") e.createdAt = parseExcelDate(val);
          });

          if (e.machineTag && (e.parentAreaName || e.parentPccName)) {
            if (!e.createdAt) e.createdAt = new Date().toISOString();
            parsedEntries.push(e);
          }
        }
      }

      // 5. APFC sheet
      else if (normName === "apfc") {
        const headers = rows[0].map((h: any) => String(h || "").trim());
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || row[0] === undefined) continue;

          const ap: any = {};
          headers.forEach((h: string, idx: number) => {
            const val = row[idx];
            const cleanHeader = h.toLowerCase();
            if (cleanHeader === "location plant input" || cleanHeader === "plant input" || cleanHeader === "zone" || cleanHeader === "plant main input") ap.parentZoneName = String(val || "").trim();
            else if (cleanHeader === "location panel" || cleanHeader === "panel") ap.parentAreaName = String(val || "").trim();
            else if (cleanHeader === "stage") ap.stage = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "rated capacitor value") ap.ratedCapacitorValue = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "voltage") ap.voltage = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i-r" || cleanHeader === "ir") ap.iR = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i-y" || cleanHeader === "iy") ap.iY = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i-b" || cleanHeader === "ib") ap.iB = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "remark") ap.remark = val ? String(val).trim() : null;
            else if (cleanHeader === "description") ap.description = val ? String(val).trim() : null;
            else if (cleanHeader === "photo path") ap.photoPath = val ? String(val).trim() : null;
            else if (cleanHeader === "recorded by") ap.recordedBy = val ? String(val).trim() : null;
            else if (cleanHeader === "date" || cleanHeader === "time") ap.createdAt = parseExcelDate(val);
          });

          if (ap.stage !== null) {
            if (!ap.createdAt) ap.createdAt = new Date().toISOString();
            parsedApfcs.push(ap);
          }
        }
      }
      
      else if (normName === "energy sources" || normName === "energy source") {
        const headers = rows[0].map((h: any) => String(h || "").trim());
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || row[0] === undefined) continue;

          const es: any = {};
          headers.forEach((h: string, idx: number) => {
            const val = row[idx];
            const cleanHeader = h.toLowerCase();
            if (cleanHeader === "source name" || cleanHeader === "name") es.name = String(val || "").trim();
            else if (cleanHeader === "source type" || cleanHeader === "type") es.sourceType = String(val || "Main Grid").trim();
            else if (cleanHeader === "pq name") es.pqName = val ? String(val).trim() : null;
            else if (cleanHeader === "recording id" || cleanHeader === "recording name id") es.recordingNameId = val ? String(val).trim() : null;
            else if (cleanHeader === "v1") es.v1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "v2") es.v2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "v3") es.v3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "uthd1") es.uthd1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "uthd2") es.uthd2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "uthd3") es.uthd3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i1") es.i1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i2") es.i2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "i3") es.i3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "ithd1") es.ithd1 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "ithd2") es.ithd2 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "ithd3") es.ithd3 = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "power factor" || cleanHeader === "pf") es.pf = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "kvar (d)" || cleanHeader === "kvard") es.kvarD = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "kvar (q)" || cleanHeader === "kvarq") es.kvarQ = val !== undefined && val !== "" ? Number(val) : null;
            else if (cleanHeader === "kvar style" || cleanHeader === "kvar lead/lag" || cleanHeader === "lead/lag") es.kvarLeadLag = val ? String(val).trim() : "Lag";
            else if (cleanHeader === "total power" || cleanHeader === "total power (kw)") es.totalPower = val !== undefined && val !== "" ? Number(val) : null;
          });

          if (es.name) {
            parsedEnergySources.push(es);
          }
        }
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // DUPLICATE PROTECTION & STORE MERGING LOGIC
    // ─────────────────────────────────────────────────────────────────────────
    const currentZones = [...zones];
    const currentAreas = [...areas];
    const currentEntries = [...entries];
    const currentApfcs = [...apfcs];

    let zonesAdded = 0;
    let zonesUpdated = 0;
    let areasAdded = 0;
    let areasUpdated = 0;
    let entriesAdded = 0;
    let entriesUpdated = 0;
    let apfcAdded = 0;
    let apfcUpdated = 0;

    const currentUserName = useAuthStore.getState().displayName || "Unknown";

    // 1. Process Company Profile
    let finalProfile = profile ? { ...profile } : null;
    if (parsedProfile.companyName) {
      finalProfile = {
        id: profile?.id || crypto.randomUUID(),
        companyName: parsedProfile.companyName,
        area: parsedProfile.area || profile?.area || "N/A",
        district: parsedProfile.district || profile?.district || "N/A",
        state: parsedProfile.state || profile?.state || "N/A",
        pincode: parsedProfile.pincode || profile?.pincode || "N/A",
        overallConsumption: parsedProfile.overallConsumption !== undefined ? parsedProfile.overallConsumption : (profile?.overallConsumption || 0),
        updatedAt: new Date().toISOString()
      };
    }

    // Maps to bind parsed child structures to merged DB IDs
    const zoneNameToId: Record<string, string> = {};
    currentZones.forEach((z) => {
      zoneNameToId[z.name.toLowerCase().trim()] = z.id;
    });

    // 2. Merge Zones
    parsedZones.forEach((pz) => {
      const key = pz.name.toLowerCase().trim();
      const existingId = zoneNameToId[key];

      const record: ZoneTag = {
        id: existingId || crypto.randomUUID(),
        name: pz.name,
        v1: pz.v1, v2: pz.v2, v3: pz.v3,
        uthd1: pz.uthd1, uthd2: pz.uthd2, uthd3: pz.uthd3,
        i1: pz.i1, i2: pz.i2, i3: pz.i3,
        ithd1: pz.ithd1, ithd2: pz.ithd2, ithd3: pz.ithd3,
        pf: pz.pf, kvarD: pz.kvarD, kvarQ: pz.kvarQ, kvarLeadLag: pz.kvarLeadLag,
        totalPower: pz.totalPower,
        pqName: pz.pqName, recordingNameId: pz.recordingNameId,
        description: pz.description,
        recordedBy: pz.recordedBy || (existingId ? (currentZones.find(x => x.id === existingId)?.recordedBy || currentUserName) : currentUserName),
        photoPath: pz.photoPath || null,
        createdAt: pz.createdAt
      };

      // Compute total power if electrical parameters are set but total power is missing
      if (record.totalPower === null || record.totalPower === undefined) {
        const vCount = (record.v1 ? 1 : 0) + (record.v2 ? 1 : 0) + (record.v3 ? 1 : 0);
        const iCount = (record.i1 ? 1 : 0) + (record.i2 ? 1 : 0) + (record.i3 ? 1 : 0);
        const v1 = record.v1 || 0; const v2 = record.v2 || 0; const v3 = record.v3 || 0;
        const i1 = record.i1 || 0; const i2 = record.i2 || 0; const i3 = record.i3 || 0;
        const pf = record.pf || 0;
        const avgV = vCount > 0 ? (v1 + v2 + v3) / vCount : 0;
        const avgI = iCount > 0 ? (i1 + i2 + i3) / iCount : 0;
        if (avgV > 0 && avgI > 0 && pf > 0) {
          record.totalPower = Number(((1.732 * avgV * avgI * pf) / 1000).toFixed(2));
        } else {
          record.totalPower = 0;
        }
      }

      if (existingId) {
        const index = currentZones.findIndex((x) => x.id === existingId);
        currentZones[index] = record;
        zonesUpdated++;
      } else {
        currentZones.push(record);
        zoneNameToId[key] = record.id;
        zonesAdded++;
      }
    });

    // 3. Merge Areas
    const areaKeyToId: Record<string, string> = {};
    currentAreas.forEach((a) => {
      const zoneName = currentZones.find((z) => z.id === a.zoneId)?.name.toLowerCase().trim() || "";
      areaKeyToId[`${zoneName}|${a.name.toLowerCase().trim()}`] = a.id;
    });

    parsedAreas.forEach((pa) => {
      const parentZoneNameClean = pa.parentZoneName.toLowerCase().trim();
      let parentZoneId = zoneNameToId[parentZoneNameClean];

      // If zone doesn't exist, create an empty one first
      if (!parentZoneId) {
        const newZone: ZoneTag = {
          id: crypto.randomUUID(),
          name: pa.parentZoneName,
          recordedBy: pa.recordedBy || currentUserName,
          createdAt: new Date().toISOString()
        };
        currentZones.push(newZone);
        parentZoneId = newZone.id;
        zoneNameToId[parentZoneNameClean] = newZone.id;
        zonesAdded++;
      }

      const areaKey = `${parentZoneNameClean}|${pa.name.toLowerCase().trim()}`;
      const existingId = areaKeyToId[areaKey];

      const record: AreaTag = {
        id: existingId || crypto.randomUUID(),
        zoneId: parentZoneId,
        name: pa.name,
        type: pa.type || "PCC",
        pccId: null, // resolved in second pass
        pqName: pa.pqName, recordingNameId: pa.recordingNameId,
        v1: pa.v1, v2: pa.v2, v3: pa.v3,
        uthd1: pa.uthd1, uthd2: pa.uthd2, uthd3: pa.uthd3,
        i1: pa.i1, i2: pa.i2, i3: pa.i3,
        ithd1: pa.ithd1, ithd2: pa.ithd2, ithd3: pa.ithd3,
        pf: pa.pf, kvarD: pa.kvarD, kvarQ: pa.kvarQ, kvarLeadLag: pa.kvarLeadLag,
        totalPower: pa.totalPower, description: pa.description,
        recordedBy: pa.recordedBy || (existingId ? (currentAreas.find(x => x.id === existingId)?.recordedBy || currentUserName) : currentUserName),
        photoPath: pa.photoPath || null,
        createdAt: pa.createdAt
      };

      // Compute total power if empty
      if (record.totalPower === null || record.totalPower === undefined) {
        const vCount = (record.v1 ? 1 : 0) + (record.v2 ? 1 : 0) + (record.v3 ? 1 : 0);
        const iCount = (record.i1 ? 1 : 0) + (record.i2 ? 1 : 0) + (record.i3 ? 1 : 0);
        const v1 = record.v1 || 0; const v2 = record.v2 || 0; const v3 = record.v3 || 0;
        const i1 = record.i1 || 0; const i2 = record.i2 || 0; const i3 = record.i3 || 0;
        const pf = record.pf || 0;
        const avgV = vCount > 0 ? (v1 + v2 + v3) / vCount : 0;
        const avgI = iCount > 0 ? (i1 + i2 + i3) / iCount : 0;
        if (avgV > 0 && avgI > 0 && pf > 0) {
          record.totalPower = Number(((1.732 * avgV * avgI * pf) / 1000).toFixed(2));
        } else {
          record.totalPower = 0;
        }
      }

      if (existingId) {
        const index = currentAreas.findIndex((x) => x.id === existingId);
        currentAreas[index] = record;
        areasUpdated++;
      } else {
        currentAreas.push(record);
        areaKeyToId[areaKey] = record.id;
        areasAdded++;
      }
    });

    // 3b. Second pass to link MCC -> PCC panels
    currentAreas.forEach((a) => {
      if (a.type === "MCC") {
        const parsedArea = parsedAreas.find(pa => pa.name.toLowerCase().trim() === a.name.toLowerCase().trim() && pa.type === "MCC");
        if (parsedArea && parsedArea.parentPccName) {
          const parentPcc = currentAreas.find(p => p.name.toLowerCase().trim() === parsedArea.parentPccName.toLowerCase().trim() && p.type === "PCC" && p.zoneId === a.zoneId);
          if (parentPcc) {
            a.pccId = parentPcc.id;
          }
        }
      }
    });

    // 4. Merge Motor Load Entries
    const entryKeyToId: Record<string, string> = {};
    currentEntries.forEach((e) => {
      entryKeyToId[`${e.areaId}|${e.machineTag.toLowerCase().trim()}`] = e.id;
    });

    parsedEntries.forEach((pe) => {
      const parentZoneNameClean = pe.parentZoneName?.toLowerCase().trim() || "";
      const parentAreaNameClean = pe.parentAreaName?.toLowerCase().trim() || "";
      
      let parentAreaId = areaKeyToId[`${parentZoneNameClean}|${parentAreaNameClean}`];
      
      // If parent area name is unique across all zones, try to fallback
      if (!parentAreaId) {
        const matchingArea = currentAreas.find(a => a.name.toLowerCase().trim() === parentAreaNameClean);
        if (matchingArea) {
          parentAreaId = matchingArea.id;
        }
      }

      // If area doesn't exist, we must create a skeleton Area under either the matched Zone or a fallback Zone
      if (!parentAreaId) {
        let parentZoneId = zoneNameToId[parentZoneNameClean];
        if (!parentZoneId) {
          // Create skeleton Zone
          const newZone: ZoneTag = {
            id: crypto.randomUUID(),
            name: pe.parentZoneName || "Imported Plant Inputs",
            recordedBy: pe.recordedBy || currentUserName,
            createdAt: new Date().toISOString()
          };
          currentZones.push(newZone);
          parentZoneId = newZone.id;
          zoneNameToId[newZone.name.toLowerCase().trim()] = newZone.id;
          zonesAdded++;
        }

        const newArea: AreaTag = {
          id: crypto.randomUUID(),
          zoneId: parentZoneId,
          name: pe.parentAreaName,
          recordedBy: pe.recordedBy || currentUserName,
          createdAt: new Date().toISOString()
        };
        currentAreas.push(newArea);
        parentAreaId = newArea.id;
        areaKeyToId[`${newArea.recordedBy}|${newArea.name.toLowerCase().trim()}`] = newArea.id;
        areasAdded++;
      }

      const entryKey = `${parentAreaId}|${pe.machineTag.toLowerCase().trim()}`;
      const existingId = entryKeyToId[entryKey];

      const record: Entry = {
        id: existingId || crypto.randomUUID(),
        areaId: parentAreaId,
        machineTag: pe.machineTag,
        starterType: pe.starterType || "DOL",
        vfdFrequency: pe.vfdFrequency,
        ratedKw: pe.ratedKw,
        ratedHp: pe.ratedHp || Number((pe.ratedKw * 1.34102).toFixed(2)),
        voltage: pe.voltage,
        current: pe.current,
        kva: pe.kva,
        pf: pe.pf,
        kvar: pe.kvar,
        measuredKw: pe.measuredKw,
        calculatedPower: pe.calculatedPower || Number(((1.732 * (pe.voltage || 0) * (pe.current || 0) * (pe.pf || 0)) / 1000).toFixed(2)),
        loadFactor: pe.loadFactor || (pe.ratedKw ? Number((pe.measuredKw / pe.ratedKw).toFixed(3)) : 0),
        description: pe.description,
        recordedBy: pe.recordedBy || (existingId ? (currentEntries.find(x => x.id === existingId)?.recordedBy || currentUserName) : currentUserName),
        photoPath: pe.photoPath || null,
        createdAt: pe.createdAt,
        createdById: "local-user"
      };

      if (existingId) {
        const index = currentEntries.findIndex((x) => x.id === existingId);
        currentEntries[index] = record;
        entriesUpdated++;
      } else {
        currentEntries.push(record);
        entryKeyToId[entryKey] = record.id;
        entriesAdded++;
      }
    });

    // 5. Merge APFC Entries
    const stageToId: Record<number, string> = {};
    currentApfcs.forEach((ap) => {
      if (ap.stage !== null && ap.stage !== undefined) {
        stageToId[ap.stage] = ap.id;
      }
    });

    parsedApfcs.forEach((pap) => {
      const existingId = stageToId[pap.stage];

      let papZoneId = null;
      if (pap.parentZoneName) {
        papZoneId = zoneNameToId[pap.parentZoneName.toLowerCase().trim()] || null;
      }
      let papAreaId = null;
      if (papZoneId && pap.parentAreaName) {
        papAreaId = areaKeyToId[`${pap.parentZoneName.toLowerCase().trim()}|${pap.parentAreaName.toLowerCase().trim()}`] || null;
      }

      const record: ApfcTag = {
        id: existingId || crypto.randomUUID(),
        stage: pap.stage,
        ratedCapacitorValue: pap.ratedCapacitorValue,
        voltage: pap.voltage,
        iR: pap.iR, iY: pap.iY, iB: pap.iB,
        remark: pap.remark,
        description: pap.description,
        photoPath: pap.photoPath || null,
        zoneId: papZoneId,
        areaId: papAreaId,
        recordedBy: pap.recordedBy || (existingId ? (currentApfcs.find(x => x.id === existingId)?.recordedBy || currentUserName) : currentUserName),
        createdAt: pap.createdAt
      };

      if (existingId) {
        const index = currentApfcs.findIndex((x) => x.id === existingId);
        currentApfcs[index] = record;
        apfcUpdated++;
      } else {
        currentApfcs.push(record);
        stageToId[pap.stage] = record.id;
        apfcAdded++;
      }
    });

    // 6. Merge Energy Sources
    const currentEnergySources = [...useAppStore.getState().energySources];
    let energySourcesAdded = 0;
    let energySourcesUpdated = 0;

    parsedEnergySources.forEach((pes) => {
      const existing = currentEnergySources.find(
        (es) => es.name.toLowerCase().trim() === pes.name.toLowerCase().trim()
      );

      const record: EnergySource = {
        id: existing?.id || crypto.randomUUID(),
        name: pes.name,
        sourceType: pes.sourceType,
        pqName: pes.pqName,
        recordingNameId: pes.recordingNameId,
        v1: pes.v1, v2: pes.v2, v3: pes.v3,
        uthd1: pes.uthd1, uthd2: pes.uthd2, uthd3: pes.uthd3,
        i1: pes.i1, i2: pes.i2, i3: pes.i3,
        ithd1: pes.ithd1, ithd2: pes.ithd2, ithd3: pes.ithd3,
        pf: pes.pf,
        kvarD: pes.kvarD, kvarQ: pes.kvarQ, kvarLeadLag: pes.kvarLeadLag,
        totalPower: pes.totalPower || 0
      };

      if (existing) {
        const idx = currentEnergySources.findIndex((es) => es.id === existing.id);
        currentEnergySources[idx] = record;
        energySourcesUpdated++;
      } else {
        currentEnergySources.push(record);
        energySourcesAdded++;
      }
    });

    // Write all states to the Zustand store atomically
    useAppStore.setState({
      profile: finalProfile,
      zones: currentZones,
      areas: currentAreas,
      entries: currentEntries,
      apfcs: currentApfcs,
      energySources: currentEnergySources
    });

    return {
      zonesAdded, zonesUpdated,
      areasAdded, areasUpdated,
      entriesAdded, entriesUpdated,
      apfcAdded, apfcUpdated,
      energySourcesAdded, energySourcesUpdated
    };
  };

  return (
    <div className="inline-block">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />
      <Button
        onClick={handleButtonClick}
        disabled={importing}
        variant="secondary"
        size="sm"
        className="gap-1.5 border border-white/10 hover:bg-cyan-500/10 hover:text-cyan-400"
      >
        {importing ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {importing ? "Importing..." : "Upload Excel"}
      </Button>
    </div>
  );
}
