// =============================================================================
// Reports / Analitika modulu üçün paylaşılan tiplər — bütün məlumatlar server
// komponentində (src/app/dashboard/reports/page.tsx) Prisma ilə hesablanır və
// bu tiplər vasitəsilə client komponentlərinə ötürülür.
// =============================================================================

export interface TaskStatusCount {
  status: string;
  count: number;
}

export interface TasksTrendPoint {
  date: string;
  count: number;
}

export interface PriorityCount {
  priority: string;
  count: number;
}

export interface DepartmentWorkload {
  id: string;
  name: string;
  color: string;
  taskCount: number;
}

export interface ReportsOverviewData {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  overallProgress: number;
  memberCount: number;
  departmentCount: number;
  statusChartData: TaskStatusCount[];
  trendData: TasksTrendPoint[];
  priorityData: PriorityCount[];
  departmentWorkload: DepartmentWorkload[];
}

export interface CrmStageBreakdown {
  id: string;
  name: string;
  color: string;
  count: number;
  value: number;
}

export interface CrmStatusBreakdown {
  status: string;
  count: number;
  value: number;
}

export interface CrmMonthlyTrendPoint {
  month: string;
  created: number;
  won: number;
  wonValue: number;
}

export interface CrmTopDeal {
  id: string;
  title: string;
  value: number;
  currency: string;
  clientName: string | null;
  clientCompany: string | null;
  stageName: string;
  stageColor: string;
}

export interface ReportsCrmData {
  totalPipelineValue: number;
  openDealsCount: number;
  wonThisMonthCount: number;
  wonThisMonthValue: number;
  winRate: number;
  stageBreakdown: CrmStageBreakdown[];
  statusBreakdown: CrmStatusBreakdown[];
  monthlyTrend: CrmMonthlyTrendPoint[];
  topDeals: CrmTopDeal[];
}

export interface MarketingChannelBreakdown {
  type: string;
  count: number;
}

export interface MarketingStatusBreakdown {
  status: string;
  count: number;
}

export interface MarketingRecentCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  sentCount: number;
  recipientCount: number;
  createdAt: string;
}

export interface ReportsMarketingData {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSent: number;
  totalFailed: number;
  totalRecipients: number;
  deliveryRate: number;
  channelBreakdown: MarketingChannelBreakdown[];
  statusBreakdown: MarketingStatusBreakdown[];
  recentCampaigns: MarketingRecentCampaign[];
}

export interface InventoryMovementBreakdown {
  type: string;
  count: number;
}

export interface InventoryLowStockItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minStockLimit: number;
}

export interface ReportsInventoryData {
  totalProducts: number;
  totalQuantity: number;
  totalValuation: number;
  lowStockCount: number;
  warehouseCount: number;
  movementBreakdown: InventoryMovementBreakdown[];
  lowStockItems: InventoryLowStockItem[];
}

export interface ReportsData {
  overview: ReportsOverviewData;
  crm: ReportsCrmData;
  marketing: ReportsMarketingData;
  inventory: ReportsInventoryData;
}
