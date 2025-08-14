import React, { createContext, useContext, useMemo } from 'react';
import { getWidgetToast } from './isolated-toast';

// Widget instance type - we'll define the actual widget interface based on what we need
interface WidgetInstance {
  sessionId: string;
  createConversation: (title?: string) => any;
  switchConversation: (conversationId: string) => void;
  getConversations: () => any[];
  updateConversationTitle: (conversationId: string, newTitle: string) => void;
  deleteConversation: (conversationId: string) => void;
  configuration?: any;
}

// Extended context that includes both widget instance and toast
interface WidgetContextValue {
  widget: WidgetInstance;
  toast: ReturnType<typeof getWidgetToast>;
}

// Create the context with undefined default
const WidgetContext = createContext<WidgetContextValue | undefined>(undefined);

// Provider component props
interface WidgetProviderProps {
  widgetInstance: WidgetInstance;
  children: React.ReactNode;
}

// Provider component that will wrap the widget's React tree
export const WidgetProvider: React.FC<WidgetProviderProps> = ({ widgetInstance, children }) => {
  // Create isolated toast instance for this widget
  const toast = useMemo(() => getWidgetToast(widgetInstance.sessionId), [widgetInstance.sessionId]);
  
  const value = useMemo(() => ({
    widget: widgetInstance,
    toast
  }), [widgetInstance, toast]);
  
  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
};

// Custom hook to use the widget instance from any component
export const useWidget = (): WidgetInstance => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidget must be used within a WidgetProvider');
  }
  return context.widget;
};

// Optional: Hook that returns null instead of throwing if no widget context
export const useWidgetSafe = (): WidgetInstance | null => {
  const context = useContext(WidgetContext);
  return context?.widget || null;
};

// Hook to use the widget-specific toast
export const useWidgetToast = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidgetToast must be used within a WidgetProvider');
  }
  return context.toast;
};