'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useBreakpoint } from './useMediaQuery';

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  threshold?: number; // minimum distance for swipe
  timeout?: number; // long press timeout
}

export const useTouchGestures = (options: TouchGestureOptions) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onLongPress,
    threshold = 50,
    timeout = 500
  } = options;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
      }, timeout);
    }
  }, [onLongPress, timeout]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if it's a tap (small movement, quick time)
    if (absX < 10 && absY < 10 && deltaTime < 300 && onTap) {
      onTap();
      return;
    }

    // Check for swipes
    if (Math.max(absX, absY) > threshold) {
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    touchStartRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, threshold]);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if finger moves
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handleTouchStart, handleTouchEnd, handleTouchMove]);

  return elementRef;
};

/**
 * Hook for managing mobile drawer/modal states
 */
export const useMobileNavigation = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeBottomSheet, setActiveBottomSheet] = useState<string | null>(null);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);

  const openBottomSheet = useCallback((sheetId: string) => {
    setActiveBottomSheet(sheetId);
  }, []);

  const closeBottomSheet = useCallback(() => {
    setActiveBottomSheet(null);
  }, []);

  // Close drawer/sheets on desktop
  const { isMobile } = useBreakpoint();
  useEffect(() => {
    if (!isMobile) {
      setIsDrawerOpen(false);
      setActiveBottomSheet(null);
    }
  }, [isMobile]);

  return {
    isDrawerOpen,
    activeBottomSheet,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    openBottomSheet,
    closeBottomSheet
  };
};