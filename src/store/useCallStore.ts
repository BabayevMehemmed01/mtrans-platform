import { create } from "zustand";

// =============================================================================
// Call Store — WebRTC zəng vəziyyəti (aktiv və gələn zəng)
// =============================================================================

export type CallRole = "caller" | "callee";

export type CallStatus = "RINGING" | "ACTIVE" | "ENDED" | "MISSED" | "DECLINED";

export interface CallInfo {
  id: string;
  channelId: string;
  type: "AUDIO" | "VIDEO";
  role: CallRole;
  status: CallStatus;
  // Qarşı tərəf haqqında UI göstərmək üçün (ad/avatar)
  peerName?: string;
  peerAvatar?: string | null;
}

interface CallStore {
  activeCall: CallInfo | null;
  incomingCall: CallInfo | null;

  setActiveCall: (call: CallInfo | null) => void;
  setIncomingCall: (call: CallInfo | null) => void;
  updateActiveCallStatus: (status: CallStatus) => void;
  clear: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  activeCall: null,
  incomingCall: null,

  setActiveCall: (call) => set({ activeCall: call }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  updateActiveCallStatus: (status) =>
    set((state) => ({
      activeCall: state.activeCall ? { ...state.activeCall, status } : null,
    })),

  clear: () => set({ activeCall: null, incomingCall: null }),
}));
