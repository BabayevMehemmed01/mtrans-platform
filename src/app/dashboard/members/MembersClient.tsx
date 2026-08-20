"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react" // YENİ
import { getTranslation } from "@/lib/i18n" // YENİ
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogDescription
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MoreVertical, Shield, Trash, Pencil, Mail, RefreshCw, XCircle, 
  Users, Clock, Search, MessageCircle, ShieldCheck 
} from "lucide-react"

function getInitials(name: string) {
  if (!name) return "US"
  return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
}

function InviteStatusBadge({ status, t }: { status: string; t: any }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    ACCEPTED: "bg-green-100 text-green-700",
    EXPIRED: "bg-slate-100 text-slate-600",
    REVOKED: "bg-red-100 text-red-700",
  }
  const labels: Record<string, string> = {
    PENDING: t("membersClient.statusPending") || "Gözləyir",
    ACCEPTED: t("membersClient.statusAccepted") || "Qəbul edilib",
    EXPIRED: t("membersClient.statusExpired") || "Vaxtı bitib",
    REVOKED: t("membersClient.statusRevoked") || "Ləğv edilib",
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
  // YENİ: Dili tapıb tərcümə obyektini formalaşdırırıq
  const { data: session } = useSession()
  const lang = (session?.user as any)?.language || "az"
  const t = getTranslation(lang)
  const currentUserId = (session?.user as any)?.id

  const [members, setMembers] = useState(initialData)
  const [invites, setInvites] = useState(initialInvites)
  const [searchTerm, setSearchTerm] = useState("")

  // Dialog States
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviteError, setInviteError] = useState("")

  // Invite Form
  const [inviteType, setInviteType] = useState<"MEMBER" | "GUEST">("MEMBER")
  const [inviteName, setInviteName] = useState("")
  const [inviteSurname, setInviteSurname] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteDepartmentId, setInviteDepartmentId] = useState("")
  const [inviteRoleId, setInviteRoleId] = useState("")
  const [inviteMessage, setInviteMessage] = useState(t("membersClient.inviteMessageDefault") || "Sizi WorkSpace ERP sistemində komandamıza qoşulmağa dəvət edirik!")
  const [inviteProjectIds, setInviteProjectIds] = useState<string[]>([])

  // Edit Form
  const [editId, setEditId] = useState("")
  const [editName, setEditName] = useState("")
  const [editDepartmentId, setEditDepartmentId] = useState("")
  const [editRoleId, setEditRoleId] = useState("")

  const router = useRouter()

  // Axtarış və Sıralama (Rəhbərlər öndə)
  const filteredAndSortedMembers = useMemo(() => {
    let result = members;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(lowerSearch)) ||
          (m.email && m.email.toLowerCase().includes(lowerSearch)) ||
          (m.jobTitle && m.jobTitle.toLowerCase().includes(lowerSearch)) ||
          (m.department?.name && m.department.name.toLowerCase().includes(lowerSearch))
      );
    }
    result.sort((a, b) => {
      const aIsHead = a.jobTitle?.toLowerCase().includes("rəhbər") || a.role?.name?.toLowerCase().includes("rəhbər") || a.jobTitle?.toLowerCase().includes("head") ? 1 : 0;
      const bIsHead = b.jobTitle?.toLowerCase().includes("rəhbər") || b.role?.name?.toLowerCase().includes("rəhbər") || b.jobTitle?.toLowerCase().includes("head") ? 1 : 0;
      if (bIsHead === aIsHead) return (a.name || "").localeCompare(b.name || "");
      return bIsHead - aIsHead; 
    });
    return result;
  }, [members, searchTerm]);

  const resetInviteForm = () => {
    setInviteType("MEMBER")
    setInviteName("")
    setInviteSurname("")
    setInviteEmail("")
    setInviteDepartmentId("")
    setInviteRoleId("")
    setInviteMessage(t("membersClient.inviteMessageDefault") || "Sizi WorkSpace ERP sistemində komandamıza qoşulmağa dəvət edirik!")
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
          name: inviteName,
          surname: inviteSurname,
          email: inviteEmail,
          message: inviteMessage,
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
        setInviteError(data.error || (t("membersClient.errorGeneric") || "Xəta baş verdi"))
      }
    } catch (e) {
      setInviteError(t("membersClient.networkError") || "Şəbəkə xətası. Yenidən cəhd edin.")
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
    if (!confirm(t("membersClient.deleteConfirm") || "Bu istifadəçini silmək istədiyinizə əminsiniz?")) return
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" })
      if (res.ok) {
        setMembers(members.filter(m => m.id !== id))
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || (t("membersClient.deleteFail") || "Məlumatı silmək mümkün olmadı"))
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
        alert(data.error || (t("membersClient.resendFail") || "Dəvəti yenidən göndərmək mümkün olmadı"))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeInvite = async (id: string) => {
    if (!confirm(t("membersClient.revokeConfirm") || "Bu dəvəti ləğv etmək istədiyinizə əminsiniz?")) return
    try {
      const res = await fetch(`/api/invites/${id}`, { method: "DELETE" })
      if (res.ok) {
        setInvites(invites.map(i => i.id === id ? { ...i, status: "REVOKED" } : i))
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || (t("membersClient.revokeFail") || "Dəvəti ləğv etmək mümkün olmadı"))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const pendingInvites = invites.filter(i => i.status === "PENDING" || i.status === "EXPIRED")

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Axtarış Qutusu */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("membersClient.searchPlaceholder") || "Ada, vəzifəyə və ya şöbəyə görə axtar..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        <Dialog open={isInviteOpen} onOpenChange={(open) => { setIsInviteOpen(open); if (!open) resetInviteForm() }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
              <Mail className="w-4 h-4 mr-2" />
              {t("membersClient.inviteBtn") || "Dəvət Göndər"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("membersClient.inviteTitle") || "Yeni Dəvət Göndər"}</DialogTitle>
              <DialogDescription>
                {t("membersClient.inviteDesc") || "İstifadəçinin məlumatlarını dolduraraq ona e-poçt vasitəsilə dəvət göndərin."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 mt-2">
              {inviteError && (
                <div className="px-3 py-2 rounded-md bg-red-50 text-red-600 text-sm border border-red-200">
                  {inviteError}
                </div>
              )}

              <div className="space-y-2">
                <Label>{t("membersClient.inviteType") || "Dəvət Növü"}</Label>
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
                    {t("membersClient.typeMember") || "Üzv (Member)"}
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
                    {t("membersClient.typeGuest") || "Qonaq (Guest)"}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {inviteType === "GUEST"
                    ? (t("membersClient.guestNote") || "Qonaqlar yalnız seçilmiş layihələrə baxa bilər (VIEWER).")
                    : (t("membersClient.memberNote") || "Üzvlər şirkətin adi işçisi kimi qoşulur və icazələri tənzimlənə bilir.")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteName">{t("membersClient.firstName") || "Ad"}</Label>
                  <Input
                    id="inviteName"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Məs: Əli"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteSurname">{t("membersClient.lastName") || "Soyad"}</Label>
                  <Input
                    id="inviteSurname"
                    value={inviteSurname}
                    onChange={(e) => setInviteSurname(e.target.value)}
                    placeholder="Məs: Əliyev"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteEmail">{t("membersClient.email") || "Email"}</Label>
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
                  <Label htmlFor="dept">{t("membersClient.dept") || "Şöbə"}</Label>
                  <select
                    id="dept"
                    className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                    value={inviteDepartmentId}
                    onChange={(e) => setInviteDepartmentId(e.target.value)}
                  >
                    <option value="">{t("membersClient.selectDept") || "Seçin"}</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t("membersClient.role") || "Rol"}</Label>
                  <select
                    id="role"
                    className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                    value={inviteRoleId}
                    onChange={(e) => setInviteRoleId(e.target.value)}
                  >
                    <option value="">{t("membersClient.standardRole") || "Standart rol"}</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {inviteType === "GUEST" && (
                <div className="space-y-2">
                  <Label>{t("membersClient.projects") || "Layihələr"}</Label>
                  <div className="max-h-40 overflow-y-auto rounded-md border border-[hsl(var(--input))] p-2 space-y-1">
                    {projects.length === 0 && (
                      <p className="text-xs text-muted-foreground px-1 py-1">{t("membersClient.noProjects") || "Heç bir layihə tapılmadı"}</p>
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
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="inviteMessage">{t("membersClient.inviteMessage") || "Dəvət Mesajı"}</Label>
                <Textarea
                  id="inviteMessage"
                  rows={3}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder={t("membersClient.inviteMessagePlaceholder") || "E-poçtda gedəcək xüsusi mesaj..."}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                  {t("membersClient.cancel") || "Ləğv et"}
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? (t("membersClient.sending") || "Göndərilir...") : (t("membersClient.inviteBtn") || "Dəvət Göndər")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("membersClient.editTitle") || "Məlumatları Redaktə Et"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="editName">{t("membersClient.fullName") || "Ad və Soyad"}</Label>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editDept">{t("membersClient.dept") || "Şöbə"}</Label>
                <select
                  id="editDept"
                  className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(e.target.value)}
                >
                  <option value="">{t("membersClient.selectDept") || "Seçin"}</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">{t("membersClient.role") || "Rol"}</Label>
                <select
                  id="editRole"
                  className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                >
                  <option value="">{t("membersClient.selectDept") || "Seçin"}</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? (t("membersClient.saving") || "Yadda saxlanılır...") : (t("membersClient.save") || "Yadda saxla")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="w-4 h-4" />
            {(t("membersClient.tabMembers") || "Aktiv Üzvlər ({count})").replace("{count}", String(filteredAndSortedMembers.length))}
          </TabsTrigger>
          <TabsTrigger value="invites" className="gap-1.5">
            <Clock className="w-4 h-4" />
            {(t("membersClient.tabInvites") || "Dəvətlər ({count})").replace("{count}", String(pendingInvites.length))}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>{t("membersClient.thName") || "Ad və Soyad"}</TableHead>
                  <TableHead>{t("membersClient.thDeptRole") || "Şöbə / Vəzifə"}</TableHead>
                  <TableHead>{t("membersClient.thEmail") || "Email ünvanı"}</TableHead>
                  <TableHead>{t("membersClient.thStatus") || "Status"}</TableHead>
                  <TableHead className="w-[80px] text-center">{t("membersClient.thChat") || "Çat"}</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedMembers.map((member) => (
                  <TableRow key={member.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-[hsl(var(--border))]">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">
                            {member.name} {member.id === currentUserId && <span className="text-xs text-muted-foreground ml-1">{t("membersClient.you") || "(Siz)"}</span>}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          {member.jobTitle || (member.role ? member.role.name : (t("membersClient.noVezife") || "Vəzifə yoxdur"))}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> 
                          {member.department?.name || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{member.email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {member.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => router.push(`/dashboard/chat?userId=${member.id}`)}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>{t("membersClient.management") || "İdarəetmə"}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => openEditModal(member)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>{t("membersClient.editBtn") || "Redaktə et"}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:bg-red-50 focus:text-red-700"
                            onSelect={(e) => {
                              e.preventDefault()
                              handleDelete(member.id)
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>{t("membersClient.deleteBtn") || "Sil"}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAndSortedMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                      {searchTerm ? (t("membersClient.noMatch") || "Axtarışınıza uyğun heç bir üzv tapılmadı.") : (t("membersClient.noMembers") || "Hələ heç bir üzv yoxdur")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>{t("membersClient.thType") || "Növ"}</TableHead>
                  <TableHead>{t("membersClient.thDeptRole") || "Şöbə / Rol"}</TableHead>
                  <TableHead>{t("membersClient.thInviter") || "Dəvət edən"}</TableHead>
                  <TableHead>{t("membersClient.thStatus") || "Status"}</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium text-sm">{invite.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                        {invite.type === "GUEST" ? (t("membersClient.typeGuest") || "Qonaq") : (t("membersClient.typeMember") || "Üzv")}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invite.department?.name || "-"} {invite.role ? `/ ${invite.role.name}` : ""}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{invite.invitedBy?.name || "-"}</TableCell>
                    <TableCell>
                      <InviteStatusBadge status={invite.status} t={t} />
                    </TableCell>
                    <TableCell>
                      {(invite.status === "PENDING" || invite.status === "EXPIRED") && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title={t("membersClient.resend") || "Yenidən göndər"}
                            onClick={() => handleResendInvite(invite.id)}
                          >
                            <RefreshCw className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          </Button>
                          {invite.status === "PENDING" && (
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title={t("membersClient.revoke") || "Ləğv et"}
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
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">
                      {t("membersClient.noInvites") || "Hələ heç bir dəvət göndərilməyib"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}