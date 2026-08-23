"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react" // YENİ: Dil üçün sessiya
import { getTranslation } from "@/lib/i18n" // YENİ: Tərcümə mühərriki
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import {
  MoreVertical,
  Building2,
  Pencil,
  Trash,
  UserCircle,
  Plus,
  Users,
  FolderKanban,
  Lock,
} from "lucide-react"

type CompanyUser = { id: string; name: string; avatar: string | null }

interface DepartmentsClientProps {
  initialData: any[]
  users: CompanyUser[]
  currentUserId: string
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export function DepartmentsClient({
  initialData,
  users,
  currentUserId,
  canCreate,
  canEdit,
  canDelete,
}: DepartmentsClientProps) {
  const { data: session } = useSession()
  const lang = (session?.user as any)?.language || "az"
  const t = getTranslation(lang)

  const [departments, setDepartments] = useState(initialData)

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Create Form
  const [name, setName] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [headUserId, setHeadUserId] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  // Edit Form
  const [editId, setEditId] = useState("")
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("#6366f1")
  const [editHeadUserId, setEditHeadUserId] = useState("")
  const [editIsDefault, setEditIsDefault] = useState(false)

  const router = useRouter()

  const resetCreateForm = () => {
    setName("")
    setColor("#6366f1")
    setHeadUserId("")
    setIsDefault(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, headUserId: headUserId || null, isDefault }),
      })
      if (res.ok) {
        const newDept = await res.json()
        setDepartments([newDept, ...departments])
        setIsCreateOpen(false)
        resetCreateForm()
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || (t("departmentsClient.errorGeneric") || "Xəta baş verdi"))
      }
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (dept: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditId(dept.id)
    setEditName(dept.name)
    setEditColor(dept.color)
    setEditHeadUserId(dept.headUserId || "")
    setEditIsDefault(!!dept.isDefault)
    setIsEditOpen(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/departments/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          color: editColor,
          headUserId: editHeadUserId || null,
          isDefault: editIsDefault,
        }),
      })
      if (res.ok) {
        const updatedDept = await res.json()
        setDepartments(departments.map((d) => (d.id === editId ? updatedDept : d)))
        setIsEditOpen(false)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || (t("departmentsClient.errorGeneric") || "Xəta baş verdi"))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (dept: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dept.isDefault) {
      alert(t("departmentsClient.errorDefaultDelete") || "Sancılmış (default) şöbələr silinə bilməz")
      return
    }
    const confirmMessage = (t("departmentsClient.confirmDelete") || `"{name}" şöbəsini silmək istədiyinizə əminsiniz?`).replace("{name}", dept.name);
    if (!confirm(confirmMessage)) return
    try {
      const res = await fetch(`/api/departments/${dept.id}`, { method: "DELETE" })
      if (res.ok) {
        setDepartments(departments.filter((d) => d.id !== dept.id))
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || (t("departmentsClient.errorDeleteFail") || "Şöbəni silmək mümkün olmadı"))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {(t("departmentsClient.deptCount") || "{count} şöbə").replace("{count}", String(departments.length))} 
          {canCreate ? "" : (t("departmentsClient.superAdminOnly") || "— yeni şöbə yaratmaq yalnız Super Admin üçün mümkündür")}
        </p>

        {canCreate && (
          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetCreateForm() }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                {t("departmentsClient.newDept") || "Yeni Şöbə"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("departmentsClient.newDept") || "Yeni Şöbə"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("departmentsClient.deptName") || "Şöbənin adı"}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("departmentsClient.deptNamePlaceholder") || "Məsələn: Marketing"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">{t("departmentsClient.colorCode") || "Rəng kodu"}</Label>
                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-20 p-1 cursor-pointer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headUser">{t("departmentsClient.deptHead") || "Şöbə Rəhbəri"}</Label>
                  <select
                    id="headUser"
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    value={headUserId}
                    onChange={(e) => setHeadUserId(e.target.value)}
                  >
                    <option value="">{t("departmentsClient.notSelected") || "Seçilməyib"}</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    {t("departmentsClient.makeDefault") || "Sancılmış (default) şöbə et — silinə bilməyəcək"}
                  </span>
                </label>
                <DialogFooter>
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {loading ? (t("departmentsClient.creating") || "Yaradılır...") : (t("departmentsClient.create") || "Yarat")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("departmentsClient.editDeptTitle") || "Şöbəni Redaktə Et"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="editName">{t("departmentsClient.deptName") || "Şöbənin adı"}</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editColor">{t("departmentsClient.colorCode") || "Rəng kodu"}</Label>
              <Input
                id="editColor"
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="h-10 w-20 p-1 cursor-pointer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editHeadUser">{t("departmentsClient.deptHead") || "Şöbə Rəhbəri"}</Label>
              <select
                id="editHeadUser"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={editHeadUserId}
                onChange={(e) => setEditHeadUserId(e.target.value)}
              >
                <option value="">{t("departmentsClient.notSelected") || "Seçilməyib"}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            {canCreate && (
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editIsDefault}
                  onChange={(e) => setEditIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  {t("departmentsClient.isDefaultNote") || "Sancılmış (default) şöbə — silinə bilməyəcək"}
                </span>
              </label>
            )}
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (t("departmentsClient.saving") || "Yadda saxlanılır...") : (t("departmentsClient.save") || "Yadda saxla")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {departments.map((dept) => {
            const isHead = dept.headUserId === currentUserId
            const canManageThis = canEdit || isHead
            const canDeleteThis = canDelete && !dept.isDefault

            return (
              <Link key={dept.id} href={`/dashboard/departments/${dept.id}`} className="block group">
                <div className="card-hover flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  {/* Colored banner (Classroom-style header) */}
                  <div
                    className="relative flex h-32 flex-shrink-0 flex-col justify-between overflow-hidden p-4"
                    style={{ backgroundColor: dept.color }}
                  >
                    <Building2 className="absolute -right-4 -bottom-6 h-28 w-28 text-white/10" />
                    <div className="relative flex items-center justify-between">
                      {dept.isDefault ? (
                        <Badge className="border-white/30 bg-white/20 text-white backdrop-blur-sm gap-1">
                          <Lock className="h-3 w-3" /> {t("departmentsClient.defaultBadge") || "Standart"}
                        </Badge>
                      ) : <span />}

                      {(canManageThis || canDeleteThis) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-white hover:bg-white/20 hover:text-white"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canManageThis && (
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openEditModal(dept, e as any) }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>{t("departmentsClient.editBtn") || "Redaktə et"}</span>
                              </DropdownMenuItem>
                            )}
                            {canDeleteThis && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onSelect={(e) => { e.preventDefault(); handleDelete(dept, e as any) }}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>{t("departmentsClient.deleteBtn") || "Sil"}</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <h3 className="relative line-clamp-2 text-xl font-bold text-white drop-shadow-sm">
                      {dept.name}
                    </h3>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col gap-4 p-4">
                    {dept.head ? (
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarImage src={dept.head.avatar ?? undefined} alt={dept.head.name} />
                          <AvatarFallback>{getInitials(dept.head.name)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm text-muted-foreground">
                          {dept.head.name} <span className="text-xs">{t("departmentsClient.headBadge") || "(Rəhbər)"}</span>
                        </span>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="w-fit gap-1.5 text-muted-foreground">
                        <UserCircle className="h-3 w-3" />
                        {t("departmentsClient.noHead") || "Rəhbər təyin edilməyib"}
                      </Badge>
                    )}

                    {dept.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{dept.description}</p>
                    )}

                    <div className="mt-auto flex items-center gap-4 border-t border-border pt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {(t("departmentsClient.workersCount") || "{count} işçi").replace("{count}", String(dept._count?.users ?? 0))}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FolderKanban className="h-4 w-4" />
                        {(t("departmentsClient.projectsCount") || "{count} layihə").replace("{count}", String(dept._count?.projects ?? 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-medium">{t("departmentsClient.noDeptsTitle") || "Şöbə Yoxdur"}</h3>
          <p className="mb-4 text-sm text-muted-foreground">{t("departmentsClient.noDeptsDesc") || "Hələ heç bir şöbə yaradılmayıb."}</p>
        </div>
      )}
    </div>
  )
}