'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design based on media queries
 * Provides mobile-first breakpoint detection
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Handle server-side rendering
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    media.addEventListener('change', listener);

    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

/**
 * Predefined breakpoint hooks for common use cases
 */
export const useBreakpoint = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeScreen = useMediaQuery('(min-width: 1280px)');
  
  // Touch device detection
  const isTouchDevice = useMediaQuery('(pointer: coarse)');
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    isTouchDevice,
    // Helper computed values
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop
  };
};

/**
 * Hook for getting current screen size category
 */
export const useScreenSize = () => {
  const { isMobile, isTablet, isDesktop, isLargeScreen } = useBreakpoint();
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (isLargeScreen) return 'large';
  if (isDesktop) return 'desktop';
  return 'desktop'; // fallback
};