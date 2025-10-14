import { ReactNode, useState } from 'react';
import { DemoModeContext } from '../../contexts/DemoModeContext';

interface DemoModeProviderProps {
  children: ReactNode;
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isFreeTrialMode, setIsFreeTrialMode] = useState(false);
  
  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        isFreeTrialMode,
        setDemoMode: setIsDemoMode,
        setFreeTrialMode: setIsFreeTrialMode,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}
