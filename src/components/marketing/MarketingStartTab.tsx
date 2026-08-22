"use client";

import { useMemo } from "react";
import toast from "react-hot-toast";
import { Rocket, Sparkles, Lock, ArrowUpRight, Megaphone, Users2, Send, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CHANNEL_META, CHANNEL_ORDER, isChannelActiveFor } from "./channelMeta";
import { CampaignStatusBadge } from "./StatusBadge";
import { MarketingEmptyState } from "./MarketingEmptyState";
import type { CampaignType, MarketingCampaignLite, MarketingConfigClient, MarketingSegmentLite } from "./types";

interface MarketingStartTabProps {
  config: MarketingConfigClient;
  campaigns: MarketingCampaignLite[];
  segments: MarketingSegmentLite[];
  loading: boolean;
  onCreateCampaign: (type: CampaignType) => void;
  onGoToCampaigns: () => void;
}

export function MarketingStartTab({
  config,
  campaigns,
  segments,
  loading,
  onCreateCampaign,
  onGoToCampaigns,
}: MarketingStartTabProps) {
  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === "IN_PROGRESS" || c.status === "SCHEDULED").length;
    const completed = campaigns.filter((c) => c.status === "COMPLETED").length;
    const rates = campaigns
      .filter((c) => c.status === "COMPLETED")
      .map((c) => c.stats?.openRate ?? 0);
    const avgOpenRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
    return { total, active, completed, avgOpenRate, segments: segments.length };
  }, [campaigns, segments]);

  const recent = campaigns.slice(0, 5);

  const handleCardClick = (type: CampaignType) => {
    const active = isChannelActiveFor(type, config);
    if (!active) {
      const meta = CHANNEL_META[type];
      toast.error(
        `${meta.shortLabel} kanalı aktiv deyil. Lütfən .env faylına API məlumatlarını (${meta.envHint}) daxil edin.`,
        { duration: 4500 }
      );
      return;
    }
    onCreateCampaign(type);
  };

  return (
    <div className="space-y-6">
      {/* Stat overview */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Megaphone} label="Cəmi Kampaniya" value={stats.total} accent="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Send} label="Aktiv / Planlaşdırılan" value={stats.active} accent="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Users2} label="Auditoriya Seqmenti" value={stats.segments} accent="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={TrendingUp} label="Orta Açılma Faizi" value={`${stats.avgOpenRate}%`} accent="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* Create Campaign section */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Rocket className="h-4.5 w-4.5 text-primary" />
          <h3 className="text-base font-semibold tracking-tight">Kampaniya Yarat</h3>
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNEL_ORDER.map((type) => {
            const meta = CHANNEL_META[type];
            const active = isChannelActiveFor(type, config);
            const Icon = meta.icon;

            return (
              <button
                key={type}
                type="button"
                onClick={() => handleCardClick(type)}
                className={cn(
                  "group relative flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition-all duration-200",
                  active
                    ? "hover:-translate-y-0.5 hover:shadow-md hover:border-border cursor-pointer"
                    : "opacity-60 cursor-pointer"
                )}
              >
                {!active && (
                  <Badge
                    variant="outline"
                    className="absolute right-3 top-3 gap-1 rounded-full border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600"
                  >
                    <Lock className="h-2.5 w-2.5" /> Quraşdırma Tələb Olunur
                  </Badge>
                )}

                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", meta.softBg)}>
                  <Icon className={cn("h-5.5 w-5.5", meta.accent)} />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{meta.description}</p>
                </div>

                <div
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 text-xs font-medium",
                    active ? meta.accent : "text-muted-foreground"
                  )}
                >
                  {active ? "Kampaniya Yarat" : "Deaktiv"}
                  <ArrowUpRight className="h-3 w-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent campaigns */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="px-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">Son Kampaniyalar</h3>
            <button
              onClick={onGoToCampaigns}
              className="text-xs font-medium text-primary hover:underline"
            >
              Hamısına bax
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <MarketingEmptyState
              title="No data found"
              description="Hələ heç bir kampaniya yaradılmayıb. Yuxarıdaki kanallardan birini seçərək ilk kampaniyanızı yaradın."
            />
          ) : (
            <div className="divide-y divide-border/60">
              {recent.map((c) => {
                const meta = CHANNEL_META[c.type];
                const Icon = meta.icon;
                return (
                  <div key={c.id} className="flex items-center gap-3 py-2.5">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.softBg)}>
                      <Icon className={cn("h-4 w-4", meta.accent)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{meta.shortLabel}{c.segment ? ` · ${c.segment.name}` : ""}</p>
                    </div>
                    <CampaignStatusBadge status={c.status} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent: string;
  bg: string;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="flex items-center gap-3 px-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", bg)}>
          <Icon className={cn("h-5 w-5", accent)} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-none tracking-tight">{value}</p>
          <p className="truncate text-[11px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
