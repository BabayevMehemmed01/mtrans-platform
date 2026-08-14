import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as any).companyId) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--muted))] p-4">
      <div className="max-w-md w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--primary))]/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-[hsl(var(--primary))]" />
        </div>
        <h1 className="text-xl font-bold mb-2">Hesabınız hələ bir şirkətə bağlı deyil</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
          {session.user.email} ilə giriş etmisiniz, lakin hesabınız hazırda heç bir şirkət
          işçi heyətinə aid edilməyib. Bunun üçün şirkət administratorunuzla əlaqə saxlayın
          və sizi dəvət etməsini xahiş edin, və ya yeni şirkət qeydiyyatı keçin.
        </p>
        <div className="flex flex-col gap-2">
          <a
            href="/register"
            className="inline-flex items-center justify-center h-10 rounded-lg bg-[hsl(var(--primary))] text-white text-sm font-medium hover:bg-[hsl(var(--primary))]/90 transition-colors"
          >
            Yeni Şirkət Qeydiyyatı
          </a>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center h-10 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors"
            >
              Çıxış Et
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
