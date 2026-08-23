"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search, MoreHorizontal, Trash2, Users2, Layers } from "lucide-react";
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
import { useT } from "@/hooks/useT";
import { SegmentStatusBadge } from "./StatusBadge";
import { MarketingEmptyState, MarketingTableSkeleton } from "./MarketingEmptyState";
import { segmentRecipientCount } from "./types";
import type { MarketingSegmentLite } from "./types";

interface MarketingSegmentsTabProps {
  segments: MarketingSegmentLite[];
  loading: boolean;
  onOpenCreate: () => void;
  onSegmentDeleted: (id: string) => void;
}

export function MarketingSegmentsTab({ segments, loading, onOpenCreate, onSegmentDeleted }: MarketingSegmentsTabProps) {
  const t = useT();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => segments.filter((s) => (search ? s.name.toLowerCase().includes(search.toLowerCase()) : true)),
    [segments, search]
  );

  const handleDelete = async (segment: MarketingSegmentLite) => {
    if (!confirm(t("marketing.confirmDeleteSegment").replace("{name}", segment.name))) return;
    try {
      const res = await fetch(`/api/marketing/segments/${segment.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onSegmentDeleted(segment.id);
      toast.success(t("marketing.segmentDeleted"));
    } catch {
      toast.error(t("marketing.segmentDeleteFailed"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("marketing.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={onOpenCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> {t("marketing.createSegment")}
        </Button>
      </div>

      <div className="rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>{t("marketing.thUsage")}</TableHead>
              <TableHead>{t("marketing.thRecipients")}</TableHead>
              <TableHead>{t("marketing.thStatus")}</TableHead>
              <TableHead className="w-[64px]">{t("marketing.thActions")}</TableHead>
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
                    icon={Layers}
                    title={t("marketing.noDataFound")}
                    description={t("marketing.noSegmentsHint")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => {
                const recipientCount = segmentRecipientCount(s);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                          <Users2 className="h-4 w-4 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium">{s.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.useCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{recipientCount}</TableCell>
                    <TableCell>
                      <SegmentStatusBadge recipientCount={recipientCount} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(s)}>
                            <Trash2 className="h-4 w-4" /> {t("marketing.delete")}
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
