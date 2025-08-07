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
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )}
      aria-label={label}
    />
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
        'bg-muted rounded',
        animate && 'animate-pulse',
        className
      )}
    />
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
    sm: 'h-1 w-1',
    md: 'h-1.5 w-1.5',
    lg: 'h-2 w-2'
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      <div className={cn(
        'bg-muted-foreground rounded-full animate-bounce',
        sizeClasses[size],
        '[animation-delay:-0.3s]'
      )} />
      <div className={cn(
        'bg-muted-foreground rounded-full animate-bounce',
        sizeClasses[size],
        '[animation-delay:-0.15s]'
      )} />
      <div className={cn(
        'bg-muted-foreground rounded-full animate-bounce',
        sizeClasses[size]
      )} />
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
      'bg-background/80 transition-opacity duration-200',
      blur && 'backdrop-blur-sm',
      className
    )}>
      <div className="flex flex-col items-center space-y-3">
        <Spinner size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
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
      'transition-all duration-300',
      className
    )}
    style={{ backgroundColor: `rgba(255, 255, 255, ${opacity / 100})` }}>
      <div className="flex flex-col items-center space-y-4 p-8">
        <div className="relative">
          {icon ? (
            <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-full mb-2">
              {icon}
            </div>
          ) : (
            <Spinner size="xl" />
          )}
        </div>
        {message && (
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-1">{message}</p>
            <div className="flex items-center justify-center space-x-1">
              <LoadingDots size="md" />
            </div>
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