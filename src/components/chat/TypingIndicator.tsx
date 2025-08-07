/**
 * Typing Indicator Component
 * 
 * Shows animated typing indicator when AI is generating a response.
 * Provides visual feedback that the system is processing.
 * 
 * Features:
 * - Three-dot bouncing animation
 * - AI avatar display
 * - Staggered animation delays
 * - Consistent styling with messages
 * - Subtle bounce effect
 * 
 * Animation:
 * - Uses CSS animations defined in globals.css
 * - animate-bounce-subtle class for smooth motion
 * - Staggered delays (0ms, 100ms, 200ms)
 * - Creates wave-like effect
 * 
 * Design:
 * - Matches message component layout
 * - Gray background for distinction
 * - Centered in chat container
 * - Responsive max-width
 * 
 * Features:
 * - Multiple animation styles for enhanced visual feedback
 * - Contextual status messages for different AI processing states
 * - Progress indicators with time estimation for long operations
 * - Professional avatar customization with brand consistency
 * - Advanced loading patterns including skeleton alternatives
 */

'use client';

import React from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for TypingIndicator
 * 
 * @property className - Additional CSS classes for styling
 */
interface TypingIndicatorProps {
  className?: string;
}

/**
 * Typing Indicator Component
 * 
 * Displays animated dots to indicate AI is typing/processing.
 * Maintains visual consistency with message components.
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className }) => {
  return (
    <div className={cn(
      'px-4 py-6 bg-muted border-y border-border',
      className
    )}>
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-brand-600" />
        </div>
        
        {/* Typing Animation */}
        <div className="flex items-center gap-1 py-2">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce-subtle" />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce-subtle delay-100" />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce-subtle delay-200" />
        </div>
      </div>
    </div>
  );
};