import type { Metadata } from "next";
import { PackageSearch, User, Wallet, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Sifariş İzləmə Paneli" };

// =============================================================================
// GET /track/[token] — Şifrəsiz, unikal müştəri izləmə paneli (Magic Link)
// Server Component, tamamilə public, read-only. Auth tələb olunmur (bax: proxy.ts).
// =============================================================================

function formatDate(value: Date | null): string {
  if (!value) return "Təyin olunmayıb";
  return new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatAmount(value: number, currency: string): string {
  return `${value.toLocaleString("az-AZ")} ${currency}`;
}

// Mərhələnin açıq/tünd rəngindən asılı olmayaraq oxunaqlı olması üçün
// badge-in yazı rəngini fon rənginin işıqlılığına görə seçirik.
function getReadableTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160 ? "#0f172a" : "#ffffff";
}

function NotFoundCard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-sm w-full text-center">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
            <PackageSearch className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Sifariş tapılmadı
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Bu izləmə linki etibarsızdır və ya sifariş silinib. Zəhmət
              olmasa linki yenidən yoxlayın.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const deal = token
    ? await prisma.crmDeal.findUnique({
        where: { trackingToken: token },
        include: { stage: true, customer: true },
      })
    : null;

  if (!deal) {
    return <NotFoundCard />;
  }

  const customerName = deal.customer?.name || deal.clientName || "Müştəri";
  const stageColor = deal.stage?.color || "#6366f1";
  const stageTextColor = getReadableTextColor(stageColor);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="max-w-md w-full shadow-xl ring-1 ring-slate-200">
        <CardHeader className="items-center text-center pt-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg mb-3">
            <PackageSearch className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-xl">Sifariş İzləmə Paneli</CardTitle>
          <CardDescription>Sifarişinizin cari statusu</CardDescription>
        </CardHeader>

        <CardContent className="pt-2 pb-8">
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            <InfoRow icon={User} label="Müştəri Adı" value={customerName} />
            <InfoRow icon={PackageSearch} label="Sifarişin Adı" value={deal.title} />

            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <PackageSearch className="w-4 h-4 text-slate-400" />
                Hazırkı Mərhələ
              </span>
              <Badge
                style={{ backgroundColor: stageColor, color: stageTextColor }}
                className="border-transparent"
              >
                {deal.stage?.name || "Naməlum"}
              </Badge>
            </div>

            <InfoRow
              icon={Wallet}
              label="Məbləğ"
              value={formatAmount(deal.value, deal.currency)}
            />
            <InfoRow
              icon={CalendarClock}
              label="Son Tarix"
              value={formatDate(deal.deadline)}
            />
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Bu, yalnız sizin üçün nəzərdə tutulmuş şəxsi izləmə linkidir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="flex items-center gap-2 text-sm text-slate-500">
        <Icon className="w-4 h-4 text-slate-400" />
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-900 text-right">
        {value}
      </span>
    </div>
  );
}
