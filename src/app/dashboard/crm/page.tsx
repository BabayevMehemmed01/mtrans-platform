import { auth } from "@/lib/auth"; // YENİ: Metadata və səhifədə sessiya yoxlanışı üçün əlavə edildi
import { redirect } from "next/navigation";
import { Metadata } from "next";
import CrmClient from "./CrmClient";
import { getTranslation } from "@/lib/i18n";
import { canAccessModule } from "@/lib/module-access";
import { AccessDenied } from "@/components/ui/access-denied";

// YENİ: Dinamik Metadata
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  return {
    title: t("crm.metaTitle") || "CRM | M-Trans ERP",
    description: t("crm.metaDesc") || "Müştəri Münasibətləri və Satış İdarəetməsi",
  };
}

export default async function CrmPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // YENİ: Tərcümə mühərrikini çağırırıq
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  const canView = await canAccessModule(session.user.id, "crm", "view");
  if (!canView) {
    return (
      <AccessDenied
        title="Access Denied"
        description="CRM moduluna giriş icazəniz yoxdur."
      />
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("crm.title") || "CRM"}
        </h2>
      </div>
      <CrmClient />
    </div>
  );
}