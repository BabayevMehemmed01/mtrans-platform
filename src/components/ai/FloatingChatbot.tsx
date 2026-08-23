"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export function FloatingChatbot() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setMessages((prev) =>
      prev.length === 0
        ? [{ id: "welcome", role: "assistant", content: t("aiAssistant.welcome") }]
        : prev
    );
  }, [open, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m.id !== "welcome")
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `${res.status} ${res.statusText || "Internal Error"}`);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.message || t("aiAssistant.error"),
        },
      ]);
    } catch (error) {
      const reason = error instanceof Error && error.message.trim()
        ? error.message
        : t("aiAssistant.error");
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: `${t("aiAssistant.unavailable")}: ${reason}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {open && (
        <Card className="fixed inset-0 z-50 flex h-full w-full flex-col overflow-hidden rounded-none border-0 bg-card shadow-xl ring-1 ring-foreground/10 md:inset-auto md:bottom-6 md:right-6 md:h-[600px] md:w-[400px] md:rounded-2xl md:border md:border-border">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{t("aiAssistant.title")}</p>
                <p className="text-[11px] text-muted-foreground">{t("aiAssistant.subtitle")}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 rounded-lg md:size-9"
              onClick={() => setOpen(false)}
              aria-label={t("aiAssistant.close")}
            >
              <X className="size-5 md:size-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-3 p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                      message.role === "user"
                        ? "ml-auto bg-blue-600 text-white"
                        : "mr-auto bg-muted text-foreground"
                    )}
                  >
                    {message.content}
                  </div>
                ))}
                {sending && (
                  <div className="mr-auto flex max-w-[85%] flex-col gap-1.5 rounded-2xl bg-muted px-3.5 py-3 shadow-sm">
                    <span className="text-[11px] text-muted-foreground">{t("aiAssistant.typing")}</span>
                    <Skeleton className="h-2.5 w-28" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
            <form
              className="flex items-center gap-2 border-t border-border/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage();
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("aiAssistant.placeholder")}
                className="h-11 rounded-xl md:h-9"
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                className="size-11 rounded-xl shadow-sm md:size-9"
                disabled={sending || !input.trim()}
                aria-label={t("aiAssistant.send")}
              >
                <Send className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Button
        type="button"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-50 size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 md:bottom-6 md:right-6",
          open && "hidden md:inline-flex"
        )}
        aria-label={open ? t("aiAssistant.close") : t("aiAssistant.open")}
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </Button>
    </>
  );
}
