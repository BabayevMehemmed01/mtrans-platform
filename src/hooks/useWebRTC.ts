"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// useWebRTC — 1:1 zəng üçün RTCPeerConnection idarəetməsi
// Siqnalizasiya polling üzərindən aparılır (websocket serveri yoxdur).
// STUN-only konfiqurasiya — TURN serveri yoxdur, restriktiv NAT arxasında
// bəzi hallarda bağlantı qurulmaya bilər (məlum və qəbul edilmiş məhdudiyyət).
// =============================================================================

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const SIGNAL_POLL_INTERVAL_MS = 1200;

export type CallRole = "caller" | "callee";
export type CallKind = "AUDIO" | "VIDEO";

interface SignalRow {
  id: string;
  type: string;
  payload: any;
  createdAt: string;
  senderId: string;
}

interface UseWebRTCOptions {
  callId: string | null;
  type: CallKind;
  role: CallRole;
  onRemoteHangup?: () => void;
  onRemoteDecline?: () => void;
  onError?: (message: string) => void;
}

export function useWebRTC({ callId, type, role, onRemoteHangup, onRemoteDecline, onError }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [connected, setConnected] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const answeredRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const sendSignal = useCallback(
    async (signalType: string, payload: any) => {
      if (!callId) return;
      try {
        await fetch(`/api/calls/${callId}/signals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: signalType, payload }),
        });
      } catch (err) {
        console.error("[useWebRTC] sendSignal error", err);
      }
    },
    [callId]
  );

  const ensurePeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal("ice-candidate", e.candidate.toJSON());
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream((prev) => {
        const stream = prev ?? new MediaStream();
        if (!stream.getTracks().some((t) => t.id === e.track.id)) {
          stream.addTrack(e.track);
        }
        return new MediaStream(stream.getTracks());
      });
    };

    pc.onconnectionstatechange = () => {
      setConnected(pc.connectionState === "connected");
    };

    pcRef.current = pc;
    return pc;
  }, [sendSignal]);

  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[useWebRTC] addIceCandidate (flush) error", err);
      }
    }
  }, []);

  const getLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "VIDEO",
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, [type]);

  const attachLocalTracks = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  }, []);

  const handleIncomingSignal = useCallback(
    async (signal: SignalRow) => {
      const pc = ensurePeerConnection();

      switch (signal.type) {
        case "offer": {
          if (remoteDescSetRef.current) break;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          remoteDescSetRef.current = true;
          await flushPendingCandidates(pc);

          if (!answeredRef.current) {
            answeredRef.current = true;
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal("answer", answer);
          }
          break;
        }
        case "answer": {
          if (remoteDescSetRef.current) break;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          remoteDescSetRef.current = true;
          await flushPendingCandidates(pc);
          break;
        }
        case "ice-candidate": {
          if (remoteDescSetRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
            } catch (err) {
              console.error("[useWebRTC] addIceCandidate error", err);
            }
          } else {
            pendingCandidatesRef.current.push(signal.payload);
          }
          break;
        }
        case "hangup": {
          cleanupRef.current?.();
          onRemoteHangup?.();
          break;
        }
        case "decline": {
          cleanupRef.current?.();
          onRemoteDecline?.();
          break;
        }
        default:
          break;
      }
    },
    [ensurePeerConnection, flushPendingCandidates, sendSignal, onRemoteHangup, onRemoteDecline]
  );

  const pollOnce = useCallback(async () => {
    if (!callId || closedRef.current) return;
    try {
      const url = cursorRef.current
        ? `/api/calls/${callId}/signals?after=${encodeURIComponent(cursorRef.current)}`
        : `/api/calls/${callId}/signals`;
      const res = await fetch(url);
      if (!res.ok) return;
      const signals: SignalRow[] = await res.json();
      if (!Array.isArray(signals) || signals.length === 0) return;

      for (const signal of signals) {
        await handleIncomingSignal(signal);
      }
      cursorRef.current = signals[signals.length - 1].createdAt;
    } catch (err) {
      console.error("[useWebRTC] poll error", err);
    }
  }, [callId, handleIncomingSignal]);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    pollTimerRef.current = setInterval(pollOnce, SIGNAL_POLL_INTERVAL_MS);
    // İlk sorğunu dərhal at
    pollOnce();
  }, [pollOnce]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Zəng edən tərəf: media al, offer yarat və göndər
  const start = useCallback(async () => {
    try {
      closedRef.current = false;
      const stream = await getLocalMedia();
      const pc = ensurePeerConnection();
      attachLocalTracks(pc, stream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal("offer", offer);

      startPolling();
    } catch (err: any) {
      console.error("[useWebRTC] start error", err);
      onError?.(err?.message || "Kameraya/mikrofona giriş alına bilmədi");
    }
  }, [getLocalMedia, ensurePeerConnection, attachLocalTracks, sendSignal, startPolling, onError]);

  // Qəbul edən tərəf: media al, gələn offer-i (poll vasitəsilə) gözlə və cavabla
  const answer = useCallback(async () => {
    try {
      closedRef.current = false;
      const stream = await getLocalMedia();
      const pc = ensurePeerConnection();
      attachLocalTracks(pc, stream);

      startPolling();
    } catch (err: any) {
      console.error("[useWebRTC] answer error", err);
      onError?.(err?.message || "Kameraya/mikrofona giriş alına bilmədi");
    }
  }, [getLocalMedia, ensurePeerConnection, attachLocalTracks, startPolling, onError]);

  const cleanup = useCallback(() => {
    closedRef.current = true;
    stopPolling();

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    remoteDescSetRef.current = false;
    answeredRef.current = false;
    pendingCandidatesRef.current = [];
    cursorRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setConnected(false);
  }, [stopPolling]);

  useEffect(() => {
    cleanupRef.current = cleanup;
  }, [cleanup]);

  const hangUp = useCallback(
    (sendSignalType: "hangup" | "decline" = "hangup") => {
      sendSignal(sendSignalType, {});
      cleanup();
    },
    [sendSignal, cleanup]
  );

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    const nextMuted = !isMuted;
    audioTracks.forEach((t) => (t.enabled = !nextMuted));
    setIsMuted(nextMuted);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;
    const nextOff = !isCameraOff;
    videoTracks.forEach((t) => (t.enabled = !nextOff));
    setIsCameraOff(nextOff);
  }, [isCameraOff]);

  // Unmount zamanı təmizlik
  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    localStream,
    remoteStream,
    connected,
    isMuted,
    isCameraOff,
    start,
    answer,
    hangUp,
    toggleMute,
    toggleCamera,
    cleanup,
  };
}
