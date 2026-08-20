"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { getTranslation } from "@/lib/i18n";
import {
  Send,
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
  Download,
  X,
  Reply,
  SquarePen,
  Users,
  Trash2,
  Pin,
  Settings,
  Pencil,
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadButton, uploadFiles } from "@/utils/uploadthing";
import { useCallStore } from "@/store/useCallStore";
import { cn, getInitials } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const REPLY_STORE_KEY = "chat-reply-previews";

type ReplyPreview = { name: string; content: string };

const loadReplyStore = (): Record<string, ReplyPreview> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(REPLY_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const formatRecordTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const pickRecorderMime = () => {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read audio"));
    };
    reader.onerror = () => reject(reader.error || new Error("Failed to read audio"));
    reader.readAsDataURL(blob);
  });

const isAudioMessage = (msg: any) =>
  String(msg?.fileType || "").startsWith("audio/") ||
  /\.(webm|ogg|mp3|m4a|wav)$/i.test(String(msg?.fileName || ""));

const isImageMessage = (msg: any) =>
  String(msg?.fileType || "").startsWith("image/") ||
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(msg?.fileName || ""));

type ChatTab = "all" | "direct" | "departments" | "projects" | "collab";
type NewChatModule = "direct" | "departments" | "projects" | "collab";

const channelModule = (c: any): Exclude<ChatTab, "all"> => {
  if (c?.type === "DIRECT") return "direct";
  if (c?.type === "DEPARTMENT") return "departments";
  if (c?.type === "PROJECT" && !c?.project?.departmentId) return "collab";
  return "projects";
};

const isChannelAdmin = (c: any, userId: string, superAdmin = false) => {
  if (!c || c.type === "DIRECT") return false;
  if (superAdmin) return true;
  if (c.type === "DEPARTMENT") return c.department?.headUserId === userId;
  if (c.project?.ownerId === userId) return true;
  const role = c.project?.members?.find((m: any) => m.userId === userId)?.role;
  return role === "OWNER" || role === "MANAGER";
};

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
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [dialogQuery, setDialogQuery] = useState("");
  const [dialogTab, setDialogTab] = useState<NewChatModule>("direct");
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState<any | null>(null);
  const [replyPreviews, setReplyPreviews] = useState<Record<string, ReplyPreview>>(loadReplyStore);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceSending, setVoiceSending] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sendAfterStopRef = useRef(false);
  const sendVoiceBlobRef = useRef<(blob: Blob, mimeType: string, quoted?: any) => Promise<void>>(async () => {});
  const replyingRef = useRef<any>(null);
  replyingRef.current = replyingToMessage;

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
    try {
      sessionStorage.setItem(REPLY_STORE_KEY, JSON.stringify(replyPreviews));
    } catch {
      // ignore quota / private mode
    }
  }, [replyPreviews]);

  const replySnippet = (msg: any) => {
    if (msg?.content) return String(msg.content);
    if (isAudioMessage(msg)) return t("chatClient.voiceMessage") || "Səsli mesaj";
    return msg?.fileName || t("chatClient.downloadFile") || "Fayl";
  };

  const replyAuthor = (msg: any) =>
    msg?.sender?.id === currentUser.id
      ? t("chatClient.me") || "Mən"
      : msg?.sender?.name || t("chatClient.unknown") || "Naməlum";

  const rememberReply = (messageId: string | undefined, quoted: any | null) => {
    if (!messageId || !quoted) return;
    const preview: ReplyPreview = {
      name: replyAuthor(quoted),
      content: replySnippet(quoted),
    };
    setReplyPreviews((prev) => ({ ...prev, [messageId]: preview }));
  };

  const stopMediaTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const clearRecordingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetRecordingUi = () => {
    clearRecordingTimer();
    setIsRecording(false);
    setRecordSeconds(0);
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    sendAfterStopRef.current = false;
    stopMediaTracks();
  };

  const cancelRecording = () => {
    sendAfterStopRef.current = false;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      resetRecordingUi();
    }
  };

  useEffect(() => {
    setReplyingToMessage(null);
    setHeaderQuery("");
    setHeaderSearchOpen(false);
    setProfileOpen(false);
    setGroupSettingsOpen(false);
    setEditingProfile(false);
    cancelRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset composer when switching chats
  }, [activeChannelId]);

  useEffect(() => {
    return () => {
      sendAfterStopRef.current = false;
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      stopMediaTracks();
      clearRecordingTimer();
    };
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeChannelId || isRecording) return;

    const tempText = messageText;
    const quoted = replyingToMessage;
    const preview = quoted
      ? { name: replyAuthor(quoted), content: replySnippet(quoted) }
      : null;
    setMessageText("");
    setReplyingToMessage(null);
    if (textareaRef.current) textareaRef.current.style.height = "40px";

    mutateMessages(
      (prev: any) => [
        ...(prev || []),
        {
          id: "temp-" + Date.now(),
          content: tempText,
          sender: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar || currentUser.image },
          createdAt: new Date().toISOString(),
          replyPreview: preview,
        },
      ],
      false
    );

    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: activeChannelId, content: tempText }),
    });
    const saved = await res.json().catch(() => null);
    rememberReply(saved?.id, quoted);
    mutateMessages();
    mutateChannels();
  };

  const postUploadedFile = async (file: { url?: string; ufsUrl?: string; name?: string; type?: string }, quoted = replyingRef.current) => {
    if (!activeChannelId) return;
    const fileUrl = file.ufsUrl || file.url;
    if (!fileUrl) return;

    setReplyingToMessage(null);

    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId: activeChannelId,
        fileUrl,
        fileName: file.name,
        fileType: file.type,
      }),
    });
    const saved = await res.json().catch(() => null);
    rememberReply(saved?.id, quoted);
    mutateMessages();
    mutateChannels();
  };

  const handlePickedFile = async (file: File | undefined) => {
    if (!file || !activeChannelId) return;
    try {
      const res = await uploadFiles("chatAttachment", { files: [file] });
      if (!res?.[0]) return;
      await postUploadedFile({
        ...res[0],
        name: file.name || res[0].name,
        type: file.type || res[0].type,
      });
    } catch (error) {
      alert(
        (t("chatClient.errorPrefix") || "Xəta: {message}").replace(
          "{message}",
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  };

  const sendVoiceBlob = async (blob: Blob, mimeType: string, quotedArg?: any) => {
    if (!activeChannelId || blob.size === 0) {
      setVoiceSending(false);
      if (blob.size === 0) {
        alert(t("chatClient.recordingError") || "Səs yazıla bilmədi");
      }
      return;
    }
    setVoiceSending(true);
    const audioType = (mimeType || "audio/webm").split(";")[0] || "audio/webm";
    const ext = audioType.includes("mp4") ? "m4a" : audioType.includes("ogg") ? "ogg" : "webm";
    const fileName = `voice-${Date.now()}.${ext}`;
    const quoted = quotedArg ?? replyingRef.current;
    const previewUrl = URL.createObjectURL(blob);
    const tempId = "temp-voice-" + Date.now();
    mutateMessages(
      (prev: any) => [
        ...(prev || []),
        {
          id: tempId,
          fileUrl: previewUrl,
          fileName,
          fileType: audioType,
          sender: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar || currentUser.image },
          createdAt: new Date().toISOString(),
          replyPreview: quoted
            ? { name: replyAuthor(quoted), content: replySnippet(quoted) }
            : null,
        },
      ],
      false
    );
    try {
      const dataUrl = await blobToDataUrl(blob);
      mutateMessages(
        (prev: any) =>
          Array.isArray(prev)
            ? prev.map((m: any) => (m.id === tempId ? { ...m, fileUrl: dataUrl } : m))
            : prev,
        false
      );
      URL.revokeObjectURL(previewUrl);

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: activeChannelId,
          fileUrl: dataUrl,
          fileName,
          fileType: audioType,
        }),
      });
      if (!res.ok) throw new Error("voice send failed");
      const saved = await res.json().catch(() => null);
      rememberReply(saved?.id, quoted);
      setReplyingToMessage(null);
      await mutateMessages();
      await mutateChannels();
    } catch (error) {
      console.error(error);
      alert(t("chatClient.recordingError") || "Səs yazıla bilmədi");
      mutateMessages(
        (prev: any) => (Array.isArray(prev) ? prev.filter((m: any) => m.id !== tempId) : prev),
        false
      );
      URL.revokeObjectURL(previewUrl);
    } finally {
      setVoiceSending(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || voiceSending || !activeChannelId) return;
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      alert(t("chatClient.recordingError") || "Səs yazıla bilmədi");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      sendAfterStopRef.current = false;
      const mimeType = pickRecorderMime();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const shouldSend = sendAfterStopRef.current;
        const chunks = chunksRef.current.slice();
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const quoted = replyingRef.current;
        const recordedType = (recorder.mimeType || "audio/webm").split(";")[0] || "audio/webm";
        resetRecordingUi();
        if (shouldSend) {
          void sendVoiceBlobRef.current(audioBlob, recordedType, quoted);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((value) => value + 1);
      }, 1000);
    } catch {
      stopMediaTracks();
      alert(t("chatClient.micDenied") || "Mikrofon icazəsi verilmədi");
    }
  };

  const sendRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    sendAfterStopRef.current = true;
    setVoiceSending(true);
    recorder.stop();
  };

  sendVoiceBlobRef.current = sendVoiceBlob;

  const handleDeleteMessage = async (msg: any) => {
    if (!msg?.id) return;
    mutateMessages(
      (prev: any) => (Array.isArray(prev) ? prev.filter((m: any) => m.id !== msg.id) : prev),
      false
    );
    if (replyingToMessage?.id === msg.id) setReplyingToMessage(null);
    if (String(msg.id).startsWith("temp-")) return;
    const res = await fetch(`/api/chat/messages/${msg.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert(t("chatClient.deleteFailed") || "Mesaj silinə bilmədi");
      mutateMessages();
      return;
    }
    mutateChannels();
  };

  const handlePinMessage = async (msg: any, pinDuration: "24h" | "7d" | "forever") => {
    if (!msg?.id || String(msg.id).startsWith("temp-")) return;
    mutateMessages(
      (prev: any) =>
        Array.isArray(prev)
          ? prev.map((m: any) => ({
              ...m,
              isPinned: m.id === msg.id,
            }))
          : prev,
      false
    );
    const res = await fetch(`/api/chat/messages/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: true, pinDuration }),
    });
    if (!res.ok) {
      alert(t("chatClient.pinFailed") || "Mesaj sancıla bilmədi");
    }
    mutateMessages();
  };

  const handleUnpinMessage = async (msg: any) => {
    if (!msg?.id || String(msg.id).startsWith("temp-")) return;
    mutateMessages(
      (prev: any) =>
        Array.isArray(prev)
          ? prev.map((m: any) => (m.id === msg.id ? { ...m, isPinned: false, pinExpiry: null } : m))
          : prev,
      false
    );
    const res = await fetch(`/api/chat/messages/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: false }),
    });
    if (!res.ok) mutateMessages();
  };

  const handleSaveAdminsOnly = async (value: boolean) => {
    if (!activeChannelId) return;
    mutateChannels(
      (prev: any) =>
        prev
          ? {
              ...prev,
              channels: (prev.channels || []).map((c: any) =>
                c.id === activeChannelId ? { ...c, adminsOnly: value } : c
              ),
            }
          : prev,
      false
    );
    const res = await fetch(`/api/chat/channels/${activeChannelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminsOnly: value }),
    });
    if (!res.ok) {
      alert(t("chatClient.settingsFailed") || "Ayarlar yadda saxlanılmadı");
    }
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
  const isAdmin = isChannelAdmin(
    activeChannel,
    currentUser.id,
    Boolean((currentUser as any).isSuperAdmin)
  );
  const canSendMessages =
    !activeChannel ||
    activeChannel.type === "DIRECT" ||
    !activeChannel.adminsOnly ||
    isAdmin;
  const otherDirectUser =
    activeChannel?.type === "DIRECT"
      ? activeChannel.members?.find((m: any) => m.user.id !== currentUser.id)?.user
      : null;
  const canEditProfile =
    activeChannel?.type === "DIRECT"
      ? otherDirectUser?.id === currentUser.id
      : isAdmin;
  const profileBio =
    activeChannel?.type === "DIRECT"
      ? otherDirectUser?.bio || ""
      : activeChannel?.description ||
        activeChannel?.project?.description ||
        activeChannel?.department?.description ||
        "";

  const filteredChannels = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return channels.filter((c: any) => {
      if (listTab !== "all" && channelModule(c) !== listTab) return false;
      if (!q) return true;
      const name = c.type !== "DIRECT"
        ? c.name
        : c.members?.find((m: any) => m.user.id !== currentUser.id)?.user?.name || "";
      return String(name).toLowerCase().includes(q);
    });
  }, [channels, listQuery, listTab, currentUser.id]);

  const dialogUsers = useMemo(() => {
    const q = dialogQuery.trim().toLowerCase();
    if (!q) return companyUsers;
    return companyUsers.filter((u: any) =>
      [u.name, u.email].some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [companyUsers, dialogQuery]);

  const dialogChannelsByModule = useMemo(() => {
    const q = dialogQuery.trim().toLowerCase();
    const match = (c: any) =>
      !q || String(c.name || "").toLowerCase().includes(q);
    return {
      departments: channels.filter((c: any) => channelModule(c) === "departments" && match(c)),
      projects: channels.filter((c: any) => channelModule(c) === "projects" && match(c)),
      collab: channels.filter((c: any) => channelModule(c) === "collab" && match(c)),
    };
  }, [channels, dialogQuery]);

  const visibleMessages = useMemo(() => {
    if (!Array.isArray(messages)) return [];
    const withReplies = messages.map((m: any) => ({
      ...m,
      replyPreview: m.replyPreview || replyPreviews[m.id] || null,
    }));
    const q = headerQuery.trim().toLowerCase();
    if (!q) return withReplies;
    return withReplies.filter((m: any) => (m.content || m.fileName || "").toLowerCase().includes(q));
  }, [messages, headerQuery, replyPreviews]);

  const pinnedMessage = useMemo(() => {
    if (!Array.isArray(messages)) return null;
    const now = Date.now();
    const pinned = messages.filter(
      (m: any) => m.isPinned && (!m.pinExpiry || new Date(m.pinExpiry).getTime() > now)
    );
    return pinned.length ? pinned[pinned.length - 1] : null;
  }, [messages]);

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

  const openChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    setNewChatOpen(false);
    setDialogQuery("");
  };

  const createDirectMessage = async (userId: string) => {
    const res = await fetch("/api/chat/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId }),
    });
    if (!res.ok) {
      alert(t("chatClient.fetchError") || "Kanalları yükləyərkən xəta baş verdi");
      return;
    }
    const channel = await res.json();
    openChannel(channel.id);
    mutateChannels();
  };

  const getChannelAvatar = (c: any) => {
    if (!c) return null;
    if (c.type !== "DIRECT") return c.avatar ?? null;
    return c.members?.find((m: any) => m.user.id !== currentUser.id)?.user?.avatar ?? null;
  };

  const openProfileSheet = () => {
    if (!activeChannel || headerSearchOpen) return;
    setBioDraft(
      activeChannel.type === "DIRECT"
        ? otherDirectUser?.bio || ""
        : activeChannel.description ||
            activeChannel.project?.description ||
            activeChannel.department?.description ||
            ""
    );
    setEditingProfile(false);
    setProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!activeChannel || !canEditProfile) return;
    setSavingProfile(true);
    try {
      const res =
        activeChannel.type === "DIRECT"
          ? await fetch("/api/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bio: bioDraft }),
            })
          : await fetch(`/api/chat/channels/${activeChannel.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ description: bioDraft }),
            });
      if (!res.ok) {
        alert(t("chatClient.profileFailed") || "Profil yadda saxlanılmadı");
        return;
      }
      setEditingProfile(false);
      mutateChannels();
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileAvatar = async (file: { url?: string; ufsUrl?: string }) => {
    const url = file.ufsUrl || file.url;
    if (!url || !activeChannel || !canEditProfile) return;
    const res =
      activeChannel.type === "DIRECT"
        ? await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: url }),
          })
        : await fetch(`/api/chat/channels/${activeChannel.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: url }),
          });
    if (!res.ok) {
      alert(t("chatClient.profileFailed") || "Profil yadda saxlanılmadı");
      return;
    }
    mutateChannels();
  };

  const GroupIcon = ({ channel, className = "size-5" }: { channel: any; className?: string }) => {
    const kind = channelModule(channel);
    if (kind === "departments") return <Building className={className} />;
    if (kind === "collab") return <Users className={className} />;
    return <Hash className={className} />;
  };

  const lastMessageText = (c: any) => {
    const last = c.messages?.[0];
    if (!last) return t("chatClient.noMessages") || "Bu söhbətdə hələ mesaj yoxdur.";
    if (last.content) return last.content;
    if (isAudioMessage(last)) return t("chatClient.voiceMessage") || "Səsli mesaj";
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
    { id: "departments", label: t("chatClient.tabDepartments") || "Şöbələr" },
    { id: "projects", label: t("chatClient.tabProjects") || "Layihələr" },
    { id: "collab", label: t("chatClient.tabCollab") || "Collab" },
  ];

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Left: 30% conversation list */}
      <aside className="flex w-[30%] min-w-[260px] flex-col border-r border-[#e9edef] bg-white">
        <div className="sticky top-0 z-10 space-y-2 bg-[#f0f2f5] px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#54656f]" />
              <Input
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                placeholder={t("chatClient.messages") || "Mesajlar"}
                className="h-9 rounded-lg border-0 bg-white pl-9 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9 shrink-0 rounded-full bg-white text-[#54656f] hover:bg-[#d9fdd3] hover:text-[#136c3b]"
              title={t("chatClient.newChat") || "Yeni Söhbət"}
              onClick={() => {
                setDialogTab("direct");
                setDialogQuery("");
                setNewChatOpen(true);
              }}
            >
              <SquarePen className="size-4" />
            </Button>
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
                {c.type === "DIRECT" || getChannelAvatar(c) ? (
                  <Avatar className="size-12">
                    <AvatarImage src={getChannelAvatar(c) ?? undefined} />
                    <AvatarFallback className="bg-[#dfe5e7] text-sm text-[#54656f]">
                      {getInitials(getChannelName(c))}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] text-[#54656f]">
                    <GroupIcon channel={c} />
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
        </div>
      </aside>

      {/* Right: 70% conversation */}
      <section className="flex min-w-0 w-[70%] flex-col bg-[#efeae2]">
        {activeChannel ? (
          <>
            <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-4">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={openProfileSheet}
              >
                {activeChannel.type === "DIRECT" || getChannelAvatar(activeChannel) ? (
                  <Avatar className="size-10">
                    <AvatarImage src={getChannelAvatar(activeChannel) ?? undefined} />
                    <AvatarFallback>{getInitials(getChannelName(activeChannel))}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#dfe5e7] text-[#54656f]">
                    <GroupIcon channel={activeChannel} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {headerSearchOpen ? (
                    <Input
                      autoFocus
                      value={headerQuery}
                      onChange={(e) => setHeaderQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
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
              </button>
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
                {activeChannel.type !== "DIRECT" && isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full"
                    title={t("chatClient.groupSettings") || "Qrup Ayarları"}
                    onClick={() => setGroupSettingsOpen(true)}
                  >
                    <Settings className="size-5" />
                  </Button>
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

            {pinnedMessage && (
              <div className="flex shrink-0 items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-4 py-2">
                <Pin className="size-4 shrink-0 text-[#00a884]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[#00a884]">
                    {t("chatClient.pinnedMessage") || "Sancılmış mesaj"}
                  </p>
                  <p className="truncate text-xs text-[#667781]">{replySnippet(pinnedMessage)}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full p-1 text-[#54656f] hover:bg-white hover:text-[#111b21]"
                  title={t("chatClient.unpin") || "Sancmanı ləğv et"}
                  onClick={() => handleUnpinMessage(pinnedMessage)}
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

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
                        <div
                          className={cn(
                            "relative max-w-[75%] rounded-lg px-2.5 py-1.5 text-sm shadow-sm",
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
                            {isAudioMessage(msg) && msg.fileUrl ? (
                              <audio controls src={msg.fileUrl} className="mt-1 max-w-full" />
                            ) : isImageMessage(msg) && msg.fileUrl ? (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 block"
                              >
                                <img
                                  src={msg.fileUrl}
                                  alt={msg.fileName || ""}
                                  className="max-h-64 max-w-full rounded-md object-cover"
                                />
                              </a>
                            ) : msg.fileUrl ? (
                              <a
                                href={msg.fileUrl}
                                download={msg.fileName || true}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 flex items-center gap-2 text-[#027eb5] hover:underline"
                              >
                                <FileText className="size-4 shrink-0" />
                                <span className="max-w-[200px] truncate text-sm">
                                  {msg.fileName || t("chatClient.downloadFile") || "Faylı yüklə"}
                                </span>
                                <Download className="size-4 shrink-0" />
                              </a>
                            ) : null}
                            <div className="mt-0.5 flex items-center justify-end gap-1">
                              {msg.isPinned && <Pin className="size-3 text-[#667781]" />}
                              {reactions[msg.id] && <span className="text-xs">{reactions[msg.id]}</span>}
                              <span className="text-[11px] text-[#667781]">
                                {format(new Date(msg.createdAt), "HH:mm")}
                              </span>
                            </div>

                          <div
                            className={cn(
                              "absolute -top-3 z-20 flex items-center gap-0.5 rounded-full border border-[#e9edef] bg-white px-0.5 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 has-[[data-state=open]]:opacity-100",
                              isMe ? "-left-1" : "-right-1"
                            )}
                          >
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="rounded-full p-1 hover:bg-gray-100">
                                  <Smile className="size-3.5 text-[#54656f]" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align={isMe ? "end" : "start"}
                                side="top"
                                sideOffset={6}
                                className="flex gap-1 p-1"
                              >
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
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="rounded-full p-1 hover:bg-gray-100">
                                  <ChevronDown className="size-3.5 text-[#54656f]" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isMe ? "end" : "start"} side="top" sideOffset={6}>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setReplyingToMessage(msg);
                                    requestAnimationFrame(() => textareaRef.current?.focus());
                                  }}
                                >
                                  <Reply className="mr-2 size-4" />
                                  {t("chatClient.reply") || "Cavab ver"}
                                </DropdownMenuItem>
                                {!String(msg.id).startsWith("temp-") && (
                                  msg.isPinned ? (
                                    <DropdownMenuItem onSelect={() => handleUnpinMessage(msg)}>
                                      <Pin className="mr-2 size-4" />
                                      {t("chatClient.unpin") || "Sancmanı ləğv et"}
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <Pin className="mr-2 size-4" />
                                        {t("chatClient.pin") || "Sanc"}
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        <DropdownMenuItem onSelect={() => handlePinMessage(msg, "24h")}>
                                          {t("chatClient.pin24h") || "24 saat"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handlePinMessage(msg, "7d")}>
                                          {t("chatClient.pin1week") || "1 həftə"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handlePinMessage(msg, "forever")}>
                                          {t("chatClient.pinForever") || "Həmişəlik"}
                                        </DropdownMenuItem>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  )
                                )}
                                {(isMe || isAdmin) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onSelect={() => handleDeleteMessage(msg)}
                                    >
                                      <Trash2 className="mr-2 size-4" />
                                      {t("chatClient.delete") || "Sil"}
                                    </DropdownMenuItem>
                                  </>
                                )}
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
              {!canSendMessages ? (
                <p className="py-3 text-center text-sm text-[#667781]">
                  {t("chatClient.adminsOnlyNotice") || "Yalnız qrup inzibatçıları mesaj göndərə bilər"}
                </p>
              ) : (
              <form onSubmit={handleSendMessage} className="flex items-end gap-1.5">
                {isRecording ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="mb-0.5 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
                    title={t("chatClient.cancelRecording") || "Ləğv et"}
                    onClick={cancelRecording}
                  >
                    <Trash2 className="size-5" />
                  </Button>
                ) : (
                  <>
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
                        <DropdownMenuItem
                          className="gap-2"
                          onSelect={(e) => {
                            e.preventDefault();
                            imageInputRef.current?.click();
                          }}
                        >
                          <ImageIcon className="size-4" />
                          {t("chatClient.attachImage") || "Şəkil"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onSelect={(e) => {
                            e.preventDefault();
                            documentInputRef.current?.click();
                          }}
                        >
                          <FileText className="size-4" />
                          {t("chatClient.attachDocument") || "Sənəd"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        void handlePickedFile(file);
                      }}
                    />
                    <input
                      ref={documentInputRef}
                      type="file"
                      accept="*/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        void handlePickedFile(file);
                      }}
                    />
                  </>
                )}

                <div className="min-w-0 flex-1 overflow-hidden rounded-lg bg-white">
                  {replyingToMessage && (
                    <div className="flex items-start gap-2 border-l-4 border-[#06cf9c] bg-[#f0f2f5] px-3 py-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#06cf9c]">
                          {replyAuthor(replyingToMessage)}
                        </p>
                        <p className="truncate text-xs text-[#667781]">
                          {replySnippet(replyingToMessage)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingToMessage(null)}
                        className="mt-0.5 shrink-0 text-[#54656f] hover:text-[#111b21]"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}

                  {isRecording ? (
                    <div className="flex h-10 items-center gap-2 px-3">
                      <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />
                      <span className="text-sm tabular-nums text-[#111b21]">
                        {formatRecordTime(recordSeconds)}
                      </span>
                    </div>
                  ) : (
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
                      className="max-h-[120px] min-h-[40px] w-full resize-none rounded-none border-0 bg-transparent px-3 py-2.5 text-sm shadow-none focus-visible:ring-0"
                    />
                  )}
                </div>

                {isRecording || voiceSending ? (
                  <Button
                    type="button"
                    size="icon"
                    disabled={voiceSending}
                    className="mb-0.5 rounded-full bg-[#00a884] text-white hover:bg-[#008f72]"
                    title={t("chatClient.sendVoice") || "Göndər"}
                    onClick={sendRecording}
                  >
                    {voiceSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                ) : messageText.trim() ? (
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
                    onClick={startRecording}
                  >
                    <Mic className="size-5" />
                  </Button>
                )}
              </form>
              )}
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

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto bg-[#f0f2f5] p-0 sm:max-w-md">
          <div className="bg-[#00a884] px-6 pb-8 pt-14 text-white">
            <SheetHeader className="space-y-1">
              <SheetTitle className="text-white">
                {activeChannel?.type === "DIRECT"
                  ? t("chatClient.contactInfo") || "Əlaqə məlumatı"
                  : t("chatClient.groupInfo") || "Qrup məlumatları"}
              </SheetTitle>
              <SheetDescription className="text-white/80">
                {getChannelName(activeChannel)}
              </SheetDescription>
            </SheetHeader>
          </div>
          <div className="flex flex-col items-center bg-[#00a884] px-6 pb-8">
            {activeChannel?.type === "DIRECT" || getChannelAvatar(activeChannel) ? (
              <Avatar className="size-40 border-4 border-white/20">
                <AvatarImage src={getChannelAvatar(activeChannel) ?? undefined} />
                <AvatarFallback className="text-3xl">
                  {getInitials(getChannelName(activeChannel))}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex size-40 items-center justify-center rounded-full bg-white/20 text-white">
                <GroupIcon channel={activeChannel} className="size-16" />
              </div>
            )}
            <h2 className="mt-4 text-xl font-medium text-white">{getChannelName(activeChannel)}</h2>
            {canEditProfile && (
              <div className="mt-3">
                <UploadButton
                  endpoint="chatAttachment"
                  onClientUploadComplete={(res: any[]) => {
                    if (!res?.[0]) return;
                    void handleProfileAvatar(res[0]);
                  }}
                  appearance={{
                    button:
                      "h-8 ut-ready:bg-white/20 ut-uploading:bg-white/20 after:bg-transparent text-sm text-white border-0 shadow-none rounded-full px-3",
                    allowedContent: "hidden",
                  }}
                  content={{
                    button: t("chatClient.changePhoto") || "Şəkli dəyiş",
                  }}
                />
              </div>
            )}
          </div>
          <div className="m-4 rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-[#00a884]">
                {t("chatClient.about") || "Haqqında"}
              </p>
              {canEditProfile && !editingProfile && (
                <button
                  type="button"
                  className="rounded-full p-1 text-[#54656f] hover:bg-[#f0f2f5]"
                  title={t("chatClient.edit") || "Redaktə et"}
                  onClick={() => {
                    setBioDraft(profileBio);
                    setEditingProfile(true);
                  }}
                >
                  <Pencil className="size-4" />
                </button>
              )}
            </div>
            {editingProfile ? (
              <div className="space-y-2">
                <Textarea
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  rows={4}
                  className="min-h-[80px] text-sm"
                  placeholder={t("chatClient.bio") || "Bio"}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingProfile(false);
                      setBioDraft(profileBio);
                    }}
                  >
                    {t("chatClient.cancelEdit") || "Ləğv et"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-[#00a884] hover:bg-[#008f72]"
                    disabled={savingProfile}
                    onClick={() => void handleSaveProfile()}
                  >
                    {savingProfile ? <Loader2 className="size-4 animate-spin" /> : t("chatClient.save") || "Yadda saxla"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-[#111b21]">
                {profileBio || t("chatClient.noBio") || "Bio əlavə edilməyib"}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={groupSettingsOpen} onOpenChange={setGroupSettingsOpen}>
        <DialogContent className="max-w-sm gap-4 p-5 sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("chatClient.groupSettings") || "Qrup Ayarları"}</DialogTitle>
            <DialogDescription>{t("chatClient.whoCanSend") || "Mesaj göndərə bilər"}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleSaveAdminsOnly(false)}
              className={cn(
                "rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors",
                !activeChannel?.adminsOnly
                  ? "bg-[#d9fdd3] text-[#136c3b]"
                  : "bg-[#f0f2f5] text-[#111b21] hover:bg-gray-100"
              )}
            >
              {t("chatClient.sendEveryone") || "Hər kəs"}
            </button>
            <button
              type="button"
              onClick={() => handleSaveAdminsOnly(true)}
              className={cn(
                "rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors",
                activeChannel?.adminsOnly
                  ? "bg-[#d9fdd3] text-[#136c3b]"
                  : "bg-[#f0f2f5] text-[#111b21] hover:bg-gray-100"
              )}
            >
              {t("chatClient.sendAdminsOnly") || "Yalnız İnzibatçılar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="max-w-md gap-3 p-5 sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("chatClient.newChatTitle") || "Yeni Söhbət"}</DialogTitle>
            <DialogDescription>
              {t("chatClient.newChatDesc") ||
                "Şəxsi söhbət, şöbə, layihə və ya collab qrupu seçin."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#54656f]" />
            <Input
              value={dialogQuery}
              onChange={(e) => setDialogQuery(e.target.value)}
              placeholder={t("chatClient.newChatSearch") || "Axtar..."}
              className="h-9 rounded-lg border-[#e9edef] bg-[#f0f2f5] pl-9 text-sm"
            />
          </div>

          <Tabs
            value={dialogTab}
            onValueChange={(value) => setDialogTab(value as NewChatModule)}
            className="w-full"
          >
            <TabsList className="grid h-auto w-full grid-cols-4 gap-1 bg-[#f0f2f5] p-1">
              <TabsTrigger value="direct" className="px-1 text-xs data-[state=active]:bg-white">
                {t("chatClient.tabDirect") || "Şəxsi"}
              </TabsTrigger>
              <TabsTrigger value="departments" className="px-1 text-xs data-[state=active]:bg-white">
                {t("chatClient.tabDepartments") || "Şöbələr"}
              </TabsTrigger>
              <TabsTrigger value="projects" className="px-1 text-xs data-[state=active]:bg-white">
                {t("chatClient.tabProjects") || "Layihələr"}
              </TabsTrigger>
              <TabsTrigger value="collab" className="px-1 text-xs data-[state=active]:bg-white">
                {t("chatClient.tabCollab") || "Collab"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="direct" className="mt-3">
              <div className="max-h-[320px] space-y-0.5 overflow-y-auto [scrollbar-width:thin]">
                {dialogUsers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[#667781]">
                    {t("chatClient.emptyDirect") || "Söhbət ediləcək şəxs tapılmadı."}
                  </p>
                ) : (
                  dialogUsers.map((u: any) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => createDirectMessage(u.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#f0f2f5]"
                    >
                      <Avatar className="size-10">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#111b21]">{u.name}</p>
                        <p className="truncate text-xs text-[#667781]">{u.email}</p>
                      </div>
                      <UserIcon className="ml-auto size-4 shrink-0 text-[#667781]" />
                    </button>
                  ))
                )}
              </div>
            </TabsContent>

            {(["departments", "projects", "collab"] as const).map((module) => (
              <TabsContent key={module} value={module} className="mt-3">
                <div className="max-h-[320px] space-y-0.5 overflow-y-auto [scrollbar-width:thin]">
                  {dialogChannelsByModule[module].length === 0 ? (
                    <p className="py-8 text-center text-sm text-[#667781]">
                      {module === "departments"
                        ? t("chatClient.emptyDepartments") || "Aid olduğunuz şöbə qrupu yoxdur."
                        : module === "projects"
                          ? t("chatClient.emptyProjects") || "Aid olduğunuz layihə çatı yoxdur."
                          : t("chatClient.emptyCollab") || "Aid olduğunuz collab qrupu yoxdur."}
                    </p>
                  ) : (
                    dialogChannelsByModule[module].map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => openChannel(c.id)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#f0f2f5]"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] text-[#54656f]">
                          <GroupIcon channel={c} className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#111b21]">{c.name}</p>
                          <p className="truncate text-xs text-[#667781]">
                            {(t("chatClient.membersCount") || "{count} üzv").replace(
                              "{count}",
                              String(c.members?.length || 0)
                            )}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
