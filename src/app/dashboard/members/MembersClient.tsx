"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreVertical, Shield, Trash, Pencil, Mail, RefreshCw, XCircle, Users, Clock } from "lucide-react"

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
}

function InviteStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    ACCEPTED: "bg-green-100 text-green-700",
    EXPIRED: "bg-slate-100 text-slate-600",
    REVOKED: "bg-red-100 text-red-700",
  }
  const labels: Record<string, string> = {
    PENDING: "Gözləyir",
    ACCEPTED: "Qəbul edilib",
    EXPIRED: "Vaxtı bitib",
    REVOKED: "Ləğv edilib",
  }
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[status] ?? status}
    </span>
  )
}

export function MembersClient({
  initialData,
  departments,
  roles,
  projects,
  initialInvites,
}: {
  initialData: any[]
  departments: any[]
  roles: any[]
  projects: any[]
  initialInvites: any[]
}) {
  const [members, setMembers] = useState(initialData)
  const [invites, setInvites] = useState(initialInvites)

  // Dialog States
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviteError, setInviteError] = useState("")

  // Invite Form
  const [inviteType, setInviteType] = useState<"MEMBER" | "GUEST">("MEMBER")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteDepartmentId, setInviteDepartmentId] = useState("")
  const [inviteRoleId, setInviteRoleId] = useState("")
  const [inviteProjectIds, setInviteProjectIds] = useState<string[]>([])

  // Edit Form
  const [editId, setEditId] = useState("")
  const [editName, setEditName] = useState("")
  const [editDepartmentId, setEditDepartmentId] = useState("")
  const [editRoleId, setEditRoleId] = useState("")

  const router = useRouter()

  const resetInviteForm = () => {
    setInviteType("MEMBER")
    setInviteEmail("")
    setInviteDepartmentId("")
    setInviteRoleId("")
    setInviteProjectIds([])
    setInviteError("")
  }

  const toggleInviteProject = (projectId: string) => {
    setInviteProjectIds(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    )
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError("")
    setLoading(true)
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          type: inviteType,
          departmentId: inviteDepartmentId || null,
          roleId: inviteRoleId || null,
          projectIds: inviteType === "GUEST" ? inviteProjectIds : [],
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setInvites([data, ...invites])
        setIsInviteOpen(false)
        resetInviteForm()
        router.refresh()
      } else {
        setInviteError(data.error || "Xəta baş verdi")
      }
    } catch (e) {
      setInviteError("Şəbəkə xətası. Yenidən cəhd edin.")
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (member: any) => {
    setEditId(member.id)
    setEditName(member.name)
    setEditDepartmentId(member.departmentId || "")
    setEditRoleId(member.roleId || "")
    setIsEditOpen(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/members/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          departmentId: editDepartmentId,
          roleId: editRoleId
        }),
      })
      if (res.ok) {
        const updatedMember = await res.json()
        setMembers(members.map(m => m.id === editId ? updatedMember : m))
        setIsEditOpen(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu istifadəçini silmək istədiyinizə əminsiniz?")) return
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" })
      if (res.ok) {
        setMembers(members.filter(m => m.id !== id))
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || "Məlumatı silmək mümkün olmadı")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleResendInvite = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/invites/${id}`, { method: "PATCH" })
      const data = await res.json()
      if (res.ok) {
        setInvites(invites.map(i => i.id === id ? data : i))
        router.refresh()
      } else {
        alert(data.error || "Dəvəti yenidən göndərmək mümkün olmadı")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeInvite = async (id: string) => {
    if (!confirm("Bu dəvəti ləğv etmək istədiyinizə əminsiniz?")) return
    try {
      const res = await fetch(`/api/invites/${id}`, { method: "DELETE" })
      if (res.ok) {
        setInvites(invites.map(i => i.id === id ? { ...i, status: "REVOKED" } : i))
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || "Dəvəti ləğv etmək mümkün olmadı")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const pendingInvites = invites.filter(i => i.status === "PENDING" || i.status === "EXPIRED")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Komanda</h2>

        <Dialog open={isInviteOpen} onOpenChange={(open) => { setIsInviteOpen(open); if (!open) resetInviteForm() }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Mail className="w-4 h-4 mr-2" />
              Dəvət Göndər
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Dəvət Göndər</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 mt-4">
              {inviteError && (
                <div className="px-3 py-2 rounded-md bg-red-50 text-red-600 text-sm border border-red-200">
                  {inviteError}
                </div>
              )}

              <div className="space-y-2">
                <Label>Dəvət Növü</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInviteType("MEMBER")}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      inviteType === "MEMBER"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))]"
                    }`}
                  >
                    Üzv (Member)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteType("GUEST")}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      inviteType === "GUEST"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))]"
                    }`}
                  >
                    Qonaq (Guest)
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {inviteType === "GUEST"
                    ? "Qonaqlar yalnız seçilmiş layihələrə baxa bilər (VIEWER)."
                    : "Üzvlər şirkətin adi işçisi kimi qoşulur."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="ad@sirket.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dept">Şöbə</Label>
                  <select
                    id="dept"
                    className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                    value={inviteDepartmentId}
                    onChange={(e) => setInviteDepartmentId(e.target.value)}
                  >
                    <option value="">Seçin</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <select
                    id="role"
                    className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                    value={inviteRoleId}
                    onChange={(e) => setInviteRoleId(e.target.value)}
                  >
                    <option value="">Standart rol</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {inviteType === "GUEST" && (
                <div className="space-y-2">
                  <Label>Layihələr</Label>
                  <div className="max-h-40 overflow-y-auto rounded-md border border-[hsl(var(--input))] p-2 space-y-1">
                    {projects.length === 0 && (
                      <p className="text-xs text-muted-foreground px-1 py-1">Heç bir layihə tapılmadı</p>
                    )}
                    {projects.map(p => (
                      <label key={p.id} className="flex items-center gap-2 px-1 py-1 text-sm rounded hover:bg-[hsl(var(--muted))] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inviteProjectIds.includes(p.id)}
                          onChange={() => toggleInviteProject(p.id)}
                          className="h-4 w-4 rounded border-[hsl(var(--input))]"
                        />
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Qonaq yalnız seçilmiş layihələri görə biləcək.</p>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? "Göndərilir..." : "Dəvət Göndər"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Məlumatları Redaktə Et</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Ad və Soyad</Label>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editDept">Şöbə</Label>
                <select
                  id="editDept"
                  className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(e.target.value)}
                >
                  <option value="">Seçin</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Rol</Label>
                <select
                  id="editRole"
                  className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                >
                  <option value="">Seçin</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "Yadda saxlanılır..." : "Yadda saxla"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="w-4 h-4" />
            Aktiv Üzvlər ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invites" className="gap-1.5">
            <Clock className="w-4 h-4" />
            Dəvətlər ({pendingInvites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İstifadəçi</TableHead>
                <TableHead>Şöbə</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
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
                        <span className="font-medium text-sm">{member.name}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">{member.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.department ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                        {member.department.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {member.role ? (
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-sm">{member.role.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {member.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEditModal(member)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Redaktə et</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onSelect={(e) => {
                            e.preventDefault()
                            handleDelete(member.id)
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Sil</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    Hələ heç bir üzv yoxdur
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="invites">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Növ</TableHead>
                <TableHead>Şöbə / Rol</TableHead>
                <TableHead>Dəvət edən</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium text-sm">{invite.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                      {invite.type === "GUEST" ? "Qonaq" : "Üzv"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invite.department?.name || "-"} {invite.role ? `/ ${invite.role.name}` : ""}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{invite.invitedBy?.name || "-"}</TableCell>
                  <TableCell>
                    <InviteStatusBadge status={invite.status} />
                  </TableCell>
                  <TableCell>
                    {(invite.status === "PENDING" || invite.status === "EXPIRED") && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Yenidən göndər"
                          onClick={() => handleResendInvite(invite.id)}
                        >
                          <RefreshCw className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        </Button>
                        {invite.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="Ləğv et"
                            onClick={() => handleRevokeInvite(invite.id)}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {invites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    Hələ heç bir dəvət göndərilməyib
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  )
}
