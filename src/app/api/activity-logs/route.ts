import { NextResponse } from "next/server";
import { Prisma, type AuditAction } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";

const ACTIONS: AuditAction[] = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "INVITE",
  "ASSIGN",
  "COMPLETE",
  "ARCHIVE",
  "RESTORE",
];

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId as string | undefined;
    if (!companyId) {
      return NextResponse.json({ error: "Company required" }, { status: 400 });
    }

    if (!(await isSuperAdmin(session.user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const actionParam = searchParams.get("action")?.trim().toUpperCase() || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
    const exportAll = searchParams.get("export") === "1";

    const where: Prisma.AuditLogWhereInput = { companyId };

    if (actionParam && ACTIONS.includes(actionParam as AuditAction)) {
      where.action = actionParam as AuditAction;
    }

    if (q) {
      where.OR = [
        { entityName: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { ipAddress: { contains: q, mode: "insensitive" } },
      ];
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        const start = new Date(from);
        if (!Number.isNaN(start.getTime())) where.createdAt.gte = start;
      }
      if (to) {
        const end = new Date(to);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }
    }

    const take = exportAll ? 5000 : limit;
    const skip = exportAll ? 0 : (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityName: true,
          ipAddress: true,
          sessionDurationMs: true,
          createdAt: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page: exportAll ? 1 : page,
      limit: take,
    });
  } catch (error) {
    console.error("[ACTIVITY_LOGS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
