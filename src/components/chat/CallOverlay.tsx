"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCallStore, type CallInfo } from "@/store/useCallStore";
import { useWebRTC } from "@/hooks/useWebRTC";

const INCOMING_POLL_INTERVAL_MS = 3000;

// =============================================================================
// CallOverlay — Qlobal zəng qatı: gələn zəng bildirişi + aktiv zəng paneli
// Dashboard layout-una bir dəfə mount edilir.
// =============================================================================

export function CallOverlay() {
  const activeCall = useCallStore((s) => s.activeCall);
  const incomingCall = useCallStore((s) => s.incomingCall);
  const setActiveCall = useCallStore((s) => s.setActiveCall);
  const setIncomingCall = useCallStore((s) => s.setIncomingCall);
  const clear = useCallStore((s) => s.clear);

  const initiatedCallIdRef = useRef<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const handleRemoteEnded = useCallback(() => {
    initiatedCallIdRef.current = null;
    clear();
  }, [clear]);

  const webrtc = useWebRTC({
    callId: activeCall?.id ?? null,
    type: activeCall?.type ?? "AUDIO",
    role: activeCall?.role ?? "caller",
    onRemoteHangup: handleRemoteEnded,
    onRemoteDecline: handleRemoteEnded,
    onError: (msg) => {
      console.error("[CallOverlay] WebRTC xətası:", msg);
    },
  });

  // Gələn zəng pollu — yalnız aktiv/gedən zəng yoxdursa
  useEffect(() => {
    if (activeCall) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/calls/incoming");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;

        if (data?.call) {
          setIncomingCall({
            id: data.call.id,
            channelId: data.call.channelId,
            type: data.call.type,
            role: "callee",
            status: data.call.status,
            peerName: data.call.caller?.name,
            peerAvatar: data.call.caller?.avatar,
          });
        } else {
          setIncomingCall(null);
        }
      } catch (err) {
        console.error("[CallOverlay] incoming poll error", err);
      }
    };

    poll();
    const timer = setInterval(poll, INCOMING_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeCall, setIncomingCall]);

  // Aktiv zəng başladıqda (həm caller, həm callee) WebRTC axınını bir dəfə işə sal
  useEffect(() => {
    if (!activeCall) {
      initiatedCallIdRef.current = null;
      return;
    }
    if (initiatedCallIdRef.current === activeCall.id) return;
    initiatedCallIdRef.current = activeCall.id;

    if (activeCall.role === "caller") {
      webrtc.start();
    } else {
      webrtc.answer();
    }
    // webrtc metodları useCallback ilə stabil saxlanılır, yalnız call dəyişəndə işə düşməlidir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall?.id, activeCall?.role]);

  // Video elementlərinə stream-ləri bağla
  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = webrtc.localStream;
  }, [webrtc.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = webrtc.remoteStream;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = webrtc.remoteStream;
  }, [webrtc.remoteStream]);

  const endCall = useCallback(
    async (patchStatus: "ENDED" | "DECLINED" = "ENDED") => {
      const callId = activeCall?.id;
      webrtc.hangUp(patchStatus === "DECLINED" ? "decline" : "hangup");
      initiatedCallIdRef.current = null;
      clear();
      if (callId) {
        try {
          await fetch(`/api/calls/${callId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: patchStatus }),
          });
        } catch (err) {
          console.error("[CallOverlay] end call PATCH error", err);
        }
      }
    },
    [activeCall, webrtc, clear]
  );

  const acceptIncoming = useCallback(async () => {
    if (!incomingCall) return;
    const call = incomingCall;
    setIncomingCall(null);
    const accepted: CallInfo = { ...call, status: "ACTIVE" };
    setActiveCall(accepted);
    try {
      await fetch(`/api/calls/${call.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
    } catch (err) {
      console.error("[CallOverlay] accept PATCH error", err);
    }
  }, [incomingCall, setIncomingCall, setActiveCall]);

  const declineIncoming = useCallback(async () => {
    if (!incomingCall) return;
    const call = incomingCall;
    setIncomingCall(null);
    try {
      await fetch(`/api/calls/${call.id}/signals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "decline", payload: {} }),
      });
      await fetch(`/api/calls/${call.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DECLINED" }),
      });
    } catch (err) {
      console.error("[CallOverlay] decline error", err);
    }
  }, [incomingCall, setIncomingCall]);

  const initials = (name?: string) => (name ? name.substring(0, 2).toUpperCase() : "??");

  return (
    <>
      {/* Gələn zəng modalı */}
      {incomingCall && !activeCall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-80 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
            <Avatar className="w-20 h-20 border shadow-sm" size="lg">
              <AvatarImage src={incomingCall.peerAvatar ?? undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xl font-medium">
                {initials(incomingCall.peerName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-semibold text-lg text-gray-900">{incomingCall.peerName || "Naməlum"}</p>
              <p className="text-sm text-gray-500">
                {incomingCall.type === "VIDEO" ? "Video zəng edir..." : "Səsli zəng edir..."}
              </p>
            </div>
            <div className="flex gap-4 mt-2">
              <Button
                onClick={declineIncoming}
                size="icon-lg"
                className="rounded-full bg-red-600 hover:bg-red-700 text-white w-14 h-14"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              <Button
                onClick={acceptIncoming}
                size="icon-lg"
                className="rounded-full bg-green-600 hover:bg-green-700 text-white w-14 h-14"
              >
                <Phone className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Aktiv zəng paneli */}
      {activeCall && (
        <div className="fixed bottom-6 right-6 z-[100] w-80 bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
          <div className="relative bg-black aspect-video flex items-center justify-center">
            {activeCall.type === "VIDEO" ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover bg-black"
                />
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute bottom-2 right-2 w-20 h-14 object-cover rounded-lg border border-gray-700 shadow-lg"
                />
                {!webrtc.remoteStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs">Qoşulur...</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <audio ref={remoteAudioRef} autoPlay />
                <div className="flex flex-col items-center gap-3 py-8">
                  <Avatar className="w-16 h-16 border-2 border-gray-700" size="lg">
                    <AvatarImage src={activeCall.peerAvatar ?? undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-medium">
                      {initials(activeCall.peerName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-200 text-sm font-medium">{activeCall.peerName || "Naməlum"}</span>
                  <span className="text-gray-400 text-xs">
                    {webrtc.connected ? "Zəng davam edir" : "Qoşulur..."}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 py-3 bg-gray-900">
            <Button
              onClick={webrtc.toggleMute}
              size="icon"
              className={`rounded-full ${webrtc.isMuted ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"} text-white`}
            >
              {webrtc.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            {activeCall.type === "VIDEO" && (
              <Button
                onClick={webrtc.toggleCamera}
                size="icon"
                className={`rounded-full ${webrtc.isCameraOff ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"} text-white`}
              >
                {webrtc.isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </Button>
            )}
            <Button
              onClick={() => endCall("ENDED")}
              size="icon"
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
