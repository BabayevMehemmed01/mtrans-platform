import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyWorkClient } from "./MyWorkClient";
import { getTranslation } from "@/lib/i18n"; // YENİ

export const metadata = {
  title: "Mənim İşlərim | ERP",
};

export default async function MyWorkPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // YENİ: Dili oxuyub tərcümə obyektini qururuq
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t("myWork.title") || "Mənim İşlərim"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("myWork.desc") || "Gündəlik iş qrafikiniz, tapşırıqlar və xatırlatmalar."}
          </p>
        </div>
      </div>
      <MyWorkClient currentUser={session.user} />
    </div>
  );
}