"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CrmDealDialog } from "./CrmDealDialog";
import { CrmStageDialog } from "./CrmStageDialog";
import type { CrmBoard } from "./useCrmBoard";
import type { CrmDeal } from "./types";

interface CrmDealsListProps {
  board: CrmBoard;
}

// =============================================================================
// CrmDealsList — Əqdlərin cədvəl (List) görünüşü. Kanban ilə eyni datadan
// (useCrmBoard) istifadə edir, ona görə iki görünüş arasında keçid zamanı
// dəyişikliklər dərhal sinxronlaşır.
// =============================================================================
export default function CrmDealsList({ board }: CrmDealsListProps) {
  const { stages, setStages, deals, setDeals, contacts, companies, setCompanies, members, loading } = board;
  const [search, setSearch] = useState("");
  const [dialogState, setDialogState] = useState<{ open: boolean; mode: "create" | "edit"; deal: CrmDeal | null }>({
    open: false,
    mode: "create",
    deal: null,
  });
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);

  const filteredDeals = deals.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => setDialogState({ open: true, mode: "create", deal: null });
  const openEdit = (deal: CrmDeal) => setDialogState({ open: true, mode: "edit", deal });

  const handleDelete = async (deal: CrmDeal) => {
    if (!confirm(`"${deal.title}" əqdini silmək istədiyinizə əminsiniz?`)) return;
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeals((prev) => prev.filter((d) => d.id !== deal.id));
      toast.success("Əqd silindi");
    } catch {
      toast.error("Əqd silinərkən xəta baş verdi");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Əqd axtar..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsStageDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Mərhələ
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Yeni Əqd
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Əqd</TableHead>
              <TableHead>Mərhələ</TableHead>
              <TableHead>Məbləğ</TableHead>
              <TableHead>Ehtimal</TableHead>
              <TableHead>Bağlanma Tarixi</TableHead>
              <TableHead>İcraçı</TableHead>
              <TableHead>Əlaqə/Şirkət</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">Yüklənir...</TableCell>
              </TableRow>
            ) : filteredDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  Əqd tapılmadı.
                </TableCell>
              </TableRow>
            ) : (
              filteredDeals.map((deal) => {
                const stage = stages.find((s) => s.id === deal.stageId);
                return (
                  <TableRow key={deal.id} className="cursor-pointer" onClick={() => openEdit(deal)}>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>
                      {stage && (
                        <Badge
                          variant="outline"
                          style={{ backgroundColor: `${stage.color}15`, color: stage.color, borderColor: `${stage.color}30` }}
                        >
                          {stage.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{deal.value?.toLocaleString?.() ?? deal.value} {deal.currency}</TableCell>
                    <TableCell>{deal.probability}%</TableCell>
                    <TableCell>
                      {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{deal.assignee?.name || "-"}</TableCell>
                    <TableCell>
                      {deal.crmContact
                        ? `${deal.crmContact.firstName} ${deal.crmContact.lastName ?? ""}`.trim()
                        : deal.crmCompany?.name || "-"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(deal)}>
                            <Pencil className="mr-2 h-4 w-4" /> Redaktə et
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(deal)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Sil
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

      <CrmDealDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((p) => ({ ...p, open }))}
        mode={dialogState.mode}
        deal={dialogState.deal}
        stages={stages}
        members={members}
        contacts={contacts}
        companies={companies}
        onCreated={(deal) => setDeals((prev) => [deal, ...prev])}
        onUpdated={(deal) => setDeals((prev) => prev.map((d) => (d.id === deal.id ? deal : d)))}
        onDeleted={(id) => setDeals((prev) => prev.filter((d) => d.id !== id))}
        onCompanyCreated={(c) => setCompanies((prev) => [...prev, c])}
      />

      <CrmStageDialog
        open={isStageDialogOpen}
        onOpenChange={setIsStageDialogOpen}
        onCreated={(stage) => setStages((prev) => [...prev, stage])}
      />
    </div>
  );
}
