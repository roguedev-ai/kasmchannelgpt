/**
 * Theme Provider Component
 * 
 * Handles theme initialization on both client and server side.
 * Uses cookies for persistence and prevents flash of incorrect theme.
 */

'use client';

import { useEffect } from 'react';
import { useConfigStore } from '@/store/config';
import { initializeTheme } from '@/lib/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme } = useConfigStore();

  useEffect(() => {
    // Initialize theme from cookie on mount
    const cookieTheme = initializeTheme();
    
    // Update store if theme differs
    if (cookieTheme !== theme) {
      setTheme(cookieTheme);
    }
  }, [theme, setTheme]);

  return <>{children}</>;
}