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

// =============================================================================
// COMPANY Validations
// =============================================================================

export const updateCompanySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  website: z.string().url("Düzgün URL daxil edin").optional().or(z.literal("")),
  logo: z.string().url().optional(),
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
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Düzgün hex rəng daxil edin").optional(),
  icon: z.string().optional(),
  headUserId: z.string().optional().or(z.null()),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

// =============================================================================
// INVITE Validations
// =============================================================================

export const createInviteSchema = z.object({
  email: z
    .string()
    .min(1, "Email tələb olunur")
    .email("Düzgün email formatı daxil edin"),
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

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Tapşırıq başlığı tələb olunur")
    .max(300, "Tapşırıq başlığı çox uzundur"),
  description: z.string().max(10000).optional(),
  status: z
    .enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: flexibleDateString.optional().or(z.null()),
  startDate: flexibleDateString.optional().or(z.null()),
  estimatedHours: z.number().positive().optional().or(z.null()),
  assigneeId: z.string().optional().or(z.null()),
  parentId: z.string().optional().or(z.null()),
  labelIds: z.array(z.string()).optional(),
  projectId: z.string().min(1, "Layihə ID-si tələb olunur"),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });
// Alias
export const taskSchema = createTaskSchema;

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

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
