import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsappMessage } from "@/lib/infobip";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const body = await req.json();
    const { dealId, contactId, templateName } = body as {
      dealId?: string;
      contactId?: string;
      templateName?: string;
    };

    if (!dealId && !contactId) {
      return NextResponse.json({ error: "dealId və ya contactId tələb olunur" }, { status: 400 });
    }

    let phone = "";
    let name = "";

    if (dealId) {
      const deal = await prisma.crmDeal.findFirst({
        where: { id: dealId, companyId },
        include: { crmContact: true, customer: true },
      });
      if (!deal) return NextResponse.json({ error: "Sövdələşmə tapılmadı" }, { status: 404 });
      phone = deal.clientPhone || deal.crmContact?.phone || deal.customer?.phone || "";
      name =
        deal.clientName ||
        [deal.crmContact?.firstName, deal.crmContact?.lastName].filter(Boolean).join(" ") ||
        deal.customer?.name ||
        "Customer";
    } else if (contactId) {
      const contact = await prisma.crmContact.findFirst({
        where: { id: contactId, companyId },
      });
      if (!contact) return NextResponse.json({ error: "Əlaqə tapılmadı" }, { status: 404 });
      phone = contact.phone || "";
      name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Customer";
    }

    if (!phone) {
      return NextResponse.json({ error: "Müştərinin telefon nömrəsi yoxdur" }, { status: 400 });
    }

    const data = await sendWhatsappMessage(
      phone,
      name,
      templateName || "test_whatsapp_template_en"
    );
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("[CRM_WHATSAPP_POST]", error);
    return NextResponse.json(error.response?.data ?? { error: error?.message ?? "Server xətası" }, {
      status: 500,
    });
  }
}
