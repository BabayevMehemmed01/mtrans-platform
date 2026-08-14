"use client";

import { useCallback, useEffect, useState } from "react";
import type { CrmStage, CrmDeal, CrmContact, CrmCompanyLite, CrmMember } from "./types";

// =============================================================================
// useCrmBoard — CRM modulunun bütün datasını (mərhələlər, əqdlər, əlaqələr,
// şirkətlər, komanda üzvləri) yükləyən paylaşılan hook.
// Həm Kanban, həm də Cədvəl (List) görünüşü eyni datadan istifadə edir ki,
// biri digərində edilən dəyişikliyi dərhal əks etdirsin.
// =============================================================================
export function useCrmBoard() {
  const [stages, setStages] = useState<CrmStage[]>([]);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [companies, setCompanies] = useState<CrmCompanyLite[]>([]);
  const [members, setMembers] = useState<CrmMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stagesRes, dealsRes, contactsRes, companiesRes, membersRes] = await Promise.all([
        fetch("/api/crm/stages"),
        fetch("/api/crm/deals"),
        fetch("/api/crm/contacts"),
        fetch("/api/crm/companies"),
        fetch("/api/members"),
      ]);

      const [stagesData, dealsData, contactsData, companiesData, membersData] = await Promise.all([
        stagesRes.json(),
        dealsRes.json(),
        contactsRes.json(),
        companiesRes.json(),
        membersRes.json(),
      ]);

      if (Array.isArray(stagesData)) {
        setStages([...stagesData].sort((a, b) => a.position - b.position));
      }
      if (Array.isArray(dealsData)) setDeals(dealsData);
      if (Array.isArray(contactsData)) setContacts(contactsData);
      if (Array.isArray(companiesData)) setCompanies(companiesData);
      if (Array.isArray(membersData)) {
        setMembers(membersData.map((m: any) => ({ id: m.id, name: m.name, avatar: m.avatar })));
      }
    } catch (error) {
      console.error("Error loading CRM board data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    stages,
    setStages,
    deals,
    setDeals,
    contacts,
    setContacts,
    companies,
    setCompanies,
    members,
    loading,
    refetch: fetchAll,
  };
}

export type CrmBoard = ReturnType<typeof useCrmBoard>;
