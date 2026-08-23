import { z } from "zod";

// Accepts either a full ISO-8601 datetime ("2026-08-13T10:00:00.000Z") or a
// plain date-only string ("2026-08-13") — the UI's <input type="date"> sends
// the latter, while programmatic callers may send the former.
const flexibleDateString = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), "Düzgün tarix formatı deyil");

// =============================================================================
// AUTH Validations
// =============================================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email tələb olunur")
    .email("Düzgün email formatı daxil edin"),
  password: z
    .string()
    .min(1, "Şifrə tələb olunur")
    .min(6, "Şifrə ən az 6 simvol olmalıdır"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Ad ən az 2 simvol olmalıdır")
      .max(100, "Ad çox uzundur"),
    email: z
      .string()
      .min(1, "Email tələb olunur")
      .email("Düzgün email formatı daxil edin"),
    password: z
      .string()
      .min(8, "Şifrə ən az 8 simvol olmalıdır")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Şifrədə böyük hərf, kiçik hərf və rəqəm olmalıdır"
      ),
    confirmPassword: z.string(),
    companyName: z
      .string()
      .min(2, "Şirkət adı ən az 2 simvol olmalıdır")
      .max(100, "Şirkət adı çox uzundur"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifrələr uyğun gəlmir",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

const passwordSchema = z
  .string()
  .min(8, "Şifrə ən az 8 simvol olmalıdır")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Şifrədə böyük hərf, kiçik hərf və rəqəm olmalıdır"
  );

/** Token-əsaslı (dəvət) qeydiyyat — yalnız şifrə tələb olunur */
export const inviteRegisterSchema = z
  .object({
    token: z.string().min(1, "Dəvət token-i tələb olunur"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifrələr uyğun gəlmir",
    path: ["confirmPassword"],
  });

export type InviteRegisterInput = z.infer<typeof inviteRegisterSchema>;

// =============================================================================
// COMPANY Validations
// =============================================================================

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  website: z.string().url("Düzgün URL daxil edin").optional().or(z.literal("")),
  logo: z.string().url().optional(),
  taxId: z.string().optional().nullable(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// =============================================================================
// DEPARTMENT Validations
// =============================================================================

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(2, "Şöbə adı ən az 2 simvol olmalıdır")
    .max(100, "Şöbə adı çox uzundur"),
  description: z.string().max(500).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Düzgün hex rəng daxil edin").optional(),
  icon: z.string().optional(),
  headUserId: z.string().optional().or(z.null()),
  isDefault: z.boolean().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

// =============================================================================
// DEPARTMENT MEMBER PERMISSION Validations
// =============================================================================

export const permissionKeyEnum = z.enum([
  "CAN_MANAGE_COMPANY", "CAN_INVITE_USER", "CAN_REMOVE_USER", "CAN_VIEW_AUDIT_LOG", "CAN_MANAGE_BILLING",
  "CAN_CREATE_ROLE", "CAN_EDIT_ROLE", "CAN_DELETE_ROLE", "CAN_ASSIGN_ROLE", "CAN_VIEW_ROLES",
  "CAN_CREATE_DEPARTMENT", "CAN_EDIT_DEPARTMENT", "CAN_DELETE_DEPARTMENT", "CAN_VIEW_DEPARTMENTS", "CAN_ASSIGN_DEPARTMENT",
  "CAN_CREATE_PROJECT", "CAN_EDIT_PROJECT", "CAN_DELETE_PROJECT", "CAN_VIEW_PROJECT", "CAN_ARCHIVE_PROJECT",
  "CAN_CHANGE_PROJECT_STATUS", "CAN_ASSIGN_PROJECT_MEMBER",
  "CAN_CREATE_TASK", "CAN_EDIT_TASK", "CAN_DELETE_TASK", "CAN_VIEW_TASK", "CAN_ASSIGN_TASK",
  "CAN_CHANGE_TASK_STATUS", "CAN_SET_TASK_PRIORITY", "CAN_SET_TASK_DEADLINE",
  "CAN_CREATE_SUBTASK", "CAN_EDIT_SUBTASK", "CAN_DELETE_SUBTASK", "CAN_COMPLETE_SUBTASK",
  "CAN_COMMENT", "CAN_EDIT_OWN_COMMENT", "CAN_DELETE_OWN_COMMENT", "CAN_DELETE_ANY_COMMENT",
  "CAN_UPLOAD_FILE", "CAN_DELETE_OWN_FILE", "CAN_DELETE_ANY_FILE", "CAN_VIEW_FILES",
  "CAN_VIEW_REPORTS", "CAN_EXPORT_DATA",
]);

export const grantDepartmentPermissionSchema = z.object({
  userId: z.string().min(1),
  permissionKey: permissionKeyEnum,
  grant: z.boolean(),
});

export type GrantDepartmentPermissionInput = z.infer<typeof grantDepartmentPermissionSchema>;

// =============================================================================
// INVITE Validations
// =============================================================================

export const createInviteSchema = z.object({
  email: z
    .string()
    .min(1, "Email tələb olunur")
    .email("Düzgün email formatı daxil edin"),
  name: z.string().min(1, "Ad tələb olunur").max(100, "Ad çox uzundur"),
  surname: z.string().min(1, "Soyad tələb olunur").max(100, "Soyad çox uzundur"),
  message: z.string().max(1000).optional().or(z.literal("")),
  type: z.enum(["MEMBER", "GUEST"]).default("MEMBER"),
  roleId: z.string().optional().or(z.null()),
  departmentId: z.string().optional().or(z.null()),
  projectIds: z.array(z.string()).optional(),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const acceptInviteSchema = z
  .object({
    name: z
      .string()
      .min(2, "Ad ən az 2 simvol olmalıdır")
      .max(100, "Ad çox uzundur"),
    password: z
      .string()
      .min(8, "Şifrə ən az 8 simvol olmalıdır")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Şifrədə böyük hərf, kiçik hərf və rəqəm olmalıdır"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifrələr uyğun gəlmir",
    path: ["confirmPassword"],
  });

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

// =============================================================================
// ROLE Validations
// =============================================================================

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Rol adı ən az 2 simvol olmalıdır")
    .max(50, "Rol adı çox uzundur"),
  description: z.string().max(300).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  permissionIds: z.array(z.string()).min(1, "Ən az bir icazə seçilməlidir"),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(300).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  permissionIds: z.array(z.string()).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// =============================================================================
// PROJECT Validations
// =============================================================================

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Layihə adı ən az 2 simvol olmalıdır")
    .max(150, "Layihə adı çox uzundur"),
  description: z.string().max(2000).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  category: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.null()),
  endDate: z.string().optional().or(z.null()),
  departmentId: z.string().min(1, "Şöbə seçilməlidir"),
});

export const updateProjectSchema = createProjectSchema.partial();
// Alias for convenience
export const projectSchema = createProjectSchema;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// =============================================================================
// TASK Validations
// =============================================================================

const taskStatusEnum = z.enum([
  "NOT_PLANNED",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "BACKLOG",
  "TODO",
  "IN_REVIEW",
  "CANCELLED",
]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Tapşırıq başlığı tələb olunur")
    .max(300, "Tapşırıq başlığı çox uzundur"),
  description: z.string().max(10000).optional(),
  status: taskStatusEnum.optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: flexibleDateString.optional().or(z.null()),
  startDate: flexibleDateString.optional().or(z.null()),
  estimatedHours: z.number().positive().optional().or(z.null()),
  assigneeId: z.string().optional().or(z.null()),
  observerIds: z.array(z.string()).optional(),
  parentId: z.string().optional().or(z.null()),
  labelIds: z.array(z.string()).optional(),
  projectId: z.string().min(1, "Layihə ID-si tələb olunur"),
});

// Şablondan yaradılan tapşırığa köçürülən struktur sahələr (deep-clone edilir,
// Master TaskTemplate-ə heç bir referans saxlanmır).
export const taskTemplateDataSchema = z.object({
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  estimatedHours: z.coerce.number().positive().max(10000).optional().or(z.null()),
});

export const createTaskTemplateSchema = z.object({
  name: z.string().min(1, "Şablon adı tələb olunur").max(300),
  description: z.string().max(10000).optional().or(z.null()),
  departmentId: z.string().optional().or(z.null()),
  data: taskTemplateDataSchema.optional(),
});

export const updateTaskTemplateSchema = createTaskTemplateSchema.partial();

export type TaskTemplateDataInput = z.infer<typeof taskTemplateDataSchema>;
export type UpdateTaskTemplateInput = z.infer<typeof updateTaskTemplateSchema>;

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });
// Alias
export const taskSchema = createTaskSchema;

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateTaskTemplateInput = z.infer<typeof createTaskTemplateSchema>;

// =============================================================================
// COMMENT Validations
// =============================================================================

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Şərh boş ola bilməz")
    .max(5000, "Şərh çox uzundur"),
  taskId: z.string().min(1),
  parentId: z.string().optional().or(z.null()),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

// =============================================================================
// LABEL Validations
// =============================================================================

export const createLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;

// =============================================================================
// MARKETING Validations
// =============================================================================

export const campaignTypeEnum = z.enum(["EMAIL", "SMS", "WHATSAPP", "INSTAGRAM"]);
export const campaignStatusEnum = z.enum(["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED"]);

const customRecipientSchema = z.object({
  name: z.string().max(150).optional().or(z.literal("")),
  email: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
});

export const createMarketingSegmentSchema = z.object({
  name: z
    .string()
    .min(2, "Seqment adı ən az 2 simvol olmalıdır")
    .max(150, "Seqment adı çox uzundur"),
  filters: z.record(z.string(), z.any()).optional(),
  customerIds: z.array(z.string()).optional(),
  customRecipients: z.array(customRecipientSchema).optional(),
});

export const updateMarketingSegmentSchema = createMarketingSegmentSchema.partial();

export type CreateMarketingSegmentInput = z.infer<typeof createMarketingSegmentSchema>;
export type UpdateMarketingSegmentInput = z.infer<typeof updateMarketingSegmentSchema>;

export const createMarketingCampaignSchema = z.object({
  name: z
    .string()
    .min(2, "Kampaniya adı ən az 2 simvol olmalıdır")
    .max(150, "Kampaniya adı çox uzundur"),
  type: campaignTypeEnum,
  status: campaignStatusEnum.optional(),
  subject: z.string().max(300).optional().or(z.literal("")),
  content: z.string().max(20000).optional().or(z.literal("")),
  segmentId: z.string().optional().or(z.null()),
  scheduledAt: flexibleDateString.optional().or(z.null()).or(z.literal("")),
});

export const updateMarketingCampaignSchema = createMarketingCampaignSchema.partial();

export type CreateMarketingCampaignInput = z.infer<typeof createMarketingCampaignSchema>;
export type UpdateMarketingCampaignInput = z.infer<typeof updateMarketingCampaignSchema>;

// =============================================================================
// WMS (Anbar İdarəetmə Sistemi) Validations
// =============================================================================

export const warehouseTypeEnum = z.enum(["MAIN", "TRANSIT"]);
export const stockMovementTypeEnum = z.enum([
  "INBOUND",
  "OUTBOUND",
  "TRANSFER",
  "ADJUSTMENT",
  "SCRAP",
]);
export const stockMovementStatusEnum = z.enum(["DRAFT", "PENDING", "COMPLETED", "CANCELLED"]);

export const createWarehouseSchema = z.object({
  name: z.string().min(2, "Anbar adı ən az 2 simvol olmalıdır").max(150),
  location: z.string().max(300).optional().or(z.literal("")),
  type: warehouseTypeEnum.optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

export const createWarehouseZoneSchema = z.object({
  warehouseId: z.string().min(1),
  name: z.string().min(1).max(150),
  code: z.string().max(50).optional().or(z.literal("")),
});

export const createWarehouseBinSchema = z.object({
  zoneId: z.string().min(1),
  code: z.string().min(1).max(50),
});

export const createProductSchema = z.object({
  sku: z.string().min(1, "SKU tələb olunur").max(80),
  barcode: z.string().max(80).optional().or(z.literal("")),
  name: z.string().min(1, "Məhsul adı tələb olunur").max(200),
  category: z.string().max(100).optional().or(z.literal("")),
  unit: z.string().max(20).optional(),
  minStockLimit: z.coerce.number().min(0).optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  salesPrice: z.coerce.number().min(0).optional(),
  isTrackedByBatch: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Bir "sənəd" (Stock adjustment / Transfer / Write-off) eyni `reference` altında
// birdən çox StockMovement sətrindən ibarət ola bilər — hamısı bir $transaction-da yaradılır.
export const stockMovementLineSchema = z.object({
  productId: z.string().min(1, "Məhsul seçilməlidir"),
  quantity: z.coerce.number(),
  unitCost: z.coerce.number().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  fromWarehouseId: z.string().optional().or(z.null()),
  toWarehouseId: z.string().optional().or(z.null()),
  fromBinId: z.string().optional().or(z.null()),
  toBinId: z.string().optional().or(z.null()),
  lotNumber: z.string().max(80).optional().or(z.literal("")).or(z.null()),
  expiryDate: flexibleDateString.optional().or(z.null()).or(z.literal("")),
});

export const createStockMovementDocumentSchema = z.object({
  type: stockMovementTypeEnum,
  status: z.enum(["DRAFT", "COMPLETED"]).optional(),
  reference: z.string().max(150).optional().or(z.literal("")),
  comment: z.string().max(2000).optional().or(z.literal("")),
  currency: z.string().max(10).optional(),
  // INBOUND (qəbul) sənədləri üçün mənbə təchizatçı
  supplierId: z.string().optional().or(z.literal("")).or(z.null()),
  lines: z.array(stockMovementLineSchema).min(1, "Ən azı bir məhsul sətri əlavə edilməlidir"),
});

export type StockMovementLineInput = z.infer<typeof stockMovementLineSchema>;
export type CreateStockMovementDocumentInput = z.infer<typeof createStockMovementDocumentSchema>;

export const createSupplierSchema = z.object({
  name: z.string().min(2, "Təchizatçı adı ən az 2 simvol olmalıdır").max(150),
  contactName: z.string().max(150).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email().max(200).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  taxId: z.string().max(50).optional().or(z.literal("")),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

// =============================================================================
// TEMPLATE Validations (Layihə / Dəvət / Rol şablonları)
// =============================================================================

export const templateTypeEnum = z.enum(["PROJECT", "INVITATION", "ROLE"]);

export const createTemplateSchema = z.object({
  type: templateTypeEnum,
  name: z.string().min(2, "Şablon adı ən az 2 simvol olmalıdır").max(150),
  description: z.string().max(2000).optional().or(z.literal("")).or(z.null()),
  data: z.record(z.string(), z.any()).default({}),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(2000).optional().or(z.literal("")).or(z.null()),
  data: z.record(z.string(), z.any()).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

// =============================================================================
// MARKETING TEMPLATE Validations (Email / SMS / WhatsApp məzmun şablonları)
// =============================================================================

export const createMarketingTemplateSchema = z.object({
  name: z.string().min(2, "Şablon adı ən az 2 simvol olmalıdır").max(150),
  type: campaignTypeEnum,
  subject: z.string().max(300).optional().or(z.literal("")),
  content: z.string().max(20000).optional().or(z.literal("")),
});

export const updateMarketingTemplateSchema = createMarketingTemplateSchema.partial();

export type CreateMarketingTemplateInput = z.infer<typeof createMarketingTemplateSchema>;
export type UpdateMarketingTemplateInput = z.infer<typeof updateMarketingTemplateSchema>;

// =============================================================================
// KUSTOMİZASİYA (User Preferences) Validations
// =============================================================================

// Bir "scope" (səhifə/vidjet qrupu) daxilində tək bir elementin görünürlüyünü
// dəyişir, məsələn: { scope: "my-work-dashboard", key: "loggedTime", value: false }
export const updatePreferenceSchema = z.object({
  scope: z.string().min(1).max(100),
  key: z.string().min(1).max(100),
  value: z.boolean(),
});

export type UpdatePreferenceInput = z.infer<typeof updatePreferenceSchema>;

// =============================================================================
// PAGINATION
// =============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// =============================================================================
// CRM Validations (B2B Şirkət / Mərhələ idarəetməsi)
// =============================================================================

export const createCrmCompanySchema = z.object({
  name: z.string().min(1, "Şirkət adı tələb olunur").max(200),
  industry: z.string().max(150).optional().or(z.literal("")).or(z.null()),
  website: z.string().max(300).optional().or(z.literal("")).or(z.null()),
  phone: z.string().max(50).optional().or(z.literal("")).or(z.null()),
  email: z
    .string()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Düzgün email daxil edin")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  address: z.string().max(500).optional().or(z.literal("")).or(z.null()),
});

export const updateCrmCompanySchema = createCrmCompanySchema.partial();

export type CreateCrmCompanyInput = z.infer<typeof createCrmCompanySchema>;
export type UpdateCrmCompanyInput = z.infer<typeof updateCrmCompanySchema>;

export const createCrmStageSchema = z.object({
  name: z.string().min(1, "Mərhələ adı tələb olunur").max(100),
  color: z.string().max(20).optional(),
});

export const updateCrmStageSchema = z.object({
  name: z.string().min(1, "Mərhələ adı tələb olunur").max(100).optional(),
  color: z.string().max(20).optional(),
});

export const reorderCrmStagesSchema = z.object({
  orderedIds: z.array(z.string()).min(1, "Sıralama üçün ən azı bir mərhələ tələb olunur"),
});

export type CreateCrmStageInput = z.infer<typeof createCrmStageSchema>;
export type UpdateCrmStageInput = z.infer<typeof updateCrmStageSchema>;
