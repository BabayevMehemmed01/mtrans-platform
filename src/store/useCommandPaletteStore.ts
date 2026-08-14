import { create } from "zustand";

// =============================================================================
// Command Palette Store — Cmd+K global axtarış paneli state-i
// =============================================================================

interface CommandPaletteStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteStore>()((set) => ({
  open: false,

  setOpen: (open: boolean) => set({ open }),

  toggle: () => set((state) => ({ open: !state.open })),
}));
