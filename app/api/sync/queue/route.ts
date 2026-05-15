export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { buildExcelBase64 } from "@/lib/export-offline";

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
    const { jobId, reporterName, profile, zones, areas, entries, apfcs } = await req.json();

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
        create: { id: z.id, name: z.name, v1: z.v1, v2: z.v2, v3: z.v3, pf: z.pf, totalPower: z.totalPower, pqName: z.pqName, recordingNameId: z.recordingNameId, description: z.description, kvarD: z.kvarD, kvarQ: z.kvarQ, kvarLeadLag: z.kvarLeadLag, uthd1: z.uthd1, uthd2: z.uthd2, uthd3: z.uthd3, ithd1: z.ithd1, ithd2: z.ithd2, ithd3: z.ithd3, i1: z.i1, i2: z.i2, i3: z.i3 },
        update: { name: z.name, v1: z.v1, v2: z.v2, v3: z.v3, pf: z.pf, totalPower: z.totalPower, pqName: z.pqName, recordingNameId: z.recordingNameId, description: z.description, kvarD: z.kvarD, kvarQ: z.kvarQ, kvarLeadLag: z.kvarLeadLag, uthd1: z.uthd1, uthd2: z.uthd2, uthd3: z.uthd3, ithd1: z.ithd1, ithd2: z.ithd2, ithd3: z.ithd3, i1: z.i1, i2: z.i2, i3: z.i3 },
      });
    }

    for (const a of (areas ?? [])) {
      await prisma.areaTag.upsert({
        where: { id: a.id },
        create: { id: a.id, zoneId: a.zoneId, name: a.name, v1: a.v1, v2: a.v2, v3: a.v3, pf: a.pf, totalPower: a.totalPower, pqName: a.pqName, recordingNameId: a.recordingNameId, description: a.description, kvarD: a.kvarD, kvarQ: a.kvarQ, kvarLeadLag: a.kvarLeadLag, uthd1: a.uthd1, uthd2: a.uthd2, uthd3: a.uthd3, ithd1: a.ithd1, ithd2: a.ithd2, ithd3: a.ithd3, i1: a.i1, i2: a.i2, i3: a.i3 },
        update: { name: a.name, v1: a.v1, v2: a.v2, v3: a.v3, pf: a.pf, totalPower: a.totalPower, pqName: a.pqName, recordingNameId: a.recordingNameId, description: a.description, kvarD: a.kvarD, kvarQ: a.kvarQ, kvarLeadLag: a.kvarLeadLag, uthd1: a.uthd1, uthd2: a.uthd2, uthd3: a.uthd3, ithd1: a.ithd1, ithd2: a.ithd2, ithd3: a.ithd3, i1: a.i1, i2: a.i2, i3: a.i3 },
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
          vfdFrequency: e.vfdFrequency,
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
          vfdFrequency: e.vfdFrequency,
          ratedKw: e.ratedKw,
          measuredKw: e.measuredKw,
          calculatedPower: e.calculatedPower,
          loadFactor: e.loadFactor,
        },
      });
    }

    for (const a of (apfcs ?? [])) {
      await prisma.apfcTag.upsert({
        where: { id: a.id },
        create: { id: a.id, stage: a.stage, ratedCapacitorValue: a.ratedCapacitorValue, voltage: a.voltage, iR: a.iR, iY: a.iY, iB: a.iB, remark: a.remark, description: a.description },
        update: { stage: a.stage, ratedCapacitorValue: a.ratedCapacitorValue, voltage: a.voltage, iR: a.iR, iY: a.iY, iB: a.iB, remark: a.remark, description: a.description },
      });
    }

    // 2. Generate Excel & Send Email if Profile exists
    if (profile) {
      const { base64, filename } = buildExcelBase64(profile, zones, areas, entries, apfcs);
      const xlsxBuffer = Buffer.from(base64, "base64");
      const today = new Date();
      const ddmm = `${String(today.getDate()).padStart(2, "0")}${String(today.getMonth() + 1).padStart(2, "0")}`;

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

      const mainRecipient = ADMIN_EMAILS[0];
      const ccRecipients = ADMIN_EMAILS.slice(1);

      await transporter.sendMail({
        from: `"Fox Kisem" <${process.env.SMTP_USER}>`,
        to: mainRecipient,
        cc: ccRecipients,
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
      console.log("[SYNC] Email successfully dispatched to all admins.");
    }

    return NextResponse.json({ ok: true, synced: { jobId } });
  } catch (err: any) {
    console.error("[SYNC/EMAIL ERROR]", err);
    return NextResponse.json({ error: "Sync failed or Email failed: " + err.message }, { status: 500 });
  }
}
