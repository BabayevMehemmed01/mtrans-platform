"use client";

import { useState } from "react";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import { Plus, Search, MoreHorizontal, Mail, Phone, Pencil, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CrmContactDialog } from "./CrmContactDialog";
import type { CrmBoard } from "./useCrmBoard";
import type { CrmContact } from "./types";

interface CrmContactsProps {
  board: CrmBoard;
}

export default function CrmContacts({ board }: CrmContactsProps) {
  // YENİ: Tərcüməni qoşuruq
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const { contacts, setContacts, companies, setCompanies, loading } = board;
  const [search, setSearch] = useState("");
  const [dialogState, setDialogState] = useState<{ open: boolean; mode: "create" | "edit"; contact: CrmContact | null }>({
    open: false,
    mode: "create",
    contact: null,
  });

  const filteredContacts = contacts.filter(c =>
    `${c.firstName} ${c.lastName || ''}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const openCreate = () => setDialogState({ open: true, mode: "create", contact: null });
  const openEdit = (contact: CrmContact) => setDialogState({ open: true, mode: "edit", contact });

  const handleDelete = async (contact: CrmContact) => {
    const confirmMsg = (t("crmContacts.confirmDelete") || `"{name}" əlaqəsini silmək istədiyinizə əminsiniz?`).replace("{name}", `${contact.firstName} ${contact.lastName || ""}`.trim());
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("crmContacts.searchPlaceholder") || "Müştəri axtar..."}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> {t("crmContacts.newContactBtn") || "Yeni Əlaqə"}
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("crmContacts.thName") || "Ad & Soyad"}</TableHead>
              <TableHead>{t("crmContacts.thContactInfo") || "Əlaqə Məlumatları"}</TableHead>
              <TableHead>{t("crmContacts.thPosition") || "Vəzifə"}</TableHead>
              <TableHead>{t("crmContacts.thCompany") || "Şirkət"}</TableHead>
              <TableHead>{t("crmContacts.thCreatedAt") || "Yaradılma Tarixi"}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  {t("crmContacts.loading") || "Yüklənir..."}
                </TableCell>
              </TableRow>
            ) : filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  {t("crmContacts.noMatch") || "Müştəri tapılmadı."}
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {contact.email && (
                        <div className="flex items-center gap-1"><Mail className="h-3 w-3"/> {contact.email}</div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1"><Phone className="h-3 w-3"/> {contact.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{contact.position || "-"}</TableCell>
                  <TableCell>
                    {contact.crmCompany ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {contact.crmCompany.name}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{new Intl.DateTimeFormat(lang === "en" ? "en-US" : lang === "ru" ? "ru-RU" : "az-AZ").format(new Date(contact.createdAt))}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(contact)}>
                          <Pencil className="mr-2 h-4 w-4" /> {t("crmContacts.editBtn") || "Redaktə et"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(contact)}>
                          <Trash2 className="mr-2 h-4 w-4" /> {t("crmContacts.deleteBtn") || "Sil"}
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

      <CrmContactDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((p) => ({ ...p, open }))}
        mode={dialogState.mode}
        contact={dialogState.contact}
        companies={companies}
        onCreated={(c) => setContacts((prev) => [c, ...prev])}
        onUpdated={(c) => setContacts((prev) => prev.map((x) => (x.id === c.id ? c : x)))}
        onDeleted={(id) => setContacts((prev) => prev.filter((x) => x.id !== id))}
        onCompanyCreated={(c) => setCompanies((prev) => [...prev, c])}
      />
    </div>
  );
}