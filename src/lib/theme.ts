/**
 * Theme utilities for persistent theme management
 * 
 * Uses cookies for theme persistence to ensure the theme
 * is available during server-side rendering and prevents
 * flash of incorrect theme on page load.
 */

export type Theme = 'light' | 'dark';

const THEME_COOKIE_NAME = 'customgpt-theme';
const THEME_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Get theme from cookie
 */
export function getThemeFromCookie(): Theme {
  if (typeof window === 'undefined') return 'light';
  
  const cookies = document.cookie.split(';');
  const themeCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${THEME_COOKIE_NAME}=`)
  );
  
  if (themeCookie) {
    const value = themeCookie.split('=')[1].trim();
    return value === 'dark' ? 'dark' : 'light';
  }
  
  return 'light';
}

/**
 * Set theme in cookie
 */
export function setThemeCookie(theme: Theme) {
  if (typeof window === 'undefined') return;
  
  // Set cookie with max age and path
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; max-age=${THEME_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

/**
 * Apply theme to document
 */
export function applyThemeToDocument(theme: Theme) {
  if (typeof window === 'undefined') return;
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Initialize theme from cookie and apply to document
 */
export function initializeTheme(): Theme {
  const theme = getThemeFromCookie();
  applyThemeToDocument(theme);
  return theme;
}

/**
 * Set theme and persist to cookie
 */
export function setTheme(theme: Theme) {
  setThemeCookie(theme);
  applyThemeToDocument(theme);
}