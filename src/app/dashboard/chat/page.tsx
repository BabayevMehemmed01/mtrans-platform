import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatClient } from "./ChatClient";

export const metadata = {
  title: "Mesajlar | ERP",
};

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mesajlaşma</h1>
          <p className="text-sm text-muted-foreground mt-1">Komanda yoldaşlarınızla əlaqədə qalın.</p>
        </div>
      </div>
      <ChatClient currentUser={session.user} />
    </div>
  );
}
