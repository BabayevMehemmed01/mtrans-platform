import { Resend } from "resend";

// =============================================================================
// Resend wrapper — dəvət emailləri
// RESEND_API_KEY boşdursa (dev mühiti), API çağırılmır — link konsola yazılır.
// =============================================================================

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type SendInviteEmailInput = {
  to: string;
  inviterName: string;
  companyName: string;
  token: string;
  type: "MEMBER" | "GUEST";
};

export async function sendInviteEmail({
  to,
  inviterName,
  companyName,
  token,
  type,
}: SendInviteEmailInput): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = `${appUrl}/invite/${token}`;
  const roleLabel = type === "GUEST" ? "qonaq (guest)" : "üzv";

  if (!resend) {
    // Dev fallback — email konfiqurasiya olunmayıb, linki konsola çıxarırıq
    console.log(
      `[INVITE EMAIL] ${to} ünvanına ${companyName} şirkətinə ${roleLabel} kimi dəvət göndərildi: ${inviteLink}`
    );
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@yourcompany.com",
      to,
      subject: `${inviterName} sizi ${companyName} şirkətinə dəvət etdi`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Siz ${companyName} şirkətinə dəvət olundunuz</h2>
          <p><b>${inviterName}</b> sizi ${companyName} şirkətinə ${roleLabel} kimi qoşulmağa dəvət edir.</p>
          <p>
            <a href="${inviteLink}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;">
              Dəvəti qəbul et
            </a>
          </p>
          <p style="color:#64748b;font-size:12px;">Bu link 7 gün ərzində etibarlıdır. Əgər bu dəvəti gözləmirdinizsə, bu emaili nəzərə almayın.</p>
        </div>
      `,
    });
  } catch (error) {
    // Email göndərilməsə belə, invite yaradılması prosesi kəsilməməlidir.
    console.error("[sendInviteEmail] Resend xətası:", error);
    console.log(`[INVITE EMAIL FALLBACK] ${inviteLink}`);
  }
}
