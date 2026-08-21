import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendDealWelcomeNotification } from "@/lib/integrationService";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Company Required" }, { status: 400 });

    const deals = await prisma.crmDeal.findMany({
      where: { companyId },
      include: {
        stage: true,
        crmContact: true,
        crmCompany: true,
        assignee: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error("[CRM_DEALS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Company Required" }, { status: 400 });

    const body = await req.json();
    const {
      title, value, currency, probability, expectedCloseDate, deadline,
      clientName, clientCompany, clientPhone, clientEmail,
      stageId, crmContactId, crmCompanyId, assigneeId,
    } = body;

    if (!title || !stageId) {
      return NextResponse.json({ error: "Title and stage are required" }, { status: 400 });
    }

    const stage = await prisma.crmStage.findFirst({ where: { id: stageId, companyId } });
    if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

    if (assigneeId) {
      const assignee = await prisma.user.findFirst({ where: { id: assigneeId, companyId } });
      if (!assignee) return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
    }

    const trimmedPhone = clientPhone?.trim() || null;
    const trimmedEmail = clientEmail?.trim() || null;
    const trimmedName = clientName?.trim() || null;
    const trimmedCompany = clientCompany?.trim() || null;

    // Əqdə uyğun Customer tapılır (telefon/email üzrə) və ya yaradılır —
    // xarici inteqrasiyalar (1C, Email, SMS, WhatsApp, Telegram) bu kartla işləyir.
    let customer = null as Awaited<ReturnType<typeof prisma.customer.findFirst>> | null;
    if (trimmedPhone || trimmedEmail) {
      const orConditions: Array<{ phone: string } | { email: string }> = [];
      if (trimmedPhone) orConditions.push({ phone: trimmedPhone });
      if (trimmedEmail) orConditions.push({ email: trimmedEmail });

      customer = await prisma.customer.findFirst({
        where: { companyId, OR: orConditions },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: trimmedName || "Naməlum Müştəri",
            company: trimmedCompany,
            phone: trimmedPhone,
            email: trimmedEmail,
            source: "CRM",
            companyId,
          },
        });
      } else {
        const updateData: Record<string, unknown> = {};
        if (trimmedName && !customer.name) updateData.name = trimmedName;
        if (trimmedCompany && !customer.company) updateData.company = trimmedCompany;
        if (trimmedEmail && !customer.email) updateData.email = trimmedEmail;
        if (trimmedPhone && !customer.phone) updateData.phone = trimmedPhone;
        if (Object.keys(updateData).length > 0) {
          customer = await prisma.customer.update({ where: { id: customer.id }, data: updateData });
        }
      }
    }

    // Hər əqd üçün unikal, şifrəsiz izləmə linki (Magic Link) tokeni
    const trackingToken = randomBytes(16).toString("hex");

    const deal = await prisma.crmDeal.create({
      data: {
        title,
        value: value ? parseFloat(value) : 0,
        currency: currency || "AZN",
        probability: probability ? parseInt(probability) : 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        clientName: trimmedName,
        clientCompany: trimmedCompany,
        clientPhone: trimmedPhone,
        clientEmail: trimmedEmail,
        trackingToken,
        companyId,
        stageId,
        crmContactId: crmContactId || null,
        crmCompanyId: crmCompanyId || null,
        assigneeId: assigneeId || null,
        customerId: customer?.id || null,
      },
      include: {
        stage: true,
        crmContact: true,
        crmCompany: true,
        assignee: true,
        customer: true,
      },
    });

    // Əqd yaradıldıqdan dərhal sonra, arxa planda (bloklamadan) müştəriyə
    // "Xoş gəldiniz" bildirişi göndərilir. Xəta əqdin yaranmasını ƏSLA bloklamır.
    if (customer && (customer.email || customer.phone)) {
      void sendDealWelcomeNotification({
        customerName: customer.name,
        dealTitle: deal.title,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        dealId: deal.id,
        customerId: customer.id,
        trackingToken: deal.trackingToken,
      }).catch((err) => {
        console.error("[CRM_DEAL_WELCOME_NOTIFY_FAILED]", err);
      });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error("[CRM_DEALS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
