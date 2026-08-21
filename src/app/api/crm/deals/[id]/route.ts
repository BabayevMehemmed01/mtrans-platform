import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const { id } = await params;
    const body = await req.json();
    const {
      stageId, title, value, currency, probability, expectedCloseDate, deadline,
      clientName, clientCompany, clientPhone, clientEmail,
      status, assigneeId, crmContactId, crmCompanyId,
    } = body;

    const existingDeal = await prisma.crmDeal.findFirst({ where: { id, companyId } });
    if (!existingDeal) {
      return NextResponse.json({ error: "Sövdələşmə tapılmadı" }, { status: 404 });
    }

    if (stageId) {
      const stage = await prisma.crmStage.findFirst({ where: { id: stageId, companyId } });
      if (!stage) return NextResponse.json({ error: "Mərhələ tapılmadı" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (stageId !== undefined) data.stageId = stageId;
    if (title !== undefined) data.title = title;
    if (value !== undefined) data.value = parseFloat(value) || 0;
    if (currency !== undefined) data.currency = currency;
    if (probability !== undefined) data.probability = parseInt(probability) || 0;
    if (expectedCloseDate !== undefined) data.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;
    if (clientName !== undefined) data.clientName = clientName ? String(clientName).trim() : null;
    if (clientCompany !== undefined) data.clientCompany = clientCompany ? String(clientCompany).trim() : null;
    if (clientPhone !== undefined) data.clientPhone = clientPhone ? String(clientPhone).trim() : null;
    if (clientEmail !== undefined) data.clientEmail = clientEmail ? String(clientEmail).trim() : null;
    if (status !== undefined) data.status = status;
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (crmContactId !== undefined) data.crmContactId = crmContactId || null;
    if (crmCompanyId !== undefined) data.crmCompanyId = crmCompanyId || null;

    const deal = await prisma.crmDeal.update({
      where: { id },
      data,
      include: {
        stage: true,
        crmContact: true,
        crmCompany: true,
        assignee: true,
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    console.error("[CRM_DEALS_PATCH]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const { id } = await params;

    const existingDeal = await prisma.crmDeal.findFirst({ where: { id, companyId } });
    if (!existingDeal) {
      return NextResponse.json({ error: "Sövdələşmə tapılmadı" }, { status: 404 });
    }

    await prisma.crmDeal.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CRM_DEALS_DELETE]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
