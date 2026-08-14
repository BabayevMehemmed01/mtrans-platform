"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash } from "lucide-react";
import type { TaskMember } from "@/components/kanban/types";

// Extended ProjectMember type that includes the user object and role
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
  companyUsers: TaskMember[]; // Users in the company who can be invited
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0,2)
}

export function ProjectMembersClient({
  projectId,
  projectMembers,
  companyUsers,
}: ProjectMembersClientProps) {
  const [members, setMembers] = useState(projectMembers);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("MEMBER");
  
  const router = useRouter();

  // Filter out users who are already in the project
  const availableUsers = companyUsers.filter(
    (u) => !members.some((m) => m.userId === u.id)
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      });
      if (res.ok) {
        const newMember = await res.json();
        setMembers([...members, newMember]);
        setSelectedUserId("");
        router.refresh();
      } else {
        alert("Xəta baş verdi");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Bu istifadəçini layihədən çıxarmaq istədiyinizə əminsiniz?")) return;
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

  return (
    <div className="p-6 space-y-6">
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Layihəyə Üzv Əlavə Et</h3>
        <form onSubmit={handleAddMember} className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="user">İstifadəçi</Label>
            <select
              id="user"
              className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
            >
              <option value="">İstifadəçi seçin</option>
              {availableUsers.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="w-48 space-y-2">
            <Label htmlFor="role">Layihə Rolu</Label>
            <select
              id="role"
              className="flex h-10 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="OWNER">Sahib (Owner)</option>
              <option value="MANAGER">Menecer (Manager)</option>
              <option value="MEMBER">Üzv (Member)</option>
              <option value="VIEWER">İzləyici (Viewer)</option>
            </select>
          </div>
          <Button type="submit" disabled={loading || !selectedUserId} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? "Əlavə edilir..." : "Əlavə et"}
          </Button>
        </form>
      </div>

      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Üzv</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.userId}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.user.avatar || undefined} />
                      <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{member.user.name}</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{member.user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                    member.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                    member.role === 'VIEWER' ? 'bg-gray-100 text-gray-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {member.role}
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
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600" 
                        onSelect={(e) => {
                          e.preventDefault()
                          handleRemoveMember(member.userId)
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Layihədən Çıxar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Bu layihədə hələ heç bir üzv yoxdur.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
