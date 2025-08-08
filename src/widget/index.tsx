import React from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';

import '../app/globals.css';
import './widget-styles.css';
import { WidgetConfig } from '../types';
import { useConfigStore, useAgentStore } from '../store';
import { ChatLayout } from '../components/chat/ChatLayout';
import { getClient } from '../lib/api/client';
import { WidgetProvider } from './WidgetContext';
import { WidgetStoreProvider } from './WidgetStoreContext';

/**
 * Widget Configuration Interface
 * 
 * Defines all configuration options for CustomGPT widget initialization.
 * This interface is used by both embedded widgets and floating buttons.
 * 
 * @property agentId - Required: Agent/Project ID from CustomGPT dashboard
 * @property agentName - Optional: Custom name to display instead of "Agent - {ID}"
 * @property containerId - DOM element ID for embedded mode (ignored in floating mode)
 * @property mode - Widget deployment mode: 'embedded' | 'floating' | 'widget'
 * @property theme - Color theme: 'light' | 'dark'
 * @property position - Position for floating mode: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
 * @property width - Widget width (default: '400px')
 * @property height - Widget height (default: '600px')
 * @property enableCitations - Show citation sources in messages
 * @property enableFeedback - Show thumbs up/down feedback buttons
 * 
 * Conversation Management Options:
 * @property enableConversationManagement - Enable conversation switching UI
 * @property maxConversations - Maximum conversations per session (default: 5)
 * @property sessionId - Custom session ID (auto-generated if not provided)
 * @property threadId - Specific conversation thread to load
 * @property isolateConversations - Whether to isolate conversations from other widgets (default: true)
 * 
 * Event Callbacks:
 * @property onOpen - Called when widget opens
 * @property onClose - Called when widget closes
 * @property onMessage - Called when new message is sent/received
 * @property onConversationChange - Called when conversation switches
 */
export interface CustomGPTWidgetConfig {
  // Required properties (API key no longer needed - handled by server)
  agentId: number | string;
  
  // Display properties
  agentName?: string;
  containerId?: string;
  mode?: 'embedded' | 'floating' | 'widget';
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width?: string;
  height?: string;
  
  // Feature flags
  enableCitations?: boolean;
  enableFeedback?: boolean;
  enableConversationManagement?: boolean;
  
  // Conversation management
  maxConversations?: number;
  sessionId?: string;
  threadId?: string;
  isolateConversations?: boolean; // New flag to isolate conversations
  
  // Event callbacks
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (message: any) => void;
  onConversationChange?: (conversation: any) => void;
}

/**
 * CustomGPT Widget Class
 * 
 * Main widget class that manages the lifecycle of CustomGPT chat instances.
 * Supports both embedded and floating deployment modes with full conversation management.
 * 
 * @example
 * // Basic embedded widget
 * const widget = CustomGPTWidget.init({
 *   agentId: '123',
 *   containerId: 'chat-container'
 * });
 * 
 * @example
 * // Floating widget with conversation management
 * const widget = CustomGPTWidget.init({
 *   agentId: '123',
 *   mode: 'floating',
 *   enableConversationManagement: true,
 *   maxConversations: 10
 * });
 */
class CustomGPTWidget {
  private container: HTMLElement | null = null;
  private root: any = null;
  private config: CustomGPTWidgetConfig;
  private isOpen: boolean = false;
  public sessionId: string;
  private currentConversationId: string | null = null;
  private instanceKey?: string;
  private conversationRefreshKey: number = 0;

  constructor(config: CustomGPTWidgetConfig) {
    // Validate required fields
    
    if (!config.agentId) {
      throw new Error('CustomGPT Widget: Agent ID is required');
    }

    // Merge with defaults
    this.config = {
      mode: 'embedded',
      theme: 'light',
      position: 'bottom-right',
      width: '400px',
      height: '600px',
      enableCitations: true,
      enableFeedback: true,
      enableConversationManagement: false,
      ...config,
    };

    // Initialize session ID
    // If isolateConversations is true, ensure each widget has a unique session
    if (this.config.isolateConversations !== false) {
      // Default to isolated conversations - each widget gets its own session
      const modePrefix = this.config.mode || 'widget';
      const containerId = this.config.containerId || 'default';
      // Create a unique session ID that includes mode, container info, and a random component
      // Use performance.now() for higher precision to avoid collisions
      const timestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const uniqueId = `${timestamp}_${random}_${Math.random().toString(36).substr(2, 5)}`;
      this.sessionId = `session_${modePrefix}_${containerId}_${uniqueId}`;
    } else if (this.config.sessionId) {
      // Use provided session ID for sharing conversations
      this.sessionId = this.config.sessionId;
    } else {
      // Generate a regular session ID
      this.sessionId = this.generateSessionId();
    }
    
    // Store widget instance reference for conversation management
    // Use unique instance key to prevent conflicts between multiple widgets
    if (typeof window !== 'undefined') {
      const instanceKey = `__customgpt_widget_${this.sessionId}`;
      (window as any)[instanceKey] = this;
      
      // DEPRECATED: Global reference kept for backward compatibility
      // Don't overwrite if already exists to preserve first widget
      if (!(window as any).__customgpt_widget_instance) {
        (window as any).__customgpt_widget_instance = this;
      }
      
      // Store instance key for later reference
      this.instanceKey = instanceKey;
    }

    this.init();
  }

  /**
   * Generates a unique session ID for conversation isolation
   * @returns Unique session identifier
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async init() {
    // Config store no longer needs API key setup
    
    // Configure session for conversation isolation
    if (this.config.enableConversationManagement) {
      // Store session configuration for conversation management
      // If isolateConversations is true, use instance-specific session storage
      if (this.config.isolateConversations) {
        // Create instance-specific session object
        if (!(window as any).__customgpt_sessions) {
          (window as any).__customgpt_sessions = {};
        }
        (window as any).__customgpt_sessions[this.sessionId] = {
          sessionId: this.sessionId,
          maxConversations: this.config.maxConversations,
          enableConversationManagement: true
        };
      } else {
        // Use shared session (old behavior)
        (window as any).__customgpt_session = {
          sessionId: this.sessionId,
          maxConversations: this.config.maxConversations,
          enableConversationManagement: true
        };
      }
    }
    
    // Check if using demo/test API key
    const isDemoMode = false; // Demo mode removed as API key is server-side
    
    // Store demo mode flag for preventing unnecessary API calls
    if (isDemoMode) {
      (window as any).__customgpt_demo_mode = true;
    } else {
      // Ensure demo mode is disabled for valid API keys
      (window as any).__customgpt_demo_mode = false;
    }
    
    // Fetch the actual agent details
    const agentId = typeof this.config.agentId === 'string' ? parseInt(this.config.agentId) : this.config.agentId;
    
    if (!isDemoMode) {
      try {
        // Try to fetch agent details to get the project name
        const client = getClient();
        const agentsResponse = await client.getAgents();
        const agents = Array.isArray(agentsResponse) ? agentsResponse : (agentsResponse as any).data || [];
        const agent = agents.find((a: any) => a.id === agentId);
        
        if (agent) {
          // Use custom agent name if provided
          if (this.config.agentName) {
            agent.project_name = this.config.agentName;
          }
          
          // Use the actual agent with proper project name
          useAgentStore.getState().selectAgent(agent);
          // Clear other agents to ensure only this one is available
          useAgentStore.getState().setAgents([agent]);
        } else {
          // Fallback if agent not found
          const fallbackAgent: any = {
            id: agentId,
            project_name: this.config.agentName || `Project ${agentId}`,
            is_chat_active: true,
          };
          useAgentStore.getState().selectAgent(fallbackAgent);
          useAgentStore.getState().setAgents([fallbackAgent]);
        }
      } catch (error) {
        // Use fallback on error
        const fallbackAgent: any = {
          id: agentId,
          project_name: this.config.agentName || `Project ${agentId}`,
          is_chat_active: true,
        };
        useAgentStore.getState().selectAgent(fallbackAgent);
        useAgentStore.getState().setAgents([fallbackAgent]);
      }
    } else {
      // For demo mode, always use fallback agent
      const fallbackAgent: any = {
        id: agentId,
        project_name: this.config.agentName || `Demo Assistant`,
        is_chat_active: true,
      };
      useAgentStore.getState().selectAgent(fallbackAgent);
      useAgentStore.getState().setAgents([fallbackAgent]);
    }

    // Create container based on mode
    this.createContainer();
    
    // Render the widget first
    this.render();
    
    // Initialize conversation after render to ensure ConversationManager is mounted
    if (this.config.enableConversationManagement) {
      const conversations = this.getConversations();
      
      if (conversations.length === 0) {
        // Create initial conversation after a small delay to ensure components are mounted
        setTimeout(() => {
          this.createConversation('New Chat');
        }, 100);
      } else {
        // Set current conversation to the first one
        this.currentConversationId = conversations[0].id;
        
        // Only sync with global store if explicitly not isolated
        if (this.config.isolateConversations === false && typeof window !== 'undefined') {
          const { useConversationStore } = require('../store');
          const currentConv = conversations[0];
          const fullConversation = {
            ...currentConv,
            project_id: parseInt(this.config.agentId as string) || 0,
            session_id: this.sessionId,
            name: currentConv.title
          };
          
          // Set only the current conversation
          useConversationStore.setState({
            conversations: [fullConversation as any],
            currentConversation: fullConversation as any
          });
        }
      }
    }
    
    // For isolated widgets, we need to prevent the global store from being used
    if (this.config.isolateConversations !== false && typeof window !== 'undefined') {
      // Store the widget instance globally so components can access it
      (window as any).__customgpt_widget_instances = (window as any).__customgpt_widget_instances || {};
      (window as any).__customgpt_widget_instances[this.sessionId] = this;
      
      // Set the current active widget session
      (window as any).__customgpt_active_widget_session = this.sessionId;
    }
  }

  private createContainer() {
    const { mode, containerId } = this.config;

    if (mode === 'embedded' && containerId) {
      // Use provided container
      this.container = document.getElementById(containerId);
      if (!this.container) {
        throw new Error(`Container with id "${containerId}" not found`);
      }
    } else if (mode === 'floating') {
      // Create floating container
      this.container = document.createElement('div');
      this.container.id = 'customgpt-floating-widget';
      this.setupFloatingStyles();
      document.body.appendChild(this.container);
    } else {
      // Create default container
      this.container = document.createElement('div');
      this.container.id = 'customgpt-widget';
      document.body.appendChild(this.container);
    }
  }

  private setupFloatingStyles() {
    if (!this.container || this.config.mode !== 'floating') return;

    const { position, width, height } = this.config;
    
    // Base floating styles
    Object.assign(this.container.style, {
      position: 'fixed',
      zIndex: '9999',
      width: width || '400px',
      height: height || '600px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      backgroundColor: 'white', // Ensure background is set
    });
    
    // Add class for styling
    this.container.classList.add('floating-mode');
    this.container.classList.add('customgpt-floating-container');

    // Position-specific styles
    switch (position) {
      case 'bottom-right':
        Object.assign(this.container.style, {
          bottom: '20px',
          right: '20px',
        });
        break;
      case 'bottom-left':
        Object.assign(this.container.style, {
          bottom: '20px',
          left: '20px',
        });
        break;
      case 'top-right':
        Object.assign(this.container.style, {
          top: '20px',
          right: '20px',
        });
        break;
      case 'top-left':
        Object.assign(this.container.style, {
          top: '20px',
          left: '20px',
        });
        break;
    }

    // Initially hidden for floating mode with proper initial state
    this.container.style.display = 'none';
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateY(20px)';
  }

  private render() {
    if (!this.container) return;

    // Apply proper styling based on mode
    if (this.config.mode === 'embedded') {
      this.container.classList.add('customgpt-embedded-widget');
      // Apply width and height styles directly to container
      Object.assign(this.container.style, {
        width: this.config.width || '400px',
        height: this.config.height || '600px',
        margin: '0 auto', // Center by default
        display: 'block',
      });
    }

    // Only create root once
    if (!this.root) {
      this.root = createRoot(this.container);
    }
    
    const WidgetApp = () => {
      // DEPRECATED: This global reference is kept for backward compatibility
      // New code should use WidgetContext instead
      // Only set if not already set to avoid overwriting first widget
      if (typeof window !== 'undefined' && !(window as any).__customgpt_widget_instance) {
        (window as any).__customgpt_widget_instance = this;
      }
      
      const handleClose = () => {
        this.close();
        this.config.onClose?.();
      };

      // Get current conversation ID or use thread ID
      const currentConvId = this.currentConversationId || this.config.threadId;
      
      // For isolated mode, pass the widget instance to manage conversations locally
      const widgetRef = this;
      
      // Create a unique key for this widget's conversations
      const widgetKey = `widget_${this.sessionId}`;

      return (
        <WidgetStoreProvider sessionId={this.sessionId}>
          <WidgetProvider widgetInstance={widgetRef}>
            <div className={`customgpt-widget-wrapper widget-mode ${this.config.mode}-mode`}>
              <ChatLayout
                mode={this.config.mode === 'embedded' ? 'widget' : 'floating'}
                onClose={this.config.mode === 'floating' ? handleClose : undefined}
                showSidebar={false} // Disable sidebar for widget mode
                className="w-full h-full"
                // Pass conversation management configuration
                enableConversationManagement={this.config.enableConversationManagement}
                maxConversations={this.config.maxConversations}
                sessionId={this.sessionId}
                threadId={currentConvId} // Pass current conversation ID
                onConversationChange={this.config.onConversationChange}
                onMessage={this.config.onMessage}
                // Pass widget instance for isolated conversation management
                widgetInstance={this.config.isolateConversations !== false ? widgetRef : undefined}
                // Pass current conversations for isolated mode
                conversations={this.config.isolateConversations !== false ? this.getConversations() : undefined}
                currentConversation={this.config.isolateConversations !== false && this.currentConversationId ? 
                  this.getConversations().find(c => c.id === this.currentConversationId) : undefined}
                // Pass refresh key to trigger ConversationManager updates
                conversationRefreshKey={this.conversationRefreshKey}
              />
              <Toaster 
                position="top-center"
                closeButton
                gap={8}
                toastOptions={{
                  style: { 
                    zIndex: 10000,
                    marginTop: '8px'
                  }
                }}
              />
            </div>
          </WidgetProvider>
        </WidgetStoreProvider>
      );
    };

    this.root.render(<WidgetApp />);

    // Auto-open for embedded mode
    if (this.config.mode === 'embedded') {
      this.open();
    }
  }

  /**
   * Get all conversations for current session
   * @returns Array of conversations
   */
  public getConversations(): any[] {
    const stored = localStorage.getItem(`customgpt_conversations_${this.sessionId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse conversations:', e);
      }
    }
    return [];
  }

  /**
   * Switch to a different conversation
   * @param conversationId - ID of conversation to switch to
   */
  public switchConversation(conversationId: string): void {
    const conversations = this.getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      this.currentConversationId = conversationId;
      
      // Increment refresh key to trigger ConversationManager update
      this.conversationRefreshKey++;
      
      // Don't update the global store if we're in isolated mode
      // The render() method will handle passing the correct conversation
      if (!this.config.isolateConversations) {
        // Only update global store if sharing conversations
        if (typeof window !== 'undefined') {
          const { useConversationStore } = require('../store');
          
          // Get all widget conversations
          const allWidgetConversations = this.getConversations();
          
          // Convert all widget conversations to store format
          const storeConversations = allWidgetConversations.map(conv => ({
            ...conv,
            project_id: parseInt(this.config.agentId as string) || 0,
            session_id: this.sessionId,
            name: conv.title
          }));
          
          // Find the selected conversation with proper format
          const fullConversation = storeConversations.find(c => c.id === conversationId);
          
          // Update store with all widget conversations
          useConversationStore.setState({
            conversations: storeConversations as any,
            currentConversation: fullConversation as any
          });
        }
      }
      
      // Trigger re-render with new conversation
      this.render();
      this.config.onConversationChange?.(conversation);
    }
  }

  /**
   * Create a new conversation
   * @param title - Optional title for the conversation
   * @returns The new conversation object
   */
  public createConversation(title?: string): any {
    const conversations = this.getConversations();
    
    // Check max conversations limit (only if specified by user)
    if (this.config.maxConversations && conversations.length >= this.config.maxConversations) {
      console.warn(`Maximum conversation limit (${this.config.maxConversations}) reached`);
      return null; // Return null instead of throwing error
    }
    
    const newConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title || `Conversation ${conversations.length + 1}`,
      createdAt: new Date().toISOString(),
      messages: [],
      // Add required fields for conversation store compatibility
      project_id: parseInt(this.config.agentId as string) || 0,
      session_id: this.sessionId,
      name: title || `Conversation ${conversations.length + 1}`
    };
    
    conversations.unshift(newConversation);
    this.saveConversations(conversations);
    this.currentConversationId = newConversation.id;
    
    // Don't update the global store if we're in isolated mode
    if (!this.config.isolateConversations) {
      // Only update global store if sharing conversations
      if (typeof window !== 'undefined') {
        const { useConversationStore, useMessageStore } = require('../store');
        const messageStore = useMessageStore.getState();
        
        // Get all widget conversations (local storage)
        const allWidgetConversations = this.getConversations();
        
        // Convert all widget conversations to store format
        const storeConversations = allWidgetConversations.map(conv => ({
          ...conv,
          project_id: parseInt(this.config.agentId as string) || 0,
          session_id: this.sessionId,
          name: conv.title
        }));
        
        // Update store with all widget conversations, with new one as current
        useConversationStore.setState({
          conversations: storeConversations as any,
          currentConversation: newConversation as any
        });
        
        // Clear any existing messages for this conversation ID to ensure welcome message shows
        messageStore.clearMessages(newConversation.id);
      }
    }
    
    // Increment refresh key to trigger ConversationManager update
    this.conversationRefreshKey++;
    
    // Trigger re-render with new conversation
    this.render();
    
    return newConversation;
  }

  /**
   * Update conversation title
   * @param conversationId - ID of conversation to update
   * @param newTitle - New title for the conversation
   */
  public updateConversationTitle(conversationId: string, newTitle: string): void {
    const conversations = this.getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      conversation.title = newTitle;
      this.saveConversations(conversations);
      // Increment refresh key to trigger ConversationManager update
      this.conversationRefreshKey++;
      this.render();
    }
  }

  /**
   * Delete a conversation
   * @param conversationId - ID of conversation to delete
   */
  public deleteConversation(conversationId: string): void {
    const conversations = this.getConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    
    this.saveConversations(filtered);
    
    // Increment refresh key to trigger ConversationManager update
    this.conversationRefreshKey++;
    
    // If deleting current conversation, switch to another or create new
    if (this.currentConversationId === conversationId) {
      if (filtered.length > 0) {
        this.switchConversation(filtered[0].id);
      } else {
        this.createConversation();
      }
    } else {
      // Still need to re-render to update the conversation list
      this.render();
    }
  }

  /**
   * Save conversations to localStorage
   * @param conversations - Array of conversations to save
   */
  private saveConversations(conversations: any[]): void {
    try {
      localStorage.setItem(
        `customgpt_conversations_${this.sessionId}`,
        JSON.stringify(conversations)
      );
    } catch (e) {
      console.error('Failed to save conversations:', e);
      // Handle quota exceeded error
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        // Try to clean up old conversations
        this.cleanupOldConversations();
      }
    }
  }

  /**
   * Clean up old conversations to free up localStorage space
   */
  private cleanupOldConversations(): void {
    const conversations = this.getConversations();
    // Keep only the 3 most recent conversations
    const recent = conversations.slice(0, 3);
    this.saveConversations(recent);
  }

  // Public methods
  public open() {
    if (!this.container) return;

    this.isOpen = true;
    
    if (this.config.mode === 'floating') {
      this.container.style.display = 'block';
      // Trigger animation
      setTimeout(() => {
        if (this.container) {
          this.container.style.transform = 'translateY(0)';
          this.container.style.opacity = '1';
        }
      }, 10);
    }

    this.config.onOpen?.();
  }

  public close() {
    if (!this.container) return;

    this.isOpen = false;

    if (this.config.mode === 'floating') {
      this.container.style.transform = 'translateY(20px)';
      this.container.style.opacity = '0';
      
      setTimeout(() => {
        if (this.container) {
          this.container.style.display = 'none';
        }
      }, 300);
    }
  }

  public toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public destroy() {
    if (this.root) {
      this.root.unmount();
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.container = null;
    this.root = null;
  }

  public updateConfig(newConfig: Partial<CustomGPTWidgetConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Re-render with new config
    this.render();
  }
  
  /**
   * Force a re-render of the widget
   * Useful for updating the UI after state changes
   */
  public refresh() {
    this.render();
  }

  // Getters
  public get isOpened() {
    return this.isOpen;
  }

  public get configuration() {
    return { ...this.config };
  }
}

// Global API for the widget
declare global {
  interface Window {
    CustomGPTWidget: {
      init: (config: CustomGPTWidgetConfig) => CustomGPTWidget;
      create: (config: CustomGPTWidgetConfig) => CustomGPTWidget;
    };
  }
}

// Export for UMD build
const CustomGPTWidgetAPI = {
  init: (config: CustomGPTWidgetConfig): CustomGPTWidget => {
    return new CustomGPTWidget(config);
  },
  
  create: (config: CustomGPTWidgetConfig): CustomGPTWidget => {
    return new CustomGPTWidget(config);
  },
};

// Global assignment for browser usage
if (typeof window !== 'undefined') {
  window.CustomGPTWidget = CustomGPTWidgetAPI;
}

// For module usage
export { CustomGPTWidget, CustomGPTWidgetAPI };
export default CustomGPTWidgetAPI;