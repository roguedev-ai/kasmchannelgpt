import { createContext, useContext } from 'react';

export interface DemoModeContextValue {
  isDemoMode: boolean;
  isFreeTrialMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  setFreeTrialMode: (enabled: boolean) => void;
}

export const DemoModeContext = createContext<DemoModeContextValue>({
  isDemoMode: false,
  isFreeTrialMode: false,
  setDemoMode: () => {},
  setFreeTrialMode: () => {},
});

export const useDemoModeContext = () => useContext(DemoModeContext);
