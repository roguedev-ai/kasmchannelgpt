/**
 * Loading Components
 * 
 * Reusable loading indicators for consistent loading states across the app.
 * Includes spinner, skeleton loaders, and full-page loading states.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Label for accessibility */
  label?: string;
}

/**
 * Spinner Component
 * 
 * Animated spinning loader for inline and overlay loading states
 */
export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className,
  label = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className="relative inline-flex">
      <Loader2 
        className={cn(
          'animate-spin text-primary transition-all duration-200',
          sizeClasses[size],
          className
        )}
        aria-label={label}
      />
      {/* Subtle glow effect */}
      <div className={cn(
        'absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl',
        sizeClasses[size]
      )} />
    </div>
  );
};

interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the skeleton */
  animate?: boolean;
}

/**
 * Skeleton Component
 * 
 * Placeholder loading state for content
 */
export const Skeleton: React.FC<SkeletonProps> = ({ 
  className,
  animate = true
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted',
        animate && 'shimmer',
        className
      )}
    >
      {animate && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </div>
  );
};

interface LoadingDotsProps {
  /** Size of the dots */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * LoadingDots Component
 * 
 * Three animated dots for typing/processing indicators
 */
export const LoadingDots: React.FC<LoadingDotsProps> = ({ 
  size = 'md',
  className 
}) => {
  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5'
  };

  return (
    <div className={cn('flex items-center space-x-1.5', className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full bg-primary/60',
            'animate-[pulse_1.4s_ease-in-out_infinite]',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${index * 0.15}s`,
            animationFillMode: 'both',
          }}
        />
      ))}
    </div>
  );
};

interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Loading message to display */
  message?: string;
  /** Whether to blur the background */
  blur?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * LoadingOverlay Component
 * 
 * Full-screen or container overlay with loading indicator
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible,
  message,
  blur = true,
  className
}) => {
  if (!visible) return null;

  return (
    <div className={cn(
      'absolute inset-0 z-50 flex items-center justify-center',
      'bg-background/60 transition-all duration-300',
      blur && 'backdrop-blur-md',
      'animate-in fade-in-0 duration-200',
      className
    )}>
      <div className={cn(
        'flex flex-col items-center space-y-4 p-6',
        'bg-background/90 backdrop-blur-sm',
        'rounded-xl border border-border/50',
        'shadow-xl',
        'animate-in zoom-in-95 duration-300'
      )}>
        <Spinner size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};

interface MessageSkeletonProps {
  /** Whether this represents an assistant message */
  isAssistant?: boolean;
  /** Number of lines to show */
  lines?: number;
}

/**
 * MessageSkeleton Component
 * 
 * Skeleton loader specifically for chat messages
 */
export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ 
  isAssistant = false,
  lines = 3
}) => {
  return (
    <div className={cn(
      'flex gap-3 p-4',
      isAssistant ? 'bg-muted' : 'bg-background'
    )}>
      {/* Avatar */}
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      
      {/* Message content */}
      <div className="flex-1 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i}
            className={cn(
              'h-4',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
};

interface ConversationSkeletonProps {
  /** Number of conversation items to show */
  count?: number;
}

/**
 * ConversationSkeleton Component
 * 
 * Skeleton loader for conversation list items
 */
export const ConversationSkeleton: React.FC<ConversationSkeletonProps> = ({ 
  count = 3 
}) => {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3 rounded-lg">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
};

interface LoadingButtonProps {
  /** Whether the button is in loading state */
  loading: boolean;
  /** Button content when not loading */
  children: React.ReactNode;
  /** Loading text to display */
  loadingText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Other button props */
  [key: string]: any;
}

/**
 * LoadingButton Component
 * 
 * Button with integrated loading state
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  loading,
  children,
  loadingText = 'Loading...',
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={cn(
        'relative',
        loading && 'cursor-not-allowed opacity-70',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner size="sm" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

interface ScreenLoadingProps {
  /** Whether the screen loading is visible */
  visible: boolean;
  /** Loading message to display */
  message?: string;
  /** Optional icon to show with the loading message */
  icon?: React.ReactNode;
  /** Background opacity (0-100) */
  opacity?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ScreenLoading Component
 * 
 * Full-screen loading overlay for page/screen transitions
 * with customizable message and icon
 */
export const ScreenLoading: React.FC<ScreenLoadingProps> = ({
  visible,
  message = 'Loading...',
  icon,
  opacity = 95,
  className
}) => {
  if (!visible) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-[100] flex items-center justify-center',
      'bg-background/90 backdrop-blur-lg',
      'transition-all duration-500',
      'animate-in fade-in-0',
      className
    )}>
      <div className={cn(
        'flex flex-col items-center space-y-6 p-10',
        'animate-in zoom-in-95 slide-in-from-bottom-4 duration-500'
      )}>
        <div className="relative">
          {icon ? (
            <div className={cn(
              'flex items-center justify-center w-20 h-20',
              'bg-primary/10 rounded-2xl',
              'shadow-lg shadow-primary/20',
              'animate-pulse'
            )}>
              {icon}
            </div>
          ) : (
            <Spinner size="xl" />
          )}
        </div>
        {message && (
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">{message}</p>
            <LoadingDots size="md" />
          </div>
        )}
      </div>
    </div>
  );
};

interface PageLoadingProps {
  /** Whether the page loading is visible */
  visible: boolean;
  /** Loading message to display */
  message?: string;
  /** Show skeleton content instead of spinner */
  showSkeleton?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PageLoading Component
 * 
 * In-page loading state for content areas
 * with optional skeleton loading
 */
export const PageLoading: React.FC<PageLoadingProps> = ({
  visible,
  message = 'Loading page...',
  showSkeleton = false,
  className
}) => {
  if (!visible) return null;

  if (showSkeleton) {
    return (
      <div className={cn('space-y-4 p-6', className)}>
        <div className="space-y-3">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-12',
      className
    )}>
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
};