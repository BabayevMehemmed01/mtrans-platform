"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CHANNEL_META } from "./channelMeta";
import type { CampaignType, MarketingCampaignLite, MarketingSegmentLite } from "./types";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: CampaignType;
  segments: MarketingSegmentLite[];
  onCreated: (campaign: MarketingCampaignLite) => void;
}

const NO_SEGMENT_VALUE = "__none__";

export function CreateCampaignDialog({
  open,
  onOpenChange,
  type,
  segments,
  onCreated,
}: CreateCampaignDialogProps) {
  const meta = CHANNEL_META[type];
  const Icon = meta.icon;

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [segmentId, setSegmentId] = useState<string>(NO_SEGMENT_VALUE);
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setSubject("");
      setContent("");
      setSegmentId(NO_SEGMENT_VALUE);
      setScheduledAt("");
    }
  }, [open, type]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Kampaniya adı tələb olunur");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          subject: type === "EMAIL" ? subject.trim() : undefined,
          content: content.trim(),
          segmentId: segmentId === NO_SEGMENT_VALUE ? null : segmentId,
          status: scheduledAt ? "SCHEDULED" : "DRAFT",
          scheduledAt: scheduledAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Kampaniya yaradıla bilmədi");

      onCreated(data);
      toast.success("Kampaniya uğurla yaradıldı");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2.5">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", meta.softBg)}>
              <Icon className={cn("h-4.5 w-4.5", meta.accent)} />
            </div>
            <DialogTitle>Yeni {meta.label}</DialogTitle>
          </div>
          <DialogDescription>
            Kampaniyanı qaralama (draft) kimi yaradın, sonra Campaigns cədvəlindən istədiyiniz vaxt göndərin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-name">Kampaniya adı</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Məsələn: ${meta.shortLabel} — Yay Endirimi 2026`}
              autoFocus
            />
          </div>

          {type === "EMAIL" && (
            <div className="space-y-1.5">
              <Label htmlFor="campaign-subject">Mövzu (Subject)</Label>
              <Input
                id="campaign-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email mövzu sətri"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="campaign-content">Məzmun</Label>
            <Textarea
              id="campaign-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === "EMAIL"
                  ? "Email HTML/mətn məzmunu..."
                  : type === "INSTAGRAM"
                    ? "Reklam mətni / creative təsviri..."
                    : "Mesaj mətni..."
              }
              className="min-h-28"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Auditoriya Seqmenti</Label>
              <Select value={segmentId} onValueChange={(value) => setSegmentId(value ?? NO_SEGMENT_VALUE)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seqment seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SEGMENT_VALUE}>Seqment yoxdur</SelectItem>
                  {segments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="campaign-schedule">Planlaşdır (ixtiyari)</Label>
              <Input
                id="campaign-schedule"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </div>

          {segments.length === 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Seqment yoxdur — &ldquo;Segments&rdquo; tabından auditoriya yarada bilərsiniz.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Ləğv et
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Qaralama kimi Yadda Saxla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
