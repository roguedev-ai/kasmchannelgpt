'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useIntersectionObserver, useNetworkQuality } from '@/lib/performance/mobile-optimizations';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized Image Component for Mobile
 * 
 * Features:
 * - Lazy loading with intersection observer
 * - Network-aware quality selection
 * - Progressive loading with blur placeholder
 * - Error state handling
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  priority = false,
  quality,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const { hasIntersected } = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px',
  });
  
  const networkQuality = useNetworkQuality();
  
  // Determine quality based on network conditions
  const imageQuality = quality || (networkQuality.saveData ? 60 : 
    networkQuality.effectiveType === 'slow-2g' ? 70 :
    networkQuality.effectiveType === '2g' ? 80 : 90);
  
  // Should load image (either priority or in viewport)
  const shouldLoad = priority || hasIntersected;
  
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  const handleError = () => {
    setHasError(true);
    onError?.();
  };
  
  // Optimize image URL based on quality
  const optimizedSrc = src.includes('?') 
    ? `${src}&q=${imageQuality}`
    : `${src}?q=${imageQuality}`;
  
  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
    >
      {/* Placeholder */}
      {placeholder === 'blur' && blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* Main Image */}
      {shouldLoad && !hasError && (
        <img
          src={optimizedSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading={priority ? 'eager' : 'lazy'}
          {...props}
        />
      )}
      
      {/* Loading State */}
      {!isLoaded && !hasError && shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      )}
      
      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
          <ImageOff className="w-8 h-8 mb-2" />
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
      
      {/* Network indicator for slow connections */}
      {networkQuality.effectiveType === 'slow-2g' && !isLoaded && (
        <div className="absolute top-2 right-2 bg-yellow-500/80 text-white text-xs px-2 py-1 rounded">
          Slow connection
        </div>
      )}
    </div>
  );
};