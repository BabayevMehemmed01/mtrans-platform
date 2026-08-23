"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n";  // YENİ
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreVertical, Trash, UserPlus, ShieldAlert, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProjectMemberExt {
  projectId: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface ProjectMembersClientProps {
  projectId: string;
  projectMembers: ProjectMemberExt[];
  companyUsers: any[];
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0,2);
}

export function ProjectMembersClient({
  projectId,
  projectMembers,
  companyUsers,
}: ProjectMembersClientProps) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [members, setMembers] = useState(projectMembers);
  const [loading, setLoading] = useState(false);
  const [inviteMode, setInviteMode] = useState<"INDIVIDUAL" | "DEPARTMENT">("INDIVIDUAL");
  
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedRole, setSelectedRole] = useState("MEMBER");
  
  const router = useRouter();

  const availableUsers = useMemo(() => {
    return companyUsers.filter((u) => !members.some((m) => m.userId === u.id));
  }, [companyUsers, members]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Map();
    companyUsers.forEach(u => {
      if (u.department) depts.set(u.department.id, u.department);
    });
    return Array.from(depts.values());
  }, [companyUsers]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (inviteMode === "INDIVIDUAL") {
        if (!selectedUserId) return;
        const res = await fetch(`/api/projects/${projectId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
        });
        if (res.ok) {
          const newMember = await res.json();
          setMembers([...members, newMember]);
          setSelectedUserId("");
        }
      } 
      else if (inviteMode === "DEPARTMENT") {
        if (!selectedDeptId) return;
        const usersToInvite = availableUsers.filter(u => u.department?.id === selectedDeptId);
        
        if (usersToInvite.length === 0) {
          alert(t("projectMembers.alertDeptDone") || "Bu şöbənin bütün işçiləri artıq layihəyə əlavə edilib!");
          setLoading(false);
          return;
        }

        const promises = usersToInvite.map(u => 
          fetch(`/api/projects/${projectId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: u.id, role: selectedRole }),
          }).then(r => r.json())
        );

        const newMembers = await Promise.all(promises);
        setMembers([...members, ...newMembers]);
        setSelectedDeptId("");
        
        const successMsg = t("projectMembers.alertSuccess") || "{count} nəfər şöbə işçisi uğurla layihəyə əlavə edildi!";
        alert(successMsg.replace("{count}", String(usersToInvite.length)));
      }
      
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(t("projectMembers.alertError") || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(t("projectMembers.confirmRemove") || "Bu istifadəçini layihədən çıxarmaq istədiyinizə əminsiniz?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setMembers(members.filter((m) => m.userId !== userId));
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Rol adını göstərmək üçün helper
  const getRoleLabel = (roleStr: string) => {
    switch (roleStr) {
      case 'OWNER': return t("projectMembers.roleOwner") || "Sahib (Owner)";
      case 'MANAGER': return t("projectMembers.roleManager") || "Menecer (Manager)";
      case 'VIEWER': return t("projectMembers.roleViewer") || "İzləyici (Viewer)";
      default: return t("projectMembers.roleMember") || "Üzv (Member)";
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 overflow-auto h-full">
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col xl:flex-row xl:items-start justify-between gap-6">
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              {inviteMode === "INDIVIDUAL" ? <UserPlus className="w-6 h-6 text-primary" /> : <Users className="w-6 h-6 text-primary" />}
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-foreground">{t("projectMembers.addMemberTitle")}</h3>
              <p className="text-[12px] font-medium text-muted-foreground">{t("projectMembers.addMemberDesc")}</p>
            </div>
          </div>

          <div className="flex bg-muted p-1 rounded-lg w-fit border border-border">
            <button
              onClick={() => setInviteMode("INDIVIDUAL")}
              className={cn("px-4 py-1.5 text-[12px] font-bold rounded-md transition-all", inviteMode === "INDIVIDUAL" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {t("projectMembers.individualSelect")}
            </button>
            <button
              onClick={() => setInviteMode("DEPARTMENT")}
              className={cn("px-4 py-1.5 text-[12px] font-bold rounded-md transition-all", inviteMode === "DEPARTMENT" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {t("projectMembers.departmentSelect")}
            </button>
          </div>
        </div>

        <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
          {inviteMode === "INDIVIDUAL" ? (
            <div className="w-full sm:w-64 space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">{t("projectMembers.selectWorker")}</label>
              <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v ?? "")}>
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue placeholder={t("projectMembers.selectWorkerPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} {u.department ? `(${u.department.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="w-full sm:w-64 space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">{t("projectMembers.selectDepartment")}</label>
              <Select value={selectedDeptId} onValueChange={(v) => setSelectedDeptId(v ?? "")}>
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue placeholder={t("projectMembers.selectDepartmentPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {uniqueDepartments.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="w-full sm:w-40 space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">{t("projectMembers.permissionRole")}</label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v ?? "MEMBER")}>
              <SelectTrigger className="h-11 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">{t("projectMembers.roleOwner")}</SelectItem>
                <SelectItem value="MANAGER">{t("projectMembers.roleManager")}</SelectItem>
                <SelectItem value="MEMBER">{t("projectMembers.roleMember")}</SelectItem>
                <SelectItem value="VIEWER">{t("projectMembers.roleViewer")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            disabled={loading || (inviteMode === "INDIVIDUAL" ? !selectedUserId : !selectedDeptId)} 
            className="h-11 font-bold px-8 shadow-sm rounded-xl w-full sm:w-auto"
          >
            {loading ? t("projectMembers.waitBtn") : t("projectMembers.addBtn")}
          </Button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-muted/50 border-b border-border px-6 py-3 flex items-center gap-3">
          <div className="flex-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t("projectMembers.tableMemberInfo")}</div>
          <div className="w-40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">{t("projectMembers.tableRole")}</div>
          <div className="w-16 flex-shrink-0 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t("projectMembers.tableAction")}</div>
        </div>

        <Table>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.userId} className="hover:bg-accent/50 transition-colors border-b border-border last:border-0">
                <TableCell className="px-6 py-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 border border-border shadow-sm">
                      <AvatarImage src={member.user.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {getInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-[14px] text-foreground">{member.user.name}</span>
                      <span className="text-[12px] font-medium text-muted-foreground">{member.user.email}</span>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="w-40 px-6 py-3 text-center">
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    member.role === 'OWNER' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/40' :
                    member.role === 'MANAGER' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40' :
                    member.role === 'VIEWER' ? 'bg-muted text-muted-foreground border-border' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40'
                  }`}>
                    {member.role === 'OWNER' && <ShieldAlert className="w-3 h-3 mr-1" />}
                    {getRoleLabel(member.role)}
                  </span>
                </TableCell>

                <TableCell className="w-16 px-6 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg font-medium text-[13px]" 
                        onSelect={(e) => {
                          e.preventDefault();
                          handleRemoveMember(member.userId);
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        <span>{t("projectMembers.removeMember")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <UserPlus className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-[14px] font-medium">{t("projectMembers.noMembersTitle")}</p>
                    <p className="text-[12px]">{t("projectMembers.noMembersDesc")}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}