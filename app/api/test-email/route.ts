import { NextResponse } from "next/server";
import { Resend } from "resend";

const ADMIN_EMAILS = [
  "loriyasagar.b@iitgn.ac.in",
  "abhay.maurya@iitgn.ac.in",
  "md.faizan@iitgn.ac.in",
  "rishabh.dangi@iitgn.ac.in",
  "dhruvit.patel@iitgn.ac.in",
  "rahuljayantibhai.p@iitgn.ac.in",
  "iea@iitgn.ac.in"
];

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: "RESEND_API_KEY not configured in environment",
        status: "FAILED"
      }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const testEmail = `
      <h2>Fox Kisem - Test Email</h2>
      <p>This is a test email to verify the Resend email service is working correctly.</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p>If you received this, the email service is configured properly!</p>
      <hr>
      <p>Fox Kisem - Industrial Data Collection System</p>
    `;

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Fox Kisem <noreply@resend.dev>",
      to: ADMIN_EMAILS[0],
      bcc: ADMIN_EMAILS.slice(1),
      subject: "Fox Kisem - Test Email",
      html: testEmail,
    });

    if (response.error) {
      return NextResponse.json({
        error: response.error.message,
        status: "FAILED"
      }, { status: 500 });
    }

    return NextResponse.json({
      message: "Test email sent successfully",
      recipients: ADMIN_EMAILS,
      emailId: response.data?.id,
      status: "SUCCESS"
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      status: "FAILED"
    }, { status: 500 });
  }
}
