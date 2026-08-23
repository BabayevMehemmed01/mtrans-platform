"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react" // YENİ: Dil üçün sessiya
import { getTranslation } from "@/lib/i18n" // YENİ: Tərcümə mühərriki
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Shield, Trash, Pencil, Check, Users } from "lucide-react"

// İcazələri kateqoriyaya görə qruplaşdır
function groupByCategory(permissions: any[]) {
  return permissions.reduce((acc: Record<string, any[]>, p) => {
    const cat = p.category || "GENERAL"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})
}

// Kateqoriya adlarını tərcümədən çəkən helper
const getCategoryLabel = (cat: string, t: any) => {
  const map: Record<string, string> = {
    COMPANY: t("rolesClient.catCompany") || "🏢 Şirkət İdarəetməsi",
    ROLE: t("rolesClient.catRole") || "🔐 Rol & İcazə",
    DEPARTMENT: t("rolesClient.catDepartment") || "🏬 Şöbə",
    PROJECT: t("rolesClient.catProject") || "📁 Layihə",
    TASK: t("rolesClient.catTask") || "✅ Tapşırıq",
    SUBTASK: t("rolesClient.catSubtask") || "📋 Alt Tapşırıq",
    COMMENT: t("rolesClient.catComment") || "💬 Şərhlər",
    FILE: t("rolesClient.catFile") || "📎 Fayllar",
    REPORTING: t("rolesClient.catReporting") || "📊 Hesabatlar",
  }
  return map[cat] || cat
}

function PermissionCheckboxGroup({
  permissions,
  selected,
  onChange,
  t, // YENİ
}: {
  permissions: any[]
  selected: string[]
  onChange: (ids: string[]) => void
  t: any
}) {
  const grouped = groupByCategory(permissions)

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const toggleCategory = (catPerms: any[]) => {
    const catIds = catPerms.map((p) => p.id)
    const allSelected = catIds.every((id) => selected.includes(id))
    if (allSelected) {
      onChange(selected.filter((s) => !catIds.includes(s)))
    } else {
      const newIds = [...new Set([...selected, ...catIds])]
      onChange(newIds)
    }
  }

  return (
    <div className="space-y-5 max-h-[420px] overflow-y-auto pr-2">
      {Object.entries(grouped).map(([cat, perms]) => {
        const catIds = (perms as any[]).map((p) => p.id)
        const allChecked = catIds.every((id) => selected.includes(id))
        const someChecked = catIds.some((id) => selected.includes(id))

        return (
          <div key={cat}>
            <div
              className="flex items-center gap-2 mb-2 cursor-pointer group"
              onClick={() => toggleCategory(perms as any[])}
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  allChecked
                    ? "bg-primary border-primary"
                    : someChecked
                    ? "bg-primary/30 border-primary/60"
                    : "border-border group-hover:border-primary/60"
                }`}
              >
                {(allChecked || someChecked) && (
                  <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
                )}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {getCategoryLabel(cat, t)}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {catIds.filter((id) => selected.includes(id)).length}/{catIds.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1 pl-6">
              {(perms as any[]).map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2.5 py-1 cursor-pointer group rounded hover:bg-muted/50 px-2"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      selected.includes(p.id)
                        ? "bg-primary border-primary"
                        : "border-border group-hover:border-primary/60"
                    }`}
                    onClick={() => toggle(p.id)}
                  >
                    {selected.includes(p.id) && (
                      <Check className="w-2 h-2 text-primary-foreground" strokeWidth={3} />
                    )}
                  </div>
                  <span className="text-sm text-foreground">{p.name}</span>
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function RolesClient({
  initialRoles,
  permissions,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: {
  initialRoles: any[]
  permissions: any[]
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}) {
  // YENİ: Dili tapıb tərcümə obyektini formalaşdırırıq
  const { data: session } = useSession()
  const lang = (session?.user as any)?.language || "az"
  const t = getTranslation(lang)

  const [roles, setRoles] = useState(initialRoles)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Create form
  const [name, setName] = useState("")
  const [color, setColor] = useState("#8b5cf6")
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  // Rol şablonları (yalnız yaratma dialoqu açılanda yüklənir)
  const [roleTemplates, setRoleTemplates] = useState<{ id: string; name: string; description: string | null; data: { color?: string; permissionKeys?: string[] } | null }[]>([])
  const [roleTemplateId, setRoleTemplateId] = useState("")

  useEffect(() => {
    if (!isCreateOpen || roleTemplates.length > 0) return
    fetch("/api/templates?type=ROLE")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (Array.isArray(data)) setRoleTemplates(data) })
      .catch(() => {})
  }, [isCreateOpen, roleTemplates.length])

  const applyRoleTemplate = (id: string) => {
    setRoleTemplateId(id)
    const tpl = roleTemplates.find((tp) => tp.id === id)
    if (!tpl?.data) return
    // Klonlama: şablonun `data`sı yeni rola köçürülür, əsas (master) şablon dəyişməz qalır.
    const cloned = JSON.parse(JSON.stringify(tpl.data)) as { color?: string; permissionKeys?: string[] }
    if (cloned.color) setColor(cloned.color)
    if (cloned.permissionKeys) {
      const ids = permissions
        .filter((p: any) => cloned.permissionKeys!.includes(p.key))
        .map((p: any) => p.id)
      setSelectedPerms(ids)
    }
  }

  // Edit form
  const [editId, setEditId] = useState("")
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("#8b5cf6")
  const [editPerms, setEditPerms] = useState<string[]>([])

  const resetCreate = () => {
    setName("")
    setColor("#8b5cf6")
    setSelectedPerms([])
    setRoleTemplateId("")
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, permissionIds: selectedPerms }),
      })
      if (res.ok) {
        const newRole = await res.json()
        setRoles([...roles, newRole])
        setIsCreateOpen(false)
        resetCreate()
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || (t("rolesClient.errorGeneric") || "Xəta baş verdi"))
      }
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (role: any) => {
    setEditId(role.id)
    setEditName(role.name)
    setEditColor(role.color)
    setEditPerms(role.permissions?.map((rp: any) => rp.permission.id) ?? [])
    setIsEditOpen(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/roles/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, color: editColor, permissionIds: editPerms }),
      })
      if (res.ok) {
        const updated = await res.json()
        setRoles(roles.map((r) => (r.id === editId ? updated : r)))
        setIsEditOpen(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, isSystem: boolean) => {
    if (isSystem) {
      alert(t("rolesClient.systemRoleError") || "Sistem rolları silinə bilməz.")
      return
    }
    if (!confirm(t("rolesClient.deleteConfirm") || "Bu rolu silmək istədiyinizə əminsiniz?")) return
    try {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" })
      if (res.ok) {
        setRoles(roles.filter((r) => r.id !== id))
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{t("rolesClient.rolesTitle") || "Rollar"}</h2>
        {canCreate && (
          <Button onClick={() => setIsCreateOpen(true)}>
            {t("rolesClient.newRoleBtn") || "+ Yeni Rol"}
          </Button>
        )}
      </div>

      {/* ──── CREATE MODAL ──── */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetCreate() }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("rolesClient.newRoleTitle") || "Yeni Rol Yarat"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            {roleTemplates.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="roleTemplate">{t("rolesClient.templateLabel") || "Şablondan başla (istəyə bağlı)"}</Label>
                <select
                  id="roleTemplate"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={roleTemplateId}
                  onChange={(e) => applyRoleTemplate(e.target.value)}
                >
                  <option value="">{t("rolesClient.noTemplate") || "Boş başla"}</option>
                  {roleTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                  ))}
                </select>
                {roleTemplateId && roleTemplates.find((tp) => tp.id === roleTemplateId)?.description && (
                  <p className="text-xs text-muted-foreground">
                    {roleTemplates.find((tp) => tp.id === roleTemplateId)?.description}
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="roleName">{t("rolesClient.roleNameLabel") || "Rol adı"}</Label>
                <Input
                  id="roleName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("rolesClient.roleNamePlaceholder") || "Məsələn: Project Manager"}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleColor">{t("rolesClient.colorLabel") || "Rəng"}</Label>
                <Input
                  id="roleColor"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-full p-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("rolesClient.permsLabel") || "İcazələr"}</Label>
              <div className="border border-border rounded-xl p-4">
                <PermissionCheckboxGroup
                  permissions={permissions}
                  selected={selectedPerms}
                  onChange={setSelectedPerms}
                  t={t} // YENİ: Tərcümə
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {(t("rolesClient.selectedPerms") || "{count} icazə seçildi").replace("{count}", String(selectedPerms.length))}
              </p>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (t("rolesClient.creatingBtn") || "Yaradılır...") : (t("rolesClient.createBtn") || "Rolu Yarat")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──── EDIT MODAL ──── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("rolesClient.editRoleTitle") || "Rolu Redaktə Et"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="editRoleName">{t("rolesClient.roleNameLabel") || "Rol adı"}</Label>
                <Input
                  id="editRoleName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRoleColor">{t("rolesClient.colorLabel") || "Rəng"}</Label>
                <Input
                  id="editRoleColor"
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="h-10 w-full p-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("rolesClient.permsLabel") || "İcazələr"}</Label>
              <div className="border border-border rounded-xl p-4">
                <PermissionCheckboxGroup
                  permissions={permissions}
                  selected={editPerms}
                  onChange={setEditPerms}
                  t={t} // YENİ: Tərcümə
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {(t("rolesClient.selectedPerms") || "{count} icazə seçildi").replace("{count}", String(editPerms.length))}
              </p>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (t("rolesClient.savingBtn") || "Yadda saxlanılır...") : (t("rolesClient.saveBtn") || "Yadda saxla")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──── TABLE ──── */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("rolesClient.thRole") || "Rol"}</TableHead>
            <TableHead>{t("rolesClient.thPermCount") || "İcazə sayı"}</TableHead>
            <TableHead>{t("rolesClient.thUserCount") || "İstifadəçi sayı"}</TableHead>
            <TableHead>{t("rolesClient.thType") || "Növ"}</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${role.color}20`, color: role.color }}
                  >
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{role.name}</p>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {(t("rolesClient.permCountBadge") || "{count} icazə").replace("{count}", String(role.permissions?.length ?? 0))}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm">{role._count?.users ?? 0}</span>
                </div>
              </TableCell>
              <TableCell>
                {role.isSystem ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                    {t("rolesClient.typeSystem") || "Sistem"}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {t("rolesClient.typeCustom") || "Xüsusi"}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {(canEdit || (canDelete && !role.isSystem)) ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEdit && (
                        <DropdownMenuItem onSelect={() => openEdit(role)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>{t("rolesClient.editPermsMenu") || "İcazələri redaktə et"}</span>
                        </DropdownMenuItem>
                      )}
                      {canDelete && !role.isSystem && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => {
                            e.preventDefault()
                            handleDelete(role.id, role.isSystem)
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>{t("rolesClient.deleteMenu") || "Sil"}</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}