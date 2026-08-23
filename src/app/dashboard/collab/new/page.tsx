import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { NewCollabForm } from "./NewCollabForm";
import { getTranslation } from "@/lib/i18n"; // YENİ

export default async function NewCollabPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  // YENİ: Tərcümə
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <Link
          href="/dashboard/collab"
          className="p-2 border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {t("newCollab.title") || "Yeni Ortaq (Collab) Layihə"}
          </h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            {t("newCollab.subtitle") || "Bu layihəyə istənilən şöbədən işçi dəvət edə biləcəksiniz."}
          </p>
        </div>
      </div>

      <NewCollabForm />
    </div>
  );
}