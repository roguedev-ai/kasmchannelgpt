/**
 * Demo Mode Banner Component
 * 
 * Persistent banner shown when in demo mode to remind users
 * about security implications and session timeout.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Clock, Settings, FolderOpen, MessageSquare, Zap, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDemoStore } from '@/store/demo';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { DemoConfigModal } from './DemoConfigModal';
import { useDemoModeContext } from '@/contexts/DemoModeContext';
import { proxyClient } from '@/lib/api/proxy-client';
import { FREE_TRIAL_LIMITS } from '@/lib/constants/demo-limits';

interface DemoModeBannerProps {
  className?: string;
}

export function DemoModeBanner({ className }: DemoModeBannerProps) {
  const { sessionStartTime, sessionTimeout, clearApiKey } = useDemoStore();
  const { isFreeTrialMode } = useDemoModeContext();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const { isMobile } = useBreakpoint();
  
  // Fetch usage stats for free trial mode
  useEffect(() => {
    if (!isFreeTrialMode) return;
    
    const fetchStats = async () => {
      try {
        const response = await proxyClient.getDemoUsageStats();
        if (response.status === 'success') {
          setUsageStats(response.data);
        }
      } catch (err) {
        console.error('[DemoModeBanner] Failed to fetch usage stats:', err);
      }
    };
    
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [isFreeTrialMode]);
  
  useEffect(() => {
    const updateTimer = () => {
      if (isFreeTrialMode && usageStats?.session) {
        // For free trial, use the session data from API
        const remaining = Math.max(0, usageStats.session.expiresAt - Date.now());
        
        if (remaining <= 0) {
          setTimeRemaining('Session expired');
          return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else if (!isFreeTrialMode && sessionStartTime) {
        // For user API key mode, use the existing logic
        const elapsed = Date.now() - sessionStartTime;
        const remaining = sessionTimeout - elapsed;
        
        if (remaining <= 0) {
          setTimeRemaining('Session expired');
          return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [sessionStartTime, sessionTimeout, isFreeTrialMode, usageStats]);
  
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          "text-white p-2 rounded shadow-lg transition-colors inline-flex items-center gap-2",
          isFreeTrialMode 
            ? "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            : "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700",
          className
        )}
        aria-label="Show demo mode banner"
      >
        {isFreeTrialMode ? <Zap className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        <span className="text-xs font-medium">
          {isFreeTrialMode ? "Free Trial" : "Demo Mode"}
        </span>
      </button>
    );
  }
  
  return (
    <div className={cn(
      "border-b",
      isFreeTrialMode 
        ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/90 dark:to-purple-950/90 border-blue-200 dark:border-blue-800"
        : "bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800",
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
            {isFreeTrialMode ? (
              <>
                <Zap className={cn(
                  "text-blue-600 dark:text-blue-400 flex-shrink-0",
                  isMobile ? "h-3 w-3" : "h-4 w-4"
                )} />
                <p className={cn(
                  "text-blue-800 dark:text-blue-200",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  <span className="font-semibold">Free Trial</span>
                  {!isMobile && usageStats && (
                    <span className="hidden sm:inline ml-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          {usageStats.usage.projects.used}/{usageStats.usage.projects.limit}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {usageStats.usage.conversations.used}/{usageStats.usage.conversations.limit}
                        </span>
                      </span>
                    </span>
                  )}
                </p>
              </>
            ) : (
              <>
                <Key className={cn(
                  "text-amber-600 dark:text-amber-400 flex-shrink-0",
                  isMobile ? "h-3 w-3" : "h-4 w-4"
                )} />
                <p className={cn(
                  "text-amber-800 dark:text-amber-200",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  <span className="font-semibold">Demo Mode{!isMobile && " Active"}</span>
                  {!isMobile && <span className="hidden sm:inline"> - Using your API key</span>}
                </p>
              </>
            )}
            {timeRemaining && (
              <div className={cn(
                "flex items-center gap-1",
                isFreeTrialMode 
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-amber-700 dark:text-amber-300",
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
            {isFreeTrialMode ? (
              <>
                {/* Free trial mode switch button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Clear all demo-related data
                      localStorage.removeItem('customgpt.deploymentMode');
                      localStorage.removeItem('customgpt.freeTrialMode');
                      sessionStorage.removeItem('customgpt.freeTrialSession');
                      sessionStorage.removeItem('customgpt.captchaVerified');
                      sessionStorage.removeItem('customgpt.autoDetected');
                      sessionStorage.removeItem('customgpt.firstLoadHandled');
                      // Clear any cookies
                      document.cookie = 'demo_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                      // Reload to start fresh
                      window.location.reload();
                    }}
                    className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  >
                    Switch Mode
                  </Button>
              </>
            ) : (
              <>
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
                    onClick={() => setShowEndSessionConfirm(true)}
                    className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  >
                    End Session
                  </Button>
                )}
              </>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className={cn(
                "transition-colors",
                isFreeTrialMode
                  ? "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  : "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200",
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
      
      {/* End Session Confirmation Dialog */}
      <AlertDialog open={showEndSessionConfirm} onOpenChange={setShowEndSessionConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Demo Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end your demo session? This will clear your API key and return you to the mode selection screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearApiKey();
                setShowEndSessionConfirm(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}