/**
 * Demo Mode Provider Component
 * 
 * Wraps the app and handles demo mode authentication flow.
 * Shows either the demo mode setup screen or the main app.
 */

'use client';

import React, { useEffect } from 'react';
import { useDemoStore } from '@/store/demo';
import { DemoModeScreen } from './DemoModeScreen';
import { DemoModeBanner } from './DemoModeBanner';
import { apiClient } from '@/lib/api/client';

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
  
  useEffect(() => {
    // Check for deployment mode preference
    const deploymentMode = localStorage.getItem('customgpt.deploymentMode');
    
    // Only initialize demo store if in demo mode
    if (deploymentMode === 'demo') {
      initializeFromStorage();
    }
  }, [initializeFromStorage]);
  
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
    const deploymentMode = localStorage.getItem('customgpt.deploymentMode');
    if (deploymentMode === 'demo' && openAIApiKey) {
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
    const deploymentMode = localStorage.getItem('customgpt.deploymentMode');
    if (deploymentMode === 'demo' && apiKey) {
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
  
  // Check if deployment mode has been selected
  const deploymentMode = typeof window !== 'undefined' 
    ? localStorage.getItem('customgpt.deploymentMode') 
    : null;
  
  // If production mode is selected, bypass demo mode entirely
  if (deploymentMode === 'production') {
    return <>{children}</>;
  }
  
  // If no deployment mode selected yet, show selection screen
  if (!deploymentMode) {
    return <DemoModeScreen />;
  }
  
  // If not in demo mode, render children directly
  if (!isDemoMode) {
    return <>{children}</>;
  }
  
  // In demo mode, check authentication
  if (!isAuthenticated) {
    return <DemoModeScreen />;
  }
  
  // Authenticated in demo mode - show app without banner
  return <>{children}</>;
}