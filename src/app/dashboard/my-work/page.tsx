import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyWorkClient } from "./MyWorkClient";

export const metadata = {
  title: "Mənim İşlərim | ERP",
};

export default async function MyWorkPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mənim İşlərim</h1>
          <p className="text-sm text-muted-foreground mt-1">Gündəlik iş qrafikiniz, tapşırıqlar və xatırlatmalar.</p>
        </div>
      </div>
      <MyWorkClient currentUser={session.user} />
    </div>
  );
}
