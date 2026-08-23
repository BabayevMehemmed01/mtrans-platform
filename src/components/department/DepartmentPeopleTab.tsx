"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react"; // YENİ: Sessiyadan dil üçün
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə mühərriki
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Mail, ShieldCheck, Shield } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface PermissionRow {
  id: string;
  key: string;
  name: string;
  category: string;
}

interface RoleRow {
  id: string;
  name: string;
  color: string;
  permissions: { permission: { key: string } }[];
}

interface MemberRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  jobTitle: string | null;
  status: string;
  role: { id: string; name: string; color: string } | null;
  extraPermissions: { permission: { key: string; name: string; category: string } }[];
}

interface DepartmentPeopleTabProps {
  departmentId: string;
  members: MemberRow[];
  allPermissions: PermissionRow[];
  roles: RoleRow[];
  canManage: boolean;
  canInvite: boolean;
  currentUserId: string;
}

function groupByCategory(permissions: PermissionRow[]) {
  return permissions.reduce((acc: Record<string, PermissionRow[]>, p) => {
    const cat = p.category || "GENERAL";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});
}

// Kateqoriya adlarını tərcümədən alan helper funksiyası
const getCategoryLabel = (cat: string, t: any) => {
  const map: Record<string, string> = {
    COMPANY: t("departmentPeopleTab.catCompany") || "🏢 Şirkət İdarəetməsi",
    ROLE: t("departmentPeopleTab.catRole") || "🔐 Rol & İcazə",
    DEPARTMENT: t("departmentPeopleTab.catDepartment") || "🏬 Şöbə",
    PROJECT: t("departmentPeopleTab.catProject") || "📁 Layihə",
    TASK: t("departmentPeopleTab.catTask") || "✅ Tapşırıq",
    SUBTASK: t("departmentPeopleTab.catSubtask") || "📋 Alt Tapşırıq",
    COMMENT: t("departmentPeopleTab.catComment") || "💬 Şərhlər",
    FILE: t("departmentPeopleTab.catFile") || "📎 Fayllar",
    REPORT: t("departmentPeopleTab.catReport") || "📊 Hesabatlar",
  };
  return map[cat] ?? cat;
};

function PermissionsDialog({
  departmentId,
  member,
  allPermissions,
  roles,
  open,
  onOpenChange,
  t, // YENİ: Tərcümə obyekti
}: {
  departmentId: string;
  member: MemberRow;
  allPermissions: PermissionRow[];
  roles: RoleRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: any;
}) {
  const [extraKeys, setExtraKeys] = useState<Set<string>>(
    new Set(member.extraPermissions.map((e) => e.permission.key))
  );
  const [pending, setPending] = useState<string | null>(null);

  const roleKeys = useMemo(() => {
    const role = roles.find((r) => r.id === member.role?.id);
    return new Set(role?.permissions.map((p) => p.permission.key) ?? []);
  }, [roles, member.role]);

  const grouped = groupByCategory(allPermissions);

  const toggle = async (key: string, nextChecked: boolean) => {
    setPending(key);
    // Optimistic update
    setExtraKeys((prev) => {
      const next = new Set(prev);
      if (nextChecked) next.add(key);
      else next.delete(key);
      return next;
    });
    try {
      const res = await fetch(`/api/departments/${departmentId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id, permissionKey: key, grant: nextChecked }),
      });
      if (!res.ok) {
        // revert on failure
        setExtraKeys((prev) => {
          const next = new Set(prev);
          if (nextChecked) next.delete(key);
          else next.add(key);
          return next;
        });
        const data = await res.json().catch(() => ({}));
        alert(data.error || (t("departmentPeopleTab.errorGeneric") || "Xəta baş verdi"));
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {(t("departmentPeopleTab.permTitle") || "{name} — Fərdi İcazələr").replace("{name}", member.name)}
          </DialogTitle>
          <DialogDescription>
            {t("departmentPeopleTab.permDesc") || "Rolun verdiyi icazələr üstündən əlavə olaraq, bu istifadəçiyə spesifik icazələr verin."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {Object.entries(grouped).map(([category, perms]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                {getCategoryLabel(category, t)}
              </p>
              <div className="space-y-2">
                {perms.map((perm) => {
                  const fromRole = roleKeys.has(perm.key as any);
                  const fromExtra = extraKeys.has(perm.key);
                  return (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{perm.name}</p>
                        {fromRole && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Shield className="w-3 h-3" /> {t("departmentPeopleTab.hasByRole") || "Rol vasitəsilə artıq var"}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={fromRole || fromExtra}
                        disabled={fromRole || pending === perm.key}
                        onCheckedChange={(checked) => toggle(perm.key, checked)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DepartmentPeopleTab({
  departmentId,
  members,
  allPermissions,
  roles,
  canManage,
  canInvite,
  currentUserId,
}: DepartmentPeopleTabProps) {
  // YENİ: Dili tapırıq və tərcümə obyektini (t) formalaşdırırıq
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [loading, setLoading] = useState(false);
  const [permissionsMember, setPermissionsMember] = useState<MemberRow | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setLoading(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          type: "MEMBER",
          departmentId,
          roleId: inviteRoleId || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsInviteOpen(false);
        setInviteEmail("");
        setInviteRoleId("");
      } else {
        setInviteError(data.error || (t("departmentPeopleTab.errorGeneric") || "Xəta baş verdi"));
      }
    } catch {
      setInviteError(t("departmentPeopleTab.networkError") || "Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {(t("departmentPeopleTab.workerCount") || "{count} işçi bu şöbəyə aiddir").replace("{count}", String(members.length))}
        </p>
        {canInvite && (
          <Dialog open={isInviteOpen} onOpenChange={(open) => { setIsInviteOpen(open); if (!open) { setInviteError(""); } }}>
            <DialogTrigger asChild>
              <Button>
                <Mail className="w-4 h-4 mr-2" /> {t("departmentPeopleTab.inviteBtn") || "Şöbəyə Dəvət Et"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("departmentPeopleTab.inviteTitle") || "Şöbəyə Yeni Üzv Dəvət Et"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4 mt-4">
                {inviteError && (
                  <div className="px-3 py-2 rounded-md bg-red-50 text-red-600 text-sm border border-red-200">
                    {inviteError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="deptInviteEmail">{t("departmentPeopleTab.emailLabel") || "Email"}</Label>
                  <Input
                    id="deptInviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t("departmentPeopleTab.emailPlaceholder") || "ad@sirket.com"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deptInviteRole">{t("departmentPeopleTab.roleLabel") || "Rol"}</Label>
                  <select
                    id="deptInviteRole"
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    value={inviteRoleId}
                    onChange={(e) => setInviteRoleId(e.target.value)}
                  >
                    <option value="">{t("departmentPeopleTab.standardRole") || "Standart rol"}</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? (t("departmentPeopleTab.sending") || "Göndərilir...") : (t("departmentPeopleTab.sendInvite") || "Dəvət Göndər")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>{t("departmentPeopleTab.thMember") || "Üzv"}</TableHead>
              <TableHead>{t("departmentPeopleTab.thRole") || "Rol"}</TableHead>
              <TableHead>{t("departmentPeopleTab.thPerms") || "Fərdi İcazələr"}</TableHead>
              {canManage && <TableHead className="w-[160px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatar || undefined} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {member.name} {member.id === currentUserId && <span className="text-xs text-muted-foreground">{t("departmentPeopleTab.you") || "(Siz)"}</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">{member.jobTitle || member.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {member.role ? (
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-sm">{member.role.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {member.extraPermissions.length > 0 ? (
                    <span className="text-xs font-medium text-blue-600">
                      {(t("departmentPeopleTab.extraPerms") || "+{count} əlavə icazə").replace("{count}", String(member.extraPermissions.length))}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setPermissionsMember(member)}>
                      <Shield className="w-3.5 h-3.5 mr-1.5" /> {t("departmentPeopleTab.permsBtn") || "İcazələr"}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={canManage ? 4 : 3} className="text-center text-sm text-muted-foreground py-8">
                  {t("departmentPeopleTab.emptyMembers") || "Bu şöbədə hələ heç bir işçi yoxdur"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {permissionsMember && (
        <PermissionsDialog
          departmentId={departmentId}
          member={permissionsMember}
          allPermissions={allPermissions}
          roles={roles}
          open={!!permissionsMember}
          onOpenChange={(open) => { if (!open) setPermissionsMember(null); }}
          t={t} // YENİ: Tərcümə obyektini Modal-a ötürürük
        />
      )}
    </div>
  );
}