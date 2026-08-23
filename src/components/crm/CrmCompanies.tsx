"use client";

import { useState } from "react";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import { Plus, Search, MoreHorizontal, Mail, Phone, Pencil, Trash2, Globe, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CrmCompanyDialog } from "./CrmCompanyDialog";
import type { CrmBoard } from "./useCrmBoard";
import type { CrmCompanyLite } from "./types";

interface CrmCompaniesProps {
  board: CrmBoard;
}

export default function CrmCompanies({ board }: CrmCompaniesProps) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const { companies, setCompanies, loading } = board;
  const [search, setSearch] = useState("");
  const [dialogState, setDialogState] = useState<{ open: boolean; mode: "create" | "edit"; company: CrmCompanyLite | null }>({
    open: false,
    mode: "create",
    company: null,
  });

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => setDialogState({ open: true, mode: "create", company: null });
  const openEdit = (company: CrmCompanyLite) => setDialogState({ open: true, mode: "edit", company });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("crmCompanies.searchPlaceholder") || "Şirkət axtar..."}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("crmCompanies.newCompanyBtn") || "Yeni Şirkət"}
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("crmCompanies.thName") || "Şirkət"}</TableHead>
              <TableHead>{t("crmCompanies.thIndustry") || "Sahə"}</TableHead>
              <TableHead>{t("crmCompanies.thContactInfo") || "Əlaqə Məlumatları"}</TableHead>
              <TableHead>{t("crmCompanies.thContacts") || "Əlaqələr"}</TableHead>
              <TableHead>{t("crmCompanies.thDeals") || "Əqdlər"}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {t("crmCompanies.loading") || "Yüklənir..."}
                </TableCell>
              </TableRow>
            ) : filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  {t("crmCompanies.noMatch") || "Şirkət tapılmadı."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{company.name}</span>
                      {company.website && (
                        <a
                          href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-3 w-3" /> {company.website}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.industry ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Briefcase className="h-3 w-3 text-muted-foreground" /> {company.industry}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {company.email && (
                        <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {company.email}</div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {company.phone}</div>
                      )}
                      {!company.email && !company.phone && "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{company._count?.contacts ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{company._count?.deals ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(company)}>
                          <Pencil className="mr-2 h-4 w-4" /> {t("crmCompanies.editBtn") || "Redaktə et"}
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

      <CrmCompanyDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((p) => ({ ...p, open }))}
        mode={dialogState.mode}
        company={dialogState.company}
        onCreated={(c) => setCompanies((prev) => [...prev, c])}
        onUpdated={(c) => setCompanies((prev) => prev.map((x) => (x.id === c.id ? c : x)))}
        onDeleted={(id) => setCompanies((prev) => prev.filter((x) => x.id !== id))}
      />
    </div>
  );
}
