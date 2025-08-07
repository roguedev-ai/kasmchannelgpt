/**
 * Widget Store Hooks
 * 
 * These hooks automatically select between global and widget-specific stores
 * based on whether the component is rendered inside a widget context.
 */

import { useContext } from 'react';
import { useStore } from 'zustand';
import { WidgetStoreContext } from '../widget/WidgetStoreContext';
import { useMessageStore as useGlobalMessageStore } from '../store';
import { useConversationStore as useGlobalConversationStore } from '../store';
import { useAgentStore as useGlobalAgentStore } from '../store';
import type { MessageStore } from '../store/widget-stores/messages';
import type { ConversationStore } from '../store/widget-stores/conversations';
import type { AgentStore } from '../store/widget-stores/agents';

/**
 * Check if we're inside a widget context
 */
function useIsInWidgetContext(): boolean {
  try {
    const context = useContext(WidgetStoreContext);
    return context !== null;
  } catch {
    return false;
  }
}

/**
 * Get widget stores if inside widget context
 */
function useWidgetStores() {
  const context = useContext(WidgetStoreContext);
  return context?.stores;
}

/**
 * Message store hook that automatically selects the correct store
 */
export function useMessageStore() {
  const isInWidget = useIsInWidgetContext();
  const widgetStores = useWidgetStores();
  
  if (isInWidget && widgetStores) {
    // Use widget-specific store
    return useStore(widgetStores.messageStore);
  }
  
  // Use global store
  return useGlobalMessageStore();
}

/**
 * Conversation store hook that automatically selects the correct store
 */
export function useConversationStore() {
  const isInWidget = useIsInWidgetContext();
  const widgetStores = useWidgetStores();
  
  if (isInWidget && widgetStores) {
    // Use widget-specific store
    return useStore(widgetStores.conversationStore);
  }
  
  // Use global store
  return useGlobalConversationStore();
}

/**
 * Agent store hook that automatically selects the correct store
 */
export function useAgentStore() {
  const isInWidget = useIsInWidgetContext();
  const widgetStores = useWidgetStores();
  
  if (isInWidget && widgetStores) {
    // Use widget-specific store
    return useStore(widgetStores.agentStore);
  }
  
  // Use global store
  return useGlobalAgentStore();
}

/**
 * Export convenience functions to check store source
 */
export function useIsUsingWidgetStore(): boolean {
  return useIsInWidgetContext();
}

/**
 * Get the current session ID if in widget context
 */
export function useWidgetSessionId(): string | null {
  const context = useContext(WidgetStoreContext);
  if (!context) return null;
  
  // Extract session ID from the store's localStorage key
  const messageStore = context.stores.messageStore;
  const state = messageStore.getState();
  
  // Session ID would need to be added to context for retrieval
  return null;
}