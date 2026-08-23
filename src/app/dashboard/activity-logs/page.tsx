import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/permissions";
import { getTranslation } from "@/lib/i18n";
import { ActivityLogsClient } from "./ActivityLogsClient";
import { AccessDenied } from "@/components/ui/access-denied";

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
      <AccessDenied
        title={t("activityLogs.accessDenied") || "İcazə yoxdur"}
        description={
          t("activityLogs.accessDeniedDesc") ||
          "Bu səhifəni yalnız Super Admin və şirkət rəhbəri görə bilər."
        }
      />
    );
  }

  return <ActivityLogsClient />;
}
