import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LabelsClient } from "./LabelsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Etiketlər" };

export default async function LabelsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  const labels = await prisma.label.findMany({
    where: { companyId },
    include: { _count: { select: { taskLabels: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Etiketlər</h2>
          <p className="text-[hsl(var(--muted-foreground))]">
            Tapşırıqları təsnifləndirmək üçün etiketləri idarə edin.
          </p>
        </div>
      </div>

      <LabelsClient initialLabels={labels} />
    </div>
  );
}
