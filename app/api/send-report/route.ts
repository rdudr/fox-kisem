import { NextResponse } from "next/server";
import { Resend } from "resend";
import * as XLSX from "xlsx";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile, zones, areas, entries, apfcs, energySources, recipients, reporterName } = body;

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
    const zoneHeaders = ["Name","PQ Name","V1","V2","V3","UTHD1","UTHD2","UTHD3","I1","I2","I3","ITHD1","ITHD2","ITHD3","Power Factor","KVAr (D)","KVAr (Q)","KVAr Lead/Lag","Total Power (kW)","Description","Photo Path","Date"];
    const zoneRows = (zones ?? []).map((z: any) => [z.name, z.pqName??"",(z.v1??""),(z.v2??""),(z.v3??""),(z.uthd1??""),(z.uthd2??""),(z.uthd3??""),(z.i1??""),(z.i2??""),(z.i3??""),(z.ithd1??""),(z.ithd2??""),(z.ithd3??""),(z.pf??""),(z.kvarD??""),(z.kvarQ??""),(z.kvarLeadLag??""),(z.totalPower??""),(z.description??""),z.photoPath??"",new Date(z.createdAt).toLocaleString("en-IN")]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([zoneHeaders, ...zoneRows]), "Plant Main Inputs");

    // Sheet 3: PCC Panels
    const pccHeaders = ["Plant Main Input","PCC Name","PQ Name","V1","V2","V3","UTHD1","UTHD2","UTHD3","I1","I2","I3","ITHD1","ITHD2","ITHD3","Power Factor","KVAr (D)","KVAr (Q)","KVAr Lead/Lag","Total Power (kW)","Description","Photo Path","Date"];
    const pccRows = (areas ?? []).filter((a: any) => a.type === "PCC").map((a: any) => {
      const zone = (zones ?? []).find((z: any) => z.id === a.zoneId);
      return [(zone?.name??"Unknown"), a.name, (a.pqName??""),(a.v1??""),(a.v2??""),(a.v3??""),(a.uthd1??""),(a.uthd2??""),(a.uthd3??""),(a.i1??""),(a.i2??""),(a.i3??""),(a.ithd1??""),(a.ithd2??""),(a.ithd3??""),(a.pf??""),(a.kvarD??""),(a.kvarQ??""),(a.kvarLeadLag??""),(a.totalPower??""),(a.description??""),a.photoPath??"",new Date(a.createdAt).toLocaleString("en-IN")];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([pccHeaders, ...pccRows]), "PCC Panels");

    // Sheet 4: MCC Panels
    const mccHeaders = ["Plant Main Input","Parent PCC Panel","MCC Name","PQ Name","V1","V2","V3","UTHD1","UTHD2","UTHD3","I1","I2","I3","ITHD1","ITHD2","ITHD3","Power Factor","KVAr (D)","KVAr (Q)","KVAr Lead/Lag","Total Power (kW)","Description","Photo Path","Date"];
    const mccRows = (areas ?? []).filter((a: any) => a.type === "MCC").map((a: any) => {
      const zone = (zones ?? []).find((z: any) => z.id === a.zoneId);
      const parentPcc = (areas ?? []).find((p: any) => p.id === a.pccId);
      return [(zone?.name??"Unknown"), (parentPcc?.name??"Direct Feed"), a.name, (a.pqName??""),(a.v1??""),(a.v2??""),(a.v3??""),(a.uthd1??""),(a.uthd2??""),(a.uthd3??""),(a.i1??""),(a.i2??""),(a.i3??""),(a.ithd1??""),(a.ithd2??""),(a.ithd3??""),(a.pf??""),(a.kvarD??""),(a.kvarQ??""),(a.kvarLeadLag??""),(a.totalPower??""),(a.description??""),a.photoPath??"",new Date(a.createdAt).toLocaleString("en-IN")];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([mccHeaders, ...mccRows]), "MCC Panels");

    // Sheet 5: Motor Loads Clamp
    const clampEntries = (entries ?? []).filter((e: any) => !e.entryType || e.entryType === "CLAMP");
    const clampHeaders = ["Zone","Area (MCC/PCC)","Machine Tag","Starter Type","Rated kW","Rated HP","Voltage (V)","Current (A)","KVA","Power Factor","KVAr","Measured kW","Calculated Power (kW)","Load Factor","Description","Photo Path","Date"];
    const clampRows = clampEntries.map((e: any) => {
      const area = (areas ?? []).find((a: any) => a.id === e.areaId);
      const zone = (zones ?? []).find((z: any) => z.id === area?.zoneId);
      return [(zone?.name??"Unknown"),(area?.name??"Unknown"),e.machineTag,e.starterType,e.ratedKw,(e.ratedHp??""),(e.voltage??""),(e.current??""),(e.kva??""),(e.pf??""),(e.kvar??""),e.measuredKw,Number(e.calculatedPower).toFixed(2),Number(e.loadFactor).toFixed(3),(e.description??""),e.photoPath??"",new Date(e.createdAt).toLocaleString("en-IN")];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([clampHeaders, ...clampRows]), "Motor Loads Clamp");

    // Sheet 6: Motor Loads PQ
    const pqEntries = (entries ?? []).filter((e: any) => e.entryType === "PQ");
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
    const pqRows = pqEntries.map((e: any) => {
      const area = (areas ?? []).find((a: any) => a.id === e.areaId);
      const zone = (zones ?? []).find((z: any) => z.id === area?.zoneId);
      
      let pccName = "";
      let mccName = "";
      if (area) {
        if (area.type === "MCC") {
          mccName = area.name;
          const parentPcc = (areas ?? []).find((p: any) => p.id === area.pccId);
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
    const apfcHeaders = ["Location Plant Input","Location Panel","Stage","Rated Capacitor Value","Voltage","I-R","I-Y","I-B","Remark","Description","Photo Path","Date"];
    const apfcRows = (apfcs ?? []).map((ap: any) => {
      const zone = (zones ?? []).find((z: any) => z.id === ap.zoneId);
      const panel = (areas ?? []).find((p: any) => p.id === ap.areaId);
      const panelStr = panel ? `[${panel.type}] ${panel.name}` : "Direct Feed";
      return [
        (zone?.name??"Unknown"),
        panelStr,
        ap.stage??"",
        ap.ratedCapacitorValue??"",
        ap.voltage??"",
        ap.iR??"",
        ap.iY??"",
        ap.iB??"",
        ap.remark??"",
        ap.description??"",
        ap.photoPath??"",
        new Date(ap.createdAt).toLocaleString("en-IN")
      ];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([apfcHeaders, ...apfcRows]), "APFC");

    // Sheet 7: Energy Sources
    const energySourceHeaders = ["Source Name","Source Type","PQ Name","Recording ID","V1","V2","V3","UTHD1","UTHD2","UTHD3","I1","I2","I3","ITHD1","ITHD2","ITHD3","Power Factor","KVAr (D)","KVAr (Q)","KVAr Lead/Lag","Total Power (kW)","Date"];
    const energySourceRows = (energySources ?? []).map((es: any) => [
      es.name,
      es.sourceType,
      es.pqName ?? "",
      es.recordingNameId ?? "",
      es.v1 ?? "", es.v2 ?? "", es.v3 ?? "",
      es.uthd1 ?? "", es.uthd2 ?? "", es.uthd3 ?? "",
      es.i1 ?? "", es.i2 ?? "", es.i3 ?? "",
      es.ithd1 ?? "", es.ithd2 ?? "", es.ithd3 ?? "",
      es.pf ?? "", es.kvarD ?? "", es.kvarQ ?? "", es.kvarLeadLag ?? "",
      es.totalPower ?? "",
      es.createdAt ? new Date(es.createdAt).toLocaleString("en-IN") : new Date().toLocaleString("en-IN")
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([energySourceHeaders, ...energySourceRows]), "Energy Sources");

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
    <li>Energy Sources: ${(energySources ?? []).length}</li>
    <li>Zones Recorded: ${zones.length}</li>
    <li>MCC/PCC Areas: ${areas.length}</li>
    <li>Motor Load Clamp Entries: ${clampEntries.length}</li>
    <li>Motor Load PQ Entries: ${pqEntries.length}</li>
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
