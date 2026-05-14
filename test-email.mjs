import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_EMAILS = [
  "loriyasagar.b@iitgn.ac.in",
  "abhay.maurya@iitgn.ac.in",
  "md.faizan@iitgn.ac.in",
  "rishabh.dangi@iitgn.ac.in",
  "dhruvit.patel@iitgn.ac.in",
  "rahuljayantibhai.p@iitgn.ac.in",
  "eas@iitgn.ac.in"
];

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendTestEmail() {
  try {
    console.log("Using SMTP User:", process.env.SMTP_USER);
    console.log("Sending test email to:", ADMIN_EMAILS.join(", "));
    
    const info = await transporter.sendMail({
      from: `"Fox Kisem" <${process.env.SMTP_USER}>`,
      to: ADMIN_EMAILS.join(", "),
      subject: "Test Email: Fox Kisem Email Configuration",
      text: "Hello Team,\n\nThis is a test email to verify that the automated email configuration is working correctly for the Fox Kisem application.\n\nIf you are reading this, the email setup was successful!\n\nBest regards,\nFox Kisem — Industrial Data Collection System\nIITGN Kisem Lab",
    });
    
    console.log("✅ Email sent successfully! Message ID: " + info.messageId);
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
}

sendTestEmail();
