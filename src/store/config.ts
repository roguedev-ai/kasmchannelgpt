import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConfigStore } from '@/types';
import { setTheme as setThemeUtil, getThemeFromCookie, initializeTheme } from '@/lib/theme';

/**
 * Configuration Store
 * 
 * Updated to remove API key storage for security.
 * API key is now stored securely on the server.
 * Theme is persisted using cookies for better SSR support.
 */
export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      apiKey: null, // Deprecated - kept for interface compatibility
      baseURL: 'https://app.customgpt.ai/api/v1', // Not used anymore, server handles this
      theme: (typeof window !== 'undefined' ? getThemeFromCookie() : 'light') as 'light' | 'dark',

      setApiKey: (key: string) => {
        // No-op - API key is not stored client-side anymore
        // This method is kept for backward compatibility
        console.warn('API key storage has been disabled for security. Configure API key in server environment variables.');
      },

      setBaseURL: (url: string) => {
        // No-op - base URL is configured on server
        console.warn('Base URL configuration has been moved to server. Update CUSTOMGPT_API_BASE_URL in environment variables.');
      },

      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
        
        // Update cookie and document class for theme
        if (typeof window !== 'undefined') {
          setThemeUtil(theme);
        }
      },
    }),
    {
      name: 'customgpt-config',
      // Only persist non-sensitive data
      partialize: (state) => ({
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize theme from cookie on rehydration
        if (typeof window !== 'undefined') {
          const theme = initializeTheme();
          if (state && state.theme !== theme) {
            state.theme = theme;
          }
        }
      },
    }
  )
);