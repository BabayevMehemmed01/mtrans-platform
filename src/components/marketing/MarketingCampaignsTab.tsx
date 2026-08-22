"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  MoreHorizontal,
  Send,
  Trash2,
  ChevronDown,
  Lock,
  Megaphone,
  TrendingUp,
  MousePointerClick,
} from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CHANNEL_META, isChannelActiveFor } from "./channelMeta";
import { CampaignStatusBadge } from "./StatusBadge";
import { MarketingEmptyState, MarketingTableSkeleton } from "./MarketingEmptyState";
import type { CampaignType, MarketingCampaignLite, MarketingConfigClient } from "./types";

const CREATABLE_TYPES: CampaignType[] = ["EMAIL", "SMS", "WHATSAPP"];

interface MarketingCampaignsTabProps {
  campaigns: MarketingCampaignLite[];
  config: MarketingConfigClient;
  loading: boolean;
  onOpenCreate: (type: CampaignType) => void;
  onCampaignUpdated: (campaign: MarketingCampaignLite) => void;
  onCampaignDeleted: (id: string) => void;
  typeFilter?: CampaignType;
}

export function MarketingCampaignsTab({
  campaigns,
  config,
  loading,
  onOpenCreate,
  onCampaignUpdated,
  onCampaignDeleted,
  typeFilter,
}: MarketingCampaignsTabProps) {
  const [search, setSearch] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns
      .filter((c) => (typeFilter ? c.type === typeFilter : true))
      .filter((c) => (q ? c.name.toLowerCase().includes(q) : true));
  }, [campaigns, search, typeFilter]);

  const handleCreateClick = (type: CampaignType) => {
    if (!isChannelActiveFor(type, config)) {
      const meta = CHANNEL_META[type];
      toast.error(
        `${meta.shortLabel} kanalı aktiv deyil. Lütfən .env faylına API məlumatlarını (${meta.envHint}) daxil edin.`
      );
      return;
    }
    onOpenCreate(type);
  };

  const handleSend = async (campaign: MarketingCampaignLite) => {
    setSendingId(campaign.id);
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaign.id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Kampaniya göndərilə bilmədi");
      onCampaignUpdated(data);
      toast.success("Kampaniya uğurla göndərildi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xəta baş verdi");
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (campaign: MarketingCampaignLite) => {
    if (!confirm(`"${campaign.name}" kampaniyasını silmək istədiyinizə əminsiniz?`)) return;
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaign.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onCampaignDeleted(campaign.id);
      toast.success("Kampaniya silindi");
    } catch {
      toast.error("Kampaniya silinə bilmədi");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kampaniya axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600/90">
              <Plus className="h-4 w-4" /> Create Campaign <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel>Kanal seçin</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CREATABLE_TYPES.map((type) => {
              const meta = CHANNEL_META[type];
              const Icon = meta.icon;
              const active = isChannelActiveFor(type, config);
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => handleCreateClick(type)}
                  className="flex items-center gap-2 py-2"
                >
                  <Icon className={cn("h-4 w-4", active ? meta.accent : "text-muted-foreground")} />
                  <span className={cn(!active && "text-muted-foreground")}>{meta.label}</span>
                  {!active && <Lock className="ml-auto h-3 w-3 text-orange-500" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Statistics</TableHead>
              <TableHead>Yaradılma tarixi</TableHead>
              <TableHead className="w-[64px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <MarketingTableSkeleton rows={4} cols={5} />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <MarketingEmptyState
                    icon={Megaphone}
                    title="No data found"
                    description="Hələ heç bir kampaniya yaradılmayıb. Yuxarıdaki 'Create Campaign' düyməsi ilə başlayın."
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const meta = CHANNEL_META[c.type];
                const Icon = meta.icon;
                const canSend = c.status !== "COMPLETED" && c.status !== "IN_PROGRESS";
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.softBg)}>
                          <Icon className={cn("h-4 w-4", meta.accent)} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {meta.shortLabel}
                            {c.segment ? ` · ${c.segment.name}` : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CampaignStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Send className="h-3 w-3" /> {c.stats?.sentCount ?? 0}/{c.stats?.recipientCount ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> {c.stats?.openRate ?? 0}%
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" /> {c.stats?.clickRate ?? 0}%
                        </span>
                      </div>
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
                          {canSend && (
                            <DropdownMenuItem
                              disabled={sendingId === c.id}
                              onClick={() => handleSend(c)}
                              className="gap-2"
                            >
                              <Send className="h-4 w-4" /> {sendingId === c.id ? "Göndərilir..." : "İndi Göndər"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(c)}>
                            <Trash2 className="h-4 w-4" /> Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
