"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
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
import { useT } from "@/hooks/useT";
import { CHANNEL_META, CHANNEL_ORDER, channelCopy } from "./channelMeta";
import type { CampaignType, MarketingTemplateLite } from "./types";

interface MarketingTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  template?: MarketingTemplateLite | null;
  defaultType: CampaignType;
  onCreated: (template: MarketingTemplateLite) => void;
  onUpdated: (template: MarketingTemplateLite) => void;
}

function emptyForm(type: CampaignType) {
  return { name: "", type, subject: "", content: "" };
}

export function MarketingTemplateDialog({
  open,
  onOpenChange,
  mode,
  template,
  defaultType,
  onCreated,
  onUpdated,
}: MarketingTemplateDialogProps) {
  const t = useT();
  const [form, setForm] = useState(emptyForm(defaultType));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && template) {
      setForm({
        name: template.name,
        type: template.type,
        subject: template.subject || "",
        content: template.content,
      });
    } else {
      setForm(emptyForm(defaultType));
    }
  }, [open, mode, template, defaultType]);

  const meta = CHANNEL_META[form.type];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t("marketing.templateNameRequired"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        subject: form.type === "EMAIL" ? form.subject.trim() || undefined : undefined,
        content: form.content.trim(),
      };
      const url = mode === "edit" && template ? `/api/marketing/templates/${template.id}` : "/api/marketing/templates";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("marketing.errorGeneric"));

      if (mode === "edit") {
        onUpdated(data);
        toast.success(t("marketing.templateUpdated"));
      } else {
        onCreated(data);
        toast.success(t("marketing.templateCreated"));
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("marketing.errorGeneric"));
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
              <meta.icon className={cn("h-4.5 w-4.5", meta.accent)} />
            </div>
            <DialogTitle>{mode === "create" ? t("marketing.newTemplateTitle") : t("marketing.editTemplateTitle")}</DialogTitle>
          </div>
          <DialogDescription>
            {mode === "create" ? t("marketing.templateCreateHint") : t("marketing.templateEditHint")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("marketing.templateName")}</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} autoFocus required />
            </div>
            <div className="space-y-1.5">
              <Label>{t("marketing.channel")}</Label>
              <Select value={form.type} onValueChange={(v) => v && setForm((p) => ({ ...p, type: v as CampaignType }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_ORDER.map((type) => (
                    <SelectItem key={type} value={type}>
                      {channelCopy(t, type).shortLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.type === "EMAIL" && (
            <div className="space-y-1.5">
              <Label>{t("marketing.subject")}</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder={t("marketing.subjectPlaceholder")}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{t("marketing.content")}</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              placeholder={t("marketing.contentTemplatePlaceholder")}
              className="min-h-32"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("marketing.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Yadda saxla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
