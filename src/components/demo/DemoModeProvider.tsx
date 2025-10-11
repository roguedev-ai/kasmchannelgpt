'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDemoStore } from '@/store/demo';
import { DemoModeScreen } from './DemoModeScreen';
import { DemoModeModal } from './DemoModeModal';
import { DemoModeBanner } from './DemoModeBanner';
import { SessionExpiredScreen } from './SessionExpiredScreen';
import { apiClient } from '@/lib/api/client';
import { DemoModeContext } from '@/contexts/DemoModeContext';
import { FREE_TRIAL_LIMITS } from '@/lib/constants/demo-limits';

interface DemoModeProviderProps {
  children: React.ReactNode;
}

// Loading component with auto-refresh
const LoadingScreen: React.FC = () => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Handle client-side hydration properly
  useEffect(() => {
    if (!isClient) {
      setIsClient(true);
      
      // Start timer immediately on client
      console.log('[LoadingScreen] Component mounted on client, starting timer');
      let elapsed = 0;
      const counterTimer = setInterval(() => {
        elapsed++;
        console.log('[LoadingScreen] Timer tick:', elapsed);
        setSecondsElapsed(elapsed);
      }, 1000);
      
      // Check for auto-refresh
      const loadingRefreshAttempted = sessionStorage.getItem('customgpt.loadingRefreshAttempted');
      console.log('[LoadingScreen] Checking auto-refresh:', { loadingRefreshAttempted });
      
      if (!loadingRefreshAttempted) {
        // Auto-refresh after 2 seconds (only once)
        console.log('[LoadingScreen] Setting up auto-refresh timer');
        const refreshTimer = setTimeout(() => {
          console.log('[DemoModeProvider] Auto-refreshing due to loading timeout');
          sessionStorage.setItem('customgpt.loadingRefreshAttempted', 'true');
          // Clear flags to ensure fresh API check
          sessionStorage.removeItem('customgpt.autoDetected');
          sessionStorage.removeItem('customgpt.firstLoadHandled');
          // Set a flag to force API check on reload
          sessionStorage.setItem('customgpt.isRefreshing', 'true');
          setHasRefreshed(true);
          window.location.reload();
        }, 2000);
        
        // Clear flag after some time
        const clearFlagTimer = setTimeout(() => {
          sessionStorage.removeItem('customgpt.loadingRefreshAttempted');
        }, 10000);
        
        return () => {
          console.log('[LoadingScreen] Cleaning up timers');
          clearInterval(counterTimer);
          clearTimeout(refreshTimer);
          clearTimeout(clearFlagTimer);
        };
      } else {
        // Already attempted refresh, just clear the flag after some time
        const clearFlagTimer = setTimeout(() => {
          sessionStorage.removeItem('customgpt.loadingRefreshAttempted');
        }, 10000);
        
        return () => {
          console.log('[LoadingScreen] Cleaning up timers');
          clearInterval(counterTimer);
          clearTimeout(clearFlagTimer);
        };
      }
    }
  }, [isClient]); // Added isClient dependency
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-sm mx-auto p-8">
        {/* Loading spinner */}
        <div className="mb-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Loading...
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Checking API configuration...
        </div>
        
        {/* Show auto-refresh countdown if not already refreshed */}
        {!hasRefreshed && secondsElapsed >= 1 && secondsElapsed < 2 && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            Auto-refreshing in {2 - secondsElapsed} second{2 - secondsElapsed !== 1 ? 's' : ''}...
          </div>
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Refresh Now
        </button>
      </div>
    </div>
  );
};

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const pathname = usePathname();
  const { 
    isDemoMode, 
    isAuthenticated, 
    apiKey,
    openAIApiKey,
    initializeFromStorage,
    validateSession,
    sessionStartTime,
    sessionTimeout 
  } = useDemoStore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingKeys, setIsCheckingKeys] = useState(true);
  const [serverHasKeys, setServerHasKeys] = useState(false);
  const [isFreeTrialMode, setIsFreeTrialMode] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [deploymentMode, setDeploymentMode] = useState<string | null>(null);
  
  // Skip the modal for the landing page
  const isLandingPage = pathname === '/landing';

  // Check if session has expired
  const isSessionExpired = sessionStartTime && (Date.now() - sessionStartTime > sessionTimeout);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize deployment mode from localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !deploymentMode) {
      const storedMode = localStorage.getItem('customgpt.deploymentMode');
      if (storedMode) {
        console.log('[DemoModeProvider] Restoring deployment mode from localStorage:', storedMode);
        setDeploymentMode(storedMode);
        // Also restore free trial mode if it was set
        const freeTrialFlag = localStorage.getItem('customgpt.freeTrialMode');
        if (freeTrialFlag === 'true') {
          setIsFreeTrialMode(true);
        }
      }
    }
  }, [deploymentMode]);

  // Validate session periodically
  useEffect(() => {
    if (!validateSession) return; // Skip if validateSession not available

    const interval = setInterval(() => {
      validateSession();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [validateSession]);

  // Create context value
  const contextValue = {
    isRuntimeDemoMode: isDemoMode,
    isAuthenticated
  };

  // Wrap everything with the context provider
  return (
    <DemoModeContext.Provider value={contextValue}>
      {(() => {
        // During SSR or before mount, always render children to avoid hydration mismatch
        if (!isMounted) {
          return children;
        }
        
        // Show loading while checking for server API keys (skip for landing page or embeds)
        if (isCheckingKeys && !isLandingPage && !isEmbedded) {
          return <LoadingScreen />;
        }
        
        // Skip modal for landing page or embedded content
        if (isLandingPage || isEmbedded) {
          return children;
        }
        
        // No deployment mode selected - show modal over background UI
        if (!deploymentMode) {
          // If we detected valid keys but somehow didn't refresh, show a manual option
          if (serverHasKeys) {
            return (
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                  <div className="text-lg font-semibold text-gray-800 mb-4">
                    API Keys Detected!
                  </div>
                  <div className="text-sm text-gray-600 mb-6">
                    Valid API keys were found in your server configuration. 
                    Click below to continue to the main application.
                  </div>
                  <button 
                    onClick={() => window.location.href = window.location.href}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continue to App
                  </button>
                </div>
              </div>
            );
          }
          // Render main UI in background with modal overlay
          return (
            <>
              {/* Background UI - render children but disable interaction */}
              <div className="pointer-events-none">
                {children}
              </div>
              {/* Modal Overlay */}
              <DemoModeModal />
            </>
          );
        }
        
        // Production mode selected - show app directly
        if (deploymentMode === 'production') {
          return children;
        }
        
        // Demo mode selected
        if (deploymentMode === 'demo') {
          // Check if this is free trial mode
          if (isFreeTrialMode) {
            // Check if session has expired
            if (isSessionExpired) {
              return (
                <>
                  {/* Background UI - render children but disable interaction */}
                  <div className="pointer-events-none">
                    {children}
                  </div>
                  {/* Modal Overlay - can't close, no free trial option */}
                  <DemoModeModal hideFreeTrial={true} canClose={false} />
                </>
              );
            }
            
            // Free trial doesn't need authentication, it uses server-side demo key
            return (
              <>
                <DemoModeBanner />
                {children}
              </>
            );
          }
          
          // Check if authenticated in demo mode (user API key mode)
          if (!isAuthenticated) {
            return (
              <>
                {/* Background UI - render children but disable interaction */}
                <div className="pointer-events-none">
                  {children}
                </div>
                {/* Modal Overlay */}
                <DemoModeModal />
              </>
            );
          }
          // Authenticated - show app
          return (
            <>
              <DemoModeBanner />
              {children}
            </>
          );
        }
        
        // Fallback (should not reach here)
        console.warn('[DemoModeProvider] Fallback case reached with deploymentMode:', deploymentMode);
        return null;
      })()}
    </DemoModeContext.Provider>
  );
}
