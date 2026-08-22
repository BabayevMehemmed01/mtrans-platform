import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import MarketingClient from "./MarketingClient";
import { getTranslation } from "@/lib/i18n";
import { getMarketingConfig } from "@/lib/marketing-config";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  return {
    title: t("marketing.metaTitle") || "Marketinq Kampaniyaları | M-Trans ERP",
    description: t("marketing.metaDesc") || "Çoxkanallı marketinq kampaniyaları, auditoriya seqmentləri və reklamlar",
  };
}

export default async function MarketingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  // Server tərəfindən .env-ə əsasən kanal aktivliyini hesabla və yalnız
  // hesablanmış boolean vəziyyəti (açarların özünü YOX) client-ə ötür.
  const { isEmailActive, isSmsActive, isWhatsappActive, isInstagramActive } = getMarketingConfig();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t("marketing.title") || "Marketinq Kampaniyaları"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("marketing.subtitle") || "Çoxkanallı kampaniyalar, auditoriya seqmentləri və reklamları idarə edin"}
          </p>
        </div>
      </div>
      <MarketingClient
        config={{ isEmailActive, isSmsActive, isWhatsappActive, isInstagramActive }}
      />
    </div>
  );
}
