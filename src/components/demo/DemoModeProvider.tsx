/**
 * Demo Mode Provider Component
 * 
 * Wraps the app and handles demo mode authentication flow.
 * Shows either the demo mode setup screen or the main app.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useDemoStore } from '@/store/demo';
import { DemoModeScreen } from './DemoModeScreen';
import { DemoModeModal } from './DemoModeModal';
import { DemoModeBanner } from './DemoModeBanner';
import { SessionExpiredScreen } from './SessionExpiredScreen';
import { apiClient } from '@/lib/api/client';
import { DemoModeContextProvider } from '@/contexts/DemoModeContext';
import { FREE_TRIAL_LIMITS } from '@/lib/constants/demo-limits';

interface DemoModeProviderProps {
  children: React.ReactNode;
}

// Loading component with auto-refresh
function LoadingScreen() {
  const [secondsElapsed, setSecondsElapsed] = React.useState(0);
  const [hasRefreshed, setHasRefreshed] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  
  // Handle client-side hydration properly
  React.useEffect(() => {
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
  }, []); // Empty dependency array - run only once on mount
  
  const handleManualRefresh = () => {
    console.log('[DemoModeProvider] Manual refresh triggered');
    // Clear all relevant flags to ensure a fresh check
    sessionStorage.removeItem('customgpt.loadingRefreshAttempted');
    sessionStorage.removeItem('customgpt.autoDetected');
    sessionStorage.removeItem('customgpt.firstLoadHandled');
    // Set a flag to force API check on reload
    sessionStorage.setItem('customgpt.isRefreshing', 'true');
    window.location.reload();
  };
  
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
          onClick={handleManualRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Refresh Now
        </button>
        
      </div>
    </div>
  );
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const pathname = usePathname();
  const { 
    isDemoMode, 
    isAuthenticated, 
    apiKey,
    openAIApiKey,
    initializeFromStorage,
    validateSession 
  } = useDemoStore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingKeys, setIsCheckingKeys] = useState(true);
  const [serverHasKeys, setServerHasKeys] = useState(false);
  const [isFreeTrialMode, setIsFreeTrialMode] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  
  // Skip the modal for the landing page
  const isLandingPage = pathname === '/landing';
  
  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Detect if we're in an iframe and immediately set up free trial mode
  useEffect(() => {
    const checkIfEmbedded = () => {
      try {
        const embedded = window.self !== window.top;
        setIsEmbedded(embedded);
        if (embedded) {
          console.log('[DemoModeProvider] Site is embedded in iframe');
          
          // Only set up free trial if we don't already have a deployment mode
          const existingMode = localStorage.getItem('customgpt.deploymentMode');
          if (!existingMode) {
            console.log('[DemoModeProvider] No existing deployment mode - auto-starting free trial');
            
            // Immediately set up free trial mode for embedded contexts
            localStorage.setItem('customgpt.deploymentMode', 'demo');
            localStorage.setItem('customgpt.freeTrialMode', 'true');
            
            // Start free trial session
            const sessionData = {
              startTime: Date.now(),
              projectCount: 0,
              conversationCount: 0,
              messageCount: 0,
              sessionId: `trial_${Date.now()}_${Math.random().toString(36).substring(7)}`
            };
            
            sessionStorage.setItem('customgpt.freeTrialSession', JSON.stringify(sessionData));
            setDeploymentMode('demo');
            setIsFreeTrialMode(true);
          }
          setIsCheckingKeys(false); // Skip API checking when embedded
        }
        return embedded;
      } catch (e) {
        // Cross-origin iframe, assume we're embedded
        console.log('[DemoModeProvider] Cross-origin embed detected');
        setIsEmbedded(true);
        
        // Only set up free trial if we don't already have a deployment mode
        const existingMode = localStorage.getItem('customgpt.deploymentMode');
        if (!existingMode) {
          console.log('[DemoModeProvider] No existing deployment mode - auto-starting free trial');
          
          // Set up free trial mode for cross-origin embeds too
          localStorage.setItem('customgpt.deploymentMode', 'demo');
          localStorage.setItem('customgpt.freeTrialMode', 'true');
          
          const sessionData = {
            startTime: Date.now(),
            projectCount: 0,
            conversationCount: 0,
            messageCount: 0,
            sessionId: `trial_${Date.now()}_${Math.random().toString(36).substring(7)}`
          };
          
          sessionStorage.setItem('customgpt.freeTrialSession', JSON.stringify(sessionData));
          setDeploymentMode('demo');
          setIsFreeTrialMode(true);
        }
        setIsCheckingKeys(false); // Skip API checking when embedded
        return true;
      }
    };
    
    checkIfEmbedded();
  }, []);
  
  // Failsafe to prevent infinite loading
  useEffect(() => {
    const failsafeTimer = setTimeout(() => {
      if (isCheckingKeys) {
        console.warn('[DemoModeProvider] Failsafe triggered - forcing loading to stop');
        setIsCheckingKeys(false);
      }
    }, 10000); // 10 second absolute maximum
    
    return () => clearTimeout(failsafeTimer);
  }, [isCheckingKeys]);
  // Check session expiration synchronously on mount
  const [isSessionExpired, setIsSessionExpired] = useState(() => {
    if (typeof window !== 'undefined') {
      // CRITICAL: First check if already marked as expired
      const alreadyExpired = localStorage.getItem('customgpt.freeTrialExpired');
      if (alreadyExpired === 'true') {
        console.log('[DemoModeProvider] Initial check: Free trial already expired');
        return true;
      }
      
      const freeTrialFlag = localStorage.getItem('customgpt.freeTrialMode');
      if (freeTrialFlag === 'true') {
        const sessionData = sessionStorage.getItem('customgpt.freeTrialSession');
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            const elapsed = Date.now() - session.startTime;
            const expired = elapsed >= FREE_TRIAL_LIMITS.SESSION_DURATION;
            console.log('[DemoModeProvider] Initial expiration check:', { elapsed, expired });
            // If expired on initial check, mark it in localStorage
            if (expired) {
              localStorage.setItem('customgpt.freeTrialExpired', 'true');
            }
            return expired;
          } catch (e) {
            console.error('[DemoModeProvider] Error in initial expiration check:', e);
          }
        }
      }
    }
    return false;
  });
  
  // Initialize deploymentMode - handle SSR by deferring to useEffect
  const [deploymentMode, setDeploymentMode] = useState<string | null>(null);
  
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
  }, []);
  
  // Initialize free trial mode and check for expired sessions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const freeTrialFlag = localStorage.getItem('customgpt.freeTrialMode');
      const freeTrialExpired = localStorage.getItem('customgpt.freeTrialExpired');
      
      setIsFreeTrialMode(freeTrialFlag === 'true');
      
      // CRITICAL: Check if free trial has been marked as expired
      if (freeTrialExpired === 'true') {
        console.log('[DemoModeProvider] Free trial already expired (from localStorage)');
        setIsSessionExpired(true);
        return; // Don't need to check session data
      }
      
      // Immediately check if session is expired when loading free trial mode
      if (freeTrialFlag === 'true') {
        const sessionData = sessionStorage.getItem('customgpt.freeTrialSession');
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            const elapsed = Date.now() - session.startTime;
            const expired = elapsed >= FREE_TRIAL_LIMITS.SESSION_DURATION;
            if (expired) {
              console.log('[DemoModeProvider] Free trial session expired on load');
              setIsSessionExpired(true);
              // Mark as expired in localStorage
              localStorage.setItem('customgpt.freeTrialExpired', 'true');
            }
          } catch (e) {
            console.error('[DemoModeProvider] Error checking initial expiration:', e);
          }
        }
      }
    }
  }, []);

  // Check for server-side API keys on startup
  useEffect(() => {
    console.log('[DemoModeProvider] useEffect running, deploymentMode:', deploymentMode, 'isCheckingKeys:', isCheckingKeys, 'isEmbedded:', isEmbedded);
    
    // Skip if embedded - already handled in the iframe detection useEffect
    if (isEmbedded) {
      return;
    }
    
    if (typeof window !== 'undefined' && deploymentMode === null && !isEmbedded) {
      // Check if this is the true first load (no deployment mode and no first load handled)
      const firstLoadHandled = sessionStorage.getItem('customgpt.firstLoadHandled');
      
      if (!firstLoadHandled) {
        console.log('[DemoModeProvider] First load detected, clearing stale data...');
        // Clear any stale session data
        sessionStorage.removeItem('customgpt.autoDetected');
        sessionStorage.removeItem('customgpt.freeTrialSession');
        sessionStorage.removeItem('customgpt.captchaVerified');
        sessionStorage.removeItem('customgpt.loadingRefreshAttempted');
        // Mark first load as handled
        sessionStorage.setItem('customgpt.firstLoadHandled', 'true');
        // Remove automatic refresh here - let the LoadingScreen handle it
        // This prevents double refresh issues
      }
      
      // Check if we've already done auto-detection in this session
      const hasAutoDetected = sessionStorage.getItem('customgpt.autoDetected');
      
      if (hasAutoDetected) {
        console.log('[DemoModeProvider] Auto-detection already done this session, skipping');
        setIsCheckingKeys(false);
        return;
      }
      
      console.log('[DemoModeProvider] No deployment mode set, checking for server API keys...');
      
      // Add immediate timeout to prevent infinite checking
      const timeoutId = setTimeout(() => {
        console.log('[DemoModeProvider] API check timeout, showing selection screen');
        setServerHasKeys(false);
        sessionStorage.setItem('customgpt.autoDetected', 'true');
        setIsCheckingKeys(false);
      }, 3000); // 3 second timeout
      
      // Use AbortController for better fetch control
      const abortController = new AbortController();
      
      fetch('/api/proxy/validate-keys', { 
        signal: abortController.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
        .then(response => {
          console.log('[DemoModeProvider] Got response:', response.status, response.ok);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          clearTimeout(timeoutId);
          console.log('[DemoModeProvider] Server API key validation:', data);
          if (data.valid) {
            console.log('[DemoModeProvider] Server has valid API keys, auto-setting production mode');
            localStorage.setItem('customgpt.deploymentMode', 'production');
            sessionStorage.setItem('customgpt.autoDetected', 'true');
            setDeploymentMode('production');
            setServerHasKeys(true);
            setIsCheckingKeys(false);
            
            // Single manual refresh for clean initialization
            console.log('[DemoModeProvider] Triggering ONE refresh for clean state');
            setTimeout(() => {
              window.location.href = window.location.href;
            }, 200);
          } else {
            console.log('[DemoModeProvider] No valid server API keys, showing selection screen');
            setServerHasKeys(false);
            sessionStorage.setItem('customgpt.autoDetected', 'true');
            setIsCheckingKeys(false);
          }
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('[DemoModeProvider] API key check failed:', error);
          setServerHasKeys(false);
          sessionStorage.setItem('customgpt.autoDetected', 'true');
          setIsCheckingKeys(false);
        })
        .finally(() => {
          // Ensure loading state is always cleared
          console.log('[DemoModeProvider] API check completed, clearing loading state');
          if (isCheckingKeys) {
            setIsCheckingKeys(false);
          }
        });
        
      // Cleanup on unmount
      return () => {
        clearTimeout(timeoutId);
        abortController.abort();
      };
    } else if (deploymentMode !== null) {
      // Already have a deployment mode, no need to check
      setIsCheckingKeys(false);
    }
  }, [deploymentMode, isEmbedded]);
  
  useEffect(() => {
    // Only initialize demo store if in demo mode
    const currentMode = localStorage.getItem('customgpt.deploymentMode');
    if (currentMode === 'demo') {
      initializeFromStorage();
    }
  }, [initializeFromStorage]);
  
  // Check for session expiration in free trial mode
  useEffect(() => {
    if (!isFreeTrialMode) {
      setIsSessionExpired(false);
      return;
    }
    
    const checkExpiration = () => {
      // CRITICAL: First check if already marked as expired in localStorage
      const alreadyExpired = localStorage.getItem('customgpt.freeTrialExpired');
      if (alreadyExpired === 'true') {
        console.log('[DemoModeProvider] Free trial already marked as expired');
        setIsSessionExpired(true);
        return;
      }
      
      const sessionData = sessionStorage.getItem('customgpt.freeTrialSession');
      if (!sessionData) {
        setIsSessionExpired(false);
        return;
      }
      
      try {
        const session = JSON.parse(sessionData);
        const elapsed = Date.now() - session.startTime;
        const isExpired = elapsed >= FREE_TRIAL_LIMITS.SESSION_DURATION;
        console.log('[DemoModeProvider] Checking session expiration:', {
          startTime: session.startTime,
          currentTime: Date.now(),
          elapsed: elapsed,
          isExpired: isExpired
        });
        setIsSessionExpired(isExpired);
        
        // CRITICAL: Mark as expired in localStorage so ALL tabs know
        if (isExpired && !localStorage.getItem('customgpt.freeTrialExpired')) {
          console.log('[DemoModeProvider] Marking free trial as expired in localStorage');
          localStorage.setItem('customgpt.freeTrialExpired', 'true');
        }
      } catch (e) {
        console.error('[DemoModeProvider] Error checking expiration:', e);
        setIsSessionExpired(false);
      }
    };
    
    // Check immediately
    checkExpiration();
    
    // Check every second
    const interval = setInterval(checkExpiration, 1000);
    
    return () => clearInterval(interval);
  }, [isFreeTrialMode]);
  
  // Listen for storage changes to detect expiry in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customgpt.freeTrialExpired' && e.newValue === 'true') {
        console.log('[DemoModeProvider] Free trial expired detected from another tab');
        setIsSessionExpired(true);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  useEffect(() => {
    // Update API client with demo API key
    if (isDemoMode && apiKey) {
      console.log('[DemoModeProvider] Setting demo API key on client', { isDemoMode, hasApiKey: !!apiKey });
      apiClient.setDemoApiKey(apiKey);
    } else if (isDemoMode && !apiKey) {
      console.log('[DemoModeProvider] Demo mode but no API key available');
    }
  }, [isDemoMode, apiKey]);
  
  useEffect(() => {
    // Store OpenAI key in global for voice features
    const currentMode = localStorage.getItem('customgpt.deploymentMode');
    if (currentMode === 'demo' && openAIApiKey) {
      // We'll use this in the voice API route
      (window as any).__demoOpenAIKey = openAIApiKey;
    }
    return () => {
      // Clean up on unmount
      delete (window as any).__demoOpenAIKey;
    };
  }, [openAIApiKey]);
  
  useEffect(() => {
    // Store CustomGPT API key in global for voice features
    const currentMode = localStorage.getItem('customgpt.deploymentMode');
    if (currentMode === 'demo' && apiKey) {
      // We'll use this in the voice API route for chat completions
      (window as any).__demoCustomGPTKey = apiKey;
    }
    return () => {
      // Clean up on unmount
      delete (window as any).__demoCustomGPTKey;
    };
  }, [apiKey]);
  
  useEffect(() => {
    // Validate session periodically
    const interval = setInterval(() => {
      validateSession();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [validateSession]);
  
  // Wrap everything with the context provider
  return (
    <DemoModeContextProvider>
      {(() => {
        // During SSR or before mount, always render children to avoid hydration mismatch
        if (!isMounted) {
          return children;
        }
        
        console.log('[DemoModeProvider] Rendering with:', { 
          deploymentMode, 
          isDemoMode, 
          isAuthenticated, 
          isCheckingKeys,
          serverHasKeys,
          isEmbedded 
        });
        
        // Show loading while checking for server API keys (skip for landing page or embeds)
        if (isCheckingKeys && !isLandingPage && !isEmbedded) {
          console.log('[DemoModeProvider] Checking server API keys - showing loading');
          return <LoadingScreen />;
        }
        
        // Skip modal for landing page or embedded content
        if (isLandingPage || isEmbedded) {
          console.log('[DemoModeProvider] Landing page or embedded - skipping modal');
          return children;
        }
        
        // No deployment mode selected - show modal over background UI
        if (!deploymentMode) {
          console.log('[DemoModeProvider] No deployment mode - showing modal over UI');
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
          console.log('[DemoModeProvider] Production mode - showing main app');
          return children;
        }
        
        // Demo mode selected
        if (deploymentMode === 'demo') {
          // Check if this is free trial mode
          if (isFreeTrialMode) {
            // Check if session has expired
            if (isSessionExpired) {
              console.log('[DemoModeProvider] Free trial session expired - showing modal without free trial option');
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
            
            console.log('[DemoModeProvider] Free trial mode - showing main app');
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
            console.log('[DemoModeProvider] Demo mode but not authenticated - showing modal over UI');
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
          // Authenticated - show app
          console.log('[DemoModeProvider] Demo mode and authenticated - showing main app');
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
    </DemoModeContextProvider>
  );
}