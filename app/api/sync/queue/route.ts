import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildExcelBase64 } from "@/lib/export-offline";

export const runtime = 'nodejs';

const ADMIN_EMAILS = [
  "loriyasagar.b@iitgn.ac.in",
  "abhay.maurya@iitgn.ac.in",
  "md.faizan@iitgn.ac.in",
  "rishabh.dangi@iitgn.ac.in",
  "dhruvit.patel@iitgn.ac.in",
  "rahuljayantibhai.p@iitgn.ac.in",
  "iea@iitgn.ac.in"
];

// CORS headers for Capacitor mobile app and any cross-origin caller
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  const { jobId, reporterName, profile, zones, areas, entries, apfcs, energySources } = await req.json();

  console.log("[SYNC] Received jobId:", jobId, "hasProfile:", !!profile);

  // ── 1. Save to DB (non-fatal — email still sends if DB fails) ──────────
  try {
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
          overallConsumption: parseFloat(String(profile.overallConsumption)) || 0,
        },
        update: {
          companyName: profile.companyName,
          area: profile.area,
          district: profile.district ?? "",
          state: profile.state ?? "",
          pincode: profile.pincode ?? "",
          overallConsumption: parseFloat(String(profile.overallConsumption)) || 0,
        },
      });
    }

    if (energySources && Array.isArray(energySources)) {
      for (const es of energySources) {
        await prisma.energySource.upsert({
          where: { id: es.id },
          create: {
            id: es.id,
            companyProfileId: profile ? profile.id : null,
            name: es.name,
            sourceType: es.sourceType,
            pqName: es.pqName,
            recordingNameId: es.recordingNameId,
            v1: es.v1, v2: es.v2, v3: es.v3,
            uthd1: es.uthd1, uthd2: es.uthd2, uthd3: es.uthd3,
            i1: es.i1, i2: es.i2, i3: es.i3,
            ithd1: es.ithd1, ithd2: es.ithd2, ithd3: es.ithd3,
            pf: es.pf,
            kvarD: es.kvarD, kvarQ: es.kvarQ, kvarLeadLag: es.kvarLeadLag,
            totalPower: es.totalPower,
          },
          update: {
            companyProfileId: profile ? profile.id : null,
            name: es.name,
            sourceType: es.sourceType,
            pqName: es.pqName,
            recordingNameId: es.recordingNameId,
            v1: es.v1, v2: es.v2, v3: es.v3,
            uthd1: es.uthd1, uthd2: es.uthd2, uthd3: es.uthd3,
            i1: es.i1, i2: es.i2, i3: es.i3,
            ithd1: es.ithd1, ithd2: es.ithd2, ithd3: es.ithd3,
            pf: es.pf,
            kvarD: es.kvarD, kvarQ: es.kvarQ, kvarLeadLag: es.kvarLeadLag,
            totalPower: es.totalPower,
          }
        });
      }
    }

    for (const z of (zones ?? [])) {
      await prisma.zoneTag.upsert({
        where: { id: z.id },
        create: { id: z.id, name: z.name, v1: z.v1, v2: z.v2, v3: z.v3, pf: z.pf, totalPower: z.totalPower, pqName: z.pqName, recordingNameId: z.recordingNameId, description: z.description, kvarD: z.kvarD, kvarQ: z.kvarQ, kvarLeadLag: z.kvarLeadLag, uthd1: z.uthd1, uthd2: z.uthd2, uthd3: z.uthd3, ithd1: z.ithd1, ithd2: z.ithd2, ithd3: z.ithd3, i1: z.i1, i2: z.i2, i3: z.i3, recordedBy: z.recordedBy, photoPath: z.photoPath, createdAt: z.createdAt ? new Date(z.createdAt) : undefined },
        update: { name: z.name, v1: z.v1, v2: z.v2, v3: z.v3, pf: z.pf, totalPower: z.totalPower, pqName: z.pqName, recordingNameId: z.recordingNameId, description: z.description, kvarD: z.kvarD, kvarQ: z.kvarQ, kvarLeadLag: z.kvarLeadLag, uthd1: z.uthd1, uthd2: z.uthd2, uthd3: z.uthd3, ithd1: z.ithd1, ithd2: z.ithd2, ithd3: z.ithd3, i1: z.i1, i2: z.i2, i3: z.i3, recordedBy: z.recordedBy, photoPath: z.photoPath, createdAt: z.createdAt ? new Date(z.createdAt) : undefined },
      });
    }

    for (const a of (areas ?? [])) {
      await prisma.areaTag.upsert({
        where: { id: a.id },
        create: { id: a.id, zoneId: a.zoneId, name: a.name, type: a.type, pccId: a.pccId, v1: a.v1, v2: a.v2, v3: a.v3, pf: a.pf, totalPower: a.totalPower, pqName: a.pqName, recordingNameId: a.recordingNameId, description: a.description, kvarD: a.kvarD, kvarQ: a.kvarQ, kvarLeadLag: a.kvarLeadLag, uthd1: a.uthd1, uthd2: a.uthd2, uthd3: a.uthd3, ithd1: a.ithd1, ithd2: a.ithd2, ithd3: a.ithd3, i1: a.i1, i2: a.i2, i3: a.i3, recordedBy: a.recordedBy, photoPath: a.photoPath, createdAt: a.createdAt ? new Date(a.createdAt) : undefined },
        update: { name: a.name, type: a.type, pccId: a.pccId, v1: a.v1, v2: a.v2, v3: a.v3, pf: a.pf, totalPower: a.totalPower, pqName: a.pqName, recordingNameId: a.recordingNameId, description: a.description, kvarD: a.kvarD, kvarQ: a.kvarQ, kvarLeadLag: a.kvarLeadLag, uthd1: a.uthd1, uthd2: a.uthd2, uthd3: a.uthd3, ithd1: a.ithd1, ithd2: a.ithd2, ithd3: a.ithd3, i1: a.i1, i2: a.i2, i3: a.i3, recordedBy: a.recordedBy, photoPath: a.photoPath, createdAt: a.createdAt ? new Date(a.createdAt) : undefined },
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
          id: e.id, areaId: e.areaId, machineTag: e.machineTag, starterType: e.starterType,
          vfdFrequency: e.vfdFrequency, ratedKw: e.ratedKw, ratedHp: e.ratedHp,
          voltage: e.voltage, current: e.current, kva: e.kva, pf: e.pf, kvar: e.kvar,
          measuredKw: e.measuredKw, calculatedPower: e.calculatedPower, loadFactor: e.loadFactor,
          description: e.description, recordedBy: e.recordedBy, photoPath: e.photoPath, createdAt: e.createdAt ? new Date(e.createdAt) : undefined, createdById: systemUser.id,
          entryType: e.entryType || "CLAMP",
          pqName: e.pqName,
          recordingNameId: e.recordingNameId,
          v1: e.v1, v2: e.v2, v3: e.v3,
          uthd1: e.uthd1, uthd2: e.uthd2, uthd3: e.uthd3,
          i1: e.i1, i2: e.i2, i3: e.i3,
          ithd1: e.ithd1, ithd2: e.ithd2, ithd3: e.ithd3,
          kvarD: e.kvarD, kvarQ: e.kvarQ, kvarLeadLag: e.kvarLeadLag,
        },
        update: {
          machineTag: e.machineTag, starterType: e.starterType, vfdFrequency: e.vfdFrequency,
          ratedKw: e.ratedKw, measuredKw: e.measuredKw, calculatedPower: e.calculatedPower,
          loadFactor: e.loadFactor, recordedBy: e.recordedBy, photoPath: e.photoPath, createdAt: e.createdAt ? new Date(e.createdAt) : undefined,
          entryType: e.entryType || "CLAMP",
          pqName: e.pqName,
          recordingNameId: e.recordingNameId,
          v1: e.v1, v2: e.v2, v3: e.v3,
          uthd1: e.uthd1, uthd2: e.uthd2, uthd3: e.uthd3,
          i1: e.i1, i2: e.i2, i3: e.i3,
          ithd1: e.ithd1, ithd2: e.ithd2, ithd3: e.ithd3,
          kvarD: e.kvarD, kvarQ: e.kvarQ, kvarLeadLag: e.kvarLeadLag,
        },
      });
    }

    for (const a of (apfcs ?? [])) {
      await prisma.apfcTag.upsert({
        where: { id: a.id },
        create: { id: a.id, stage: a.stage, ratedCapacitorValue: a.ratedCapacitorValue, voltage: a.voltage, iR: a.iR, iY: a.iY, iB: a.iB, remark: a.remark, description: a.description, recordedBy: a.recordedBy, photoPath: a.photoPath, zoneId: a.zoneId, areaId: a.areaId, createdAt: a.createdAt ? new Date(a.createdAt) : undefined },
        update: { stage: a.stage, ratedCapacitorValue: a.ratedCapacitorValue, voltage: a.voltage, iR: a.iR, iY: a.iY, iB: a.iB, remark: a.remark, description: a.description, recordedBy: a.recordedBy, photoPath: a.photoPath, zoneId: a.zoneId, areaId: a.areaId, createdAt: a.createdAt ? new Date(a.createdAt) : undefined },
      });
    }

    console.log("[SYNC] Database save successful");
  } catch (dbErr: any) {
    // DB failure is non-fatal — we still send the email
    console.error("[SYNC] Database error (non-fatal):", dbErr.message);
  }

  // ── 2. Send Email via Resend (always attempted) ────────────────────────
  try {
    if (!profile) {
      return NextResponse.json({ ok: true, synced: { jobId }, note: "No profile — email skipped" }, { headers: CORS_HEADERS });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("[SYNC] RESEND_API_KEY missing");
      return NextResponse.json({ error: "Email service not configured. Add RESEND_API_KEY to Vercel environment variables." }, { status: 500, headers: CORS_HEADERS });
    }

    const { base64, filename } = buildExcelBase64(profile, zones, areas, entries, apfcs, energySources);
    const xlsxBuffer = Buffer.from(base64, "base64");
    const today = new Date();
    const ddmm = `${String(today.getDate()).padStart(2, "0")}${String(today.getMonth() + 1).padStart(2, "0")}`;
    const addressParts = [profile.area, profile.district, profile.state, profile.pincode].filter(Boolean);
    const address = addressParts.join(", ") || "N/A";
    const finalTime = today.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const engineer = reporterName || "Field Engineer";
    const company = profile.companyName || "Company";

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log("[SYNC] Sending email via Gmail to all admins");

    await transporter.sendMail({
      from: `"Fox Kisem" <${process.env.SMTP_USER}>`,
      to: ADMIN_EMAILS.join(", "),
      subject: `Motor Load Report — ${company} (${ddmm})`,
      html: `<div style="font-family:sans-serif;color:#333;">
        <h2>Fox Kisem — Industrial Data Report</h2>
        <p><strong>${engineer}</strong> has collected data for <strong>${company}</strong></p>
        <p>Location: ${address}</p>
        <p>Completed: ${finalTime}</p>
        <ul>
          <li>Zones: ${(zones ?? []).length}</li>
          <li>MCC/PCC Areas: ${(areas ?? []).length}</li>
          <li>Motor Loads: ${(entries ?? []).length}</li>
        </ul>
        <p>Full report attached.</p>
        <hr><p style="font-size:12px;color:#999;">Fox Kisem — IITGN Kisem Lab</p>
      </div>`,
      attachments: [{ filename, content: xlsxBuffer }],
    });

    console.log("[SYNC] Email sent successfully via Gmail to all admins");
    return NextResponse.json({ ok: true, synced: { jobId } }, { headers: CORS_HEADERS });

  } catch (err: any) {
    console.error("[SYNC] Email error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
