import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import InventoryClient from "./InventoryClient";
import { getTranslation } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  return {
    title: t("inventory.metaTitle") || "Anbar İdarəetməsi (WMS) | M-Trans ERP",
    description: t("inventory.metaDesc") || "Məhsul kataloqu, stok hərəkətləri, anbar iyerarxiyası və ABC analitikası",
  };
}

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t("inventory.title") || "Anbar İdarəetməsi"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("inventory.subtitle") || "Məhsul kataloqu, stok hərəkətləri və real-time anbar analitikası"}
          </p>
        </div>
      </div>
      <InventoryClient />
    </div>
  );
}
