import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMssqlPool } from "@/lib/mssql";
import type { ConnectionPool } from "mssql";

// =============================================================================
// GET /api/cron/sync-1c — 1C MS SQL Server-dən Pull tərzli sinxronizasiya
// Vercel Cron tərəfindən hər 15 dəqiqədən bir çağırılır (bax: vercel.json).
// Təhlükəsizlik: Authorization: Bearer <CRON_SECRET>
// Axın: MS SQL-ə qoşul -> müştəriləri oxu -> hər birini Customer cədvəlində
// upsert et (external_1c_id ilə) -> pool.close() ilə bağlantını bağla.
// =============================================================================

export const dynamic = "force-dynamic";

// 1C tərəfdəki müştəri cədvəli/View-u. Lazım gələrsə DB_1C_CUSTOMERS_TABLE
// mühit dəyişəni ilə fərqli ad təyin etmək mümkündür.
const CUSTOMERS_SOURCE = process.env.DB_1C_CUSTOMERS_TABLE || "dbo.Customers";

type Row1C = {
  id: string | number;
  name: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
};

function toTrimmedStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[CRON_SYNC_1C] CRON_SECRET mühit dəyişəni təyin olunmayıb");
    return NextResponse.json({ error: "Server konfiqurasiyası tamamlanmayıb" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token || token !== cronSecret) {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  let pool: ConnectionPool | null = null;
  const summary = { total: 0, created: 0, updated: 0, failed: 0, errors: [] as string[] };

  try {
    pool = await getMssqlPool();

    const dbResult = await pool.request().query<Row1C>(`
      SELECT
        id,
        name,
        company,
        phone,
        email
      FROM ${CUSTOMERS_SOURCE}
    `);

    const rows = dbResult.recordset ?? [];
    summary.total = rows.length;

    for (const row of rows) {
      const external1cId = toTrimmedStringOrNull(row.id);
      const name = toTrimmedStringOrNull(row.name);

      if (!external1cId || !name) {
        summary.failed += 1;
        summary.errors.push(`Sətir keçildi (id/name boşdur): id=${row.id}`);
        continue;
      }

      try {
        const existing = await prisma.customer.findUnique({
          where: { external_1c_id: external1cId },
          select: { id: true },
        });

        await prisma.customer.upsert({
          where: { external_1c_id: external1cId },
          update: {
            name,
            company: toTrimmedStringOrNull(row.company),
            phone: toTrimmedStringOrNull(row.phone),
            email: toTrimmedStringOrNull(row.email),
          },
          create: {
            name,
            company: toTrimmedStringOrNull(row.company),
            phone: toTrimmedStringOrNull(row.phone),
            email: toTrimmedStringOrNull(row.email),
            source: "1C",
            external_1c_id: external1cId,
          },
        });

        if (existing) {
          summary.updated += 1;
        } else {
          summary.created += 1;
        }
      } catch (rowError) {
        summary.failed += 1;
        const message = rowError instanceof Error ? rowError.message : String(rowError);
        summary.errors.push(`[${external1cId}] ${message}`);
        console.error("[CRON_SYNC_1C_ROW_FAILED]", external1cId, message);
      }
    }

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[CRON_SYNC_1C_FAILED]", message);
    return NextResponse.json(
      { error: "1C sinxronizasiyası zamanı xəta baş verdi", details: message },
      { status: 500 }
    );
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (closeError) {
        console.error("[CRON_SYNC_1C_POOL_CLOSE_FAILED]", closeError);
      }
    }
  }
}
