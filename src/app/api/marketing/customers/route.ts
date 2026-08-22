import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// =============================================================================
// GET /api/marketing/customers — Seqment yaratma modalındaki "Clients/Contacts"
// multi-select üçün şirkətin müştəri (Customer) siyahısı.
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        phone: true,
        source: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("[GET /api/marketing/customers]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
