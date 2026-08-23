import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import type { Metadata } from "next";
import { getTranslation } from "@/lib/i18n";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";
import { AccessDenied } from "@/components/ui/access-denied";
import { getRealtimeTotals } from "@/lib/inventoryService";
import { ReportsClient } from "./ReportsClient";
import type {
  ReportsData,
  ReportsCrmData,
  ReportsMarketingData,
  CrmMonthlyTrendPoint,
} from "@/components/reports/types";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  return { title: t("reportsPage.metaTitle") || "Hesabatlar və Analitika" };
}

const TREND_DAYS = 14;
const STATUS_ORDER = ["NOT_PLANNED", "BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "REVIEW", "DONE", "CANCELLED"];
const PRIORITY_ORDER = ["URGENT", "HIGH", "MEDIUM", "LOW"];
const MONTH_TREND_LENGTH = 6;

function readCampaignStats(json: unknown): { sentCount: number; failedCount: number; recipientCount: number } {
  const stats = (json ?? {}) as { sentCount?: number; failedCount?: number; recipientCount?: number };
  return {
    sentCount: stats.sentCount ?? 0,
    failedCount: stats.failedCount ?? 0,
    recipientCount: stats.recipientCount ?? 0,
  };
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  // TƏHLÜKƏSİZLİK: Server-side guard — bütün şirkətin maliyyə/performans
  // göstəricilərini (CRM pipeline dəyəri, anbar dəyəri və s.) əks etdirdiyi
  // üçün bu səhifə ən azı CAN_VIEW_REPORTS tələb edir.
  const superAdmin = await isSuperAdmin(session.user.id);
  const canView = superAdmin || (await hasPermission(session.user.id, "CAN_VIEW_REPORTS"));

  if (!canView) {
    return (
      <AccessDenied
        title={t("reportsPage.accessDenied") || "İcazə yoxdur"}
        description={
          t("reportsPage.accessDeniedDesc") ||
          "Hesabatlar və analitika bölməsinə giriş üçün icazəniz yoxdur."
        }
      />
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trendStart = new Date(today);
  trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - (MONTH_TREND_LENGTH - 1), 1);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    projectStats,
    taskStats,
    memberCount,
    departments,
    completedTasksRaw,
    openTasksForBreakdown,
    userPrefs,
    crmStages,
    crmStageAgg,
    crmStatusAgg,
    crmDealsForTrend,
    topOpenDeals,
    wonThisMonthDeals,
    campaigns,
    inventoryTotals,
    movementAgg,
  ] = await Promise.all([
    prisma.project.groupBy({ by: ["status"], where: { companyId, isArchived: false }, _count: true }),
    prisma.task.groupBy({ by: ["status"], where: { project: { companyId }, isArchived: false }, _count: true }),
    prisma.user.count({ where: { companyId } }),
    prisma.department.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true, color: true } }),
    prisma.task.findMany({
      where: { project: { companyId }, completedAt: { gte: trendStart } },
      select: { completedAt: true },
    }),
    prisma.task.findMany({
      where: { project: { companyId }, isArchived: false, status: { notIn: ["DONE", "CANCELLED"] } },
      select: { priority: true, dueDate: true, project: { select: { departmentId: true } } },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { preferences: true } }),
    prisma.crmStage.findMany({ where: { companyId }, orderBy: { position: "asc" }, select: { id: true, name: true, color: true } }),
    prisma.crmDeal.groupBy({ by: ["stageId"], where: { companyId }, _count: true, _sum: { value: true } }),
    prisma.crmDeal.groupBy({ by: ["status"], where: { companyId }, _count: true, _sum: { value: true } }),
    prisma.crmDeal.findMany({
      where: { companyId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, updatedAt: true, value: true, status: true },
    }),
    prisma.crmDeal.findMany({
      where: { companyId, status: "OPEN" },
      orderBy: { value: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        value: true,
        currency: true,
        clientName: true,
        clientCompany: true,
        stage: { select: { name: true, color: true } },
      },
    }),
    prisma.crmDeal.findMany({
      where: { companyId, status: "WON", updatedAt: { gte: monthStart } },
      select: { value: true },
    }),
    prisma.marketingCampaign.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, status: true, stats: true, createdAt: true },
    }),
    getRealtimeTotals(companyId),
    prisma.stockMovement.groupBy({ by: ["type"], where: { companyId, createdAt: { gte: thirtyDaysAgo } }, _count: true }),
  ]);

  // ---------------------------------------------------------------------
  // OVERVIEW
  // ---------------------------------------------------------------------
  const totalProjects = projectStats.reduce((sum, s) => sum + s._count, 0);
  const activeProjects = projectStats.find((s) => s.status === "ACTIVE")?._count ?? 0;
  const totalTasks = taskStats.reduce((sum, s) => sum + s._count, 0);
  const doneTasks = taskStats.find((s) => s.status === "DONE")?._count ?? 0;
  const inProgressTasks = taskStats.find((s) => s.status === "IN_PROGRESS")?._count ?? 0;
  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const now = new Date();
  const overdueTasks = openTasksForBreakdown.filter((t) => t.dueDate && new Date(t.dueDate) < now).length;

  const trendData = (() => {
    const buckets = new Map<string, number>();
    for (let i = 0; i < TREND_DAYS; i++) {
      const d = new Date(trendStart);
      d.setDate(d.getDate() + i);
      buckets.set(format(d, "dd.MM"), 0);
    }
    for (const row of completedTasksRaw) {
      if (!row.completedAt) continue;
      const key = format(row.completedAt, "dd.MM");
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets, ([date, count]) => ({ date, count }));
  })();

  const statusChartData = STATUS_ORDER.map((status) => ({
    status,
    count: taskStats.find((s) => s.status === status)?._count ?? 0,
  }));

  const priorityData = PRIORITY_ORDER.map((priority) => ({
    priority,
    count: openTasksForBreakdown.filter((t) => t.priority === priority).length,
  }));

  const departmentWorkload = departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    color: dept.color,
    taskCount: openTasksForBreakdown.filter((t) => t.project.departmentId === dept.id).length,
  }));

  const initialPreferences =
    ((userPrefs?.preferences as Record<string, Record<string, boolean>> | null)?.["reports-overview"]) ?? {};

  // ---------------------------------------------------------------------
  // CRM
  // ---------------------------------------------------------------------
  const stageBreakdown = crmStages.map((stage) => {
    const agg = crmStageAgg.find((a) => a.stageId === stage.id);
    return {
      id: stage.id,
      name: stage.name,
      color: stage.color,
      count: agg?._count ?? 0,
      value: agg?._sum.value ?? 0,
    };
  });

  const statusBreakdown = crmStatusAgg.map((s) => ({
    status: s.status,
    count: s._count,
    value: s._sum.value ?? 0,
  }));

  const totalPipelineValue = statusBreakdown.find((s) => s.status === "OPEN")?.value ?? 0;
  const openDealsCount = statusBreakdown.find((s) => s.status === "OPEN")?.count ?? 0;
  const wonCount = statusBreakdown.find((s) => s.status === "WON")?.count ?? 0;
  const lostCount = statusBreakdown.find((s) => s.status === "LOST")?.count ?? 0;
  const winRate = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;
  const wonThisMonthCount = wonThisMonthDeals.length;
  const wonThisMonthValue = wonThisMonthDeals.reduce((sum, d) => sum + d.value, 0);

  const monthlyTrend: CrmMonthlyTrendPoint[] = (() => {
    const buckets = new Map<string, CrmMonthlyTrendPoint>();
    for (let i = 0; i < MONTH_TREND_LENGTH; i++) {
      const d = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
      const key = format(d, "MM.yyyy");
      buckets.set(key, { month: format(d, "MM.yy"), created: 0, won: 0, wonValue: 0 });
    }
    for (const deal of crmDealsForTrend) {
      const createdKey = format(deal.createdAt, "MM.yyyy");
      const bucket = buckets.get(createdKey);
      if (bucket) bucket.created += 1;

      if (deal.status === "WON") {
        const wonKey = format(deal.updatedAt, "MM.yyyy");
        const wonBucket = buckets.get(wonKey);
        if (wonBucket) {
          wonBucket.won += 1;
          wonBucket.wonValue += deal.value;
        }
      }
    }
    return Array.from(buckets.values());
  })();

  const crmData: ReportsCrmData = {
    totalPipelineValue,
    openDealsCount,
    wonThisMonthCount,
    wonThisMonthValue,
    winRate,
    stageBreakdown,
    statusBreakdown,
    monthlyTrend,
    topDeals: topOpenDeals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      value: deal.value,
      currency: deal.currency,
      clientName: deal.clientName,
      clientCompany: deal.clientCompany,
      stageName: deal.stage.name,
      stageColor: deal.stage.color,
    })),
  };

  // ---------------------------------------------------------------------
  // MARKETING
  // ---------------------------------------------------------------------
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "IN_PROGRESS" || c.status === "SCHEDULED").length;

  let totalSent = 0;
  let totalFailed = 0;
  let totalRecipients = 0;
  const channelCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();

  for (const c of campaigns) {
    const stats = readCampaignStats(c.stats);
    totalSent += stats.sentCount;
    totalFailed += stats.failedCount;
    totalRecipients += stats.recipientCount;
    channelCounts.set(c.type, (channelCounts.get(c.type) ?? 0) + 1);
    statusCounts.set(c.status, (statusCounts.get(c.status) ?? 0) + 1);
  }

  const marketingData: ReportsMarketingData = {
    totalCampaigns,
    activeCampaigns,
    totalSent,
    totalFailed,
    totalRecipients,
    deliveryRate: totalRecipients > 0 ? Math.round((totalSent / totalRecipients) * 100) : 0,
    channelBreakdown: Array.from(channelCounts, ([type, count]) => ({ type, count })),
    statusBreakdown: Array.from(statusCounts, ([status, count]) => ({ status, count })),
    recentCampaigns: campaigns.slice(0, 8).map((c) => {
      const stats = readCampaignStats(c.stats);
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        sentCount: stats.sentCount,
        recipientCount: stats.recipientCount,
        createdAt: c.createdAt.toISOString(),
      };
    }),
  };

  // ---------------------------------------------------------------------
  // INVENTORY
  // ---------------------------------------------------------------------
  const reportsData: ReportsData = {
    overview: {
      totalProjects,
      activeProjects,
      totalTasks,
      doneTasks,
      inProgressTasks,
      overdueTasks,
      overallProgress,
      memberCount,
      departmentCount: departments.length,
      statusChartData,
      trendData,
      priorityData,
      departmentWorkload,
    },
    crm: crmData,
    marketing: marketingData,
    inventory: {
      totalProducts: inventoryTotals.totalProducts,
      totalQuantity: inventoryTotals.totalQuantity,
      totalValuation: inventoryTotals.totalValuation,
      lowStockCount: inventoryTotals.lowStockCount,
      warehouseCount: inventoryTotals.warehouseCount,
      movementBreakdown: movementAgg.map((m) => ({ type: m.type, count: m._count })),
      lowStockItems: inventoryTotals.lowStockItems.slice(0, 8),
    },
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("reportsPage.title") || "Hesabatlar və Analitika"}
          </h2>
          <p className="text-muted-foreground">
            {t("reportsPage.description") ||
              "Layihələr, CRM, Marketinq və Anbar üzrə real vaxt performans göstəriciləri."}
          </p>
        </div>
      </div>

      <ReportsClient data={reportsData} initialPreferences={initialPreferences} />
    </div>
  );
}
