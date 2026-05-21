import { NextResponse } from "next/server";
import { Resend } from "resend";
import * as XLSX from "xlsx";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile, zones, areas, entries, recipients, reporterName } = body;

    if (!profile) {
      return NextResponse.json({ error: "No company profile provided" }, { status: 400 });
    }

    if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
      return NextResponse.json({ error: "No recipients provided" }, { status: 400 });
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
      ["Overall Consumption", profile.overallConsumption],
      ["Report Generated", new Date().toLocaleString("en-IN")],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(profileRows), "Company Profile");

    // Sheet 2: Plant Main Inputs
    const zoneHeaders = ["Name","PQ Name","V1","V2","V3","UTHD1","UTHD2","UTHD3","I1","I2","I3","ITHD1","ITHD2","ITHD3","Power Factor","KVAr (D)","KVAr (Q)","KVAr Lead/Lag","Total Power (kW)","Description","Date"];
    const zoneRows = (zones ?? []).map((z: any) => [z.name, z.pqName??"",(z.v1??""),(z.v2??""),(z.v3??""),(z.uthd1??""),(z.uthd2??""),(z.uthd3??""),(z.i1??""),(z.i2??""),(z.i3??""),(z.ithd1??""),(z.ithd2??""),(z.ithd3??""),(z.pf??""),(z.kvarD??""),(z.kvarQ??""),(z.kvarLeadLag??""),(z.totalPower??""),(z.description??""),new Date(z.createdAt).toLocaleString("en-IN")]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([zoneHeaders, ...zoneRows]), "Plant Main Inputs");

    // Sheet 3: MCC/PCC Areas
    const areaHeaders = ["Plant Main Input","MCC/PCC Name","PQ Name","V1","V2","V3","UTHD1","UTHD2","UTHD3","I1","I2","I3","ITHD1","ITHD2","ITHD3","Power Factor","KVAr (D)","KVAr (Q)","KVAr Lead/Lag","Total Power (kW)","Description","Date"];
    const areaRows = (areas ?? []).map((a: any) => {
      const zone = (zones ?? []).find((z: any) => z.id === a.zoneId);
      return [(zone?.name??"Unknown"), a.name, (a.pqName??""),(a.v1??""),(a.v2??""),(a.v3??""),(a.uthd1??""),(a.uthd2??""),(a.uthd3??""),(a.i1??""),(a.i2??""),(a.i3??""),(a.ithd1??""),(a.ithd2??""),(a.ithd3??""),(a.pf??""),(a.kvarD??""),(a.kvarQ??""),(a.kvarLeadLag??""),(a.totalPower??""),(a.description??""),new Date(a.createdAt).toLocaleString("en-IN")];
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
    const filename = `${(profile.companyName??"report").replace(/\s+/g,"_")}_${ddmm}.xlsx`;

    // ── Compose message ──────────────────────────────────────────────────
    const addressParts = [profile.area, profile.district, profile.state, profile.pincode].filter(Boolean);
    const address = addressParts.join(", ") || "N/A";
    const finalTime = today.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const engineer = reporterName || "Field Engineer";
    const company = profile.companyName || "Company";

    const emailSubject = `Industrial Data Report — ${company}`;
    const emailBody = `<div style="font-family: sans-serif; color: #333; line-height: 1.6;">
  <h2 style="color: #0369a1;">Fox Kisem - Industrial Data Collection Report</h2>
  <p>Dear Admin Team,</p>
  <p><strong>${engineer}</strong> has successfully collected and compiled the industrial data for <strong>${company}</strong>, located at:</p>
  <p style="padding-left: 20px; color: #666;"><em>${address}</em></p>
  <p>The comprehensive motor load analysis and equipment data collection was completed on <strong>${finalTime}</strong>.</p>
  <p><strong>Report Summary:</strong></p>
  <ul style="color: #666;">
    <li>Zones Recorded: ${zones.length}</li>
    <li>MCC/PCC Areas: ${areas.length}</li>
    <li>Motor Load Entries: ${entries.length}</li>
  </ul>
  <p>Please find the detailed Excel report attached for your reference and further analysis.</p>
  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
  <p style="font-size: 12px; color: #999;">
    Fox Kisem — Industrial Data Collection System<br>
    IITGN Kisem Laboratory
  </p>
</div>`;

    // ── Send email via Resend ────────────────────────────────────────────
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];

    const response = await resend.emails.send({
      from: "Fox Kisem <noreply@resend.dev>",
      to: recipientList,
      subject: emailSubject,
      html: emailBody,
      attachments: [
        {
          filename,
          content: xlsxBuffer,
        },
      ],
    });

    if (response.error) {
      console.error("Resend API error:", response.error);
      return NextResponse.json({ error: response.error.message || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `Report sent successfully`,
      recipients: recipientList,
      id: response.data?.id
    });
  } catch (err: any) {
    console.error("Report generation error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
