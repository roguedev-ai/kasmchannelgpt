/**
 * Mobile Performance Optimizations
 * 
 * Utilities and hooks for optimizing performance on mobile devices
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Debounce hook for reducing function call frequency
 * Essential for mobile performance with touch events
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for limiting function execution rate
 * Useful for scroll and resize event handlers
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall.current;

    if (timeSinceLastCall >= delay) {
      lastCall.current = now;
      callback(...args);
    } else {
      if (timeout.current) clearTimeout(timeout.current);
      
      timeout.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]) as T;
}

/**
 * Intersection Observer hook for lazy loading
 * Improves initial load time on mobile
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasIntersected(true);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return { isIntersecting, hasIntersected };
}

/**
 * Virtual scrolling hook for long lists
 * Essential for mobile performance with large datasets
 */
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    startIndex,
    endIndex,
  };
}

/**
 * Prefetch critical resources for faster navigation
 */
export function usePrefetch(urls: string[]) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => {
        urls.forEach(url => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          document.head.appendChild(link);
        });
      });

      return () => {
        if ('cancelIdleCallback' in window) {
          cancelIdleCallback(id);
        }
      };
    }
  }, [urls]);
}

/**
 * Reduce motion for users who prefer it
 * Important for accessibility and battery life
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Battery level monitoring for adaptive performance
 */
export function useBatteryLevel() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level);
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level);
        });

        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      });
    }
  }, []);

  return { batteryLevel, isCharging };
}

/**
 * Network quality detection for adaptive loading
 */
export function useNetworkQuality() {
  const [networkQuality, setNetworkQuality] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  }>({
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
  });

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkQuality = () => {
        setNetworkQuality({
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 50,
          saveData: connection.saveData || false,
        });
      };

      updateNetworkQuality();
      connection.addEventListener('change', updateNetworkQuality);

      return () => {
        connection.removeEventListener('change', updateNetworkQuality);
      };
    }
  }, []);

  return networkQuality;
}

/**
 * Adaptive quality based on device capabilities
 */
export function useAdaptiveQuality() {
  const { batteryLevel, isCharging } = useBatteryLevel();
  const networkQuality = useNetworkQuality();
  const prefersReducedMotion = usePrefersReducedMotion();

  const quality = {
    animations: !prefersReducedMotion && (isCharging || (batteryLevel ?? 1) > 0.2),
    highResImages: networkQuality.effectiveType !== 'slow-2g' && !networkQuality.saveData,
    videoAutoplay: networkQuality.effectiveType === '4g' && (isCharging || (batteryLevel ?? 1) > 0.5),
    prefetchContent: networkQuality.effectiveType === '4g' && !networkQuality.saveData,
  };

  return quality;
}

/**
 * Image optimization component wrapper
 */
export function optimizeImageSrc(src: string, options: {
  width?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}) {
  // This is a placeholder - in production, you'd use an image optimization service
  // like Cloudinary, Imgix, or Next.js Image Optimization API
  const params = new URLSearchParams();
  
  if (options.width) params.set('w', options.width.toString());
  if (options.quality) params.set('q', options.quality.toString());
  if (options.format) params.set('f', options.format);
  
  return `${src}?${params.toString()}`;
}

/**
 * Memory usage monitoring for preventing crashes
 */
export function useMemoryUsage() {
  const [memoryUsage, setMemoryUsage] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    if ('memory' in performance) {
      const updateMemory = () => {
        const memory = (performance as any).memory;
        setMemoryUsage({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      };

      updateMemory();
      const interval = setInterval(updateMemory, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  return memoryUsage;
}