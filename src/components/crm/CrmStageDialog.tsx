"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CrmStage } from "./types";

const STAGE_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#06b6d4", "#ec4899", "#64748b"];

interface CrmStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (stage: CrmStage) => void;
}

// =============================================================================
// CrmStageDialog — Satış qıfına yeni mərhələ (pipeline stage) əlavə etmək üçün.
// =============================================================================
export function CrmStageDialog({ open, onOpenChange, onCreated }: CrmStageDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(STAGE_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Mərhələ adı mütləqdir");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/crm/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Xəta baş verdi");
      const stage = await res.json();
      onCreated(stage);
      toast.success("Mərhələ yaradıldı");
      onOpenChange(false);
      setName("");
      setColor(STAGE_COLORS[0]);
    } catch (err: any) {
      toast.error(err.message || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Yeni Mərhələ</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Mərhələnin adı</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Məs: Təklif göndərildi"
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Rəng</Label>
            <div className="grid grid-cols-8 gap-2">
              {STAGE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center"
                  style={{ backgroundColor: c, borderColor: color === c ? "currentColor" : "transparent" }}
                >
                  {color === c && <span className="w-2 h-2 bg-white rounded-full" />}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Yaradılır..." : "Yarat"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
