import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIStore } from '@/types';

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      settingsOpen: false,
      theme: 'light',
      fontSize: 'md',

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      setSettingsOpen: (open: boolean) => {
        set({ settingsOpen: open });
      },

      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
          document.documentElement.className = theme;
        }
      },

      setFontSize: (size: 'sm' | 'md' | 'lg') => {
        set({ fontSize: size });
        
        // Apply font size to document
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('text-sm', 'text-base', 'text-lg');
          
          switch (size) {
            case 'sm':
              root.classList.add('text-sm');
              break;
            case 'lg':
              root.classList.add('text-lg');
              break;
            default:
              root.classList.add('text-base');
          }
        }
      },
    }),
    {
      name: 'customgpt-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        fontSize: state.fontSize,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme and font size on rehydration
        if (typeof window !== 'undefined' && state) {
          document.documentElement.className = state.theme;
          
          const root = document.documentElement;
          root.classList.remove('text-sm', 'text-base', 'text-lg');
          
          switch (state.fontSize) {
            case 'sm':
              root.classList.add('text-sm');
              break;
            case 'lg':
              root.classList.add('text-lg');
              break;
            default:
              root.classList.add('text-base');
          }
        }
      },
    }
  )
);