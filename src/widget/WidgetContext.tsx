import React, { createContext, useContext } from 'react';

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

// Create the context with undefined default
const WidgetContext = createContext<WidgetInstance | undefined>(undefined);

// Provider component props
interface WidgetProviderProps {
  widgetInstance: WidgetInstance;
  children: React.ReactNode;
}

// Provider component that will wrap the widget's React tree
export const WidgetProvider: React.FC<WidgetProviderProps> = ({ widgetInstance, children }) => {
  return (
    <WidgetContext.Provider value={widgetInstance}>
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
  return context;
};

// Optional: Hook that returns null instead of throwing if no widget context
export const useWidgetSafe = (): WidgetInstance | null => {
  const context = useContext(WidgetContext);
  return context || null;
};