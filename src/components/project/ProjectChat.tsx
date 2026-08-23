"use client";

import { useState } from "react";
import { Send, Paperclip, Smile, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ

interface ProjectChatProps {
  projectId: string;
  chatChannels?: any[];
  currentUserRole?: string;
}

export function ProjectChat({ projectId, chatChannels, currentUserRole }: ProjectChatProps) {
  // Tərcüməni qoşuruq
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [message, setMessage] = useState("");
  
  // Müvəqqəti mesajlar (Demo) - Tərcümə olunmuş vəziyyətdə
  const [messages, setMessages] = useState([
    { id: 1, text: t("projectChat.demoMsg1") || "Salam komanda! Layihəyə başladıq, ilk taskları təyin etdim.", sender: t("projectChat.admin") || "Admin", isMe: false, time: "10:30" },
    { id: 2, text: t("projectChat.demoMsg2") || "Əla, mən frontend hissəsini götürürəm.", sender: t("projectChat.you") || "Sən", isMe: true, time: "10:32" },
    { id: 3, text: t("projectChat.demoMsg3") || "Bəs dizayn fayllarını hara yüklədiniz?", sender: t("projectChat.you") || "Sən", isMe: true, time: "10:33" },
    { id: 4, text: t("projectChat.demoMsg4") || "Faylları 'Files' tabına və Figma-ya yükləmişəm. Linki qrupa atıram.", sender: t("projectChat.designer") || "Dizayner", isMe: false, time: "10:35" },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Mesajı local olaraq əlavə edirik
    setMessages([...messages, {
      id: Date.now(),
      text: message,
      sender: t("projectChat.you") || "Sən",
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setMessage("");
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      
      {/* Chat Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/70 flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-sm">#</span>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-foreground">
              {t("projectChat.generalChat") || "Ümumi Layihə Çatı"}
            </h2>
            <p className="text-[12px] font-medium text-muted-foreground">
              {t("projectChat.chatDesc") || "Komanda ilə birbaşa əlaqə"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="text-center">
          <span className="text-[11px] font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {t("projectChat.today") || "Bu gün"}
          </span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
            {!msg.isMe && (
              <span className="text-[11px] font-bold text-muted-foreground ml-1 mb-1">{msg.sender}</span>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
              msg.isMe 
                ? "bg-primary text-primary-foreground rounded-br-sm" 
                : "bg-card border border-border text-foreground rounded-bl-sm"
            }`}>
              <p className="text-[14px] leading-relaxed">{msg.text}</p>
              <span className={`text-[10px] font-medium mt-1 block text-right ${msg.isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {msg.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border">
        <form onSubmit={handleSend} className="max-w-[1200px] mx-auto relative flex items-center">
          <button type="button" className="absolute left-3 text-muted-foreground hover:text-primary transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("projectChat.placeholder") || "Mesajınızı yazın..."}
            className="w-full bg-muted border border-border rounded-full py-3 pl-12 pr-24 text-[14px] font-medium text-foreground outline-none focus:border-primary focus:bg-background transition-all shadow-inner"
          />
          
          <div className="absolute right-2 flex items-center gap-1">
            <button type="button" className="p-2 text-muted-foreground hover:text-amber-500 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <button 
              type="submit" 
              disabled={!message.trim()}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground p-2 rounded-full shadow-sm transition-all transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}