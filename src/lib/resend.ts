import { Resend } from "resend";

// Dəvət e-poçtları nodemailer (`@/lib/mailer`) vasitəsilə göndərilir.
// Bu fayl köhnə import-ları pozmamaq üçün re-export saxlayır.
export { sendInviteEmail, type SendInviteEmailInput } from "./mailer";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function getResendClient() {
  return resend;
}
