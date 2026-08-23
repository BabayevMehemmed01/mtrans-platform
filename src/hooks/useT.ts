"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";

export function useT() {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  return useMemo(() => getTranslation(lang), [lang]);
}
