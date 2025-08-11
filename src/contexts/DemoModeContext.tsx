/**
 * Demo Mode Context
 * 
 * Provides runtime demo mode status throughout the app
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface DemoModeContextType {
  isRuntimeDemoMode: boolean;
  deploymentMode: 'demo' | 'production' | null;
  isInitialized: boolean;
  isFreeTrialMode: boolean;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isRuntimeDemoMode: false,
  deploymentMode: null,
  isInitialized: false,
  isFreeTrialMode: false,
});

export const useDemoModeContext = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoModeContext must be used within DemoModeProvider');
  }
  return context;
};

interface DemoModeContextProviderProps {
  children: React.ReactNode;
}

export function DemoModeContextProvider({ children }: DemoModeContextProviderProps) {
  const [deploymentMode, setDeploymentMode] = useState<'demo' | 'production' | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFreeTrialMode, setIsFreeTrialMode] = useState(false);

  useEffect(() => {
    // Get the runtime deployment mode from localStorage
    const mode = localStorage.getItem('customgpt.deploymentMode') as 'demo' | 'production' | null;
    const freeTrialFlag = localStorage.getItem('customgpt.freeTrialMode');
    setDeploymentMode(mode);
    setIsFreeTrialMode(freeTrialFlag === 'true');
    setIsInitialized(true);

    // Listen for storage changes
    const handleStorageChange = () => {
      const newMode = localStorage.getItem('customgpt.deploymentMode') as 'demo' | 'production' | null;
      const newFreeTrialFlag = localStorage.getItem('customgpt.freeTrialMode');
      setDeploymentMode(newMode);
      setIsFreeTrialMode(newFreeTrialFlag === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-window updates
    window.addEventListener('deploymentModeChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('deploymentModeChanged', handleStorageChange);
    };
  }, []);

  const value: DemoModeContextType = {
    isRuntimeDemoMode: deploymentMode === 'demo',
    deploymentMode,
    isInitialized,
    isFreeTrialMode,
  };

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
}