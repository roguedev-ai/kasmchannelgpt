/**
 * Demo Mode Provider Component
 * 
 * Wraps the app and handles demo mode authentication flow.
 * Shows either the demo mode setup screen or the main app.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useDemoStore } from '@/store/demo';
import { DemoModeScreen } from './DemoModeScreen';
import { DemoModeModal } from './DemoModeModal';
import { DemoModeBanner } from './DemoModeBanner';
import { SessionExpiredScreen } from './SessionExpiredScreen';
import { apiClient } from '@/lib/api/client';
import { DemoModeContextProvider } from '@/contexts/DemoModeContext';

interface DemoModeProviderProps {
  children: React.ReactNode;
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const { 
    isDemoMode, 
    isAuthenticated, 
    apiKey,
    openAIApiKey,
    initializeFromStorage,
    validateSession 
  } = useDemoStore();
  
  const [isCheckingKeys, setIsCheckingKeys] = useState(true);
  const [serverHasKeys, setServerHasKeys] = useState(false);
  const [isFreeTrialMode, setIsFreeTrialMode] = useState(false);
  // Check session expiration synchronously on mount
  const [isSessionExpired, setIsSessionExpired] = useState(() => {
    if (typeof window !== 'undefined') {
      const freeTrialFlag = localStorage.getItem('customgpt.freeTrialMode');
      if (freeTrialFlag === 'true') {
        const sessionData = sessionStorage.getItem('customgpt.freeTrialSession');
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            const elapsed = Date.now() - session.startTime;
            const expired = elapsed >= (1 * 60 * 1000); // 1 minute for testing
            console.log('[DemoModeProvider] Initial expiration check:', { elapsed, expired });
            return expired;
          } catch (e) {
            console.error('[DemoModeProvider] Error in initial expiration check:', e);
          }
        }
      }
    }
    return false;
  });
  
  // Initialize deploymentMode synchronously to avoid race conditions
  const [deploymentMode, setDeploymentMode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('customgpt.deploymentMode');
    }
    return null;
  });
  
  // Initialize free trial mode and check for expired sessions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const freeTrialFlag = localStorage.getItem('customgpt.freeTrialMode');
      setIsFreeTrialMode(freeTrialFlag === 'true');
      
      // If we detected an expired session on mount, clear the free trial mode
      if (isSessionExpired && freeTrialFlag === 'true') {
        console.log('[DemoModeProvider] Clearing expired free trial mode');
        // Don't clear deployment mode, just free trial flag
        // This will show the modal with API key option only
      }
    }
  }, [isSessionExpired]);

  // Check for server-side API keys on startup
  useEffect(() => {
    if (typeof window !== 'undefined' && deploymentMode === null) {
      // Check if this is the true first load (no deployment mode and no first load handled)
      const firstLoadHandled = sessionStorage.getItem('customgpt.firstLoadHandled');
      
      if (!firstLoadHandled) {
        console.log('[DemoModeProvider] First load detected, clearing stale data and refreshing...');
        // Clear any stale session data
        sessionStorage.removeItem('customgpt.autoDetected');
        sessionStorage.removeItem('customgpt.freeTrialSession');
        sessionStorage.removeItem('customgpt.captchaVerified');
        // Mark first load as handled
        sessionStorage.setItem('customgpt.firstLoadHandled', 'true');
        // Force a single refresh for clean initialization
        setTimeout(() => {
          window.location.reload();
        }, 100);
        return;
      }
      
      // Check if we've already done auto-detection in this session
      const hasAutoDetected = sessionStorage.getItem('customgpt.autoDetected');
      
      if (hasAutoDetected) {
        console.log('[DemoModeProvider] Auto-detection already done this session, skipping');
        setIsCheckingKeys(false);
        return;
      }
      
      console.log('[DemoModeProvider] No deployment mode set, checking for server API keys...');
      
      // Add timeout to prevent infinite checking
      const timeoutId = setTimeout(() => {
        console.log('[DemoModeProvider] API check timeout, showing selection screen');
        setServerHasKeys(false);
        sessionStorage.setItem('customgpt.autoDetected', 'true');
        setIsCheckingKeys(false);
      }, 5000); // 5 second timeout
      
      fetch('/api/proxy/validate-keys')
        .then(response => {
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
            
            // Single manual refresh for clean initialization
            console.log('[DemoModeProvider] Triggering ONE refresh for clean state');
            setTimeout(() => {
              window.location.href = window.location.href;
            }, 200);
          } else {
            console.log('[DemoModeProvider] No valid server API keys, showing selection screen');
            setServerHasKeys(false);
            sessionStorage.setItem('customgpt.autoDetected', 'true');
          }
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('[DemoModeProvider] API key check failed:', error);
          setServerHasKeys(false);
          sessionStorage.setItem('customgpt.autoDetected', 'true');
        })
        .finally(() => {
          setIsCheckingKeys(false);
        });
    } else if (deploymentMode !== null) {
      // Already have a deployment mode, no need to check
      setIsCheckingKeys(false);
    }
  }, [deploymentMode]);
  
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
      const sessionData = sessionStorage.getItem('customgpt.freeTrialSession');
      if (!sessionData) {
        setIsSessionExpired(false);
        return;
      }
      
      try {
        const session = JSON.parse(sessionData);
        const elapsed = Date.now() - session.startTime;
        const isExpired = elapsed >= (1 * 60 * 1000); // 1 minute for testing
        console.log('[DemoModeProvider] Checking session expiration:', {
          startTime: session.startTime,
          currentTime: Date.now(),
          elapsed: elapsed,
          isExpired: isExpired
        });
        setIsSessionExpired(isExpired);
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
        console.log('[DemoModeProvider] Rendering with:', { 
          deploymentMode, 
          isDemoMode, 
          isAuthenticated, 
          isCheckingKeys,
          serverHasKeys 
        });
        
        // Show loading while checking for server API keys
        if (isCheckingKeys) {
          console.log('[DemoModeProvider] Checking server API keys - showing loading');
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800 mb-2">Loading...</div>
                <div className="text-sm text-gray-600">Checking API configuration...</div>
              </div>
            </div>
          );
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
            return children;
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
          return children;
        }
        
        // Fallback (should not reach here)
        console.warn('[DemoModeProvider] Fallback case reached with deploymentMode:', deploymentMode);
        return null;
      })()}
    </DemoModeContextProvider>
  );
}