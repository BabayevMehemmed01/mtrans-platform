"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { MoreVertical, Trash, UserPlus, ShieldAlert, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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
  companyUsers: any[]; // Artıq içində department məlumatı da gəlir
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
  
  // Tab State: INDIVIDUAL və ya DEPARTMENT
  const [inviteMode, setInviteMode] = useState<"INDIVIDUAL" | "DEPARTMENT">("INDIVIDUAL");
  
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedRole, setSelectedRole] = useState("MEMBER");
  
  const router = useRouter();

  // Layihədə OLMAYAN istifadəçiləri tapırıq
  const availableUsers = useMemo(() => {
    return companyUsers.filter((u) => !members.some((m) => m.userId === u.id));
  }, [companyUsers, members]);

  // Şirkətdəki unikal şöbələri çıxarırıq (Dropdown üçün)
  const uniqueDepartments = useMemo(() => {
    const depts = new Map();
    companyUsers.forEach(u => {
      if (u.department) depts.set(u.department.id, u.department);
    });
    return Array.from(depts.values());
  }, [companyUsers]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (inviteMode === "INDIVIDUAL") {
        if (!selectedUserId) return;
        const res = await fetch(`/api/projects/${projectId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
        });
        if (res.ok) {
          const newMember = await res.json();
          setMembers([...members, newMember]);
          setSelectedUserId("");
        }
      } 
      else if (inviteMode === "DEPARTMENT") {
        if (!selectedDeptId) return;
        // Şöbəyə aid olan, amma hələ layihədə olmayan işçiləri tapırıq
        const usersToInvite = availableUsers.filter(u => u.department?.id === selectedDeptId);
        
        if (usersToInvite.length === 0) {
          alert("Bu şöbənin bütün işçiləri artıq layihəyə əlavə edilib!");
          setLoading(false);
          return;
        }

        // Bütün işçiləri eyni anda API-a göndəririk (Promise.all ilə paralel sürətli yükləmə)
        const promises = usersToInvite.map(u => 
          fetch(`/api/projects/${projectId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: u.id, role: selectedRole }),
          }).then(r => r.json())
        );

        const newMembers = await Promise.all(promises);
        setMembers([...members, ...newMembers]);
        setSelectedDeptId("");
        alert(`${usersToInvite.length} nəfər şöbə işçisi uğurla layihəyə əlavə edildi!`);
      }
      
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Xəta baş verdi");
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
      {/* ─── Add Member Toolbar (Ağıllı Dəvət) ─── */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm flex flex-col xl:flex-row xl:items-start justify-between gap-6">
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              {inviteMode === "INDIVIDUAL" ? <UserPlus className="w-6 h-6 text-blue-600" /> : <Users className="w-6 h-6 text-blue-600" />}
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-800">Layihəyə Üzv Əlavə Et</h3>
              <p className="text-[12px] font-medium text-slate-500">Collab və ya standart layihələrə işçiləri cəlb edin</p>
            </div>
          </div>

          {/* Toggle Buttons */}
          <div className="flex bg-slate-100/80 p-1 rounded-lg w-fit border border-gray-200/50">
            <button
              onClick={() => setInviteMode("INDIVIDUAL")}
              className={cn("px-4 py-1.5 text-[12px] font-bold rounded-md transition-all", inviteMode === "INDIVIDUAL" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              Fərdi Seçim
            </button>
            <button
              onClick={() => setInviteMode("DEPARTMENT")}
              className={cn("px-4 py-1.5 text-[12px] font-bold rounded-md transition-all", inviteMode === "DEPARTMENT" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              Şöbəvi Seçim (Toplu)
            </button>
          </div>
        </div>

        <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
          {inviteMode === "INDIVIDUAL" ? (
            <div className="w-full sm:w-64 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">İşçi Seçin</label>
              <select
                className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
              >
                <option value="" disabled>Siyahıdan seçin...</option>
                {availableUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.department ? `(${u.department.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="w-full sm:w-64 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Şöbə Seçin</label>
              <select
                className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                required
              >
                <option value="" disabled>Siyahıdan şöbə seçin...</option>
                {uniqueDepartments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="w-full sm:w-40 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">İcazə Rolu</label>
            <select
              className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
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
            disabled={loading || (inviteMode === "INDIVIDUAL" ? !selectedUserId : !selectedDeptId)} 
            className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-sm rounded-xl w-full sm:w-auto"
          >
            {loading ? "Gözləyin..." : "Əlavə Et"}
          </Button>
        </form>
      </div>

      {/* ─── Members Table ─── */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 border-b border-gray-200 px-6 py-3 flex items-center gap-3">
          <div className="flex-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Üzv / Məlumat</div>
          <div className="w-40 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">İcazə Rolu</div>
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
                
                <TableCell className="w-40 px-6 py-3 text-center">
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
                    <p className="text-[12px]">Yuxarıdakı paneldən yeni üzvlər cəlb edə bilərsiniz.</p>
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