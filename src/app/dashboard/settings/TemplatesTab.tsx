"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FolderKanban,
  Mail,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TemplateType = "PROJECT" | "INVITATION" | "ROLE";

type Permission = { id: string; key: string; name: string; category: string };

interface TemplateRow {
  id: string;
  type: TemplateType;
  name: string;
  description: string | null;
  data: Record<string, any>;
  isSystem: boolean;
}

const COLOR_PRESETS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#14b8a6", "#f59e0b", "#64748b",
];

const TYPE_META: Record<TemplateType, { label: string; icon: typeof FolderKanban; desc: string }> = {
  PROJECT: { label: "Layihə Şablonları", icon: FolderKanban, desc: "Yeni layihə yaradarkən istifadə oluna bilən başlanğıc dəstlər." },
  INVITATION: { label: "Dəvət Şablonları", icon: Mail, desc: "Komanda üzvü/qonaq dəvət edərkən istifadə olunan hazır mesaj şablonları." },
  ROLE: { label: "Rol Şablonları", icon: ShieldCheck, desc: "Yeni rol yaradarkən başlanğıc icazə dəsti təklif edən şablonlar." },
};

function groupByCategory(permissions: Permission[]) {
  return permissions.reduce((acc: Record<string, Permission[]>, p) => {
    const cat = p.category || "GENERAL";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});
}

function PermissionKeyCheckboxGroup({
  permissions,
  selectedKeys,
  onChange,
}: {
  permissions: Permission[];
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
}) {
  const grouped = groupByCategory(permissions);

  const toggle = (key: string) => {
    onChange(selectedKeys.includes(key) ? selectedKeys.filter((k) => k !== key) : [...selectedKeys, key]);
  };

  const toggleCategory = (perms: Permission[]) => {
    const keys = perms.map((p) => p.key);
    const allSelected = keys.every((k) => selectedKeys.includes(k));
    onChange(allSelected ? selectedKeys.filter((k) => !keys.includes(k)) : [...new Set([...selectedKeys, ...keys])]);
  };

  return (
    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
      {Object.entries(grouped).map(([cat, perms]) => {
        const keys = perms.map((p) => p.key);
        const allChecked = keys.every((k) => selectedKeys.includes(k));
        const someChecked = keys.some((k) => selectedKeys.includes(k));
        return (
          <div key={cat} className="bg-muted/50 p-3 rounded-xl border border-border">
            <div className="flex items-center gap-2.5 mb-2 cursor-pointer group" onClick={() => toggleCategory(perms)}>
              <Checkbox checked={allChecked ? true : someChecked ? "indeterminate" : false} className="pointer-events-none size-4 rounded" />
              <span className="text-[13px] font-bold text-foreground">{cat}</span>
              <span className="text-[11px] font-bold text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border ml-auto">
                {keys.filter((k) => selectedKeys.includes(k)).length}/{keys.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-6">
              {perms.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-1 cursor-pointer rounded-lg hover:bg-card px-1.5 transition-colors">
                  <Checkbox checked={selectedKeys.includes(p.key)} onCheckedChange={() => toggle(p.key)} />
                  <span className="text-[12.5px] font-medium text-muted-foreground">{p.name}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const emptyForm = {
  name: "",
  description: "",
  status: "PLANNING",
  priority: "MEDIUM",
  color: "#6366f1",
  inviteType: "MEMBER",
  message: "",
  permissionKeys: [] as string[],
};

export function TemplatesTab({ permissions }: { permissions: Permission[] }) {
  const [activeType, setActiveType] = useState<TemplateType>("PROJECT");
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/templates")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setTemplates(data);
      })
      .catch(() => toast.error("Şablonlar yüklənə bilmədi"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleTemplates = useMemo(
    () => templates.filter((tpl) => tpl.type === activeType),
    [templates, activeType]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (tpl: TemplateRow) => {
    setEditingId(tpl.id);
    setForm({
      name: tpl.name,
      description: tpl.description ?? "",
      status: tpl.data?.status ?? "PLANNING",
      priority: tpl.data?.priority ?? "MEDIUM",
      color: tpl.data?.color ?? "#6366f1",
      inviteType: tpl.data?.inviteType ?? "MEMBER",
      message: tpl.data?.message ?? "",
      permissionKeys: tpl.data?.permissionKeys ?? [],
    });
    setDialogOpen(true);
  };

  const buildData = (): Record<string, any> => {
    switch (activeType) {
      case "PROJECT":
        return { status: form.status, priority: form.priority, color: form.color };
      case "INVITATION":
        return { inviteType: form.inviteType, message: form.message };
      case "ROLE":
        return { color: form.color, permissionKeys: form.permissionKeys };
      default:
        return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Şablon adı tələb olunur");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: activeType,
        name: form.name.trim(),
        description: form.description || null,
        data: buildData(),
      };
      const url = editingId ? `/api/templates/${editingId}` : "/api/templates";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Xəta baş verdi");
        return;
      }
      setTemplates((prev) =>
        editingId ? prev.map((t) => (t.id === editingId ? data : t)) : [...prev, data]
      );
      toast.success(editingId ? "Şablon yeniləndi" : "Şablon yaradıldı");
      setDialogOpen(false);
    } catch {
      toast.error("Şəbəkə xətası");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tpl: TemplateRow) => {
    if (tpl.isSystem) {
      toast.error("Standart (default) şablonlar silinə bilməz, lakin redaktə edilə bilər");
      return;
    }
    if (!confirm(`"${tpl.name}" şablonunu silmək istədiyinizə əminsiniz?`)) return;
    try {
      const res = await fetch(`/api/templates/${tpl.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Silinmədi");
        return;
      }
      setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
      toast.success("Şablon silindi");
    } catch {
      toast.error("Şəbəkə xətası");
    }
  };

  const meta = TYPE_META[activeType];

  return (
    <div className="space-y-6">
      {/* Növ seçimi */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_META) as TemplateType[]).map((type) => {
          const m = TYPE_META[type];
          const Icon = m.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[13px] font-bold transition-all",
                activeType === type
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[13px] font-medium text-muted-foreground max-w-lg">{meta.desc}</p>
        <Button onClick={openCreate} className="gap-1.5 rounded-xl font-bold">
          <Plus className="w-4 h-4" /> Yeni Şablon
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Yüklənir...
        </div>
      ) : visibleTemplates.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground font-medium text-sm">
          Bu kateqoriyada hələ şablon yoxdur.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tpl.data?.color || "#6366f1" }}
                  />
                  <h4 className="text-[14px] font-bold text-foreground truncate">{tpl.name}</h4>
                </div>
                {tpl.isSystem && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 px-2 py-0.5 rounded-full flex-shrink-0">
                    <Lock className="w-2.5 h-2.5" /> Standart
                  </span>
                )}
              </div>
              {tpl.description && (
                <p className="text-[12.5px] text-muted-foreground line-clamp-2">{tpl.description}</p>
              )}

              {tpl.type === "PROJECT" && (
                <div className="flex gap-1.5 flex-wrap">
                  {tpl.data?.status && <Badge>{tpl.data.status}</Badge>}
                  {tpl.data?.priority && <Badge>{tpl.data.priority}</Badge>}
                </div>
              )}
              {tpl.type === "INVITATION" && (
                <div className="flex gap-1.5 flex-wrap">
                  <Badge>{tpl.data?.inviteType === "GUEST" ? "Qonaq" : "Üzv"}</Badge>
                </div>
              )}
              {tpl.type === "ROLE" && (
                <div className="flex gap-1.5 flex-wrap">
                  <Badge>{(tpl.data?.permissionKeys?.length ?? 0)} icazə</Badge>
                </div>
              )}

              <div className="mt-auto pt-2 border-t border-border flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(tpl)} title="Redaktə et">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(tpl)}
                  disabled={tpl.isSystem}
                  className="text-destructive hover:text-destructive disabled:opacity-30"
                  title={tpl.isSystem ? "Standart şablon silinə bilməz" : "Sil"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Şablonu Redaktə Et" : `Yeni ${meta.label.replace(" Şablonları", " Şablonu")}`}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Dəyişikliklər yalnız bu şablona aiddir — bu şablon əsasında əvvəllər yaradılmış elementlərə təsir etməz."
                : "Bu şablon istifadəyə hazır olacaq və istənilən vaxt yenidən redaktə edilə bilər."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Şablon adı</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Təsvir</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Bu şablonun nə üçün istifadə olunduğunu qısaca izah edin..."
              />
            </div>

            {activeType === "PROJECT" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => v && setForm((p) => ({ ...p, status: v }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLANNING">Planlanır</SelectItem>
                        <SelectItem value="ACTIVE">Aktiv</SelectItem>
                        <SelectItem value="ON_HOLD">Dayandırılıb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioritet</Label>
                    <Select value={form.priority} onValueChange={(v) => v && setForm((p) => ({ ...p, priority: v }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Aşağı</SelectItem>
                        <SelectItem value="MEDIUM">Orta</SelectItem>
                        <SelectItem value="HIGH">Yüksək</SelectItem>
                        <SelectItem value="URGENT">Təcili</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ColorPicker value={form.color} onChange={(color) => setForm((p) => ({ ...p, color }))} />
              </>
            )}

            {activeType === "INVITATION" && (
              <>
                <div className="space-y-2">
                  <Label>Dəvət növü</Label>
                  <Select value={form.inviteType} onValueChange={(v) => v && setForm((p) => ({ ...p, inviteType: v }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Üzv (Member)</SelectItem>
                      <SelectItem value="GUEST">Qonaq (Guest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dəvət mesajı</Label>
                  <Textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Dəvət e-poçtunda göndəriləcək mətn..."
                  />
                </div>
              </>
            )}

            {activeType === "ROLE" && (
              <>
                <ColorPicker value={form.color} onChange={(color) => setForm((p) => ({ ...p, color }))} />
                <div className="space-y-2">
                  <Label>Başlanğıc icazələr ({form.permissionKeys.length} seçilib)</Label>
                  <div className="border border-border rounded-xl p-3">
                    <PermissionKeyCheckboxGroup
                      permissions={permissions}
                      selectedKeys={form.permissionKeys}
                      onChange={(keys) => setForm((p) => ({ ...p, permissionKeys: keys }))}
                    />
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="submit" disabled={saving} className="font-bold">
                {saving ? "Yadda saxlanılır..." : editingId ? "Yadda saxla" : "Şablonu yarat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] font-bold uppercase tracking-wide bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
      {children}
    </span>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>Rəng</Label>
      <div className="flex items-center gap-2 flex-wrap">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              outline: value === color ? `2px solid ${color}` : undefined,
              outlineOffset: "2px",
            }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-lg cursor-pointer border border-border p-0.5"
        />
      </div>
    </div>
  );
}
