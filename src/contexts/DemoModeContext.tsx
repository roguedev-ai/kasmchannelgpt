'use client';

import React, { createContext, useContext } from 'react';

interface DemoModeContextValue {
  isRuntimeDemoMode: boolean;
  isAuthenticated: boolean;
}

export const DemoModeContext = createContext<DemoModeContextValue>({
  isRuntimeDemoMode: false,
  isAuthenticated: false,
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
  value: DemoModeContextValue;
}

export function DemoModeContextProvider({ children, value }: DemoModeContextProviderProps) {
  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
}
