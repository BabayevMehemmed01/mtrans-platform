import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { title, value, currency, probability, expectedCloseDate, stageId, crmContactId, crmCompanyId, assigneeId } = body;

    if (!title || !stageId) {
      return NextResponse.json({ error: "Title and stage are required" }, { status: 400 });
    }

    const stage = await prisma.crmStage.findFirst({ where: { id: stageId, companyId } });
    if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

    if (assigneeId) {
      const assignee = await prisma.user.findFirst({ where: { id: assigneeId, companyId } });
      if (!assignee) return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
    }

    const deal = await prisma.crmDeal.create({
      data: {
        title,
        value: value ? parseFloat(value) : 0,
        currency: currency || "AZN",
        probability: probability ? parseInt(probability) : 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        companyId,
        stageId,
        crmContactId: crmContactId || null,
        crmCompanyId: crmCompanyId || null,
        assigneeId: assigneeId || null,
      },
      include: {
        stage: true,
        crmContact: true,
        crmCompany: true,
        assignee: true,
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    console.error("[CRM_DEALS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
