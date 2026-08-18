import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatClient } from "./ChatClient";
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə
import type { Metadata } from "next";

// YENİ: Metadata dinamik tərcümə edilir
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  return { title: t("chatPage.title") || "Mesajlar" };
}

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // YENİ: Tərcüməni qoşuruq
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {t("chatPage.title") || "Mesajlaşma"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("chatPage.subtitle") || "Komanda yoldaşlarınızla əlaqədə qalın."}
          </p>
        </div>
      </div>
      <ChatClient currentUser={session.user} />
    </div>
  );
}