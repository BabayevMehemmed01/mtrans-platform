"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type LabelWithCount = {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  _count: { taskLabels: number };
};

export function LabelsClient({ initialLabels }: { initialLabels: LabelWithCount[] }) {
  const router = useRouter();
  const [labels, setLabels] = useState(initialLabels);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedLabel, setSelectedLabel] = useState<LabelWithCount | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [color, setColor] = useState("#10b981");
  const [isLoading, setIsLoading] = useState(false);

  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", 
    "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#f43f5e", "#64748b"
  ];

  const resetForm = () => {
    setName("");
    setColor("#10b981");
    setSelectedLabel(null);
  };

  const openEdit = (label: LabelWithCount) => {
    setSelectedLabel(label);
    setName(label.name);
    setColor(label.color);
    setIsEditOpen(true);
  };

  const openDelete = (label: LabelWithCount) => {
    setSelectedLabel(label);
    setIsDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Ad mütləqdir");
    setIsLoading(true);
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xəta baş verdi");
      const newLabel = await res.json();
      setLabels([{ ...newLabel, _count: { taskLabels: 0 } }, ...labels]);
      toast.success("Etiket yaradıldı");
      setIsCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!name.trim() || !selectedLabel) return toast.error("Ad mütləqdir");
    setIsLoading(true);
    try {
      const res = await fetch(`/api/labels/${selectedLabel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xəta baş verdi");
      const updatedLabel = await res.json();
      
      setLabels(labels.map(l => 
        l.id === updatedLabel.id 
          ? { ...l, name: updatedLabel.name, color: updatedLabel.color } 
          : l
      ));
      toast.success("Etiket yeniləndi");
      setIsEditOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLabel) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/labels/${selectedLabel.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xəta baş verdi");
      
      setLabels(labels.filter(l => l.id !== selectedLabel.id));
      toast.success("Etiket silindi");
      setIsDeleteOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
           {/* Hələlik axtarış inputu sadə vizual qalır, funksional əlavə edilə bilər */}
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg hover:bg-[hsl(var(--primary))/0.9] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Yeni Etiket
        </button>
      </div>

      <div className="border border-[hsl(var(--border))] rounded-xl bg-[hsl(var(--card))]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Tapşırıq Sayı</TableHead>
              <TableHead className="w-[100px] text-right">Əməliyyat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-[hsl(var(--muted-foreground))]">
                  Hələ heç bir etiket yaradılmayıb.
                </TableCell>
              </TableRow>
            ) : (
              labels.map((label) => (
                <TableRow key={label.id} className="hover:bg-[hsl(var(--accent))/0.5]">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border"
                        style={{
                          backgroundColor: `${label.color}15`,
                          color: label.color,
                          borderColor: `${label.color}30`
                        }}
                      >
                        <Tag className="w-3 h-3" />
                        {label.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[hsl(var(--muted-foreground))]">
                    {label._count.taskLabels} tapşırıq
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(label)} className="cursor-pointer gap-2">
                          <Pencil className="w-4 h-4" />
                          <span>Redaktə et</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDelete(label)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600">
                          <Trash2 className="w-4 h-4" />
                          <span>Sil</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Yaratma/Redaktə Dialog-u */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Etiketi Redaktə Et" : "Yeni Etiket"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ad</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Məs: Təcili, Bug"
                className="w-full p-2 border border-[hsl(var(--border))] rounded-md bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rəng</label>
              <div className="grid grid-cols-6 gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "currentColor" : "transparent"
                    }}
                  >
                     {color === c && <span className="w-2 h-2 bg-white rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
              }}
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-[hsl(var(--accent))] transition-colors"
            >
              Ləğv et
            </button>
            <button
              onClick={isEditOpen ? handleEdit : handleCreate}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-[hsl(var(--primary))] text-white rounded-md hover:bg-[hsl(var(--primary))/0.9] disabled:opacity-50"
            >
              {isLoading ? "Yüklənir..." : "Yadda saxla"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silmə Dialog-u */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Etiketi Sil</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              <strong>{selectedLabel?.name}</strong> etiketini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz və etiket bütün tapşırıqlardan silinəcək.
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-[hsl(var(--accent))] transition-colors"
            >
              Ləğv et
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Silinir..." : "Bəli, sil"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
