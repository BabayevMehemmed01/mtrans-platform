"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import {
  Send,
  Paperclip,
  Hash,
  User as UserIcon,
  Loader2,
  Building,
  MessageSquare,
  AlertCircle,
  Phone,
  Video,
  Search,
  Smile,
  Plus,
  Mic,
  ChevronDown,
  Image as ImageIcon,
  FileText,
  X,
  Reply,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UploadButton } from "@/utils/uploadthing";
import { useCallStore } from "@/store/useCallStore";
import { cn, getInitials } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type ChatTab = "all" | "direct" | "groups";

export function ChatClient({ currentUser }: { currentUser: any }) {
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const { data: channelsData, error: channelsError, mutate: mutateChannels } = useSWR(
    "/api/chat/channels",
    fetcher,
    { refreshInterval: 5000 }
  );
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [listQuery, setListQuery] = useState("");
  const [listTab, setListTab] = useState<ChatTab>("all");
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages, mutate: mutateMessages } = useSWR(
    activeChannelId ? `/api/chat/messages?channelId=${activeChannelId}` : null,
    fetcher,
    { refreshInterval: 3000 }
  );

  const setActiveCall = useCallStore((s) => s.setActiveCall);
  const [callStarting, setCallStarting] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setReplyTo(null);
    setHeaderQuery("");
    setHeaderSearchOpen(false);
  }, [activeChannelId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeChannelId) return;

    const tempText = messageText;
    const quoted = replyTo;
    setMessageText("");
    setReplyTo(null);
    if (textareaRef.current) textareaRef.current.style.height = "40px";

    mutateMessages(
      (prev: any) => [
        ...(prev || []),
        {
          id: "temp-" + Date.now(),
          content: tempText,
          sender: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar || currentUser.image },
          createdAt: new Date().toISOString(),
          replyPreview: quoted
            ? { name: quoted.sender?.name, content: quoted.content || quoted.fileName }
            : null,
        },
      ],
      false
    );

    await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: activeChannelId, content: tempText }),
    });
    mutateMessages();
    mutateChannels();
  };

  const handleUploadComplete = async (res: any[]) => {
    if (!activeChannelId || !res || res.length === 0) return;
    const file = res[0];

    await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId: activeChannelId,
        fileUrl: file.url,
        fileName: file.name,
        fileType: file.type,
      }),
    });
    mutateMessages();
    mutateChannels();
  };

  const insertEmoji = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "40px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const getChannelName = (c: any) => {
    if (!c) return t("chatClient.unknown") || "Naməlum";
    if (c.type !== "DIRECT") return c.name;
    const otherMember = c.members?.find((m: any) => m.user.id !== currentUser.id);
    return otherMember ? otherMember.user.name : t("chatClient.unknown") || "Naməlum";
  };

  const channels = channelsData?.channels || [];
  const companyUsers = channelsData?.companyUsers || [];
  const activeChannel = channels.find((c: any) => c.id === activeChannelId);

  const filteredChannels = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return channels.filter((c: any) => {
      if (listTab === "direct" && c.type !== "DIRECT") return false;
      if (listTab === "groups" && c.type === "DIRECT") return false;
      if (!q) return true;
      const name = c.type !== "DIRECT"
        ? c.name
        : c.members?.find((m: any) => m.user.id !== currentUser.id)?.user?.name || "";
      return String(name).toLowerCase().includes(q);
    });
  }, [channels, listQuery, listTab, currentUser.id]);

  const visibleUsers = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return companyUsers;
    return companyUsers.filter((u: any) => u.name?.toLowerCase().includes(q));
  }, [companyUsers, listQuery]);

  const visibleMessages = useMemo(() => {
    if (!Array.isArray(messages)) return [];
    const q = headerQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m: any) => (m.content || m.fileName || "").toLowerCase().includes(q));
  }, [messages, headerQuery]);

  const startCall = async (type: "AUDIO" | "VIDEO") => {
    if (!activeChannel || callStarting) return;
    const otherMember = activeChannel.members?.find((m: any) => m.user.id !== currentUser.id);
    setCallStarting(true);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: activeChannel.id, type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || t("chatClient.callFailed") || "Zəng başladıla bilmədi");
        return;
      }
      const call = await res.json();
      setActiveCall({
        id: call.id,
        channelId: activeChannel.id,
        type,
        role: "caller",
        status: "RINGING",
        peerName: otherMember?.user?.name || getChannelName(activeChannel),
        peerAvatar: otherMember?.user?.avatar,
      });
    } catch (err) {
      console.error(err);
      alert(t("chatClient.callFailed") || "Zəng başladıla bilmədi");
    } finally {
      setCallStarting(false);
    }
  };

  const createDirectMessage = async (userId: string) => {
    const res = await fetch("/api/chat/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId }),
    });
    const channel = await res.json();
    setActiveChannelId(channel.id);
    mutateChannels();
  };

  const getChannelAvatar = (c: any) => {
    if (c.type !== "DIRECT") return null;
    return c.members?.find((m: any) => m.user.id !== currentUser.id)?.user?.avatar ?? null;
  };

  const lastMessageText = (c: any) => {
    const last = c.messages?.[0];
    if (!last) return t("chatClient.noMessages") || "Bu söhbətdə hələ mesaj yoxdur.";
    if (last.content) return last.content;
    return last.fileName || t("chatClient.downloadFile") || "Fayl";
  };

  const hasUnread = (c: any) => {
    const last = c.messages?.[0];
    if (!last || last.senderId === currentUser.id) return false;
    const me = c.members?.find((m: any) => m.userId === currentUser.id || m.user?.id === currentUser.id);
    if (!me?.lastReadAt) return Boolean(last);
    return new Date(last.createdAt) > new Date(me.lastReadAt);
  };

  if (channelsError) {
    return (
      <div className="flex h-full items-center p-4 text-red-500">
        <AlertCircle className="mr-2 h-5 w-5" />
        {t("chatClient.fetchError") || "Kanalları yükləyərkən xəta baş verdi"}
      </div>
    );
  }

  if (!channelsData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  const tabs: { id: ChatTab; label: string }[] = [
    { id: "all", label: t("chatClient.tabAll") || "Bütün" },
    { id: "direct", label: t("chatClient.tabDirect") || "Şəxsi" },
    { id: "groups", label: t("chatClient.tabGroups") || "Qruplar" },
  ];

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Left: 30% conversation list */}
      <aside className="flex w-[30%] min-w-[260px] flex-col border-r border-[#e9edef] bg-white">
        <div className="sticky top-0 z-10 space-y-2 bg-[#f0f2f5] px-3 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#54656f]" />
            <Input
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              placeholder={t("chatClient.messages") || "Mesajlar"}
              className="h-9 rounded-lg border-0 bg-white pl-9 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setListTab(tab.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-all",
                  listTab === tab.id
                    ? "bg-[#d9fdd3] text-[#136c3b]"
                    : "bg-white text-[#54656f] hover:bg-gray-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15">
          {filteredChannels.map((c: any) => {
            const unread = hasUnread(c);
            const last = c.messages?.[0];
            const active = activeChannelId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveChannelId(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-[#f0f2f5] px-3 py-3 text-left transition-all hover:bg-gray-100",
                  active && "bg-[#f0f2f5]"
                )}
              >
                {c.type === "DIRECT" ? (
                  <Avatar className="size-12">
                    <AvatarImage src={getChannelAvatar(c) ?? undefined} />
                    <AvatarFallback className="bg-[#dfe5e7] text-sm text-[#54656f]">
                      {getInitials(getChannelName(c))}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] text-[#54656f]">
                    {c.type === "PROJECT" ? <Hash className="size-5" /> : <Building className="size-5" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-[#111b21]">{getChannelName(c)}</p>
                    <span className={cn("shrink-0 text-[11px]", unread ? "font-medium text-[#25d366]" : "text-[#667781]")}>
                      {last?.createdAt ? format(new Date(last.createdAt), "HH:mm") : ""}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] text-[#667781]">{lastMessageText(c)}</p>
                    {unread && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[10px] font-semibold text-white">
                        1
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {visibleUsers.length > 0 && listTab !== "groups" && (
            <div className="px-3 py-2">
              <p className="px-1 pb-1 text-[10px] font-semibold tracking-wider text-[#667781] uppercase">
                {t("chatClient.newChat") || "Yeni Söhbət Başla"}
              </p>
              {visibleUsers.map((u: any) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => createDirectMessage(u.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-all hover:bg-gray-100"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm text-[#111b21]">{u.name}</span>
                  <UserIcon className="ml-auto size-4 text-[#667781]" />
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Right: 70% conversation */}
      <section className="flex min-w-0 w-[70%] flex-col bg-[#efeae2]">
        {activeChannel ? (
          <>
            <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-4">
              {activeChannel.type === "DIRECT" ? (
                <Avatar className="size-10">
                  <AvatarImage src={getChannelAvatar(activeChannel) ?? undefined} />
                  <AvatarFallback>{getInitials(getChannelName(activeChannel))}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-[#dfe5e7] text-[#54656f]">
                  {activeChannel.type === "PROJECT" ? <Hash className="size-5" /> : <Building className="size-5" />}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {headerSearchOpen ? (
                  <Input
                    autoFocus
                    value={headerQuery}
                    onChange={(e) => setHeaderQuery(e.target.value)}
                    placeholder={t("header.search") || "Axtar..."}
                    className="h-8 border-0 bg-white text-sm"
                  />
                ) : (
                  <>
                    <h3 className="truncate text-sm font-semibold text-[#111b21]">
                      {getChannelName(activeChannel)}
                    </h3>
                    <p className="text-xs text-[#667781]">
                      {activeChannel.type === "DIRECT"
                        ? t("chatClient.online") || "Online"
                        : (t("chatClient.membersCount") || "{count} üzv").replace(
                            "{count}",
                            String(activeChannel.members?.length || 0)
                          )}
                    </p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 text-[#54656f]">
                {activeChannel.members?.length === 2 && (
                  <>
                    <Button
                      onClick={() => startCall("VIDEO")}
                      disabled={callStarting}
                      size="icon"
                      variant="ghost"
                      className="rounded-full"
                      title={t("chatClient.videoCall") || "Video zəng"}
                    >
                      <Video className="size-5" />
                    </Button>
                    <Button
                      onClick={() => startCall("AUDIO")}
                      disabled={callStarting}
                      size="icon"
                      variant="ghost"
                      className="rounded-full"
                      title={t("chatClient.voiceCall") || "Səsli zəng"}
                    >
                      <Phone className="size-5" />
                    </Button>
                  </>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setHeaderSearchOpen((v) => !v)}
                >
                  <Search className="size-5" />
                </Button>
              </div>
            </header>

            <div className="relative min-h-0 flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/20">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23111b21' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")",
                }}
              />
              <div className="relative space-y-1">
                {!messages ? (
                  <div className="flex justify-center pt-16">
                    <Loader2 className="size-6 animate-spin text-[#667781]" />
                  </div>
                ) : visibleMessages.length === 0 ? (
                  <p className="pt-16 text-center text-sm text-[#667781]">
                    {t("chatClient.noMessages") || "Bu söhbətdə hələ mesaj yoxdur."}
                  </p>
                ) : (
                  visibleMessages.map((msg: any) => {
                    const isMe = msg.sender?.id === currentUser.id;
                    return (
                      <div key={msg.id} className={cn("group flex", isMe ? "justify-end" : "justify-start")}>
                        <div className="relative max-w-[75%]">
                          <div
                            className={cn(
                              "rounded-lg px-2.5 py-1.5 text-sm shadow-sm",
                              isMe
                                ? "rounded-tr-none bg-[#d9fdd3] text-[#111b21]"
                                : "rounded-tl-none bg-white text-[#111b21]"
                            )}
                          >
                            {!isMe && activeChannel.type !== "DIRECT" && (
                              <p className="mb-0.5 text-[11px] font-semibold text-[#06cf9c]">
                                {msg.sender?.name}
                              </p>
                            )}
                            {msg.replyPreview && (
                              <div className="mb-1 rounded border-l-4 border-[#06cf9c] bg-black/5 px-2 py-1">
                                <p className="text-[11px] font-medium text-[#06cf9c]">{msg.replyPreview.name}</p>
                                <p className="truncate text-[11px] text-[#667781]">{msg.replyPreview.content}</p>
                              </div>
                            )}
                            {msg.content && <p className="whitespace-pre-wrap break-words leading-5">{msg.content}</p>}
                            {msg.fileUrl && (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 flex items-center gap-2 text-[#027eb5] hover:underline"
                              >
                                <Paperclip className="size-4" />
                                <span className="max-w-[200px] truncate text-sm">
                                  {msg.fileName || t("chatClient.downloadFile") || "Faylı yüklə"}
                                </span>
                              </a>
                            )}
                            <div className="mt-0.5 flex items-center justify-end gap-1">
                              {reactions[msg.id] && <span className="text-xs">{reactions[msg.id]}</span>}
                              <span className="text-[11px] text-[#667781]">
                                {format(new Date(msg.createdAt), "HH:mm")}
                              </span>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "absolute top-0 hidden items-center gap-0.5 rounded-full bg-white/90 px-0.5 shadow-sm group-hover:flex",
                              isMe ? "-left-16" : "-right-16"
                            )}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="rounded-full p-1 hover:bg-gray-100">
                                  <Smile className="size-3.5 text-[#54656f]" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="flex gap-1 p-1">
                                {EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className="rounded p-1 text-base hover:bg-gray-100"
                                    onClick={() =>
                                      setReactions((prev) => ({ ...prev, [msg.id]: emoji }))
                                    }
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="rounded-full p-1 hover:bg-gray-100">
                                  <ChevronDown className="size-3.5 text-[#54656f]" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isMe ? "end" : "start"}>
                                <DropdownMenuItem onClick={() => setReplyTo(msg)}>
                                  <Reply className="mr-2 size-4" />
                                  {t("chatClient.reply") || "Cavab ver"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="shrink-0 bg-[#f0f2f5] px-3 py-2">
              {replyTo && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border-l-4 border-[#06cf9c] bg-white px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#06cf9c]">
                      {replyTo.sender?.id === currentUser.id
                        ? t("chatClient.me") || "Mən"
                        : replyTo.sender?.name}
                    </p>
                    <p className="truncate text-xs text-[#667781]">
                      {replyTo.content || replyTo.fileName}
                    </p>
                  </div>
                  <button type="button" onClick={() => setReplyTo(null)} className="text-[#54656f]">
                    <X className="size-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-end gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" size="icon" variant="ghost" className="mb-0.5 rounded-full text-[#54656f]">
                      <Smile className="size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="grid grid-cols-6 gap-1 p-2">
                    {EMOJIS.concat(["🔥", "👏", "🎉", "👌", "😁", "🤝"]).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="rounded p-1 text-lg hover:bg-gray-100"
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" size="icon" variant="ghost" className="mb-0.5 rounded-full text-[#54656f]">
                      <Plus className="size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem className="gap-2" onSelect={(e) => e.preventDefault()}>
                      <ImageIcon className="size-4" />
                      {t("chatClient.attachImage") || "Şəkil"}
                      <span className="sr-only">upload</span>
                    </DropdownMenuItem>
                    <div className="px-2 pb-2">
                      <UploadButton
                        endpoint="chatAttachment"
                        onClientUploadComplete={handleUploadComplete}
                        onUploadError={(error: Error) => {
                          alert(
                            (t("chatClient.errorPrefix") || "Xəta: {message}").replace(
                              "{message}",
                              error.message
                            )
                          );
                        }}
                        appearance={{
                          button:
                            "w-full h-8 ut-ready:bg-transparent ut-uploading:bg-transparent after:bg-transparent text-sm text-[#111b21] border-0 shadow-none",
                          allowedContent: "hidden",
                        }}
                        content={{
                          button: (
                            <span className="flex items-center gap-2">
                              <FileText className="size-4" />
                              {t("chatClient.attachFile") || "Fayl / şəkil"}
                            </span>
                          ),
                        }}
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    resizeTextarea();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={t("chatClient.placeholder") || "Mesajınızı yazın..."}
                  rows={1}
                  className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-lg border-0 bg-white px-3 py-2.5 text-sm shadow-none focus-visible:ring-0"
                />

                {messageText.trim() ? (
                  <Button
                    type="submit"
                    size="icon"
                    className="mb-0.5 rounded-full bg-[#00a884] text-white hover:bg-[#008f72]"
                  >
                    <Send className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="mb-0.5 rounded-full text-[#54656f]"
                    title={t("chatClient.voiceMessage") || "Səsli mesaj"}
                  >
                    <Mic className="size-5" />
                  </Button>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center border-b-[6px] border-[#00a884] bg-[#f0f2f5] text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-white shadow-sm">
              <MessageSquare className="size-10 text-[#00a884]" />
            </div>
            <h3 className="text-xl font-light text-[#41525d]">
              {t("chatClient.selectChatTitle") || "Söhbət seçin"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-[#667781]">
              {t("chatClient.selectChatDesc") ||
                "Mesajlaşmağa başlamaq üçün sol tərəfdən layihə, şöbə qrupu və ya şəxsi söhbət seçin."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
