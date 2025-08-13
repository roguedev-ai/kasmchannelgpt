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
import { DemoModeModal } from './DemoModeModal';
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
  const [showEndTrialConfirm, setShowEndTrialConfirm] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const { isMobile, isTablet, isMobileOrTablet } = useBreakpoint();
  const [sessionData, setSessionData] = useState<{ startTime: number; expiresAt?: number } | null>(null);
  
  // Load session data from sessionStorage for immediate timer display
  useEffect(() => {
    if (!isFreeTrialMode) return;
    
    const loadSessionData = () => {
      const storedSession = sessionStorage.getItem('customgpt.freeTrialSession');
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          // Calculate expiry time
          const expiresAt = session.startTime + FREE_TRIAL_LIMITS.SESSION_DURATION;
          setSessionData({ startTime: session.startTime, expiresAt });
          
          // Also immediately update timer if we have session data
          const remaining = Math.max(0, expiresAt - Date.now());
          if (remaining > 0) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          } else {
            setTimeRemaining('Session expired');
          }
        } catch (e) {
          console.error('[DemoModeBanner] Failed to parse session data:', e);
        }
      }
    };
    
    // Load immediately
    loadSessionData();
    
    return () => {};
  }, [isFreeTrialMode]);
  
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
      if (isFreeTrialMode) {
        // For free trial, use API data if available, otherwise use sessionStorage data
        let expiresAt: number | undefined;
        
        if (usageStats?.session?.expiresAt) {
          expiresAt = usageStats.session.expiresAt;
        } else if (sessionData?.expiresAt) {
          expiresAt = sessionData.expiresAt;
        }
        
        if (expiresAt) {
          const remaining = Math.max(0, expiresAt - Date.now());
          
          if (remaining <= 0) {
            setTimeRemaining('Session expired');
            return;
          }
          
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
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
  }, [sessionStartTime, sessionTimeout, isFreeTrialMode, usageStats, sessionData]);
  
  // For mobile/tablet, always show compact view (ignore minimized state)
  if (isMobileOrTablet) {
    return (
      <div className={cn(
        "border-b",
        isFreeTrialMode 
          ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/90 dark:to-purple-950/90 border-blue-200 dark:border-blue-800"
          : "bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800",
        className
      )}>
        <div className="px-3 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                if (!isFreeTrialMode) {
                  setIsConfigOpen(true);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-all",
                isFreeTrialMode 
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                  : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50 active:scale-95 cursor-pointer",
              )}
            >
              {isFreeTrialMode ? <Zap className="h-3 w-3" /> : <Key className="h-3 w-3" />}
              <span className="flex flex-col items-start">
                <span>{isFreeTrialMode ? "Free Trial" : "Demo Mode"}</span>
                {isFreeTrialMode && usageStats && (
                  <span className="flex items-center gap-2 text-[10px] opacity-90">
                    <span className="flex items-center gap-0.5">
                      <FolderOpen className="h-2.5 w-2.5" />
                      {usageStats.usage.projects.used}/{usageStats.usage.projects.limit}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="h-2.5 w-2.5" />
                      {usageStats.usage.conversations.used}/{usageStats.usage.conversations.limit}
                    </span>
                  </span>
                )}
              </span>
              {timeRemaining && (
                <span className="flex items-center gap-1 ml-auto">
                  <Clock className="h-2.5 w-2.5" />
                  {timeRemaining}
                </span>
              )}
              {!isFreeTrialMode && (
                <Settings className="h-3 w-3 ml-1" />
              )}
            </button>
            {isFreeTrialMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEndTrialConfirm(true)}
                className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 text-xs"
              >
                End Trial
              </Button>
            )}
          </div>
        </div>
        
        {/* Configuration Modal */}
        <DemoConfigModal 
          isOpen={isConfigOpen} 
          onClose={() => setIsConfigOpen(false)} 
        />
        
        {/* End Trial Confirmation Dialog */}
        <AlertDialog open={showEndTrialConfirm} onOpenChange={setShowEndTrialConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End Free Trial?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to end your free trial and add your own API key? 
                <br /><br />
                <strong>Note:</strong> You won&apos;t be able to return to free trial mode after this action.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  // Mark free trial as expired permanently
                  localStorage.setItem('customgpt.freeTrialExpired', 'true');
                  // Clear free trial mode flag
                  localStorage.removeItem('customgpt.freeTrialMode');
                  // Clear session data
                  sessionStorage.removeItem('customgpt.freeTrialSession');
                  sessionStorage.removeItem('customgpt.captchaVerified');
                  
                  setShowEndTrialConfirm(false);
                  setShowApiKeyModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Yes, Add My API Key
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* API Key Modal - same as what shows when trial expires */}
        {showApiKeyModal && (
          <DemoModeModal 
            hideFreeTrial={true} 
            canClose={false}
            onClose={() => {
              // This modal can't be closed, user must add API key or refresh
            }}
          />
        )}
      </div>
    );
  }

  // Desktop view - check minimized state
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

  // Desktop view
  return (
    <div className={cn(
      "border-b",
      isFreeTrialMode 
        ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/90 dark:to-purple-950/90 border-blue-200 dark:border-blue-800"
        : "bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center flex-1 gap-3">
            {isFreeTrialMode ? (
              <>
                <Zap className="text-blue-600 dark:text-blue-400 flex-shrink-0 h-4 w-4" />
                <p className="text-blue-800 dark:text-blue-200 text-xs">
                  <span className="font-semibold">Free Trial</span>
                  {usageStats && (
                    <span className="ml-2">
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
                <Key className="text-amber-600 dark:text-amber-400 flex-shrink-0 h-4 w-4" />
                <p className="text-amber-800 dark:text-amber-200 text-xs">
                  <span className="font-semibold">Demo Mode Active</span>
                  <span> - Using your API key</span>
                </p>
              </>
            )}
            {timeRemaining && (
              <div className={cn(
                "flex items-center gap-1",
                isFreeTrialMode 
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-amber-700 dark:text-amber-300",
                "text-xs"
              )}>
                <Clock className="h-3 w-3" />
                <span>{timeRemaining}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isFreeTrialMode ? (
              <>
                {/* Free trial mode switch button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEndTrialConfirm(true)}
                  className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                >
                  End Trial and Add API Key
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsConfigOpen(true)}
                  className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Configure
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEndSessionConfirm(true)}
                  className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                >
                  End Session
                </Button>
              </>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className={cn(
                "p-1 transition-colors",
                isFreeTrialMode
                  ? "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  : "text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
              )}
              aria-label="Minimize banner"
            >
              <X className="h-4 w-4" />
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
      
      {/* End Trial Confirmation Dialog */}
      <AlertDialog open={showEndTrialConfirm} onOpenChange={setShowEndTrialConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Free Trial?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end your free trial and add your own API key? 
              <br /><br />
              <strong>Note:</strong> You won&apos;t be able to return to free trial mode after this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Mark free trial as expired permanently
                localStorage.setItem('customgpt.freeTrialExpired', 'true');
                // Clear free trial mode flag
                localStorage.removeItem('customgpt.freeTrialMode');
                // Clear session data
                sessionStorage.removeItem('customgpt.freeTrialSession');
                sessionStorage.removeItem('customgpt.captchaVerified');
                
                setShowEndTrialConfirm(false);
                setShowApiKeyModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Yes, Add My API Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* API Key Modal - same as what shows when trial expires */}
      {showApiKeyModal && (
        <DemoModeModal 
          hideFreeTrial={true} 
          canClose={false}
          onClose={() => {
            // This modal can't be closed, user must add API key or refresh
          }}
        />
      )}
    </div>
  );
}