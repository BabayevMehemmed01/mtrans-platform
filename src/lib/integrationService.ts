import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import type { MessageLogType } from "@prisma/client";

// =============================================================================
// Inteqrasiya Servisi — Email (SMTP), Telegram Bot API, Twilio (SMS/WhatsApp)
// Hər bir funksiya REAL xarici sorğu atır. Nəticə (SENT/FAILED) dərhal
// `prisma.messageLog` cədvəlinə yazılır. Mock/console.log əvəzləyicisi YOXDUR.
// =============================================================================

export type IntegrationResult = { success: boolean; error?: string };

type MessageMeta = {
  dealId?: string | null;
  customerId?: string | null;
};

async function logMessage(params: {
  type: MessageLogType;
  content: string;
  status: "SENT" | "FAILED";
  errorMessage?: string | null;
  dealId?: string | null;
  customerId?: string | null;
}): Promise<void> {
  try {
    await prisma.messageLog.create({
      data: {
        type: params.type,
        content: params.content,
        status: params.status,
        errorMessage: params.errorMessage ?? null,
        dealId: params.dealId ?? null,
        customerId: params.customerId ?? null,
      },
    });
  } catch (error) {
    console.error("[INTEGRATION_MESSAGE_LOG_FAILED]", error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// -----------------------------------------------------------------------------
// EMAIL — real SMTP (nodemailer, SMTP_USER/SMTP_PASS)
// -----------------------------------------------------------------------------

function getMailTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error("SMTP_USER və ya SMTP_PASS mühit dəyişəni təyin olunmayıb");
  }
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  meta?: MessageMeta
): Promise<IntegrationResult> {
  try {
    if (!to) throw new Error("Alıcı e-poçt ünvanı boşdur");
    const transporter = getMailTransporter();
    await transporter.sendMail({
      from: `"WorkSpace ERP" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    await logMessage({
      type: "EMAIL",
      content: `${subject}\n${html}`,
      status: "SENT",
      dealId: meta?.dealId,
      customerId: meta?.customerId,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[INTEGRATION_SEND_EMAIL_FAILED]", message);
    await logMessage({
      type: "EMAIL",
      content: `${subject}\n${html}`,
      status: "FAILED",
      errorMessage: message,
      dealId: meta?.dealId,
      customerId: meta?.customerId,
    });
    return { success: false, error: message };
  }
}

// -----------------------------------------------------------------------------
// TELEGRAM — real Telegram Bot API (fetch, TELEGRAM_BOT_TOKEN)
// -----------------------------------------------------------------------------

export async function sendTelegram(
  chatId: string,
  text: string,
  meta?: MessageMeta
): Promise<IntegrationResult> {
  try {
    if (!chatId) throw new Error("Telegram chat_id boşdur");
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN mühit dəyişəni təyin olunmayıb");

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.description || `Telegram API xətası (HTTP ${res.status})`);
    }

    await logMessage({ type: "TELEGRAM", content: text, status: "SENT", dealId: meta?.dealId, customerId: meta?.customerId });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[INTEGRATION_SEND_TELEGRAM_FAILED]", message);
    await logMessage({
      type: "TELEGRAM",
      content: text,
      status: "FAILED",
      errorMessage: message,
      dealId: meta?.dealId,
      customerId: meta?.customerId,
    });
    return { success: false, error: message };
  }
}

// -----------------------------------------------------------------------------
// TWILIO — real Twilio REST API (fetch + Basic Auth, SMS və WhatsApp)
// -----------------------------------------------------------------------------

export async function sendTwilioMessage(
  to: string,
  text: string,
  isWhatsApp: boolean = false,
  meta?: MessageMeta
): Promise<IntegrationResult> {
  const type: MessageLogType = isWhatsApp ? "WHATSAPP" : "SMS";
  try {
    if (!to) throw new Error("Alıcı nömrə boşdur");

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = isWhatsApp ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_SMS_FROM;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error(
        "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN və ya FROM nömrəsi mühit dəyişənləri təyin olunmayıb"
      );
    }

    const formattedTo = isWhatsApp && !to.startsWith("whatsapp:") ? `whatsapp:${to}` : to;
    const formattedFrom =
      isWhatsApp && !fromNumber.startsWith("whatsapp:") ? `whatsapp:${fromNumber}` : fromNumber;

    const params = new URLSearchParams({ To: formattedTo, From: formattedFrom, Body: text });
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || `Twilio API xətası (HTTP ${res.status})`);
    }

    await logMessage({ type, content: text, status: "SENT", dealId: meta?.dealId, customerId: meta?.customerId });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[INTEGRATION_SEND_TWILIO_FAILED]", message);
    await logMessage({
      type,
      content: text,
      status: "FAILED",
      errorMessage: message,
      dealId: meta?.dealId,
      customerId: meta?.customerId,
    });
    return { success: false, error: message };
  }
}

// -----------------------------------------------------------------------------
// Əqd yaradıldıqda avtomatik "Xoş gəldiniz" bildirişi (Email + SMS, arxa planda)
// -----------------------------------------------------------------------------

export async function sendDealWelcomeNotification(params: {
  customerName: string;
  dealTitle: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  dealId?: string | null;
  customerId?: string | null;
}): Promise<void> {
  const message = `Hörmətli ${params.customerName}, Sizinlə ${params.dealTitle} üzrə yeni müraciət qeydə alındı. Təşəkkür edirik! - WorkSpace ERP`;
  const meta: MessageMeta = { dealId: params.dealId, customerId: params.customerId };

  const tasks: Promise<IntegrationResult>[] = [];

  if (params.customerEmail) {
    tasks.push(
      sendEmail(
        params.customerEmail,
        `${params.dealTitle} üzrə müraciətiniz qeydə alındı`,
        `<p style="font-family:Arial,sans-serif;font-size:15px;color:#0f172a;">${escapeHtml(message)}</p>`,
        meta
      )
    );
  }

  if (params.customerPhone) {
    tasks.push(sendTwilioMessage(params.customerPhone, message, false, meta));
  }

  if (tasks.length === 0) return;
  await Promise.allSettled(tasks);
}
