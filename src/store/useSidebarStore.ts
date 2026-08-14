import { create } from "zustand";
import { persist } from "zustand/middleware";

// =============================================================================
// Sidebar Store — Collapsible sidebar state
// =============================================================================

interface SidebarStore {
  isOpen: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  setOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isOpen: true,
      isCollapsed: false,

      toggle: () => set((state) => ({ isOpen: !state.isOpen })),

      collapse: () => set({ isCollapsed: true }),

      expand: () => set({ isCollapsed: false }),

      setOpen: (open: boolean) => set({ isOpen: open }),
    }),
    {
      name: "sidebar-state",
    }
  )
);
