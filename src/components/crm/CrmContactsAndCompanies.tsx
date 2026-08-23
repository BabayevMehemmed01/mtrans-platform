"use client";

import { useState } from "react";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import { Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CrmContacts from "./CrmContacts";
import CrmCompanies from "./CrmCompanies";
import type { CrmBoard } from "./useCrmBoard";

interface CrmContactsAndCompaniesProps {
  board: CrmBoard;
}

export default function CrmContactsAndCompanies({ board }: CrmContactsAndCompaniesProps) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [view, setView] = useState<"contacts" | "companies">("contacts");

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
        <button
          type="button"
          onClick={() => setView("contacts")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all",
            view === "contacts" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="w-3.5 h-3.5" /> {t("crm.tabContactsOnly") || "Kontaktlar"}
          <span className="text-[11px] font-bold text-muted-foreground">({board.contacts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setView("companies")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all",
            view === "companies" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Building2 className="w-3.5 h-3.5" /> {t("crm.tabCompaniesOnly") || "Şirkətlər"}
          <span className="text-[11px] font-bold text-muted-foreground">({board.companies.length})</span>
        </button>
      </div>

      {view === "contacts" ? <CrmContacts board={board} /> : <CrmCompanies board={board} />}
    </div>
  );
}
