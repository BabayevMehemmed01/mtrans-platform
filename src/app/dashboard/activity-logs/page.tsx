import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { getTranslation } from "@/lib/i18n";
import { ActivityLogsClient } from "./ActivityLogsClient";
import { ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Fəaliyyət Jurnalı | ERP",
};

export default async function ActivityLogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);
  const allowed = await isSuperAdmin(session.user.id);

  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-xl border border-border bg-white p-8 text-center shadow-sm dark:bg-card">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            {t("activityLogs.accessDenied") || "İcazə yoxdur"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("activityLogs.accessDeniedDesc") ||
              "Bu səhifəni yalnız Super Admin və şirkət rəhbəri görə bilər."}
          </p>
        </div>
      </div>
    );
  }

  return <ActivityLogsClient />;
}
