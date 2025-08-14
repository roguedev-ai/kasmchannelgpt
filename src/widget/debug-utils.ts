/**
 * Debug utilities for CustomGPT Widget
 * 
 * Provides comprehensive debugging tools for diagnosing widget issues,
 * especially around message persistence and conversation management.
 */

interface DebugInfo {
  timestamp: string;
  sessionId: string;
  widgetInstance: any;
  conversations: any[];
  currentConversationId: string | null;
  messageStore: any;
  localStorage: {
    keys: string[];
    messageKeys: string[];
    conversationKeys: string[];
    contents: Record<string, any>;
  };
  widgetStores: any;
}

export class WidgetDebugger {
  private static instance: WidgetDebugger;
  private debugEnabled: boolean = true;
  private logHistory: any[] = [];

  static getInstance(): WidgetDebugger {
    if (!WidgetDebugger.instance) {
      WidgetDebugger.instance = new WidgetDebugger();
    }
    return WidgetDebugger.instance;
  }

  /**
   * Enhanced console log with color coding and grouping
   */
  log(category: string, message: string, data?: any, level: 'info' | 'warn' | 'error' | 'debug' = 'info') {
    if (!this.debugEnabled) return;

    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, category, message, data, level };
    this.logHistory.push(logEntry);

    // Color coding for different categories
    const colors: Record<string, string> = {
      MESSAGES: 'color: #2196F3; font-weight: bold',
      CONVERSATIONS: 'color: #4CAF50; font-weight: bold',
      STORAGE: 'color: #FF9800; font-weight: bold',
      WIDGET: 'color: #9C27B0; font-weight: bold',
      API: 'color: #F44336; font-weight: bold',
      DEBUG: 'color: #607D8B; font-weight: bold'
    };

    const color = colors[category] || 'color: #000; font-weight: bold';

    console.group(`%c[${category}] ${message}`, color);
    console.log('Timestamp:', timestamp);
    if (data) {
      console.log('Data:', data);
    }
    console.groupEnd();
  }

  /**
   * Inspect localStorage for widget-related keys
   */
  inspectLocalStorage(sessionId?: string): any {
    const allKeys = Object.keys(localStorage);
    const widgetKeys = allKeys.filter(key => 
      key.includes('customgpt') || 
      key.includes('widget') || 
      (sessionId && key.includes(sessionId))
    );

    const messageKeys = widgetKeys.filter(key => key.includes('messages'));
    const conversationKeys = widgetKeys.filter(key => key.includes('conversation'));

    const contents: Record<string, any> = {};
    widgetKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        contents[key] = value ? JSON.parse(value) : null;
      } catch (e) {
        contents[key] = localStorage.getItem(key);
      }
    });

    return {
      allKeysCount: allKeys.length,
      widgetKeysCount: widgetKeys.length,
      keys: widgetKeys,
      messageKeys,
      conversationKeys,
      contents
    };
  }

  /**
   * Get comprehensive debug information for a widget instance
   */
  getDebugInfo(widgetInstance: any): DebugInfo {
    const sessionId = widgetInstance?.sessionId || 'unknown';
    const conversations = widgetInstance?.getConversations() || [];
    const currentConversationId = widgetInstance?.currentConversationId;
    
    // Get widget stores
    const widgetStores = (window as any).__customgpt_widget_stores?.[sessionId];
    const messageStore = widgetStores?.messageStore?.getState();
    
    return {
      timestamp: new Date().toISOString(),
      sessionId,
      widgetInstance: {
        sessionId: widgetInstance?.sessionId,
        currentConversationId: widgetInstance?.currentConversationId,
        config: widgetInstance?.config,
        conversationCount: conversations.length
      },
      conversations,
      currentConversationId,
      messageStore: messageStore ? {
        messagesMapSize: messageStore.messages?.size,
        messagesMapKeys: Array.from(messageStore.messages?.keys() || []),
        isStreaming: messageStore.isStreaming,
        loading: messageStore.loading,
        error: messageStore.error
      } : null,
      localStorage: this.inspectLocalStorage(sessionId),
      widgetStores: widgetStores ? {
        hasMessageStore: !!widgetStores.messageStore,
        hasConversationStore: !!widgetStores.conversationStore,
        hasAgentStore: !!widgetStores.agentStore
      } : null
    };
  }

  /**
   * Debug a specific conversation's messages
   */
  debugConversation(widgetInstance: any, conversationId: string) {
    const debugInfo = this.getDebugInfo(widgetInstance);
    const sessionId = widgetInstance?.sessionId;

    console.group(`%c[DEBUG] Conversation ${conversationId}`, 'color: #E91E63; font-weight: bold');
    
    // Check message store
    const messageStore = (window as any).__customgpt_widget_stores?.[sessionId]?.messageStore?.getState();
    if (messageStore) {
      const messages = messageStore.messages.get(conversationId);
      console.log('Messages in store:', messages);
      console.log('Message count:', messages?.length || 0);
    }

    // Check localStorage directly
    const storageKeys = [
      `customgpt-messages-cache-${sessionId}`,
      `customgpt-messages-cache-${sessionId}-${conversationId}`,
      `customgpt-messages-${sessionId}-${conversationId}`
    ];

    console.log('Checking localStorage keys:');
    storageKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          console.log(`✅ Found ${key}:`, parsed);
        } catch (e) {
          console.log(`✅ Found ${key} (raw):`, value);
        }
      } else {
        console.log(`❌ Not found: ${key}`);
      }
    });

    console.groupEnd();
  }

  /**
   * Trace message flow for debugging
   */
  traceMessageFlow(action: string, data: any) {
    const trace = {
      action,
      timestamp: new Date().toISOString(),
      ...data
    };

    console.group(`%c[TRACE] ${action}`, 'color: #795548; font-weight: bold');
    console.table(trace);
    console.groupEnd();
  }

  /**
   * Export debug log history
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Clear debug log history
   */
  clearLogs() {
    this.logHistory = [];
  }

  /**
   * Toggle debug mode
   */
  setDebugEnabled(enabled: boolean) {
    this.debugEnabled = enabled;
    console.log(`Widget debugging ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create global debug function for easy console access
if (typeof window !== 'undefined') {
  (window as any).__customgpt_debug = (conversationId?: string) => {
    const instances = (window as any).__customgpt_widget_instances;
    if (!instances) {
      console.error('No widget instances found');
      return;
    }

    const instanceKeys = Object.keys(instances);
    if (instanceKeys.length === 0) {
      console.error('No widget instances found');
      return;
    }

    const widgetDebugger = WidgetDebugger.getInstance();
    
    instanceKeys.forEach(key => {
      const instance = instances[key];
      console.group(`%c[Widget Instance: ${key}]`, 'color: #3F51B5; font-weight: bold; font-size: 14px');
      
      const debugInfo = widgetDebugger.getDebugInfo(instance);
      console.log('Debug Info:', debugInfo);
      
      if (conversationId) {
        widgetDebugger.debugConversation(instance, conversationId);
      }
      
      console.groupEnd();
    });

    console.log(`
%c🔍 Debug Helper Functions:
%c- __customgpt_debug() - Show all widget debug info
- __customgpt_debug('conversationId') - Debug specific conversation
- __customgpt_debug_trace() - Show message flow trace
- __customgpt_debug_storage() - Inspect localStorage
- __customgpt_debug_clear() - Clear localStorage (use with caution!)
`, 'color: #4CAF50; font-weight: bold', 'color: #666');
  };

  // Additional debug helpers
  (window as any).__customgpt_debug_trace = () => {
    const widgetDebugger = WidgetDebugger.getInstance();
    console.log(widgetDebugger.exportLogs());
  };

  (window as any).__customgpt_debug_storage = () => {
    const widgetDebugger = WidgetDebugger.getInstance();
    const storage = widgetDebugger.inspectLocalStorage();
    console.table(storage.contents);
  };

  (window as any).__customgpt_debug_clear = () => {
    if (confirm('This will clear all CustomGPT widget data from localStorage. Are you sure?')) {
      const keys = Object.keys(localStorage).filter(key => 
        key.includes('customgpt') || key.includes('widget')
      );
      keys.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared ${keys.length} keys from localStorage`);
    }
  };
}

export const widgetDebugger = WidgetDebugger.getInstance();