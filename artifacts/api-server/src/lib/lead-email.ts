import nodemailer from "nodemailer";

export type LeadEmailInput = {
  name: string;
  email: string;
  phone: string;
  platform: string;
  message: string | null;
};

export type EmailNotificationStatus = "sent" | "not_configured" | "failed";
export type SmtpVerificationStatus = "verified" | "not_configured" | "failed";

const RECIPIENT = "skmediamonetization@gmail.com";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid TCP port");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

export async function verifySmtpConnection(): Promise<{
  status: SmtpVerificationStatus;
  reason?: string;
}> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return { status: "not_configured" };
  }

  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { status: "not_configured" };
    }
    await transporter.verify();
    return { status: "verified" };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.name : "UnknownSmtpError",
    };
  }
}

export async function sendLeadNotification(
  lead: LeadEmailInput,
): Promise<{ status: EmailNotificationStatus; reason?: string }> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return { status: "not_configured" };
  }

  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { status: "not_configured" };
    }
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: RECIPIENT,
      subject: "New website enquiry — SK Media Monetization",
      text: [
        "A new lead was submitted on the SK Media Monetization website.",
        "",
        `Name: ${lead.name}`,
        `Email: ${lead.email}`,
        `Phone: ${lead.phone}`,
        `Platform: ${lead.platform}`,
        "",
        "Message:",
        lead.message || "(No message provided)",
      ].join("\n"),
    });
    return { status: "sent" };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.name : "UnknownEmailError",
    };
  }
}
