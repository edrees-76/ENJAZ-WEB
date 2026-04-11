import { create } from 'zustand';

interface UIState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  isLocked: boolean;
  setLocked: (value: boolean) => void;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (value: boolean) => set({ isSidebarCollapsed: value }),
  isLocked: false,
  setLocked: (value: boolean) => set({ isLocked: value }),
  isDark: localStorage.getItem('theme') === 'dark',
  toggleTheme: () => {
    set((state) => {
      const newValue = !state.isDark;
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDark: newValue };
    });
  },
  setTheme: (value: boolean) => {
    localStorage.setItem('theme', value ? 'dark' : 'light');
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDark: value });
  }
}));
