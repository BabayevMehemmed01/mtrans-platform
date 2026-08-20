import type { CrmStage } from "./types";

/** Bitrix24 CRM funnel palette (New / In Progress / Invoice / Won / Lost). */
const BITRIX_PALETTE = ["#2FC6F6", "#55D0E0", "#8284F8", "#F7A700", "#A8ADB4", "#7BD500"];

export function getBitrixStageColor(stage: Pick<CrmStage, "name" | "color" | "position">): string {
  const name = (stage.name || "").toLowerCase();
  if (/(yeni|new|lead|müraciət)/i.test(name)) return "#2FC6F6";
  if (/(danışıq|progress|in progress|işlənir|negotiation)/i.test(name)) return "#55D0E0";
  if (/(müqavilə|invoice|faktura|təklif|proposal)/i.test(name)) return "#8284F8";
  if (/(qazan|won|uğur|success)/i.test(name)) return "#F7A700";
  if (/(itir|lost|fail)/i.test(name)) return "#A8ADB4";
  if (stage.color && stage.color !== "#94a3b8") return stage.color;
  return BITRIX_PALETTE[Math.abs(stage.position) % BITRIX_PALETTE.length];
}

export function isDeadlineOverdue(deadline: string | Date | null | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function formatDealDate(value: string | Date | null | undefined, lang: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const locale = lang === "en" ? "en-US" : lang === "ru" ? "ru-RU" : "az-AZ";
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}
