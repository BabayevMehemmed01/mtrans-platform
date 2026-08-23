"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search, MoreHorizontal, Trash2, Lock, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import { CHANNEL_META } from "./channelMeta";
import { CampaignStatusBadge } from "./StatusBadge";
import { MarketingEmptyState, MarketingTableSkeleton } from "./MarketingEmptyState";
import type { MarketingCampaignLite, MarketingConfigClient } from "./types";

interface MarketingAdsTabProps {
  campaigns: MarketingCampaignLite[];
  config: MarketingConfigClient;
  loading: boolean;
  onOpenCreate: () => void;
  onCampaignDeleted: (id: string) => void;
}

export function MarketingAdsTab({ campaigns, config, loading, onOpenCreate, onCampaignDeleted }: MarketingAdsTabProps) {
  const t = useT();
  const [search, setSearch] = useState("");
  const meta = CHANNEL_META.INSTAGRAM;
  const Icon = meta.icon;

  const ads = useMemo(
    () =>
      campaigns
        .filter((c) => c.type === "INSTAGRAM")
        .filter((c) => (search ? c.name.toLowerCase().includes(search.toLowerCase()) : true)),
    [campaigns, search]
  );

  const handleCreateClick = () => {
    if (!config.isInstagramActive) {
      toast.error(t("marketing.adsInactive").replace("{env}", meta.envHint));
      return;
    }
    onOpenCreate();
  };

  const handleDelete = async (campaign: MarketingCampaignLite) => {
    if (!confirm(t("marketing.confirmDeleteAd").replace("{name}", campaign.name))) return;
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaign.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onCampaignDeleted(campaign.id);
      toast.success(t("marketing.adDeleted"));
    } catch {
      toast.error(t("marketing.adsDeleteFailed"));
    }
  };

  if (!config.isInstagramActive && ads.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button onClick={handleCreateClick} className="gap-1.5 bg-pink-600 text-white hover:bg-pink-600/90">
            <Plus className="h-4 w-4" /> {t("marketing.createAd")}
          </Button>
        </div>
        <div className="rounded-2xl border border-dashed border-pink-200 bg-pink-50/40 p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-pink-200 dark:ring-pink-900/40">
            <Lock className="h-6 w-6 text-pink-500" />
          </div>
          <h3 className="text-sm font-semibold">{t("marketing.adsSetupTitle")}</h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
            {t("marketing.adsSetupDesc")}{" "}
            <span className="font-mono font-medium">META_API_KEY</span> {t("marketing.adsSetupSuffix")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("marketing.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Button onClick={handleCreateClick} className="gap-1.5 bg-pink-600 text-white hover:bg-pink-600/90">
          <Plus className="h-4 w-4" /> {t("marketing.createAd")}
        </Button>
      </div>

      <div className="rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>{t("marketing.thStatus")}</TableHead>
              <TableHead>{t("marketing.thCreatedAt")}</TableHead>
              <TableHead className="w-[64px]">{t("marketing.thActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="p-0">
                  <MarketingTableSkeleton rows={3} cols={4} />
                </TableCell>
              </TableRow>
            ) : ads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="p-0">
                  <MarketingEmptyState
                    icon={Camera}
                    title={t("marketing.noDataFound")}
                    description={t("marketing.noAdsYet")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              ads.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.softBg)}>
                        <Icon className={cn("h-4 w-4", meta.accent)} />
                      </div>
                      <p className="text-sm font-medium">{c.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CampaignStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("az-AZ", { dateStyle: "medium" }).format(new Date(c.createdAt))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(c)}>
                          <Trash2 className="h-4 w-4" /> {t("marketing.delete")}
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
    </div>
  );
}
