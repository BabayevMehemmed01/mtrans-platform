import { PrismaClient, PermissionKey } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as path from "path";

// Seed script özü .env faylını yükləyir
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// =============================================================================
// 38 icazənin tam siyahısı — kateqoriyalar ilə
// =============================================================================
const PERMISSIONS: {
  key: PermissionKey;
  name: string;
  description: string;
  category: string;
}[] = [
  // COMPANY
  {
    key: "CAN_MANAGE_COMPANY",
    name: "Şirkəti İdarə Et",
    description: "Şirkətin adını, loqosunu və digər məlumatlarını redaktə edə bilər",
    category: "COMPANY",
  },
  {
    key: "CAN_INVITE_USER",
    name: "İstifadəçi Dəvət Et",
    description: "Şirkətə yeni istifadəçi dəvət edə bilər",
    category: "COMPANY",
  },
  {
    key: "CAN_REMOVE_USER",
    name: "İstifadəçini Çıxar",
    description: "İstifadəçini şirkətdən çıxara bilər",
    category: "COMPANY",
  },
  {
    key: "CAN_VIEW_AUDIT_LOG",
    name: "Audit Jurnalını Gör",
    description: "Sistemdə edilən bütün əməliyyatların tarixçəsini görə bilər",
    category: "COMPANY",
  },
  {
    key: "CAN_MANAGE_BILLING",
    name: "Ödənişi İdarə Et",
    description: "Abunəlik planını və ödəniş məlumatlarını idarə edə bilər",
    category: "COMPANY",
  },

  // ROLE
  {
    key: "CAN_CREATE_ROLE",
    name: "Rol Yarat",
    description: "Şirkət üçün yeni rol yarada bilər",
    category: "ROLE",
  },
  {
    key: "CAN_EDIT_ROLE",
    name: "Rolu Redaktə Et",
    description: "Mövcud rolun adını və icazələrini dəyişə bilər",
    category: "ROLE",
  },
  {
    key: "CAN_DELETE_ROLE",
    name: "Rolu Sil",
    description: "Mövcud rolu silə bilər",
    category: "ROLE",
  },
  {
    key: "CAN_ASSIGN_ROLE",
    name: "Rol Mənimsət",
    description: "İstifadəçilərə rol təyin edə bilər",
    category: "ROLE",
  },
  {
    key: "CAN_VIEW_ROLES",
    name: "Rolları Gör",
    description: "Şirkətin bütün rollarını görə bilər",
    category: "ROLE",
  },

  // DEPARTMENT
  {
    key: "CAN_CREATE_DEPARTMENT",
    name: "Şöbə Yarat",
    description: "Şirkət daxilində yeni şöbə yarada bilər",
    category: "DEPARTMENT",
  },
  {
    key: "CAN_EDIT_DEPARTMENT",
    name: "Şöbəni Redaktə Et",
    description: "Mövcud şöbənin məlumatlarını dəyişə bilər",
    category: "DEPARTMENT",
  },
  {
    key: "CAN_DELETE_DEPARTMENT",
    name: "Şöbəni Sil",
    description: "Mövcud şöbəni silə bilər",
    category: "DEPARTMENT",
  },
  {
    key: "CAN_VIEW_DEPARTMENTS",
    name: "Şöbələri Gör",
    description: "Şirkətin bütün şöbələrini görə bilər",
    category: "DEPARTMENT",
  },
  {
    key: "CAN_ASSIGN_DEPARTMENT",
    name: "Şöbəyə Üzv Əlavə Et",
    description: "İstifadəçiləri şöbəyə aid edə bilər",
    category: "DEPARTMENT",
  },

  // PROJECT
  {
    key: "CAN_CREATE_PROJECT",
    name: "Layihə Yarat",
    description: "Yeni layihə yarada bilər",
    category: "PROJECT",
  },
  {
    key: "CAN_EDIT_PROJECT",
    name: "Layihəni Redaktə Et",
    description: "Layihənin adını, təsvirini və digər məlumatlarını dəyişə bilər",
    category: "PROJECT",
  },
  {
    key: "CAN_DELETE_PROJECT",
    name: "Layihəni Sil",
    description: "Layihəni tamamilə silə bilər",
    category: "PROJECT",
  },
  {
    key: "CAN_VIEW_PROJECT",
    name: "Layihəni Gör",
    description: "Layihəni və onun detallarını görə bilər",
    category: "PROJECT",
  },
  {
    key: "CAN_ARCHIVE_PROJECT",
    name: "Layihəni Arxivlə",
    description: "Layihəni arxivləşdirə bilər",
    category: "PROJECT",
  },
  {
    key: "CAN_CHANGE_PROJECT_STATUS",
    name: "Layihə Statusunu Dəyiş",
    description: "Layihənin statusunu dəyişə bilər (PLANNING, ACTIVE, vb.)",
    category: "PROJECT",
  },
  {
    key: "CAN_ASSIGN_PROJECT_MEMBER",
    name: "Layihəyə Üzv Əlavə Et",
    description: "Layihəyə üzv əlavə edə və ya çıxara bilər",
    category: "PROJECT",
  },

  // TASK
  {
    key: "CAN_CREATE_TASK",
    name: "Tapşırıq Yarat",
    description: "Layihə daxilində yeni tapşırıq yarada bilər",
    category: "TASK",
  },
  {
    key: "CAN_EDIT_TASK",
    name: "Tapşırığı Redaktə Et",
    description: "Tapşırığın məlumatlarını dəyişə bilər",
    category: "TASK",
  },
  {
    key: "CAN_DELETE_TASK",
    name: "Tapşırığı Sil",
    description: "Tapşırığı tamamilə silə bilər",
    category: "TASK",
  },
  {
    key: "CAN_VIEW_TASK",
    name: "Tapşırığı Gör",
    description: "Tapşırığı və onun detallarını görə bilər",
    category: "TASK",
  },
  {
    key: "CAN_ASSIGN_TASK",
    name: "Tapşırığa İcraçı Təyin Et",
    description: "Tapşırığa icraçı (assignee) təyin edə bilər",
    category: "TASK",
  },
  {
    key: "CAN_CHANGE_TASK_STATUS",
    name: "Tapşırıq Statusunu Dəyiş",
    description: "Tapşırığın statusunu dəyişə bilər (TODO, IN_PROGRESS, DONE, vb.)",
    category: "TASK",
  },
  {
    key: "CAN_SET_TASK_PRIORITY",
    name: "Tapşırıq Prioritetini Təyin Et",
    description: "Tapşırığın prioritetini (LOW, MEDIUM, HIGH, URGENT) təyin edə bilər",
    category: "TASK",
  },
  {
    key: "CAN_SET_TASK_DEADLINE",
    name: "Son Tarix Təyin Et",
    description: "Tapşırığın son tarixini (deadline) təyin edə bilər",
    category: "TASK",
  },

  // SUBTASK
  {
    key: "CAN_CREATE_SUBTASK",
    name: "Alt Tapşırıq Yarat",
    description: "Tapşırıq daxilində alt tapşırıq yarada bilər",
    category: "SUBTASK",
  },
  {
    key: "CAN_EDIT_SUBTASK",
    name: "Alt Tapşırığı Redaktə Et",
    description: "Alt tapşırığın məlumatlarını dəyişə bilər",
    category: "SUBTASK",
  },
  {
    key: "CAN_DELETE_SUBTASK",
    name: "Alt Tapşırığı Sil",
    description: "Alt tapşırığı silə bilər",
    category: "SUBTASK",
  },
  {
    key: "CAN_COMPLETE_SUBTASK",
    name: "Alt Tapşırığı Tamamla",
    description: "Alt tapşırığı tamamlandı kimi işarələyə bilər",
    category: "SUBTASK",
  },

  // COMMENT
  {
    key: "CAN_COMMENT",
    name: "Şərh Yaz",
    description: "Tapşırıqlara şərh yaza bilər",
    category: "COMMENT",
  },
  {
    key: "CAN_EDIT_OWN_COMMENT",
    name: "Öz Şərhini Redaktə Et",
    description: "Öz yazdığı şərhi redaktə edə bilər",
    category: "COMMENT",
  },
  {
    key: "CAN_DELETE_OWN_COMMENT",
    name: "Öz Şərhini Sil",
    description: "Öz yazdığı şərhi silə bilər",
    category: "COMMENT",
  },
  {
    key: "CAN_DELETE_ANY_COMMENT",
    name: "İstənilən Şərhi Sil",
    description: "Başqalarının şərhlərini də silə bilər (Moderator)",
    category: "COMMENT",
  },

  // FILE
  {
    key: "CAN_UPLOAD_FILE",
    name: "Fayl Yüklə",
    description: "Tapşırıqlara fayl yükləyə bilər",
    category: "FILE",
  },
  {
    key: "CAN_DELETE_OWN_FILE",
    name: "Öz Faylını Sil",
    description: "Özünün yüklədiyi faylı silə bilər",
    category: "FILE",
  },
  {
    key: "CAN_DELETE_ANY_FILE",
    name: "İstənilən Faylı Sil",
    description: "Başqalarının yüklədikləri faylları da silə bilər",
    category: "FILE",
  },
  {
    key: "CAN_VIEW_FILES",
    name: "Faylları Gör",
    description: "Tapşırıqlardakı faylları görə bilər",
    category: "FILE",
  },

  // REPORT
  {
    key: "CAN_VIEW_REPORTS",
    name: "Hesabatları Gör",
    description: "Layihə və tapşırıq hesabatlarını görə bilər",
    category: "REPORT",
  },
  {
    key: "CAN_EXPORT_DATA",
    name: "Məlumatları Export Et",
    description: "Layihə məlumatlarını CSV/Excel formatında export edə bilər",
    category: "REPORT",
  },
];

async function main() {
  console.log("🌱 Seed başlayır...\n");

  // 1. Bütün icazələri yarat/güncəllə
  console.log("📋 38 icazə yaradılır...");
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { name: perm.name, description: perm.description, category: perm.category },
      create: perm,
    });
  }
  console.log("✅ İcazələr yaradıldı\n");

  // 2. Demo şirkəti yarat
  console.log("🏢 Demo şirkəti yaradılır...");
  const allPermissions = await prisma.permission.findMany();

  // Admin istifadəçisi
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Admin İstifadəçi",
      passwordHash: adminPassword,
      jobTitle: "System Administrator",
    },
  });

  // M-Trans Real Admin
  const realAdmin = await prisma.user.upsert({
    where: { email: "m.babayev@m-trans.az" },
    update: {},
    create: {
      email: "m.babayev@m-trans.az",
      name: "M. Babayev",
      passwordHash: adminPassword,
      jobTitle: "CEO / Founder",
    },
  });

  // Şirkət
  const company = await prisma.company.upsert({
    where: { slug: "demo-company" },
    update: {},
    create: {
      name: "Demo Şirkət MMC",
      slug: "demo-company",
      description: "ERP platformasının demo şirkəti",
      plan: "PROFESSIONAL",
      ownerId: admin.id,
    },
  });

  // Admin-ləri şirkətə bağla
  await prisma.user.update({
    where: { id: admin.id },
    data: { companyId: company.id },
  });
  await prisma.user.update({
    where: { id: realAdmin.id },
    data: { companyId: company.id },
  });

  // 3. Sistem rolları yarat
  console.log("👑 Sistem rolları yaradılır...");

  // Super Admin rolu — bütün icazələr
  const adminRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: "Super Admin" } },
    update: {},
    create: {
      name: "Super Admin",
      description: "Bütün icazələrə sahib sistem administratoru",
      color: "#ef4444",
      isSystem: true,
      isDefault: false,
      companyId: company.id,
      permissions: {
        create: allPermissions.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  // Manager rolu — əksər icazələr (billing xaricində)
  const managerPermKeys: PermissionKey[] = [
    "CAN_INVITE_USER", "CAN_VIEW_AUDIT_LOG", "CAN_VIEW_ROLES",
    "CAN_CREATE_DEPARTMENT", "CAN_EDIT_DEPARTMENT", "CAN_VIEW_DEPARTMENTS", "CAN_ASSIGN_DEPARTMENT",
    "CAN_CREATE_PROJECT", "CAN_EDIT_PROJECT", "CAN_VIEW_PROJECT", "CAN_ARCHIVE_PROJECT",
    "CAN_CHANGE_PROJECT_STATUS", "CAN_ASSIGN_PROJECT_MEMBER",
    "CAN_CREATE_TASK", "CAN_EDIT_TASK", "CAN_DELETE_TASK", "CAN_VIEW_TASK",
    "CAN_ASSIGN_TASK", "CAN_CHANGE_TASK_STATUS", "CAN_SET_TASK_PRIORITY", "CAN_SET_TASK_DEADLINE",
    "CAN_CREATE_SUBTASK", "CAN_EDIT_SUBTASK", "CAN_DELETE_SUBTASK", "CAN_COMPLETE_SUBTASK",
    "CAN_COMMENT", "CAN_EDIT_OWN_COMMENT", "CAN_DELETE_OWN_COMMENT", "CAN_DELETE_ANY_COMMENT",
    "CAN_UPLOAD_FILE", "CAN_DELETE_OWN_FILE", "CAN_DELETE_ANY_FILE", "CAN_VIEW_FILES",
    "CAN_VIEW_REPORTS", "CAN_EXPORT_DATA",
  ];
  const managerPerms = allPermissions.filter((p) => managerPermKeys.includes(p.key));

  const managerRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: "Manager" } },
    update: {},
    create: {
      name: "Manager",
      description: "Layihə və komanda idarəçisi",
      color: "#f59e0b",
      isSystem: true,
      isDefault: false,
      companyId: company.id,
      permissions: {
        create: managerPerms.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  // Developer rolu — standart işçi
  const developerPermKeys: PermissionKey[] = [
    "CAN_VIEW_DEPARTMENTS", "CAN_VIEW_ROLES",
    "CAN_VIEW_PROJECT", "CAN_CREATE_TASK", "CAN_EDIT_TASK", "CAN_VIEW_TASK",
    "CAN_CHANGE_TASK_STATUS", "CAN_SET_TASK_PRIORITY",
    "CAN_CREATE_SUBTASK", "CAN_EDIT_SUBTASK", "CAN_COMPLETE_SUBTASK",
    "CAN_COMMENT", "CAN_EDIT_OWN_COMMENT", "CAN_DELETE_OWN_COMMENT",
    "CAN_UPLOAD_FILE", "CAN_DELETE_OWN_FILE", "CAN_VIEW_FILES",
  ];
  const developerPerms = allPermissions.filter((p) => developerPermKeys.includes(p.key));

  const developerRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: "Developer" } },
    update: {},
    create: {
      name: "Developer",
      description: "Standart işçi rolu",
      color: "#3b82f6",
      isSystem: true,
      isDefault: true, // Yeni üzvlər bu rolla başlar
      companyId: company.id,
      permissions: {
        create: developerPerms.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  // Viewer rolu — yalnız baxış
  const viewerPermKeys: PermissionKey[] = [
    "CAN_VIEW_DEPARTMENTS", "CAN_VIEW_PROJECT", "CAN_VIEW_TASK",
    "CAN_COMMENT", "CAN_VIEW_FILES",
  ];
  const viewerPerms = allPermissions.filter((p) => viewerPermKeys.includes(p.key));

  await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: "Viewer" } },
    update: {},
    create: {
      name: "Viewer",
      description: "Yalnız baxış icazəsi olan istifadəçi",
      color: "#6b7280",
      isSystem: true,
      isDefault: false,
      companyId: company.id,
      permissions: {
        create: viewerPerms.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  console.log("✅ Rollar yaradıldı\n");

  // Admin-lərə Super Admin rolu ver
  await prisma.user.update({
    where: { id: admin.id },
    data: { roleId: adminRole.id },
  });
  await prisma.user.update({
    where: { id: realAdmin.id },
    data: { roleId: adminRole.id },
  });

  // 4. Demo şöbələri
  console.log("🏗️  Demo şöbələri yaradılır...");
  const departments = [
    { name: "İnformasiya Texnologiyaları", color: "#3b82f6", icon: "Monitor" },
    { name: "Logistika", color: "#f59e0b", icon: "Truck" },
    { name: "Maliyyə", color: "#10b981", icon: "DollarSign" },
    { name: "İnsan Resursları", color: "#8b5cf6", icon: "Users" },
  ];

  const createdDepts: Record<string, string> = {};
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { companyId_name: { companyId: company.id, name: dept.name } },
      update: {},
      create: { ...dept, companyId: company.id },
    });
    createdDepts[dept.name] = d.id;
  }
  console.log("✅ Şöbələr yaradıldı\n");

  // 5. Demo istifadəçilər
  console.log("👤 Demo istifadəçilər yaradılır...");
  const memberPassword = await bcrypt.hash("Member@1234", 12);

  const demoUsers = [
    { name: "Əli Həsənov", email: "ali@demo.com", jobTitle: "Senior Developer", deptName: "İnformasiya Texnologiyaları", roleName: "Manager" },
    { name: "Leyla Məmmədova", email: "leyla@demo.com", jobTitle: "Frontend Developer", deptName: "İnformasiya Texnologiyaları", roleName: "Developer" },
    { name: "Nicat Quliyev", email: "nicat@demo.com", jobTitle: "Logistics Manager", deptName: "Logistika", roleName: "Manager" },
    { name: "Günel Əliyeva", email: "gunel@demo.com", jobTitle: "Financial Analyst", deptName: "Maliyyə", roleName: "Developer" },
  ];

  const allRoles = await prisma.role.findMany({ where: { companyId: company.id } });
  const roleMap: Record<string, string> = {};
  for (const r of allRoles) roleMap[r.name] = r.id;

  const createdUsers: string[] = [admin.id, realAdmin.id];
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        passwordHash: memberPassword,
        jobTitle: u.jobTitle,
        companyId: company.id,
        departmentId: createdDepts[u.deptName],
        roleId: roleMap[u.roleName],
      },
    });
    createdUsers.push(user.id);
  }
  console.log("✅ İstifadəçilər yaradıldı\n");

  // 6. Demo layihə
  console.log("📁 Demo layihə yaradılır...");
  const project = await prisma.project.upsert({
    where: { id: "demo-project-001" },
    update: {},
    create: {
      id: "demo-project-001",
      name: "ERP Platform v1.0",
      description: "Şirkətin daxili idarəetmə platformasının ilk versiyası",
      status: "ACTIVE",
      priority: "HIGH",
      category: "Software",
      color: "#6366f1",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      companyId: company.id,
      departmentId: createdDepts["İnformasiya Texnologiyaları"],
      ownerId: admin.id,
      members: {
        create: createdUsers.slice(0, 3).map((userId, idx) => ({
          userId,
          role: idx === 0 ? "OWNER" : "MEMBER",
        })),
      },
    },
  });

  // Demo tapşırıqlar
  const tasks = [
    { title: "Authentication sistemini qur", status: "DONE" as const, priority: "HIGH" as const },
    { title: "Prisma sxemini yaz", status: "DONE" as const, priority: "URGENT" as const },
    { title: "Dashboard UI-nı yarat", status: "IN_PROGRESS" as const, priority: "HIGH" as const },
    { title: "RBAC icazə sistemini tətbiq et", status: "TODO" as const, priority: "HIGH" as const },
    { title: "API endpoint-lərini yaz", status: "TODO" as const, priority: "MEDIUM" as const },
  ];

  for (let i = 0; i < tasks.length; i++) {
    await prisma.task.create({
      data: {
        title: tasks[i].title,
        status: tasks[i].status,
        priority: tasks[i].priority,
        position: i,
        projectId: project.id,
        createdById: admin.id,
        assigneeId: createdUsers[i % createdUsers.length],
      },
    });
  }

  console.log("✅ Demo layihə və tapşırıqlar yaradıldı\n");

  console.log("🎉 Seed tamamlandı!");
  console.log("━".repeat(50));
  console.log("Demo giriş məlumatları:");
  console.log("  Real Admin: m.babayev@m-trans.az / Admin@1234");
  console.log("  Demo Admin: admin@demo.com  / Admin@1234");
  console.log("  Manager: ali@demo.com    / Member@1234");
  console.log("  Dev:     leyla@demo.com  / Member@1234");
  console.log("━".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed xətası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
