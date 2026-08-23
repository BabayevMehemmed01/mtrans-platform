import { MoreVertical, Pencil, Trash, MessageCircle, Building2, ListTodo, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  if (!name) return "US";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
}

// =============================================================================
// <WorkloadBadge /> — Üzvün aktiv tapşırıq sayına görə rəngi dəyişən vidjet.
// 0 = boş (slate), 1-3 = yüngül (yaşıl), 4-6 = orta (kəhrəba), 7+ = ağır (qırmızı).
// =============================================================================
export function WorkloadBadge({ active }: { active: number }) {
  const level =
    active === 0 ? "empty" : active <= 3 ? "light" : active <= 6 ? "medium" : "heavy";
  const styles: Record<string, string> = {
    empty: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    light: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
    heavy: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  };
  const labels: Record<string, string> = {
    empty: "Boş",
    light: "Yüngül yük",
    medium: "Orta yük",
    heavy: "Ağır yük",
  };
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", styles[level])}
      title={labels[level]}
    >
      <ListTodo className="h-3 w-3" />
      {active} aktiv tapşırıq
    </span>
  );
}

export interface MemberCardData {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  jobTitle?: string | null;
  status: string;
  activeTaskCount?: number;
  role?: { name: string } | null;
  department?: { name: string } | null;
}

interface MemberCardProps {
  member: MemberCardData;
  currentUserId?: string;
  canManageMembers: boolean;
  canRemoveUser: boolean;
  onEdit: (member: MemberCardData) => void;
  onDelete: (id: string) => void;
  onChat: (id: string) => void;
  t: (key: string) => string;
}

export function MemberCard({
  member,
  currentUserId,
  canManageMembers,
  canRemoveUser,
  onEdit,
  onDelete,
  onChat,
  t,
}: MemberCardProps) {
  const isYou = member.id === currentUserId;
  const canShowMenu = canManageMembers || (canRemoveUser && !isYou);

  return (
    <Card className="group rounded-2xl shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11 border border-border">
              <AvatarImage src={member.avatar || undefined} />
              <AvatarFallback className="bg-blue-100 font-medium text-blue-700">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {member.name}
                {isYou && <span className="ml-1 text-xs font-normal text-muted-foreground">{t("membersClient.you") || "(Siz)"}</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {member.jobTitle || (member.role ? member.role.name : (t("membersClient.noVezife") || "Vəzifə yoxdur"))}
              </p>
            </div>
          </div>

          {canShowMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t("membersClient.management") || "İdarəetmə"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canManageMembers && (
                  <DropdownMenuItem onSelect={() => onEdit(member)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>{t("membersClient.editBtn") || "Redaktə et"}</span>
                  </DropdownMenuItem>
                )}
                {canRemoveUser && !isYou && (
                  <DropdownMenuItem
                    className="text-red-600 focus:bg-red-50 focus:text-red-700"
                    onSelect={(e) => {
                      e.preventDefault();
                      onDelete(member.id);
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    <span>{t("membersClient.deleteBtn") || "Sil"}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Building2 className="h-3 w-3" />
            {member.department?.name || "-"}
          </span>
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
            {member.status}
          </span>
          <WorkloadBadge active={member.activeTaskCount ?? 0} />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{member.email}</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-blue-50 hover:text-blue-600"
            onClick={() => onChat(member.id)}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
