import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { StoreApi } from 'zustand';
import { createMessageStore, MessageStore } from '../store/widget-stores/messages';
import { createConversationStore, ConversationStore } from '../store/widget-stores/conversations';
import { createAgentStore, AgentStore } from '../store/widget-stores/agents';

/**
 * Widget Store Context
 * 
 * Provides instance-specific Zustand stores for each widget.
 * This ensures complete data isolation between multiple widgets.
 * 
 * Each widget instance gets its own:
 * - Message store (for chat messages)
 * - Conversation store (for conversation management)
 * - Agent store (for agent selection)
 * 
 * The config store remains global as API configuration should be shared.
 */

interface WidgetStores {
  messageStore: StoreApi<MessageStore>;
  conversationStore: StoreApi<ConversationStore>;
  agentStore: StoreApi<AgentStore>;
}

interface WidgetStoreContextValue {
  stores: WidgetStores;
}

export const WidgetStoreContext = createContext<WidgetStoreContextValue | null>(null);

interface WidgetStoreProviderProps {
  children: ReactNode;
  sessionId: string;
}

/**
 * Widget Store Provider
 * 
 * Creates and provides instance-specific stores for a widget.
 * Stores are created once per widget instance and reused.
 */
export const WidgetStoreProvider: React.FC<WidgetStoreProviderProps> = ({ 
  children, 
  sessionId 
}) => {
  // Use ref to ensure stores are only created once per widget instance
  const storesRef = useRef<WidgetStores | null>(null);
  
  if (!storesRef.current) {
    // Create stores in the correct order, passing references to dependent stores
    const agentStore = createAgentStore(sessionId);
    const conversationStore = createConversationStore(sessionId);
    const messageStore = createMessageStore(sessionId, agentStore, conversationStore);
    
    storesRef.current = {
      messageStore,
      conversationStore,
      agentStore,
    };
    
    // Store the widget stores globally for access by the widget instance
    if (typeof window !== 'undefined') {
      if (!(window as any).__customgpt_widget_stores) {
        (window as any).__customgpt_widget_stores = {};
      }
      (window as any).__customgpt_widget_stores[sessionId] = storesRef.current;
    }
  }
  
  return (
    <WidgetStoreContext.Provider value={{ stores: storesRef.current }}>
      {children}
    </WidgetStoreContext.Provider>
  );
};

/**
 * Hook to access widget-specific stores
 */
export const useWidgetStores = (): WidgetStores => {
  const context = useContext(WidgetStoreContext);
  if (!context) {
    throw new Error('useWidgetStores must be used within WidgetStoreProvider');
  }
  return context.stores;
};

/**
 * Individual store hooks for easier access
 */
export const useWidgetMessageStore = () => {
  const { messageStore } = useWidgetStores();
  return messageStore;
};

export const useWidgetConversationStore = () => {
  const { conversationStore } = useWidgetStores();
  return conversationStore;
};

export const useWidgetAgentStore = () => {
  const { agentStore } = useWidgetStores();
  return agentStore;
};