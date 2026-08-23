import { PrismaClient, PermissionKey } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedDemoOperations, wipeDemoOperations } from "./demo-data-seed";
import {
  DEMO_PASSWORD,
  MODULE_PERMISSIONS,
  ORG_DEPARTMENTS,
  ORG_PEOPLE,
  ORG_ROLE_META,
  PROTECTED_EMAILS,
  permissionsForRole,
  type OrgDeptKey,
  type OrgRoleKey,
} from "./org-structure";

type Db = PrismaClient;

const CORE_PERMISSIONS: {
  key: PermissionKey;
  name: string;
  description: string;
  category: string;
}[] = [
  { key: "CAN_MANAGE_COMPANY", name: "Şirkəti İdarə Et", description: "Şirkətin adını, loqosunu və digər məlumatlarını redaktə edə bilər", category: "COMPANY" },
  { key: "CAN_INVITE_USER", name: "İstifadəçi Dəvət Et", description: "Şirkətə yeni istifadəçi dəvət edə bilər", category: "COMPANY" },
  { key: "CAN_REMOVE_USER", name: "İstifadəçini Çıxar", description: "İstifadəçini şirkətdən çıxara bilər", category: "COMPANY" },
  { key: "CAN_VIEW_AUDIT_LOG", name: "Audit Jurnalını Gör", description: "Sistemdə edilən bütün əməliyyatların tarixçəsini görə bilər", category: "COMPANY" },
  { key: "CAN_MANAGE_BILLING", name: "Ödənişi İdarə Et", description: "Abunəlik planını və ödəniş məlumatlarını idarə edə bilər", category: "COMPANY" },
  { key: "CAN_CREATE_ROLE", name: "Rol Yarat", description: "Şirkət üçün yeni rol yarada bilər", category: "ROLE" },
  { key: "CAN_EDIT_ROLE", name: "Rolu Redaktə Et", description: "Mövcud rolun adını və icazələrini dəyişə bilər", category: "ROLE" },
  { key: "CAN_DELETE_ROLE", name: "Rolu Sil", description: "Mövcud rolu silə bilər", category: "ROLE" },
  { key: "CAN_ASSIGN_ROLE", name: "Rol Mənimsət", description: "İstifadəçilərə rol təyin edə bilər", category: "ROLE" },
  { key: "CAN_VIEW_ROLES", name: "Rolları Gör", description: "Şirkətin bütün rollarını görə bilər", category: "ROLE" },
  { key: "CAN_CREATE_DEPARTMENT", name: "Şöbə Yarat", description: "Şirkət daxilində yeni şöbə yarada bilər", category: "DEPARTMENT" },
  { key: "CAN_EDIT_DEPARTMENT", name: "Şöbəni Redaktə Et", description: "Mövcud şöbənin məlumatlarını dəyişə bilər", category: "DEPARTMENT" },
  { key: "CAN_DELETE_DEPARTMENT", name: "Şöbəni Sil", description: "Mövcud şöbəni silə bilər", category: "DEPARTMENT" },
  { key: "CAN_VIEW_DEPARTMENTS", name: "Şöbələri Gör", description: "Şirkətin bütün şöbələrini görə bilər", category: "DEPARTMENT" },
  { key: "CAN_ASSIGN_DEPARTMENT", name: "Şöbəyə Üzv Əlavə Et", description: "İstifadəçiləri şöbəyə aid edə bilər", category: "DEPARTMENT" },
  { key: "CAN_CREATE_PROJECT", name: "Layihə Yarat", description: "Yeni layihə yarada bilər", category: "PROJECT" },
  { key: "CAN_EDIT_PROJECT", name: "Layihəni Redaktə Et", description: "Layihənin adını, təsvirini və digər məlumatlarını dəyişə bilər", category: "PROJECT" },
  { key: "CAN_DELETE_PROJECT", name: "Layihəni Sil", description: "Layihəni tamamilə silə bilər", category: "PROJECT" },
  { key: "CAN_VIEW_PROJECT", name: "Layihəni Gör", description: "Layihəni və onun detallarını görə bilər", category: "PROJECT" },
  { key: "CAN_ARCHIVE_PROJECT", name: "Layihəni Arxivlə", description: "Layihəni arxivləşdirə bilər", category: "PROJECT" },
  { key: "CAN_CHANGE_PROJECT_STATUS", name: "Layihə Statusunu Dəyiş", description: "Layihənin statusunu dəyişə bilər", category: "PROJECT" },
  { key: "CAN_ASSIGN_PROJECT_MEMBER", name: "Layihəyə Üzv Əlavə Et", description: "Layihəyə üzv əlavə edə və ya çıxara bilər", category: "PROJECT" },
  { key: "CAN_CREATE_TASK", name: "Tapşırıq Yarat", description: "Layihə daxilində yeni tapşırıq yarada bilər", category: "TASK" },
  { key: "CAN_EDIT_TASK", name: "Tapşırığı Redaktə Et", description: "Tapşırığın məlumatlarını dəyişə bilər", category: "TASK" },
  { key: "CAN_DELETE_TASK", name: "Tapşırığı Sil", description: "Tapşırığı tamamilə silə bilər", category: "TASK" },
  { key: "CAN_VIEW_TASK", name: "Tapşırığı Gör", description: "Tapşırığı və onun detallarını görə bilər", category: "TASK" },
  { key: "CAN_ASSIGN_TASK", name: "Tapşırığa İcraçı Təyin Et", description: "Tapşırığa icraçı təyin edə bilər", category: "TASK" },
  { key: "CAN_CHANGE_TASK_STATUS", name: "Tapşırıq Statusunu Dəyiş", description: "Tapşırığın statusunu dəyişə bilər", category: "TASK" },
  { key: "CAN_SET_TASK_PRIORITY", name: "Tapşırıq Prioritetini Təyin Et", description: "Tapşırığın prioritetini təyin edə bilər", category: "TASK" },
  { key: "CAN_SET_TASK_DEADLINE", name: "Son Tarix Təyin Et", description: "Tapşırığın son tarixini təyin edə bilər", category: "TASK" },
  { key: "CAN_CREATE_SUBTASK", name: "Alt Tapşırıq Yarat", description: "Tapşırıq daxilində alt tapşırıq yarada bilər", category: "SUBTASK" },
  { key: "CAN_EDIT_SUBTASK", name: "Alt Tapşırığı Redaktə Et", description: "Alt tapşırığın məlumatlarını dəyişə bilər", category: "SUBTASK" },
  { key: "CAN_DELETE_SUBTASK", name: "Alt Tapşırığı Sil", description: "Alt tapşırığı silə bilər", category: "SUBTASK" },
  { key: "CAN_COMPLETE_SUBTASK", name: "Alt Tapşırığı Tamamla", description: "Alt tapşırığı tamamlandı kimi işarələyə bilər", category: "SUBTASK" },
  { key: "CAN_COMMENT", name: "Şərh Yaz", description: "Tapşırıqlara şərh yaza bilər", category: "COMMENT" },
  { key: "CAN_EDIT_OWN_COMMENT", name: "Öz Şərhini Redaktə Et", description: "Öz yazdığı şərhi redaktə edə bilər", category: "COMMENT" },
  { key: "CAN_DELETE_OWN_COMMENT", name: "Öz Şərhini Sil", description: "Öz yazdığı şərhi silə bilər", category: "COMMENT" },
  { key: "CAN_DELETE_ANY_COMMENT", name: "İstənilən Şərhi Sil", description: "Başqalarının şərhlərini də silə bilər", category: "COMMENT" },
  { key: "CAN_UPLOAD_FILE", name: "Fayl Yüklə", description: "Tapşırıqlara fayl yükləyə bilər", category: "FILE" },
  { key: "CAN_DELETE_OWN_FILE", name: "Öz Faylını Sil", description: "Özünün yüklədiyi faylı silə bilər", category: "FILE" },
  { key: "CAN_DELETE_ANY_FILE", name: "İstənilən Faylı Sil", description: "Başqalarının yüklədikləri faylları da silə bilər", category: "FILE" },
  { key: "CAN_VIEW_FILES", name: "Faylları Gör", description: "Tapşırıqlardakı faylları görə bilər", category: "FILE" },
  { key: "CAN_VIEW_REPORTS", name: "Hesabatları Gör", description: "Layihə və tapşırıq hesabatlarını görə bilər", category: "REPORT" },
  { key: "CAN_EXPORT_DATA", name: "Məlumatları Export Et", description: "Layihə məlumatlarını CSV/Excel formatında export edə bilər", category: "REPORT" },
];

async function ensurePermissions(prisma: Db) {
  const all = [...CORE_PERMISSIONS, ...MODULE_PERMISSIONS];
  for (const perm of all) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { name: perm.name, description: perm.description, category: perm.category },
      create: perm,
    });
  }
  return prisma.permission.findMany();
}

async function wipeTestStaff(prisma: Db, companyId: string, founderId: string) {
  await wipeDemoOperations(prisma, companyId);

  const doomed = await prisma.user.findMany({
    where: {
      companyId,
      email: { notIn: [...PROTECTED_EMAILS] },
    },
    select: { id: true },
  });
  const ids = doomed.map((u) => u.id);

  if (ids.length > 0) {
    await prisma.project.updateMany({ where: { ownerId: { in: ids } }, data: { ownerId: founderId } });
    await prisma.task.updateMany({ where: { createdById: { in: ids } }, data: { createdById: founderId } });
    await prisma.attachment.updateMany({ where: { uploadedById: { in: ids } }, data: { uploadedById: founderId } });
    await prisma.stockMovement.updateMany({ where: { createdById: { in: ids } }, data: { createdById: founderId } });
    await prisma.purchaseOrder.updateMany({ where: { createdById: { in: ids } }, data: { createdById: founderId } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
    await prisma.callSignal.deleteMany({ where: { senderId: { in: ids } } });
    await prisma.call.deleteMany({ where: { callerId: { in: ids } } });
    await prisma.invitation.deleteMany({ where: { invitedById: { in: ids } } });
  }

  await prisma.user.updateMany({
    where: { companyId },
    data: { reportsToId: null, departmentId: null },
  });

  if (ids.length > 0) {
    await prisma.user.updateMany({ where: { id: { in: ids } }, data: { roleId: null } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  await prisma.department.updateMany({
    where: { companyId },
    data: { parentId: null, headUserId: null },
  });
  await prisma.project.updateMany({ where: { companyId }, data: { departmentId: null } });
  await prisma.taskTemplate.updateMany({ where: { companyId }, data: { departmentId: null } });
  await prisma.invitation.updateMany({ where: { companyId }, data: { departmentId: null } });
  await prisma.department.deleteMany({ where: { companyId } });
}

async function syncRolePermissions(
  prisma: Db,
  roleId: string,
  keys: PermissionKey[],
  permByKey: Map<PermissionKey, string>
) {
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  const data = keys
    .map((key) => permByKey.get(key))
    .filter((id): id is string => Boolean(id))
    .map((permissionId) => ({ roleId, permissionId }));
  if (data.length) await prisma.rolePermission.createMany({ data, skipDuplicates: true });
}

export async function seedOrganization(prisma: Db) {
  const allPermissions = await ensurePermissions(prisma);
  const permByKey = new Map(allPermissions.map((p) => [p.key, p.id]));
  const allKeys = allPermissions.map((p) => p.key);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const founderDef = ORG_PEOPLE.find((p) => p.isFounder)!;
  const adminDef = ORG_PEOPLE.find((p) => p.email === "admin@demo.com")!;
  const ceoDef = ORG_PEOPLE.find((p) => p.email === "m.babayev@m-trans.az")!;

  const founder = await prisma.user.upsert({
    where: { email: founderDef.email },
    update: {
      name: founderDef.name,
      jobTitle: founderDef.jobTitle,
      passwordHash,
      isFounder: true,
      orgLevel: founderDef.orgLevel,
      status: "ACTIVE",
    },
    create: {
      email: founderDef.email,
      name: founderDef.name,
      jobTitle: founderDef.jobTitle,
      passwordHash,
      isFounder: true,
      orgLevel: founderDef.orgLevel,
    },
  });

  await prisma.user.upsert({
    where: { email: adminDef.email },
    update: {
      name: adminDef.name,
      jobTitle: adminDef.jobTitle,
      passwordHash,
      orgLevel: adminDef.orgLevel,
      status: "ACTIVE",
    },
    create: {
      email: adminDef.email,
      name: adminDef.name,
      jobTitle: adminDef.jobTitle,
      passwordHash,
      orgLevel: adminDef.orgLevel,
    },
  });

  await prisma.user.upsert({
    where: { email: ceoDef.email },
    update: {
      name: ceoDef.name,
      jobTitle: ceoDef.jobTitle,
      passwordHash,
      orgLevel: ceoDef.orgLevel,
      status: "ACTIVE",
    },
    create: {
      email: ceoDef.email,
      name: ceoDef.name,
      jobTitle: ceoDef.jobTitle,
      passwordHash,
      orgLevel: ceoDef.orgLevel,
    },
  });

  const company = await prisma.company.upsert({
    where: { slug: "demo-company" },
    update: { name: "M-Trans MMC", ownerId: founder.id },
    create: {
      name: "M-Trans MMC",
      slug: "demo-company",
      description: "M-Trans logistika və daşıma şirkəti",
      plan: "ENTERPRISE",
      ownerId: founder.id,
    },
  });

  await prisma.user.updateMany({
    where: { email: { in: [...PROTECTED_EMAILS] } },
    data: { companyId: company.id },
  });

  console.log("🧹 Köhnə test işçiləri və şöbələr silinir...");
  await wipeTestStaff(prisma, company.id, founder.id);

  const roleIdByKey = new Map<OrgRoleKey, string>();
  for (const key of Object.keys(ORG_ROLE_META) as OrgRoleKey[]) {
    const meta = ORG_ROLE_META[key];
    const role = await prisma.role.upsert({
      where: { companyId_name: { companyId: company.id, name: meta.name } },
      update: {
        description: meta.description,
        color: meta.color,
        isSystem: meta.isSystem ?? false,
        isDefault: meta.isDefault ?? false,
      },
      create: {
        name: meta.name,
        description: meta.description,
        color: meta.color,
        isSystem: meta.isSystem ?? false,
        isDefault: meta.isDefault ?? false,
        companyId: company.id,
      },
    });
    await syncRolePermissions(prisma, role.id, permissionsForRole(key, allKeys), permByKey);
    roleIdByKey.set(key, role.id);
  }

  const defaultRoleId = roleIdByKey.get("specialist") ?? null;
  if (defaultRoleId) {
    await prisma.company.update({
      where: { id: company.id },
      data: { defaultMemberRoleId: defaultRoleId },
    });
  }

  const deptIdByKey = new Map<OrgDeptKey, string>();
  for (const dept of ORG_DEPARTMENTS.filter((d) => !d.parentKey)) {
    const created = await prisma.department.create({
      data: {
        name: dept.name,
        code: dept.code,
        description: dept.description,
        color: dept.color,
        icon: dept.icon,
        orgLevel: dept.orgLevel,
        isDefault: dept.key === "board",
        companyId: company.id,
      },
    });
    deptIdByKey.set(dept.key, created.id);
  }
  for (const dept of ORG_DEPARTMENTS.filter((d) => d.parentKey)) {
    const created = await prisma.department.create({
      data: {
        name: dept.name,
        code: dept.code,
        description: dept.description,
        color: dept.color,
        icon: dept.icon,
        orgLevel: dept.orgLevel,
        parentId: deptIdByKey.get(dept.parentKey!) ?? null,
        companyId: company.id,
      },
    });
    deptIdByKey.set(dept.key, created.id);
  }

  const userIdByEmail = new Map<string, string>();
  for (const person of ORG_PEOPLE) {
    const roleId = roleIdByKey.get(person.roleKey);
    const departmentId = deptIdByKey.get(person.deptKey);
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: {
        name: person.name,
        jobTitle: person.jobTitle,
        passwordHash,
        status: "ACTIVE",
        companyId: company.id,
        departmentId: departmentId ?? null,
        roleId: roleId ?? null,
        orgLevel: person.orgLevel,
        isFounder: Boolean(person.isFounder),
        reportsToId: null,
      },
      create: {
        email: person.email,
        name: person.name,
        jobTitle: person.jobTitle,
        passwordHash,
        companyId: company.id,
        departmentId: departmentId ?? null,
        roleId: roleId ?? null,
        orgLevel: person.orgLevel,
        isFounder: Boolean(person.isFounder),
      },
    });
    userIdByEmail.set(person.email, user.id);
  }

  for (const person of ORG_PEOPLE) {
    const id = userIdByEmail.get(person.email);
    if (!id) continue;
    const managerId = person.reportsToEmail ? userIdByEmail.get(person.reportsToEmail) : undefined;
    await prisma.user.update({
      where: { id },
      data: { reportsToId: managerId && managerId !== id ? managerId : null },
    });
    if (person.headOfDeptKey) {
      const deptId = deptIdByKey.get(person.headOfDeptKey);
      if (deptId) {
        await prisma.department.update({
          where: { id: deptId },
          data: { headUserId: id },
        });
      }
    }
  }

  const itmId = deptIdByKey.get("itm");
  const itHead = userIdByEmail.get("elchin.rzayev@m-trans.az");
  if (itmId && itHead) {
    await prisma.department.update({ where: { id: itmId }, data: { headUserId: itHead } });
  }

  const demo = await seedDemoOperations(prisma, {
    companyId: company.id,
    founderId: founder.id,
    userIdByEmail,
    deptIdByKey,
  });

  return {
    companyId: company.id,
    userCount: ORG_PEOPLE.length,
    departmentCount: ORG_DEPARTMENTS.length,
    ...demo,
  };
}
