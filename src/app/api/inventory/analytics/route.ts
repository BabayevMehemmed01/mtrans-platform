import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAbcAnalysis, getRealtimeTotals, getStockTurnover } from "@/lib/inventoryService";

// =============================================================================
// GET /api/inventory/analytics — ABC analizi, stok dövriyyəsi (turnover) və
//   real-time anbar qalığı aqreqasiyası. Bütün rəqəmlər Prisma sorğuları ilə
//   canlı hesablanır (heç bir statik/mock dəyər yoxdur).
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const days = Math.min(Math.max(Number(searchParams.get("days")) || 90, 1), 365);

    const [totals, abc, turnover] = await Promise.all([
      getRealtimeTotals(companyId),
      getAbcAnalysis(companyId, days),
      getStockTurnover(companyId, days),
    ]);

    const abcSummary = {
      A: abc.filter((r) => r.category === "A").length,
      B: abc.filter((r) => r.category === "B").length,
      C: abc.filter((r) => r.category === "C").length,
    };

    return NextResponse.json({
      totals,
      abc,
      abcSummary,
      turnover,
      periodDays: days,
    });
  } catch (error) {
    console.error("[GET /api/inventory/analytics]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
