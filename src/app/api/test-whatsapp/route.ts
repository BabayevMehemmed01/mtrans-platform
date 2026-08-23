import { NextResponse } from "next/server";
import { sendWhatsappMessage } from "@/lib/infobip";

export async function GET() {
  try {
    const data = await sendWhatsappMessage(
      "994505825782",
      "Mehemmed",
      "test_whatsapp_template_en"
    );
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(error.response?.data ?? { error: error?.message ?? "Infobip xətası" }, {
      status: 500,
    });
  }
}
