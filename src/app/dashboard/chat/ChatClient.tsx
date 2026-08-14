"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Send, Paperclip, Hash, User as UserIcon, Loader2, Building, MessageSquare, AlertCircle, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadButton } from "@/utils/uploadthing";
import { useCallStore } from "@/store/useCallStore";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ChatClient({ currentUser }: { currentUser: any }) {
  const { data: channelsData, error: channelsError } = useSWR("/api/chat/channels", fetcher, { refreshInterval: 5000 });
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeChannelId) return;

    const tempText = messageText;
    setMessageText("");

    // Optimistic update
    mutateMessages((prev: any) => [...(prev || []), {
      id: "temp-" + Date.now(),
      content: tempText,
      sender: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
      createdAt: new Date().toISOString()
    }], false);

    await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: activeChannelId, content: tempText })
    });
    mutateMessages();
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
        fileType: file.type
      })
    });
    mutateMessages();
  };

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
        alert(err.error || "Zəng başladıla bilmədi");
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
      alert("Zəng başladıla bilmədi");
    } finally {
      setCallStarting(false);
    }
  };

  const createDirectMessage = async (userId: string) => {
    const res = await fetch("/api/chat/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId })
    });
    const channel = await res.json();
    setActiveChannelId(channel.id);
  };

  if (channelsError) return <div className="p-4 text-red-500 flex items-center"><AlertCircle className="w-5 h-5 mr-2" /> Kanalları yükləyərkən xəta baş verdi</div>;
  if (!channelsData) return <div className="p-4 flex items-center justify-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  const channels = channelsData.channels || [];
  const companyUsers = channelsData.companyUsers || [];

  const projectChannels = channels.filter((c: any) => c.type === "PROJECT");
  const deptChannels = channels.filter((c: any) => c.type === "DEPARTMENT");
  const directChannels = channels.filter((c: any) => c.type === "DIRECT");

  const activeChannel = channels.find((c: any) => c.id === activeChannelId);

  const getChannelName = (c: any) => {
    if (c.type !== "DIRECT") return c.name;
    const otherMember = c.members.find((m: any) => m.user.id !== currentUser.id);
    return otherMember ? otherMember.user.name : "Naməlum";
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-white rounded-xl border overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-gray-50/50 border-r flex flex-col">
        <div className="p-4 border-b bg-white">
          <h2 className="font-semibold text-lg">Mesajlar</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            
            {/* Project Groups */}
            {projectChannels.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Layihə Qrupları</h3>
                <div className="space-y-1">
                  {projectChannels.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${activeChannelId === c.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Department Groups */}
            {deptChannels.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Şöbə Qrupları</h3>
                <div className="space-y-1">
                  {deptChannels.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${activeChannelId === c.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Messages */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Şəxsi Söhbətlər</h3>
                <div className="space-y-1">
                  {directChannels.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${activeChannelId === c.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-200'}`}
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">
                          {getChannelName(c).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{getChannelName(c)}</span>
                    </button>
                  ))}
                </div>
                
                {/* Users to start chat */}
                {companyUsers.length > 0 && (
                  <div className="mt-4">
                     <p className="text-[10px] text-gray-400 uppercase mb-2 px-2">Yeni Söhbət Başla</p>
                     {companyUsers.map((u: any) => (
                        <button
                          key={u.id}
                          onClick={() => createDirectMessage(u.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{u.name}</span>
                        </button>
                     ))}
                  </div>
                )}
            </div>

          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChannel ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              {activeChannel.type === "DIRECT" ? (
                <Avatar className="w-10 h-10 border shadow-sm">
                   <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-medium">
                      {getChannelName(activeChannel).substring(0, 2).toUpperCase()}
                   </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                   {activeChannel.type === "PROJECT" ? <Hash className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{getChannelName(activeChannel)}</h3>
                <p className="text-xs text-muted-foreground">
                  {activeChannel.type === "DIRECT" ? "Şəxsi söhbət" : `${activeChannel.members?.length || 0} üzv`}
                </p>
              </div>
              {activeChannel.members?.length === 2 && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => startCall("AUDIO")}
                    disabled={callStarting}
                    size="icon"
                    variant="ghost"
                    className="rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    title="Səsli zəng"
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => startCall("VIDEO")}
                    disabled={callStarting}
                    size="icon"
                    variant="ghost"
                    className="rounded-full text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    title="Video zəng"
                  >
                    <Video className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 p-6 bg-slate-50/50">
              <div className="space-y-6">
                {!messages ? (
                  <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-20">Bu söhbətdə hələ mesaj yoxdur.</div>
                ) : (
                  messages.map((msg: any) => {
                    const isMe = msg.sender?.id === currentUser.id;
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                          <AvatarImage src={msg.sender?.avatar} />
                          <AvatarFallback className="text-[10px] bg-slate-200">
                            {msg.sender?.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className="flex items-baseline gap-2 mb-1 px-1">
                            <span className="text-xs font-medium text-gray-900">{isMe ? 'Mən' : msg.sender?.name}</span>
                            <span className="text-[10px] text-gray-400">{format(new Date(msg.createdAt), "HH:mm")}</span>
                          </div>
                          
                          {msg.content && (
                            <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border text-gray-800 rounded-tl-sm shadow-sm'}`}>
                              {msg.content}
                            </div>
                          )}

                          {msg.fileUrl && (
                            <div className={`mt-1 p-2 rounded-xl border bg-white shadow-sm flex items-center gap-3 ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                               <Paperclip className="w-5 h-5 text-gray-400" />
                               <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline max-w-[200px] truncate">
                                 {msg.fileName || "Faylı yüklə"}
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

            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="relative">
                  <UploadButton
                    endpoint="chatAttachment"
                    onClientUploadComplete={handleUploadComplete}
                    onUploadError={(error: Error) => { alert(`Xəta: ${error.message}`); }}
                    appearance={{
                      button: "w-10 h-10 rounded-full bg-gray-100 border-0 hover:bg-gray-200 focus-within:ring-0 after:bg-transparent text-gray-600 p-0 focus:ring-0 outline-none",
                      allowedContent: "hidden",
                    }}
                    content={{
                      button: <Paperclip className="w-5 h-5 text-gray-600" />,
                    }}
                  />
                </div>
                <Input 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Mesajınızı yazın..." 
                  className="flex-1 rounded-full bg-gray-50 border-gray-200 focus-visible:ring-blue-500"
                />
                <Button type="submit" size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700 flex-shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Söhbət seçin</h3>
            <p className="max-w-xs">Mesajlaşmağa başlamaq üçün sol tərəfdən layihə, şöbə qrupu və ya şəxsi söhbət seçin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
