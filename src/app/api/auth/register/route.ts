import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { slugify } from "@/lib/utils";

// =============================================================================
// POST /api/auth/register
// Yeni istifadəçi + şirkət qeydiyyatı
// =============================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validasiya
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }

    const { name, email, password, companyName } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Email mövcudluğunu yoxla
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email ünvanı ilə artıq qeydiyyat var" },
        { status: 409 }
      );
    }

    // 3. Şirkət slug-unu unikal et
    let slug = slugify(companyName);
    const slugExists = await prisma.company.findUnique({ where: { slug } });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 4. Şifrəni hash et
    const passwordHash = await bcrypt.hash(password, 12);

    // 5. Transaction: İstifadəçi + Şirkət + Default Rollar + Şöbə
    const result = await prisma.$transaction(async (tx) => {
      // İstifadəçini yarat (şirkətsiz — sonra əlavə olunacaq)
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
        },
      });

      // Şirkəti yarat
      const company = await tx.company.create({
        data: {
          name: companyName.trim(),
          slug,
          ownerId: user.id,
        },
      });

      // Bütün icazələri al
      const allPermissions = await tx.permission.findMany();

      // Super Admin rolunu yarat
      const adminRole = await tx.role.create({
        data: {
          name: "Super Admin",
          description: "Bütün icazələrə sahib sistem administratoru",
          color: "#ef4444",
          isSystem: true,
          companyId: company.id,
          permissions: {
            create: allPermissions.map((p) => ({ permissionId: p.id })),
          },
        },
      });

      // Developer rolunu yarat (default)
      const devPermKeys = [
        "CAN_VIEW_PROJECT", "CAN_VIEW_TASK", "CAN_CREATE_TASK",
        "CAN_EDIT_TASK", "CAN_CHANGE_TASK_STATUS", "CAN_COMMENT",
        "CAN_EDIT_OWN_COMMENT", "CAN_UPLOAD_FILE", "CAN_VIEW_FILES",
        "CAN_CREATE_SUBTASK", "CAN_COMPLETE_SUBTASK", "CAN_VIEW_DEPARTMENTS",
      ];
      const devPerms = allPermissions.filter((p) => devPermKeys.includes(p.key));

      await tx.role.create({
        data: {
          name: "Developer",
          description: "Standart işçi rolu",
          color: "#3b82f6",
          isSystem: true,
          isDefault: true,
          companyId: company.id,
          permissions: {
            create: devPerms.map((p) => ({ permissionId: p.id })),
          },
        },
      });

      // İstifadəçini şirkətə bağla + Super Admin rolunu ver
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          companyId: company.id,
          roleId: adminRole.id,
        },
      });

      return { user: updatedUser, company };
    });

    return NextResponse.json(
      {
        message: "Qeydiyyat uğurla tamamlandı",
        userId: result.user.id,
        companyId: result.company.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Server xətası. Zəhmət olmasa yenidən cəhd edin." },
      { status: 500 }
    );
  }
}
