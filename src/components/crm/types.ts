// =============================================================================
// CRM — Shared Types (Kanban + List views)
// =============================================================================

export type CrmStage = {
  id: string;
  name: string;
  color: string;
  position: number;
};

export type CrmMember = {
  id: string;
  name: string;
  avatar?: string | null;
};

export type CrmCompanyLite = {
  id: string;
  name: string;
};

export type CrmContact = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  crmCompanyId: string | null;
  crmCompany?: CrmCompanyLite | null;
  createdAt: string;
};

export type CrmDeal = {
  id: string;
  title: string;
  value: number;
  currency: string;
  probability: number;
  status: string;
  expectedCloseDate: string | null;
  deadline: string | null;
  clientName: string | null;
  clientCompany: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  createdAt: string;
  stageId: string;
  stage?: CrmStage | null;
  crmContactId: string | null;
  crmContact?: { id: string; firstName: string; lastName: string | null } | null;
  crmCompanyId: string | null;
  crmCompany?: CrmCompanyLite | null;
  assigneeId: string | null;
  assignee?: CrmMember | null;
};
