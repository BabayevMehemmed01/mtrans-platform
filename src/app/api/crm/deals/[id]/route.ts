import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Company Required" }, { status: 400 });

    const { id } = await params;
    const body = await req.json();
    const { stageId, title, value, currency, probability, expectedCloseDate, status, assigneeId, crmContactId, crmCompanyId } = body;

    const existingDeal = await prisma.crmDeal.findFirst({ where: { id, companyId } });
    if (!existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (stageId) {
      const stage = await prisma.crmStage.findFirst({ where: { id: stageId, companyId } });
      if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (stageId !== undefined) data.stageId = stageId;
    if (title !== undefined) data.title = title;
    if (value !== undefined) data.value = parseFloat(value) || 0;
    if (currency !== undefined) data.currency = currency;
    if (probability !== undefined) data.probability = parseInt(probability) || 0;
    if (expectedCloseDate !== undefined) data.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
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
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Company Required" }, { status: 400 });

    const { id } = await params;

    const existingDeal = await prisma.crmDeal.findFirst({ where: { id, companyId } });
    if (!existingDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    await prisma.crmDeal.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CRM_DEALS_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
