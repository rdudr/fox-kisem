export const dynamic = 'force-static'
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile, zones, areas, entries, recipients, reporterName } = body;

    if (!profile) {
      return NextResponse.json({ error: "No company profile provided" }, { status: 400 });
    }

    // ── Build the Excel workbook ─────────────────────────────────────────
    const wb = XLSX.utils.book_new();

    // Sheet 1: Company Profile
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

    // Sheet 2: Plant Main Inputs
    const zoneHeaders = ["Name","PQ Name","V1","V2","V3","Uhtd1","Uhtd2","Uhtd3","I1","I2","I3","Ihtd1","Ihtd2","Ihtd3","Power Factor","KVAr (D)","KVAr (Q)","KVAr Lead/Lag","Total Power (kW)","Description","Date"];
    const zoneRows = (zones ?? []).map((z: any) => [z.name, z.pqName??"",(z.v1??""),(z.v2??""),(z.v3??""),(z.uhtd1??""),(z.uhtd2??""),(z.uhtd3??""),(z.i1??""),(z.i2??""),(z.i3??""),(z.ihtd1??""),(z.ihtd2??""),(z.ihtd3??""),(z.pf??""),(z.kvarD??""),(z.kvarQ??""),(z.kvarLeadLag??""),(z.totalPower??""),(z.description??""),new Date(z.createdAt).toLocaleString("en-IN")]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([zoneHeaders, ...zoneRows]), "Plant Main Inputs");

    // Sheet 3: MCC/PCC Areas
    const areaHeaders = ["Plant Main Input","MCC/PCC Name","PQ Name","V1","V2","V3","Uhtd1","Uhtd2","Uhtd3","I1","I2","I3","Ihtd1","Ihtd2","Ihtd3","Power Factor","KVAr (D)","KVAr (Q)","KVAr Lead/Lag","Total Power (kW)","Description","Date"];
    const areaRows = (areas ?? []).map((a: any) => {
      const zone = (zones ?? []).find((z: any) => z.id === a.zoneId);
      return [(zone?.name??"Unknown"), a.name, (a.pqName??""),(a.v1??""),(a.v2??""),(a.v3??""),(a.uhtd1??""),(a.uhtd2??""),(a.uhtd3??""),(a.i1??""),(a.i2??""),(a.i3??""),(a.ihtd1??""),(a.ihtd2??""),(a.ihtd3??""),(a.pf??""),(a.kvarD??""),(a.kvarQ??""),(a.kvarLeadLag??""),(a.totalPower??""),(a.description??""),new Date(a.createdAt).toLocaleString("en-IN")];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([areaHeaders, ...areaRows]), "MCC-PCC Areas");

    // Sheet 4: Motor Loads
    const entryHeaders = ["Zone","Area (MCC/PCC)","Machine Tag","Starter Type","Rated kW","Rated HP","Voltage (V)","Current (A)","KVA","Power Factor","KVAr","Measured kW","Calculated Power (kW)","Load Factor","Description","Date"];
    const entryRows = (entries ?? []).map((e: any) => {
      const area = (areas ?? []).find((a: any) => a.id === e.areaId);
      const zone = (zones ?? []).find((z: any) => z.id === area?.zoneId);
      return [(zone?.name??"Unknown"),(area?.name??"Unknown"),e.machineTag,e.starterType,e.ratedKw,(e.ratedHp??""),(e.voltage??""),(e.current??""),(e.kva??""),(e.pf??""),(e.kvar??""),e.measuredKw,Number(e.calculatedPower).toFixed(2),Number(e.loadFactor).toFixed(3),(e.description??""),new Date(e.createdAt).toLocaleString("en-IN")];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([entryHeaders, ...entryRows]), "Motor Loads");

    // Generate xlsx buffer
    const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const today = new Date();
    const ddmm = `${String(today.getDate()).padStart(2,"0")}${String(today.getMonth()+1).padStart(2,"0")}`;
    const filename = `${(profile.companyName??"export").replace(/\s+/g,"_")}_${ddmm}.xlsx`;

    // ── Compose address ──────────────────────────────────────────────────
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

    // ── Send email ───────────────────────────────────────────────────────
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const to = Array.isArray(recipients) ? recipients.join(", ") : recipients;

    await transporter.sendMail({
      from: `"Fox Kisem" <${process.env.SMTP_USER}>`,
      to,
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

    return NextResponse.json({ ok: true, message: `Report sent to ${to}` });
  } catch (err: any) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
