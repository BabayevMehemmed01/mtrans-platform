import { prisma } from "@/lib/prisma";
import { formatPhoneForAPI } from "@/lib/utils";

export class InfobipApiError extends Error {
  response: { data: unknown };

  constructor(data: unknown, message = "Infobip API xətası") {
    super(message);
    this.name = "InfobipApiError";
    this.response = { data };
  }
}

function normalizePhone(phone: string): string {
  return formatPhoneForAPI(phone).replace(/[^\d]/g, "");
}

async function logWhatsapp(params: {
  content: string;
  status: "SENT" | "FAILED";
  errorMessage?: string | null;
}): Promise<void> {
  try {
    await prisma.messageLog.create({
      data: {
        type: "WHATSAPP",
        content: params.content,
        status: params.status,
        errorMessage: params.errorMessage ?? null,
      },
    });
  } catch (error) {
    console.error("[INFOBIP_MESSAGE_LOG_FAILED]", error);
  }
}

export async function sendWhatsappMessage(
  phone: string,
  name: string,
  templateName: string = "test_whatsapp_template_en"
): Promise<unknown> {
  const baseUrl = process.env.INFOBIP_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.INFOBIP_API_KEY;
  const sender = process.env.INFOBIP_SENDER;
  const content = `${templateName} → ${phone} (${name})`;

  try {
    if (!phone) throw new InfobipApiError({ error: "Alıcı nömrə boşdur" });
    if (!baseUrl || !apiKey || !sender) {
      throw new InfobipApiError({
        error: "INFOBIP_BASE_URL, INFOBIP_API_KEY və ya INFOBIP_SENDER mühit dəyişənləri təyin olunmayıb",
      });
    }

    const response = await fetch(`${baseUrl}/whatsapp/1/message/template`, {
      method: "POST",
      headers: {
        Authorization: `App ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            from: sender,
            to: normalizePhone(phone),
            content: {
              templateName,
              templateData: { body: { placeholders: [name] } },
              language: "en",
            },
          },
        ],
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new InfobipApiError(data ?? { error: `Infobip API xətası (HTTP ${response.status})` });
    }

    await logWhatsapp({ content, status: "SENT" });
    return data;
  } catch (error) {
    const payload =
      error instanceof InfobipApiError
        ? error.response.data
        : { error: error instanceof Error ? error.message : String(error) };
    const message =
      error instanceof Error ? error.message : "Infobip WhatsApp göndərimi uğursuz oldu";
    console.error("[INFOBIP_SEND_WHATSAPP_FAILED]", payload ?? message);
    await logWhatsapp({
      content,
      status: "FAILED",
      errorMessage: typeof payload === "string" ? payload : JSON.stringify(payload),
    });
    if (error instanceof InfobipApiError) throw error;
    throw new InfobipApiError(payload, message);
  }
}
