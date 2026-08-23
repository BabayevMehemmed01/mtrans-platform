import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { hasPermission, isSuperAdmin, isDepartmentHead, PermissionError, assertCanMutatePrincipal } from "@/lib/permissions";
import { isPrivilegedInviteRoleName } from "@/lib/invite-rbac";

// =============================================================================
// PATCH /api/members/[id] — Üzv məlumatlarını redaktə et
// TƏHLÜKƏSİZLİK: Sahə-səviyyəli RBAC — hər dəyişən sahə üçün ayrıca icazə tələb
// olunur (rol → CAN_ASSIGN_ROLE, şöbə → CAN_ASSIGN_DEPARTMENT/şöbə rəhbəri,
// status → CAN_REMOVE_USER). Əvvəllər YALNIZ sessiya mövcudluğu və eyni
// şirkətə aidiyyət yoxlanılırdı — istənilən işçi istənilən başqa işçinin
// rolunu/şöbəsini dəyişə bilirdi. İndi hər əməliyyat granular icazə ilə qorunur.
// =============================================================================
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId;
    const callerId = session.user.id;

    const userToUpdate = await prisma.user.findFirst({
      where: { id, companyId },
      include: {
        company: { select: { ownerId: true } },
      },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: "Üzv tapılmadı" }, { status: 404 });
    }

    const body = await req.json();
    const { name, departmentId, roleId, jobTitle, status } = body;

    const isSelf = callerId === id;
    const callerIsSuperAdmin = await isSuperAdmin(callerId);

    await assertCanMutatePrincipal(callerId, id, "privilege");

    // Şirkət sahibinin məlumatlarını yalnız özü və ya digər Super Admin dəyişə bilər
    if (userToUpdate.id === userToUpdate.company?.ownerId && !isSelf && !callerIsSuperAdmin) {
      throw new PermissionError("Şirkət sahibinin məlumatlarını dəyişmək üçün icazəniz yoxdur");
    }

    // --- Rol dəyişikliyi ---
    const nextRoleId = roleId === "" ? null : roleId;
    if (roleId !== undefined && nextRoleId !== userToUpdate.roleId && !isSelf) {
      const canAssignRole = callerIsSuperAdmin || (await hasPermission(callerId, "CAN_ASSIGN_ROLE"));
      if (!canAssignRole) {
        throw new PermissionError("İstifadəçiyə rol təyin etmək üçün icazəniz yoxdur");
      }
      if (nextRoleId) {
        const targetRole = await prisma.role.findFirst({
          where: { id: nextRoleId, companyId },
          select: { name: true },
        });
        if (!targetRole) return NextResponse.json({ error: "Rol tapılmadı" }, { status: 400 });
        if (!callerIsSuperAdmin && isPrivilegedInviteRoleName(targetRole.name)) {
          throw new PermissionError("Super Admin/Founder rolunu yalnız Super Admin təyin edə bilər");
        }
      }
    }

    // --- Şöbə dəyişikliyi ---
    const nextDepartmentId = departmentId === "" ? null : departmentId;
    if (departmentId !== undefined && nextDepartmentId !== userToUpdate.departmentId && !isSelf) {
      const canAssignDepartment =
        callerIsSuperAdmin ||
        (await hasPermission(callerId, "CAN_ASSIGN_DEPARTMENT")) ||
        (userToUpdate.departmentId ? await isDepartmentHead(callerId, userToUpdate.departmentId) : false);
      if (!canAssignDepartment) {
        throw new PermissionError("İstifadəçini şöbəyə təyin etmək üçün icazəniz yoxdur");
      }
    }

    // --- Status dəyişikliyi (aktiv/bloklanmış) — faktiki "kənarlaşdırma" gücündədir ---
    if (status !== undefined && status !== userToUpdate.status && !isSelf) {
      const canChangeStatus = callerIsSuperAdmin || (await hasPermission(callerId, "CAN_REMOVE_USER"));
      if (!canChangeStatus) {
        throw new PermissionError("İstifadəçi statusunu dəyişmək üçün icazəniz yoxdur");
      }
    }

    // --- Ümumi profil sahələri (ad, vəzifə) ---
    if ((name !== undefined || jobTitle !== undefined) && !isSelf) {
      const canManageMembers =
        callerIsSuperAdmin ||
        (await hasPermission(callerId, "CAN_ASSIGN_ROLE")) ||
        (await hasPermission(callerId, "CAN_ASSIGN_DEPARTMENT")) ||
        (await hasPermission(callerId, "CAN_REMOVE_USER")) ||
        (await hasPermission(callerId, "CAN_INVITE_USER"));
      if (!canManageMembers) {
        throw new PermissionError("Bu istifadəçini redaktə etmək üçün icazəniz yoxdur");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(departmentId !== undefined && { departmentId: nextDepartmentId }),
        ...(roleId !== undefined && { roleId: nextRoleId }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(status && { status }),
      },
      include: {
        department: { select: { id: true, name: true, color: true } },
        role: { select: { id: true, name: true, color: true } },
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "USER",
      entityId: updatedUser.id,
      entityName: updatedUser.name,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[PATCH /api/members/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

// =============================================================================
// DELETE /api/members/[id] — Üzvü şirkətdən sil
// TƏHLÜKƏSİZLİK: CAN_REMOVE_USER icazəsi (və ya Super Admin) tələb olunur.
// Şirkət sahibi silinə bilməz. Yalnız Super Admin başqa Super Admin-i silə bilər.
// =============================================================================
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId;
    const callerId = session.user.id;

    if (id === callerId) {
      return NextResponse.json({ error: "Özünüzü silə bilməzsiniz" }, { status: 400 });
    }

    await assertCanMutatePrincipal(callerId, id, "delete");

    const member = await prisma.user.findFirst({
      where: { id, companyId },
      include: { company: { select: { ownerId: true } } },
    });

    if (!member) {
      return NextResponse.json({ error: "Üzv tapılmadı" }, { status: 404 });
    }

    if (member.id === member.company?.ownerId) {
      throw new PermissionError("Şirkət sahibini sistemdən silmək mümkün deyil");
    }

    const callerIsSuperAdmin = await isSuperAdmin(callerId);
    const canRemove = callerIsSuperAdmin || (await hasPermission(callerId, "CAN_REMOVE_USER"));
    if (!canRemove) {
      throw new PermissionError("İstifadəçini silmək üçün icazəniz yoxdur");
    }

    // Əlavə qoruma: Super Admin səlahiyyətli istifadəçini yalnız başqa Super Admin silə bilər
    if (!callerIsSuperAdmin && (await isSuperAdmin(member.id))) {
      throw new PermissionError("Super Admin istifadəçisini silmək üçün icazəniz yoxdur");
    }

    // Şirkətdən kənarlaşdırmaq üçün companyId-ni null etmək və ya birbaşa silmək olar.
    // Biz tam silirik ki, sistemdən silinsin (əgər çoxlu şirkətə aidiyyəti yoxdursa).
    await prisma.user.delete({
      where: { id },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "DELETE",
      entityType: "USER",
      entityId: member.id,
      entityName: member.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[DELETE /api/members/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
