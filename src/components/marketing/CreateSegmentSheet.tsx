"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Search, Users, FileSpreadsheet, X, UserCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import type { CustomRecipient, MarketingCustomerLite, MarketingSegmentLite } from "./types";

interface CreateSegmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: MarketingCustomerLite[];
  onCreated: (segment: MarketingSegmentLite) => void;
}

const EMAIL_RE = /[^\s,;]+@[^\s,;]+\.[^\s,;]+/;
const PHONE_RE = /(\+?\d[\d\s\-()]{6,}\d)/;

function parseRecipientsText(text: string): CustomRecipient[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed: CustomRecipient[] = [];
  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
    let email = "";
    let phone = "";
    const nameParts: string[] = [];

    for (const part of parts) {
      const emailMatch = part.match(EMAIL_RE);
      const phoneMatch = part.match(PHONE_RE);
      if (emailMatch && !email) {
        email = emailMatch[0];
      } else if (phoneMatch && !phone && !emailMatch) {
        phone = phoneMatch[0];
      } else {
        nameParts.push(part);
      }
    }

    if (!email && !phone) continue;
    parsed.push({ name: nameParts.join(" ").trim() || undefined, email: email || undefined, phone: phone || undefined });
  }
  return parsed;
}

export function CreateSegmentSheet({ open, onOpenChange, customers, onCreated }: CreateSegmentSheetProps) {
  const t = useT();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importText, setImportText] = useState("");
  const [importedRecipients, setImportedRecipients] = useState<CustomRecipient[]>([]);
  const [saving, setSaving] = useState(false);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.company || "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const toggleCustomer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = () => {
    const parsed = parseRecipientsText(importText);
    if (parsed.length === 0) {
      toast.error(t("marketing.noValidContacts"));
      return;
    }
    setImportedRecipients(parsed);
    toast.success(t("marketing.importedCount").replace("{count}", String(parsed.length)));
  };

  const removeImported = (idx: number) => {
    setImportedRecipients((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetState = () => {
    setName("");
    setSearch("");
    setSelectedIds(new Set());
    setImportText("");
    setImportedRecipients([]);
  };

  const totalRecipients = selectedIds.size + importedRecipients.length;

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t("marketing.segmentNameRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          customerIds: Array.from(selectedIds),
          customRecipients: importedRecipients,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("marketing.segmentCreateFailed"));

      onCreated(data);
      toast.success(t("marketing.segmentCreateSuccess"));
      onOpenChange(false);
      resetState();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("marketing.errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetState();
      }}
    >
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-primary" /> {t("marketing.newSegmentTitle")}
          </SheetTitle>
          <SheetDescription>
            {t("marketing.segmentDesc")}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="segment-name">{t("marketing.segmentName")}</Label>
              <Input
                id="segment-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("marketing.segmentNamePlaceholder")}
                autoFocus
              />
            </div>

            {/* Clients / Contacts multi-select */}
            <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                  <UserCheck className="h-4 w-4 text-primary" /> {t("marketing.clientsContacts")}
                </Label>
                {selectedIds.size > 0 && (
                  <Badge variant="secondary" className="rounded-full">
                    {t("marketing.selectedCount").replace("{count}", String(selectedIds.size))}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("marketing.clientsHint")}</p>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={t("marketing.searchCustomer")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="max-h-64 overflow-y-auto rounded-xl border border-border/50 bg-background">
                {filteredCustomers.length === 0 ? (
                  <p className="p-4 text-center text-xs text-muted-foreground">{t("marketing.noCustomers")}</p>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {filteredCustomers.map((c) => {
                      const checked = selectedIds.has(c.id);
                      return (
                        <li key={c.id}>
                          <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40">
                            <Checkbox checked={checked} onCheckedChange={() => toggleCustomer(c.id)} />
                            <Avatar size="sm">
                              <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{c.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {[c.email, c.phone].filter(Boolean).join(" · ") || c.company || "—"}
                              </p>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Custom recipient list import */}
            <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <Label className="flex items-center gap-1.5 text-sm font-semibold">
                <FileSpreadsheet className="h-4 w-4 text-primary" /> {t("marketing.customList")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("marketing.importFileHint")} <span className="font-mono">{t("marketing.importHint")}</span>
              </p>

              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={t("marketing.importPlaceholder")}
                className="min-h-24 font-mono text-xs"
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {importedRecipients.length > 0
                    ? t("marketing.importedCount").replace("{count}", String(importedRecipients.length))
                    : t("marketing.nothingImported")}
                </p>
                <Button type="button" size="sm" variant="outline" onClick={handleImport} disabled={!importText.trim()}>
                  {t("marketing.import")}
                </Button>
              </div>

              {importedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {importedRecipients.map((r, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 rounded-full pr-1">
                      {r.name || r.email || r.phone}
                      <button
                        type="button"
                        onClick={() => removeImported(idx)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="border-t border-border/60 px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t("marketing.totalRecipients")} <span className="font-semibold text-foreground">{totalRecipients}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                {t("marketing.cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("marketing.createSegment")}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
