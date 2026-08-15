"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { MoreVertical, Trash, UserPlus, ShieldAlert } from "lucide-react";
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
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 overflow-auto h-full">
      {/* Add Member Toolbar */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">Yeni Üzv Əlavə Et</h3>
            <p className="text-[12px] font-medium text-slate-500">Layihəyə şirkət daxilindən işçi cəlb edin</p>
          </div>
        </div>

        <form onSubmit={handleAddMember} className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex-1 lg:w-64">
            <select
              id="user"
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
            >
              <option value="" disabled>İstifadəçi seçin...</option>
              {availableUsers.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-40">
            <select
              id="role"
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="OWNER">Sahib (Owner)</option>
              <option value="MANAGER">Menecer (Manager)</option>
              <option value="MEMBER">Üzv (Member)</option>
              <option value="VIEWER">İzləyici (Viewer)</option>
            </select>
          </div>
          
          <Button 
            type="submit" 
            disabled={loading || !selectedUserId} 
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 shadow-sm rounded-lg"
          >
            {loading ? "Əlavə edilir..." : "Əlavə Et"}
          </Button>
        </form>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
        {/* Table Header matching TaskListView style */}
        <div className="bg-slate-50/80 border-b border-gray-200 px-6 py-3 flex items-center gap-3">
          <div className="flex-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Üzv / Məlumat</div>
          <div className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">İcazə Rolu</div>
          <div className="w-16 flex-shrink-0 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">İdarə</div>
        </div>

        <Table>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.userId} className="hover:bg-slate-50/50 transition-colors border-b border-gray-100 last:border-0">
                <TableCell className="px-6 py-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 border border-gray-200 shadow-sm">
                      <AvatarImage src={member.user.avatar || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-sm">
                        {getInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-[14px] text-slate-800">{member.user.name}</span>
                      <span className="text-[12px] font-medium text-slate-500">{member.user.email}</span>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="w-32 px-6 py-3 text-center">
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    member.role === 'OWNER' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    member.role === 'MANAGER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    member.role === 'VIEWER' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {member.role === 'OWNER' && <ShieldAlert className="w-3 h-3 mr-1" />}
                    {member.role}
                  </span>
                </TableCell>

                <TableCell className="w-16 px-6 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-200 rounded-md transition-colors text-slate-500">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border border-gray-200">
                      <DropdownMenuItem 
                        className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer rounded-lg font-medium text-[13px]" 
                        onSelect={(e) => {
                          e.preventDefault();
                          handleRemoveMember(member.userId);
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
                <TableCell colSpan={3} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <UserPlus className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-[14px] font-medium">Bu layihədə hələ heç bir üzv yoxdur.</p>
                    <p className="text-[12px]">Yuxarıdakı paneldən yeni üzv əlavə edə bilərsiniz.</p>
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