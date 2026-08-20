import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatClient } from "./ChatClient";
import { getTranslation } from "@/lib/i18n";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  return { title: t("chatPage.title") || "Mesajlar" };
}

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="-m-6 h-[calc(100vh-64px)] overflow-hidden">
      <ChatClient currentUser={session.user} />
    </div>
  );
}
