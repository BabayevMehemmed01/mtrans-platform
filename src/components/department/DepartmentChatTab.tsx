"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import { Send, Paperclip, Loader2, AlertCircle, Phone, Video, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadButton } from "@/utils/uploadthing";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DepartmentChatTab({ departmentId, currentUserId }: { departmentId: string; currentUserId: string }) {
  // YENİ: Tərcümə
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const { data: channel, error: channelError } = useSWR(`/api/departments/${departmentId}/channel`, fetcher);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, mutate: mutateMessages } = useSWR(
    channel?.id ? `/api/chat/messages?channelId=${channel.id}` : null,
    fetcher,
    { refreshInterval: 3000 }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !channel?.id) return;

    const tempText = messageText;
    setMessageText("");

    mutateMessages((prev: any) => [
      ...(prev || []),
      { id: "temp-" + Date.now(), content: tempText, sender: { id: currentUserId }, createdAt: new Date().toISOString() },
    ], false);

    await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: channel.id, content: tempText }),
    });
    mutateMessages();
  };

  const handleUploadComplete = async (res: any[]) => {
    if (!channel?.id || !res || res.length === 0) return;
    const file = res[0];
    await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: channel.id, fileUrl: file.url, fileName: file.name, fileType: file.type }),
    });
    mutateMessages();
  };

  const handleGroupCall = () => {
    alert(t("departmentChatTab.groupCallAlert") || "Qrup zəngləri hazırda hazırlanır...");
  };

  if (channelError) {
    return (
      <div className="p-6 text-destructive flex items-center gap-2">
        <AlertCircle className="w-5 h-5" /> {t("departmentChatTab.fetchError") || "Söhbət kanalını yükləyərkən xəta baş verdi"}
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="p-6 flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] bg-card">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-foreground">{channel.name} {t("departmentChatTab.groupChat") || "— Qrup Söhbəti"}</h3>
          <p className="text-xs text-muted-foreground">
            {(t("departmentChatTab.members") || "{count} üzv").replace("{count}", String(channel.members?.length || 0))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleGroupCall} size="icon" variant="ghost" className="rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary" title={t("departmentChatTab.voiceCall") || "Səsli zəng"}>
            <Phone className="w-5 h-5" />
          </Button>
          <Button onClick={handleGroupCall} size="icon" variant="ghost" className="rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary" title={t("departmentChatTab.videoCall") || "Video zəng"}>
            <Video className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6 bg-muted/30">
        <div className="space-y-6">
          {!messages ? (
            <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-20">{t("departmentChatTab.noMessages") || "Bu qrupda hələ mesaj yoxdur. İlk mesajı siz yazın!"}</div>
          ) : (
            messages.map((msg: any) => {
              const isMe = msg.sender?.id === currentUserId;
              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                  <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                    <AvatarImage src={msg.sender?.avatar} />
                    <AvatarFallback className="text-[10px] bg-muted">
                      {msg.sender?.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                    <div className="flex items-baseline gap-2 mb-1 px-1">
                      <span className="text-xs font-medium text-foreground">{isMe ? (t("departmentChatTab.me") || "Mən") : msg.sender?.name}</span>
                      <span className="text-[10px] text-muted-foreground/70">{format(new Date(msg.createdAt), "HH:mm")}</span>
                    </div>

                    {msg.content && (
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border text-foreground rounded-tl-sm shadow-sm"}`}>
                        {msg.content}
                      </div>
                    )}

                    {msg.fileUrl && (
                      <div className={`mt-1 p-2 rounded-xl border border-border bg-card shadow-sm flex items-center gap-3 ${isMe ? "rounded-tr-sm" : "rounded-tl-sm"}`}>
                        <Paperclip className="w-5 h-5 text-muted-foreground" />
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline max-w-[200px] truncate">
                          {msg.fileName || (t("departmentChatTab.downloadFile") || "Faylı yüklə")}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="relative">
            <UploadButton
              endpoint="chatAttachment"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error: Error) => { 
                alert((t("departmentChatTab.errorPrefix") || "Xəta: {message}").replace("{message}", error.message)); 
              }}
              appearance={{
                button: "w-10 h-10 rounded-full bg-muted border-0 hover:bg-accent focus-within:ring-0 after:bg-transparent text-muted-foreground p-0 focus:ring-0 outline-none",
                allowedContent: "hidden",
              }}
              content={{ button: <Paperclip className="w-5 h-5 text-muted-foreground" /> }}
            />
          </div>
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={t("departmentChatTab.placeholder") || "Şöbə qrupuna mesaj yazın..."}
            className="flex-1 rounded-full bg-muted border-border focus-visible:ring-primary"
          />
          <Button type="submit" size="icon" className="rounded-full flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}