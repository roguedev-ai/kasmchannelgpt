/**
 * Demo Mode Banner Component
 * 
 * Persistent banner shown when in demo mode to remind users
 * about security implications and session timeout.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDemoStore } from '@/store/demo';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { DemoConfigModal } from './DemoConfigModal';

interface DemoModeBannerProps {
  className?: string;
}

export function DemoModeBanner({ className }: DemoModeBannerProps) {
  const { sessionStartTime, sessionTimeout, clearApiKey } = useDemoStore();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { isMobile } = useBreakpoint();
  
  useEffect(() => {
    if (!sessionStartTime) return;
    
    const updateTimer = () => {
      const elapsed = Date.now() - sessionStartTime;
      const remaining = sessionTimeout - elapsed;
      
      if (remaining <= 0) {
        setTimeRemaining('Session expired');
        return;
      }
      
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [sessionStartTime, sessionTimeout]);
  
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          "fixed top-0 right-0 bg-amber-500 dark:bg-amber-600 text-white p-2 rounded-bl-lg shadow-lg z-50 hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors",
          className
        )}
        aria-label="Show demo mode banner"
      >
        <AlertTriangle className="h-4 w-4" />
      </button>
    );
  }
  
  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 bg-amber-50 dark:bg-amber-950/90 border-b border-amber-200 dark:border-amber-800 z-50",
      className
    )}>
      <div className={cn(
        "mx-auto",
        isMobile ? "px-3 py-1.5" : "max-w-7xl px-4 py-2"
      )}>
        <div className={cn(
          "flex items-center justify-between",
          isMobile ? "gap-2" : "gap-4"
        )}>
          <div className={cn(
            "flex items-center flex-1",
            isMobile ? "gap-1.5" : "gap-3"
          )}>
            <AlertTriangle className={cn(
              "text-amber-600 dark:text-amber-400 flex-shrink-0",
              isMobile ? "h-3 w-3" : "h-4 w-4"
            )} />
            <p className={cn(
              "text-amber-800 dark:text-amber-200",
              isMobile ? "text-xs" : "text-sm"
            )}>
              <span className="font-semibold">Demo Mode{!isMobile && " Active"}</span>
              {!isMobile && <span className="hidden sm:inline"> - API key is stored in browser only</span>}
            </p>
            {timeRemaining && !isMobile && (
              <div className={cn(
                "flex items-center gap-1 text-amber-700 dark:text-amber-300",
                isMobile ? "text-xs" : "text-sm"
              )}>
                <Clock className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
                <span>{timeRemaining}</span>
              </div>
            )}
          </div>
          <div className={cn(
            "flex items-center",
            isMobile ? "gap-1" : "gap-2"
          )}>
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "sm"}
              onClick={() => setIsConfigOpen(true)}
              className={cn(
                "text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50",
                isMobile && "px-2"
              )}
            >
              <Settings className={cn("mr-1", isMobile ? "h-3 w-3" : "h-4 w-4")} />
              {isMobile ? "Config" : "Configure"}
            </Button>
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearApiKey}
                className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              >
                End Session
              </Button>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className={cn(
                "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors",
                isMobile ? "p-0.5" : "p-1"
              )}
              aria-label="Minimize banner"
            >
              <X className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Configuration Modal */}
      <DemoConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
      />
    </div>
  );
}