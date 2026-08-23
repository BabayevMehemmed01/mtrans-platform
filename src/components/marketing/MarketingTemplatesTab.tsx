"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { LayoutTemplate, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import { CHANNEL_META, CHANNEL_ORDER, channelCopy } from "./channelMeta";
import { MarketingEmptyState, MarketingCardSkeleton } from "./MarketingEmptyState";
import { MarketingTemplateDialog } from "./MarketingTemplateDialog";
import type { CampaignType, MarketingTemplateLite } from "./types";

interface MarketingTemplatesTabProps {
  templates: MarketingTemplateLite[];
  loading: boolean;
  onCreated: (template: MarketingTemplateLite) => void;
  onUpdated: (template: MarketingTemplateLite) => void;
  onDeleted: (id: string) => void;
}

export function MarketingTemplatesTab({ templates, loading, onCreated, onUpdated, onDeleted }: MarketingTemplatesTabProps) {
  const t = useT();
  const [activeType, setActiveType] = useState<CampaignType>("EMAIL");
  const [dialogState, setDialogState] = useState<{ open: boolean; mode: "create" | "edit"; template: MarketingTemplateLite | null }>({
    open: false,
    mode: "create",
    template: null,
  });

  const visibleTemplates = useMemo(() => templates.filter((tpl) => tpl.type === activeType), [templates, activeType]);
  const meta = CHANNEL_META[activeType];
  const copy = channelCopy(t, activeType);

  const openCreate = () => setDialogState({ open: true, mode: "create", template: null });
  const openEdit = (template: MarketingTemplateLite) => setDialogState({ open: true, mode: "edit", template });

  const handleDelete = async (template: MarketingTemplateLite) => {
    if (template.isSystem) {
      toast.error(t("marketing.cannotDeleteDefault"));
      return;
    }
    if (!confirm(t("marketing.confirmDeleteTemplate").replace("{name}", template.name))) return;
    try {
      const res = await fetch(`/api/marketing/templates/${template.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("marketing.deleteFailedGeneric"));
        return;
      }
      onDeleted(template.id);
      toast.success(t("marketing.templateDeleted"));
    } catch {
      toast.error(t("marketing.networkError"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {CHANNEL_ORDER.map((type) => {
          const m = CHANNEL_META[type];
          const channel = channelCopy(t, type);
          const Icon = m.icon;
          const count = templates.filter((tpl) => tpl.type === type).length;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[13px] font-bold transition-all",
                activeType === type
                  ? cn("border-transparent text-white shadow-sm", m.solidBg)
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {channel.shortLabel}
              {count > 0 && (
                <span
                  className={cn(
                    "text-[10.5px] font-bold px-1.5 py-0.5 rounded-full",
                    activeType === type ? "bg-white/25" : "bg-muted"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[13px] font-medium text-muted-foreground max-w-lg">{copy.description}</p>
        <Button onClick={openCreate} className="gap-1.5 rounded-xl font-bold">
          <Plus className="w-4 h-4" /> {t("marketing.newTemplate")}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <MarketingCardSkeleton key={i} />
          ))}
        </div>
      ) : visibleTemplates.length === 0 ? (
        <MarketingEmptyState
          icon={LayoutTemplate}
          title={t("marketing.noTemplates")}
          description={t("marketing.noTemplatesForChannel").replace("{channel}", copy.shortLabel)}
          actionLabel={t("marketing.newTemplate")}
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", meta.softBg)}>
                    <meta.icon className={cn("h-3.5 w-3.5", meta.accent)} />
                  </div>
                  <h4 className="text-[14px] font-bold text-foreground truncate">{tpl.name}</h4>
                </div>
                {tpl.isSystem && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 px-2 py-0.5 rounded-full flex-shrink-0">
                    <Lock className="w-2.5 h-2.5" /> {t("marketing.defaultBadge")}
                  </span>
                )}
              </div>

              {tpl.subject && <p className="text-[12.5px] font-semibold text-foreground/80 truncate">{tpl.subject}</p>}
              <p className="text-[12.5px] text-muted-foreground line-clamp-3 whitespace-pre-line">{tpl.content || "—"}</p>

              <div className="mt-auto pt-2 border-t border-border flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(tpl)} title={t("marketing.editBtn")}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(tpl)}
                  disabled={tpl.isSystem}
                  className="text-destructive hover:text-destructive disabled:opacity-30"
                  title={tpl.isSystem ? t("marketing.cannotDeleteDefaultTitle") : t("marketing.delete")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MarketingTemplateDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((p) => ({ ...p, open }))}
        mode={dialogState.mode}
        template={dialogState.template}
        defaultType={activeType}
        onCreated={onCreated}
        onUpdated={onUpdated}
      />
    </div>
  );
}
