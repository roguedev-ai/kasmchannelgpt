/**
 * Widget-specific Conversation Store Factory
 * 
 * Creates an isolated conversation store instance for each widget.
 * This ensures conversations are not shared between different widget instances.
 */

import { create, StoreApi } from 'zustand';
import type { Conversation } from '@/types';
import { getClient } from '@/lib/api/client';
import { generateId } from '@/lib/utils';
import { logger } from '@/lib/logger';

// Conversation Store interface - widget-specific version
export interface ConversationStore {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  error: string | null;
  lastConversationActivity: Record<string, string>;
  
  // Pagination state
  currentPage: number;
  totalPages: number;
  totalConversations: number;
  perPage: number;
  
  // Sorting and filtering state
  sortOrder: 'asc' | 'desc';
  sortBy: string;
  userFilter: 'all' | string;
  
  fetchConversations: (projectId: number, params?: {
    page?: number;
    per_page?: number;
    order?: 'asc' | 'desc';
    orderBy?: string;
    userFilter?: 'all' | string;
  }) => Promise<void>;
  loadConversations: (agentId: string) => Promise<void>; // Keep for compatibility
  createConversation: (projectId: number, name?: string) => Promise<void>;
  updateConversation: (conversationId: number, sessionId: string, data: { name: string }) => Promise<void>;
  deleteConversation: (conversationId: string | number) => Promise<void>;
  selectConversation: (conversation: Conversation) => void;
  ensureConversation: (projectId: number, firstMessage?: string) => Promise<Conversation>;
  reset: () => void;
}

/**
 * Create a conversation store instance for a specific widget
 * @param sessionId - The widget's session ID for isolation
 */
export function createConversationStore(sessionId: string): StoreApi<ConversationStore> {
  const CONVERSATIONS_STORAGE_KEY = `customgpt-conversations-cache-${sessionId}`;
  const ACTIVITY_STORAGE_KEY = `customgpt-conversation-activity-${sessionId}`;
  
  // Local storage helpers scoped to this instance
  function saveConversationsToStorage(agentId: string, conversations: Conversation[]) {
    try {
      const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      const cache = stored ? JSON.parse(stored) : {};
      cache[agentId] = conversations;
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save conversations to storage:', error);
    }
  }

  function loadConversationsFromStorage(agentId: string): Conversation[] | null {
    try {
      const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (!stored) return null;
      const cache = JSON.parse(stored);
      return cache[agentId] || null;
    } catch (error) {
      console.error('Failed to load conversations from storage:', error);
      return null;
    }
  }

  function saveActivityToStorage(activity: Record<string, string>) {
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activity));
    } catch (error) {
      console.error('Failed to save activity to storage:', error);
    }
  }

  function loadActivityFromStorage(): Record<string, string> {
    try {
      const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load activity from storage:', error);
      return {};
    }
  }

  return create<ConversationStore>((set, get) => ({
    conversations: [],
    currentConversation: null,
    loading: false,
    error: null,
    lastConversationActivity: loadActivityFromStorage(),
    // Pagination state
    currentPage: 1,
    totalPages: 1,
    totalConversations: 0,
    perPage: 20,
    // Sorting and filtering state
    sortOrder: 'desc' as const,
    sortBy: 'id',
    userFilter: 'all' as const,

    fetchConversations: async (projectId: number, params?: {
      page?: number;
      per_page?: number;
      order?: 'asc' | 'desc';
      orderBy?: string;
      userFilter?: 'all' | string;
    }) => {
      // For widgets, we load conversations differently
      const isDemoMode = typeof window !== 'undefined' && (window as any).__customgpt_demo_mode;
      
      logger.info('CONVERSATIONS', 'Fetching conversations for widget', {
        sessionId,
        projectId,
        isDemoMode
      });

      set({ loading: true, error: null });

      try {
        if (isDemoMode) {
          // In demo mode, just load from local storage
          return get().loadConversations(projectId.toString());
        }
        
        // Get the list of conversation IDs that belong to this widget session
        const widgetConvKey = `widget_conversations_${sessionId}`;
        const widgetConvIds = JSON.parse(localStorage.getItem(widgetConvKey) || '[]');
        
        if (widgetConvIds.length === 0) {
          // No conversations created yet in this widget session
          set({
            conversations: [],
            loading: false,
          });
          return;
        }
        
        // Fetch conversations from API but only keep ones created in this widget session
        const client = getClient();
        
        // Merge params with current state
        const queryParams = {
          page: params?.page ?? get().currentPage,
          per_page: params?.per_page ?? get().perPage,
          order: params?.order ?? get().sortOrder,
          orderBy: params?.orderBy ?? get().sortBy,
          userFilter: params?.userFilter ?? get().userFilter,
        };
        
        const response = await client.getConversations(projectId, queryParams);
        
        // Handle different response formats
        let allConversations = [];
        let paginationData = null;
        
        if (response && typeof response === 'object') {
          // Standard paginated response format
          if ((response as any).data && (response as any).data.data) {
            allConversations = (response as any).data.data;
            paginationData = (response as any).data;
          } else if (Array.isArray((response as any).data)) {
            allConversations = (response as any).data;
          } else if (Array.isArray(response)) {
            allConversations = response;
          }
        }
        
        // Filter to only include conversations created in this widget session
        const widgetConversations = allConversations.filter((conv: Conversation) => 
          widgetConvIds.includes(conv.id)
        );
        
        logger.info('CONVERSATIONS', 'Filtered widget conversations', {
          totalFromAPI: allConversations.length,
          widgetSpecific: widgetConversations.length,
          widgetConvIds,
          paginationData
        });
        
        // Update state with conversations and pagination data
        set({ 
          conversations: widgetConversations, 
          loading: false,
          // Update pagination state if available
          currentPage: paginationData?.current_page ?? 1,
          totalPages: paginationData?.last_page ?? 1,
          totalConversations: widgetConvIds.length, // Total widget conversations, not API total
          // Update sorting/filtering if params were provided
          ...(params?.order && { sortOrder: params.order }),
          ...(params?.orderBy && { sortBy: params.orderBy }),
          ...(params?.userFilter && { userFilter: params.userFilter }),
        });
        
        // Save to local storage
        saveConversationsToStorage(projectId.toString(), widgetConversations);
      } catch (error) {
        logger.error('CONVERSATIONS', 'Failed to fetch conversations', error);
        // On error, try to load from local storage
        const cached = loadConversationsFromStorage(projectId.toString());
        set({ 
          conversations: cached || [],
          error: error instanceof Error ? error.message : 'Failed to fetch conversations',
          loading: false,
        });
      }
    },

    loadConversations: async (agentId: string) => {
      const isDemoMode = typeof window !== 'undefined' && (window as any).__customgpt_demo_mode;
      
      logger.info('CONVERSATIONS', 'Loading conversations for widget store', {
        sessionId,
        agentId,
        isDemoMode
      });

      set({ loading: true, error: null });

      try {
        // For widgets, we only load conversations from local storage that were created in this session
        // We do NOT fetch from the API to ensure complete isolation
        const cachedConversations = loadConversationsFromStorage(agentId);
        
        if (cachedConversations) {
          // Filter to only include conversations created in this widget session
          const sessionConversations = cachedConversations.filter(conv => 
            conv.session_id && conv.session_id.includes(sessionId)
          );
          
          set({
            conversations: sessionConversations,
            loading: false,
          });
          
          logger.info('CONVERSATIONS', 'Loaded session-specific conversations', {
            totalCached: cachedConversations.length,
            sessionSpecific: sessionConversations.length,
            sessionId
          });
        } else {
          // No conversations yet - start with empty array
          set({
            conversations: [],
            loading: false,
          });
        }
      } catch (error) {
        logger.error('CONVERSATIONS', 'Failed to load conversations', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load conversations',
          loading: false,
          conversations: [] // Start with empty on error
        });
      }
    },

    createConversation: async (projectId: number, name?: string): Promise<void> => {
      const isDemoMode = typeof window !== 'undefined' && (window as any).__customgpt_demo_mode;
      
      logger.info('CONVERSATIONS', 'Creating conversation in widget store', {
        sessionId,
        projectId,
        name
      });

      set({ loading: true, error: null });

      try {
        // Use the API to create the conversation
        const client = getClient();
        
        if (isDemoMode) {
          // Demo mode - create locally only
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000000);
          const sessionIdForConv = `demo_session_${timestamp}_${random}_${sessionId}`;

          const newConversation: Conversation = {
            id: Math.floor(Math.random() * 1000000),
            session_id: sessionIdForConv,
            project_id: projectId,
            name: name || 'New Conversation',
            message_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
          };

          set(state => ({
            conversations: [...state.conversations, newConversation],
            currentConversation: newConversation,
            loading: false,
          }));
          
          saveConversationsToStorage(projectId.toString(), [...get().conversations]);
          return;
        }
        
        // Create conversation via API
        const response = await client.createConversation(projectId, name ? { name } : undefined);
        const newConversation = response.data;
        
        // Ensure the conversation has our widget session ID in it for filtering
        // Store the widget session ID in localStorage to track which conversations belong to this widget
        const widgetConvKey = `widget_conversations_${sessionId}`;
        const existingConvIds = JSON.parse(localStorage.getItem(widgetConvKey) || '[]');
        existingConvIds.push(newConversation.id);
        localStorage.setItem(widgetConvKey, JSON.stringify(existingConvIds));
        
        logger.info('CONVERSATIONS', 'Created conversation via API', {
          conversationId: newConversation.id,
          sessionId: newConversation.session_id,
          projectId: newConversation.project_id,
          widgetSessionId: sessionId
        });
        
        set(state => ({ 
          conversations: [...state.conversations, newConversation],
          currentConversation: newConversation,
          loading: false,
        }));
        
        // Save to local storage for this widget session
        saveConversationsToStorage(projectId.toString(), get().conversations);
      } catch (error) {
        logger.error('CONVERSATIONS', 'Failed to create conversation', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create conversation',
          loading: false 
        });
        throw error;
      }
    },

    updateConversation: async (conversationId: number, sessionId: string, data: { name: string }) => {
      logger.info('CONVERSATIONS', 'Updating conversation in widget store', {
        sessionId: sessionId,
        conversationId,
        data
      });

      set(state => ({
        conversations: state.conversations.map(conv =>
          conv.id.toString() === conversationId.toString()
            ? { ...conv, name: data.name, updated_at: new Date().toISOString() }
            : conv
        ),
      }));

      // Update current conversation if it's the one being updated
      const current = get().currentConversation;
      if (current && current.id.toString() === conversationId.toString()) {
        set({
          currentConversation: { ...current, name: data.name, updated_at: new Date().toISOString() },
        });
      }

      // Save to storage
      const projectId = get().conversations.find(c => c.id.toString() === conversationId.toString())?.project_id;
      if (projectId) {
        saveConversationsToStorage(projectId.toString(), get().conversations);
      }
    },

    deleteConversation: async (conversationId: string | number) => {
      logger.info('CONVERSATIONS', 'Deleting conversation from widget store', {
        sessionId,
        conversationId
      });

      const conversation = get().conversations.find(c => c.id.toString() === conversationId);
      if (!conversation) return;

      set(state => ({
        conversations: state.conversations.filter(conv => conv.id.toString() !== conversationId),
        currentConversation: state.currentConversation?.id.toString() === conversationId
          ? null
          : state.currentConversation,
      }));

      // Save to storage
      saveConversationsToStorage(conversation.project_id.toString(), get().conversations);
    },

    selectConversation: (conversation: Conversation) => {
      logger.info('CONVERSATIONS', 'Selecting conversation in widget store', {
        sessionId,
        conversationId: conversation?.id
      });

      set({ currentConversation: conversation });

      // Update activity tracking
      if (conversation) {
        const activity = { ...get().lastConversationActivity };
        activity[conversation.project_id.toString()] = conversation.id.toString();
        set({ lastConversationActivity: activity });
        saveActivityToStorage(activity);
      }
    },

    ensureConversation: async (projectId: number, firstMessage?: string) => {
      const { currentConversation } = get();
      
      // If we have a current conversation for this agent, use it
      if (currentConversation && currentConversation.project_id === projectId) {
        return currentConversation;
      }

      // If no current conversation, always create a new one
      // This ensures that seeing the welcome screen (currentConversation = null) 
      // always results in starting a fresh conversation
      const title = firstMessage
        ? firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '')
        : 'New Conversation';
      
      await get().createConversation(projectId, title);
      
      // Get the newly created conversation
      const newConversation = get().conversations[get().conversations.length - 1];
      set({ currentConversation: newConversation });
      
      return newConversation;
    },

    reset: () => {
      set({
        conversations: [],
        currentConversation: null,
        loading: false,
        error: null,
        lastConversationActivity: {},
      });
    },
  }));
}