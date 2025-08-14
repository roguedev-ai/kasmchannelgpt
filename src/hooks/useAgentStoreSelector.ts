import { useAgentStore as useGlobalAgentStore } from '@/store/agents';
import { useContext } from 'react';
import { WidgetStoreContext } from '@/widget/WidgetStoreContext';
import { useWidgetSafe } from '@/widget/WidgetContext';

/**
 * Smart agent store selector that automatically uses the correct store
 * based on the context (widget vs standalone)
 */
export function useAgentStoreSelector() {
  // Check if we're in a widget context
  const widgetInstance = useWidgetSafe();
  
  // Always call the global store hook
  const globalStore = useGlobalAgentStore();
  
  // Check if widget store context is available
  const widgetStoreContext = useContext(WidgetStoreContext);
  
  // Use widget store if available and we're in widget mode
  if (widgetInstance && widgetStoreContext) {
    // Access the widget's agent store state directly without hooks
    return widgetStoreContext.stores.agentStore.getState();
  }
  
  // Use global store for standalone mode
  return globalStore;
}