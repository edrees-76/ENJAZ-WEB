import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage before importing the store
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Must import after mocking
import { useUIStore } from '../store/useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store state
    useUIStore.setState({
      isSidebarCollapsed: false,
      isLocked: false,
      isDark: false,
    });
  });

  it('initial sidebar state is not collapsed', () => {
    const state = useUIStore.getState();
    expect(state.isSidebarCollapsed).toBe(false);
  });

  it('toggleSidebar flips the collapsed state', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarCollapsed).toBe(true);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarCollapsed).toBe(false);
  });

  it('setSidebarCollapsed sets explicit value', () => {
    useUIStore.getState().setSidebarCollapsed(true);
    expect(useUIStore.getState().isSidebarCollapsed).toBe(true);
  });

  it('setLocked updates locked state', () => {
    useUIStore.getState().setLocked(true);
    expect(useUIStore.getState().isLocked).toBe(true);
  });

  it('setTheme updates isDark and localStorage', () => {
    useUIStore.getState().setTheme(true);
    expect(useUIStore.getState().isDark).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('toggleTheme flips dark mode', () => {
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().isDark).toBe(true);

    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().isDark).toBe(false);
  });
});
