import { create } from 'zustand';

interface UIState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  isLocked: boolean;
  setLocked: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (value: boolean) => set({ isSidebarCollapsed: value }),
  isLocked: false,
  setLocked: (value: boolean) => set({ isLocked: value }),
}));
