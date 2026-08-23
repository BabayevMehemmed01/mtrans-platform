"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Pencil, Check, X, Lock, UserCircle, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ

interface DepartmentHeaderProps {
  department: {
    id: string;
    name: string;
    color: string;
    description: string | null;
    isDefault: boolean;
    head: { id: string; name: string; avatar: string | null; email: string } | null;
    _count: { users: number; projects: number };
  };
  canEditDescription: boolean;
  canEditFull: boolean;
  canDelete: boolean;
  isSuperAdmin: boolean;
}

export function DepartmentHeader({
  department,
  canEditDescription,
  canDelete,
}: DepartmentHeaderProps) {
  const router = useRouter();
  
  // YENİ: Tərcüməni qoşuruq
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(department.description ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/departments/${department.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || (t("departmentHeader.errorGeneric") || "Xəta baş verdi"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmMsg = (t("departmentHeader.confirmDelete") || `"{name}" şöbəsini silmək istədiyinizə əminsiniz?`).replace("{name}", department.name);
    if (!confirm(confirmMsg)) return;
    const res = await fetch(`/api/departments/${department.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard/departments");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || (t("departmentHeader.deleteError") || "Şöbəni silmək mümkün olmadı"));
    }
  };

  return (
    <div className="flex-shrink-0">
      <div
        className="relative flex flex-col justify-between overflow-hidden p-6"
        style={{ backgroundColor: department.color }}
      >
        <Building2 className="absolute -right-6 -bottom-10 h-40 w-40 text-white/10" />

        <div className="relative flex items-center justify-between mb-4">
          <Link
            href="/dashboard/departments"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t("departmentHeader.departmentsLink") || "Şöbələr"}
          </Link>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-white/80 hover:text-white hover:bg-white/20"
            >
              <Trash className="w-4 h-4 mr-1.5" /> {t("departmentHeader.deleteBtn") || "Sil"}
            </Button>
          )}
        </div>

        <div className="relative flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-white drop-shadow-sm">{department.name}</h1>
          {department.isDefault && (
            <Badge className="border-white/30 bg-white/20 text-white backdrop-blur-sm gap-1">
              <Lock className="h-3 w-3" /> {t("departmentHeader.defaultBadge") || "Default"}
            </Badge>
          )}
        </div>

        <div className="relative flex items-center gap-4 text-sm text-white/85">
          {department.head ? (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage src={department.head.avatar ?? undefined} alt={department.head.name} />
                <AvatarFallback>{getInitials(department.head.name)}</AvatarFallback>
              </Avatar>
              <span>{department.head.name} {t("departmentHeader.headBadge") || "(Rəhbər)"}</span>
            </div>
          ) : (
            <span className="flex items-center gap-1.5">
              <UserCircle className="w-4 h-4" /> {t("departmentHeader.noHead") || "Rəhbər təyin edilməyib"}
            </span>
          )}
          <span>·</span>
          <span>{(t("departmentHeader.workers") || "{count} işçi").replace("{count}", String(department._count.users))}</span>
          <span>·</span>
          <span>{(t("departmentHeader.projects") || "{count} layihə").replace("{count}", String(department._count.projects))}</span>
        </div>
      </div>

      {/* Editable description strip */}
      <div className="border-b border-border bg-card px-6 py-4">
        {editing ? (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t("departmentHeader.descPlaceholder") || "Bu şöbənin əsas məqsədini və fəaliyyət sahəsini yazın..."}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Check className="w-3.5 h-3.5 mr-1" /> {saving ? (t("departmentHeader.saving") || "Yadda saxlanılır...") : (t("departmentHeader.save") || "Yadda saxla")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEditing(false); setDescription(department.description ?? ""); }}
              >
                <X className="w-3.5 h-3.5 mr-1" /> {t("departmentHeader.cancel") || "Ləğv et"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4 group">
            <p className="text-sm text-muted-foreground flex-1">
              {department.description || (
                <span className="italic text-muted-foreground/60">
                  {t("departmentHeader.noDesc") || "Bu şöbənin əsas məqsədi/təsviri hələ əlavə edilməyib."}
                </span>
              )}
            </p>
            {canEditDescription && (
              <button
                onClick={() => setEditing(true)}
                className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-all"
                title={t("departmentHeader.editDescTitle") || "Təsviri redaktə et"}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}