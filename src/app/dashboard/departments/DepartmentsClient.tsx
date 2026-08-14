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
import { MoreVertical, Building2, Pencil, Trash, UserCircle } from "lucide-react"

type CompanyUser = { id: string; name: string; avatar: string | null }

export function DepartmentsClient({ initialData, users }: { initialData: any[]; users: CompanyUser[] }) {
  const [departments, setDepartments] = useState(initialData)

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Create Form
  const [name, setName] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [headUserId, setHeadUserId] = useState("")

  // Edit Form
  const [editId, setEditId] = useState("")
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("#6366f1")
  const [editHeadUserId, setEditHeadUserId] = useState("")

  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, headUserId: headUserId || null }),
      })
      if (res.ok) {
        const newDept = await res.json()
        setDepartments([newDept, ...departments])
        setIsCreateOpen(false)
        setName("")
        setColor("#6366f1")
        setHeadUserId("")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (dept: any) => {
    setEditId(dept.id)
    setEditName(dept.name)
    setEditColor(dept.color)
    setEditHeadUserId(dept.headUserId || "")
    setIsEditOpen(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/departments/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, color: editColor, headUserId: editHeadUserId || null }),
      })
      if (res.ok) {
        const updatedDept = await res.json()
        setDepartments(departments.map(d =>
          d.id === editId ? updatedDept : d
        ))
        setIsEditOpen(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" })
      if (res.ok) {
        setDepartments(departments.filter(d => d.id !== id))
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Şöbələr</h2>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              + Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Şöbə</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Şöbənin adı</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Məsələn: Marketing"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Rəng kodu</Label>
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
                <Label htmlFor="headUser">Şöbə Rəhbəri</Label>
                <select
                  id="headUser"
                  className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                  value={headUserId}
                  onChange={(e) => setHeadUserId(e.target.value)}
                >
                  <option value="">Seçilməyib</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? "Yaradılır..." : "Yarat"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şöbəni Redaktə Et</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Şöbənin adı</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editColor">Rəng kodu</Label>
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
              <Label htmlFor="editHeadUser">Şöbə Rəhbəri</Label>
              <select
                id="editHeadUser"
                className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
                value={editHeadUserId}
                onChange={(e) => setEditHeadUserId(e.target.value)}
              >
                <option value="">Seçilməyib</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "Yadda saxlanılır..." : "Yadda saxla"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad</TableHead>
            <TableHead>Rəhbər</TableHead>
            <TableHead>İşçi sayı</TableHead>
            <TableHead>Layihə sayı</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${dept.color}20`, color: dept.color }}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  {dept.name}
                </div>
              </TableCell>
              <TableCell>
                {dept.head ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <UserCircle className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                    {dept.head.name}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Təyin edilməyib</span>
                )}
              </TableCell>
              <TableCell>{dept._count?.users ?? 0}</TableCell>
              <TableCell>{dept._count?.projects ?? 0}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openEditModal(dept)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600" 
                      onSelect={(e) => {
                        e.preventDefault()
                        handleDelete(dept.id)
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
