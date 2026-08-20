import nodemailer from "nodemailer";

// =============================================================================
// Nodemailer — dəvət e-poçtları
// SMTP konfiqurasiya olunmayıbsa (dev), link konsola yazılır.
// =============================================================================

export type SendInviteEmailInput = {
  to: string;
  recipientName: string;
  inviterName: string;
  companyName: string;
  token: string;
  type: "MEMBER" | "GUEST";
  message?: string | null;
};

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

function buildInviteHtml({
  recipientName,
  inviterName,
  companyName,
  inviteLink,
  message,
}: {
  recipientName: string;
  inviterName: string;
  companyName: string;
  inviteLink: string;
  message?: string | null;
}): string {
  const greetingName = recipientName.trim() || "Hörmətli istifadəçi";
  const extraMessage = message?.trim()
    ? `<p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;font-style:italic;">“${escapeHtml(message.trim())}”</p>`
    : "";

  return `
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WorkSpace ERP Dəvət</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);padding:36px 28px;">
              <div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.18);line-height:48px;text-align:center;margin:0 auto 12px;font-size:22px;color:#ffffff;font-weight:700;">W</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.3px;">WorkSpace ERP</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:40px 36px 16px;">
              <p style="margin:0 0 8px;font-size:20px;color:#0f172a;font-weight:700;">Salam, ${escapeHtml(greetingName)}!</p>
              <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">
                Siz <strong style="color:#1e293b;">WorkSpace ERP</strong> komandasına dəvət edilmisiniz.
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
                <strong>${escapeHtml(inviterName)}</strong> sizi
                <strong>${escapeHtml(companyName)}</strong> şirkətinə qoşulmağa dəvət edir.
              </p>
              ${extraMessage}
              <a href="${inviteLink}"
                 style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:999px;font-size:16px;font-weight:700;letter-spacing:0.2px;box-shadow:0 8px 20px rgba(37,99,235,0.35);">
                Dəvəti Qəbul Et
              </a>
              <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Düymə işləməsə, bu linki brauzerə kopyalayın:<br />
                <a href="${inviteLink}" style="color:#2563eb;word-break:break-all;">${inviteLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 36px 36px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Bu link 7 gün ərzində etibarlıdır. Əgər bu dəvəti gözləmirdinizsə, bu e-poçtu nəzərə almayın.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendInviteEmail({
  to,
  recipientName,
  inviterName,
  companyName,
  token,
  type,
  message,
}: SendInviteEmailInput): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = `${appUrl}/register?token=${token}`;
  const roleLabel = type === "GUEST" ? "qonaq (guest)" : "üzv";
  const html = buildInviteHtml({
    recipientName,
    inviterName,
    companyName,
    inviteLink,
    message,
  });

  const transporter = getTransporter();
  if (!transporter) {
    console.log(
      `[INVITE EMAIL] ${to} ünvanına ${companyName} şirkətinə ${roleLabel} kimi dəvət göndərildi: ${inviteLink}`
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: `"WorkSpace ERP" <${process.env.SMTP_USER}>`,
      to,
      subject: `${inviterName} sizi WorkSpace ERP komandasına dəvət etdi`,
      html,
    });
  } catch (error) {
    // Email göndərilməsə belə, dəvət yaradılması kəsilməməlidir.
    console.error("[sendInviteEmail] SMTP xətası:", error);
    console.log(`[INVITE EMAIL FALLBACK] ${inviteLink}`);
  }
}
