import { create } from "zustand";

// =============================================================================
// Project Store — Active project, view mode, filters
// =============================================================================

export type ViewMode = "board" | "list" | "timeline";

export type TaskFilter = {
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  search?: string;
};

interface ProjectStore {
  // Aktiv layihə ID-si
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;

  // Görünüş rejimi (Kanban, Siyahı, Timeline)
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Tapşırıq filterləri
  taskFilters: TaskFilter;
  setTaskFilters: (filters: Partial<TaskFilter>) => void;
  clearTaskFilters: () => void;

  // Seçilmiş task (detail panel üçün)
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),

  viewMode: "board",
  setViewMode: (mode) => set({ viewMode: mode }),

  taskFilters: {},
  setTaskFilters: (filters) =>
    set((state) => ({ taskFilters: { ...state.taskFilters, ...filters } })),
  clearTaskFilters: () => set({ taskFilters: {} }),

  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
}));
