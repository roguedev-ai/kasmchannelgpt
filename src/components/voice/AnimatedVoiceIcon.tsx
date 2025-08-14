'use client';

import { cn } from '@/lib/utils';

interface AnimatedVoiceIconProps {
  className?: string;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedVoiceIcon({ 
  className, 
  isActive = false,
  size = 'md' 
}: AnimatedVoiceIconProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  const barHeights = {
    sm: ['h-2', 'h-3', 'h-2.5', 'h-3', 'h-2'],
    md: ['h-3', 'h-4', 'h-3.5', 'h-4', 'h-3'],
    lg: ['h-3.5', 'h-5', 'h-4.5', 'h-5', 'h-3.5']
  };

  const bars = size === 'sm' ? barHeights.sm : size === 'md' ? barHeights.md : barHeights.lg;

  return (
    <div className={cn(
      'flex items-center justify-center',
      sizeClasses[size],
      className
    )}
    style={{ gap: '2px' }}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={cn(
            'rounded-full transition-all duration-300',
            height,
            isActive && 'animate-voice-pulse'
          )}
          style={{
            width: size === 'lg' ? '3px' : size === 'md' ? '2.5px' : '2px',
            animationDelay: isActive ? `${index * 100}ms` : '0ms',
            background: isActive 
              ? `linear-gradient(to top, 
                  hsl(${260 + index * 20}, 85%, 55%), 
                  hsl(${320 + index * 20}, 85%, 65%))` 
              : `linear-gradient(to top,
                  hsl(${260 + index * 15}, 80%, 55%),
                  hsl(${280 + index * 15}, 80%, 65%))`
          }}
        />
      ))}
    </div>
  );
}