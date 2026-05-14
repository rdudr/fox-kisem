export const dynamic = 'force-static'
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import * as XLSX from "xlsx";

// ── Hardcoded Admins ──────────────────────────────────────────────────
// Put your emails here. These are the people who will receive the
// report automatically when a field engineer successfully syncs.
const ADMIN_EMAILS = [
  "loriyasagar.b@iitgn.ac.in",
  "abhay.maurya@iitgn.ac.in",
  "md.faizan@iitgn.ac.in",
  "rishabh.dangi@iitgn.ac.in",
  "dhruvit.patel@iitgn.ac.in",
  "rahuljayantibhai.p@iitgn.ac.in",
  "iea@iitgn.ac.in"
];

export async function POST(req: Request) {
  try {
    const { jobId, reporterName, profile, zones, areas, entries } = await req.json();

    // 1. Save data to Database (same as regular sync)
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

    for (const z of (zones ?? [])) {
      await prisma.zoneTag.upsert({
        where: { id: z.id },
        create: { id: z.id, name: z.name, v1: z.v1, v2: z.v2, v3: z.v3, pf: z.pf, totalPower: z.totalPower, pqName: z.pqName, description: z.description, kvarD: z.kvarD, kvarQ: z.kvarQ, kvarLeadLag: z.kvarLeadLag },
        update: { name: z.name, v1: z.v1, v2: z.v2, v3: z.v3, pf: z.pf, totalPower: z.totalPower, pqName: z.pqName, description: z.description, kvarD: z.kvarD, kvarQ: z.kvarQ, kvarLeadLag: z.kvarLeadLag },
      });
    }

    for (const a of (areas ?? [])) {
      await prisma.areaTag.upsert({
        where: { id: a.id },
        create: { id: a.id, zoneId: a.zoneId, name: a.name, v1: a.v1, v2: a.v2, v3: a.v3, pf: a.pf, totalPower: a.totalPower, pqName: a.pqName, description: a.description, kvarD: a.kvarD, kvarQ: a.kvarQ, kvarLeadLag: a.kvarLeadLag },
        update: { name: a.name, v1: a.v1, v2: a.v2, v3: a.v3, pf: a.pf, totalPower: a.totalPower, pqName: a.pqName, description: a.description, kvarD: a.kvarD, kvarQ: a.kvarQ, kvarLeadLag: a.kvarLeadLag },
      });
    }

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

    // 2. Generate Excel & Send Email if Profile exists
    if (profile) {
      const wb = XLSX.utils.book_new();

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

      const zoneHeaders = ["Name", "PQ Name", "V1", "V2", "V3", "Uhtd1", "Uhtd2", "Uhtd3", "I1", "I2", "I3", "Ihtd1", "Ihtd2", "Ihtd3", "Power Factor", "KVAr (D)", "KVAr (Q)", "KVAr Lead/Lag", "Total Power (kW)", "Description", "Date"];
      const zoneRows = (zones ?? []).map((z: any) => [z.name, z.pqName ?? "", (z.v1 ?? ""), (z.v2 ?? ""), (z.v3 ?? ""), (z.uhtd1 ?? ""), (z.uhtd2 ?? ""), (z.uhtd3 ?? ""), (z.i1 ?? ""), (z.i2 ?? ""), (z.i3 ?? ""), (z.ihtd1 ?? ""), (z.ihtd2 ?? ""), (z.ihtd3 ?? ""), (z.pf ?? ""), (z.kvarD ?? ""), (z.kvarQ ?? ""), (z.kvarLeadLag ?? ""), (z.totalPower ?? ""), (z.description ?? ""), new Date(z.createdAt).toLocaleString("en-IN")]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([zoneHeaders, ...zoneRows]), "Plant Main Inputs");

      const areaHeaders = ["Plant Main Input", "MCC/PCC Name", "PQ Name", "V1", "V2", "V3", "Uhtd1", "Uhtd2", "Uhtd3", "I1", "I2", "I3", "Ihtd1", "Ihtd2", "Ihtd3", "Power Factor", "KVAr (D)", "KVAr (Q)", "KVAr Lead/Lag", "Total Power (kW)", "Description", "Date"];
      const areaRows = (areas ?? []).map((a: any) => {
        const zone = (zones ?? []).find((z: any) => z.id === a.zoneId);
        return [(zone?.name ?? "Unknown"), a.name, (a.pqName ?? ""), (a.v1 ?? ""), (a.v2 ?? ""), (a.v3 ?? ""), (a.uhtd1 ?? ""), (a.uhtd2 ?? ""), (a.uhtd3 ?? ""), (a.i1 ?? ""), (a.i2 ?? ""), (a.i3 ?? ""), (a.ihtd1 ?? ""), (a.ihtd2 ?? ""), (a.ihtd3 ?? ""), (a.pf ?? ""), (a.kvarD ?? ""), (a.kvarQ ?? ""), (a.kvarLeadLag ?? ""), (a.totalPower ?? ""), (a.description ?? ""), new Date(a.createdAt).toLocaleString("en-IN")];
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([areaHeaders, ...areaRows]), "MCC-PCC Areas");

      const entryHeaders = ["Zone", "Area (MCC/PCC)", "Machine Tag", "Starter Type", "Rated kW", "Rated HP", "Voltage (V)", "Current (A)", "KVA", "Power Factor", "KVAr", "Measured kW", "Calculated Power (kW)", "Load Factor", "Description", "Date"];
      const entryRows = (entries ?? []).map((e: any) => {
        const area = (areas ?? []).find((a: any) => a.id === e.areaId);
        const zone = (zones ?? []).find((z: any) => z.id === area?.zoneId);
        return [(zone?.name ?? "Unknown"), (area?.name ?? "Unknown"), e.machineTag, e.starterType, e.ratedKw, (e.ratedHp ?? ""), (e.voltage ?? ""), (e.current ?? ""), (e.kva ?? ""), (e.pf ?? ""), (e.kvar ?? ""), e.measuredKw, Number(e.calculatedPower).toFixed(2), Number(e.loadFactor).toFixed(3), (e.description ?? ""), new Date(e.createdAt).toLocaleString("en-IN")];
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([entryHeaders, ...entryRows]), "Motor Loads");

      const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const today = new Date();
      const ddmm = `${String(today.getDate()).padStart(2, "0")}${String(today.getMonth() + 1).padStart(2, "0")}`;
      const filename = `${(profile.companyName ?? "export").replace(/\s+/g, "_")}_${ddmm}.xlsx`;

      const addressParts = [profile.area, profile.district, profile.state, profile.pincode].filter(Boolean);
      const address = addressParts.join(", ") || "N/A";
      const finalTime = today.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const user = reporterName || "the field engineer";
      const company = profile.companyName || "the company";

      const emailBody = `Dear Team,

I am sending this mail to inform you that ${user} has successfully read and collected the industrial data of ${company}, located at ${address}.

The final report regarding the motor load analysis was completed on ${finalTime}.

Please find the attached data and report below for your reference and further review.

Best regards,
Fox Kisem — Industrial Data Collection System
IITGN Kisem Lab`;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Fox Kisem" <${process.env.SMTP_USER}>`,
        to: ADMIN_EMAILS.join(", "),
        subject: `Motor Load Report — ${company} (${ddmm})`,
        text: emailBody,
        attachments: [
          {
            filename,
            content: xlsxBuffer,
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
      });
    }

    return NextResponse.json({ ok: true, synced: { jobId } });
  } catch (err: any) {
    console.error("[SYNC/EMAIL ERROR]", err);
    return NextResponse.json({ error: "Sync failed or Email failed: " + err.message }, { status: 500 });
  }
}
