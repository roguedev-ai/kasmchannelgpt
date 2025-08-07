/**
 * Agent Store - Chatbot Management
 * 
 * This store manages all agent (chatbot) related state and operations.
 * Agents are the core entities in CustomGPT - each agent is a trained
 * chatbot with its own knowledge base and settings.
 * 
 * Features:
 * - CRUD operations for agents
 * - Persistent state using localStorage
 * - Auto-selection of first agent
 * - Agent statistics fetching
 * - License management support
 * 
 * State Persistence:
 * - Uses Zustand persist middleware
 * - Stores: agents list and current selection
 * - Survives page refreshes
 * 
 * Features:
 * - Multi-format API response handling with backward compatibility
 * - Automatic agent state synchronization across operations
 * - Optimistic UI updates for seamless user experience
 * - Comprehensive error handling with graceful recovery
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentStore, Agent } from '@/types';
import { getClient } from '@/lib/api/client';
import { useConversationStore } from './conversations';
import { useMessageStore } from './messages';

/**
 * Agent Store Implementation
 * 
 * Persisted to localStorage with key 'customgpt-agent-store'
 * Automatically hydrates on app load
 */
export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      agents: [],
      currentAgent: null,
      loading: false,
      error: null,
      paginationMeta: undefined,

      /**
       * Fetch agents from the API with enterprise-scale pagination
       * 
       * Strategy for 1000+ projects:
       * - Load first batch (100 items) immediately for UI responsiveness
       * - Load additional batches as needed via loadMoreAgents()
       * - Auto-selects first agent if none selected
       * - Maintains total count for pagination UI
       */
      fetchAgents: async () => {
        set({ loading: true, error: null });
        
        try {
          const client = getClient();
          
          // Load first batch with larger page size for better UX
          const response = await client.getAgents({ page: 1, per_page: 100 });
          
          let agents: Agent[] = [];
          let total = 0;
          let hasMore = false;
          
          // Handle different response formats from the API
          if (response && typeof response === 'object') {
            // Check for nested pagination format: { data: { data: [...], total: ..., current_page: ... } }
            if ('data' in response && (response as any).data && typeof (response as any).data === 'object' && 'data' in (response as any).data) {
              const nestedData = (response as any).data;
              agents = Array.isArray(nestedData.data) ? nestedData.data : [];
              total = nestedData.total || agents.length;
              const currentPage = nestedData.current_page || 1;
              const perPage = nestedData.per_page || 100;
              hasMore = nestedData.last_page ? currentPage < nestedData.last_page : false;
            } else if ('data' in response && 'total' in response) {
              // Flat paginated response format
              const paginatedResponse = response as { data: Agent[]; total: number; page: number; per_page: number };
              agents = paginatedResponse.data;
              total = paginatedResponse.total;
              hasMore = total > paginatedResponse.per_page;
            } else if (Array.isArray((response as any).data)) {
              // Legacy format: { data: [...] }
              agents = (response as any).data;
              total = agents.length;
              hasMore = false;
            } else if (Array.isArray(response)) {
              // Legacy format: [...]
              agents = response as Agent[];
              total = agents.length;
              hasMore = false;
            }
          }
          
          set({ 
            agents, 
            loading: false,
            // Always update pagination metadata with fresh data
            paginationMeta: { 
              currentPage: 1, 
              totalCount: total, 
              hasMore,
              perPage: 100
            },
            // Auto-select first agent if none selected
            currentAgent: get().currentAgent || (agents.length > 0 ? agents[0] : null)
          });
        } catch (error) {
          console.error('Failed to fetch agents:', error);
          set({ 
            agents: [], 
            error: error instanceof Error ? error.message : 'Failed to fetch agents',
            loading: false 
          });
        }
      },

      /**
       * Load more agents for large datasets (enterprise accounts)
       * Appends to existing agents list
       */
      loadMoreAgents: async () => {
        const state = get();
        const paginationMeta = (state as any).paginationMeta;
        
        if (!paginationMeta?.hasMore || state.loading) return;
        
        set({ loading: true, error: null });
        
        try {
          const client = getClient();
          const nextPage = paginationMeta.currentPage + 1;
          
          const response = await client.getAgents({ 
            page: nextPage, 
            per_page: paginationMeta.perPage 
          });
          
          if (response && 'data' in response) {
            let newAgents: Agent[] = [];
            let responseTotal = 0;
            let responsePage = nextPage;
            
            // Handle nested format: { data: { data: [...] } }
            if (response.data && typeof response.data === 'object' && 'data' in response.data) {
              const nestedData = (response as any).data;
              newAgents = Array.isArray(nestedData.data) ? nestedData.data : [];
              responseTotal = nestedData.total || 0;
              responsePage = nestedData.current_page || nextPage;
            } else if (Array.isArray((response as any).data)) {
              // Legacy format: { data: [...] }
              newAgents = (response as any).data;
              responseTotal = paginationMeta.totalCount;
            }
            
            set(state => ({ 
              agents: [...state.agents, ...newAgents],
              loading: false,
              paginationMeta: {
                ...paginationMeta,
                currentPage: responsePage,
                hasMore: (responsePage * paginationMeta.perPage + newAgents.length) < responseTotal
              }
            }));
          }
        } catch (error) {
          console.error('Failed to load more agents:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load more agents',
            loading: false 
          });
        }
      },

      /**
       * Search for a specific agent by ID or name
       * Useful for enterprise accounts with many projects
       */
      findAgent: async (query: string | number) => {
        try {
          const client = getClient();
          
          // If query is numeric, assume it's an ID and try to fetch directly
          if (typeof query === 'number' || /^\d+$/.test(query.toString())) {
            const id = typeof query === 'number' ? query : parseInt(query.toString());
            try {
              const response = await client.getAgent(id);
              const agent = response.data;
              
              // Add to agents list if not already present
              const state = get();
              if (!state.agents.find(a => a.id === agent.id)) {
                set(state => ({ 
                  agents: [agent, ...state.agents] 
                }));
              }
              
              return agent;
            } catch {
              // ID not found or no access, fall through to search
            }
          }
          
          // For text search, we'd need a search endpoint (not implemented in current API)
          // For now, search within loaded agents
          const state = get();
          const found = state.agents.find(agent => 
            agent.project_name.toLowerCase().includes(query.toString().toLowerCase()) ||
            agent.id.toString() === query.toString()
          );
          
          return found || null;
        } catch (error) {
          console.error('Failed to find agent:', error);
          return null;
        }
      },

      /**
       * Create a new agent
       * 
       * @param data - Agent creation data
       * @param data.project_name - Display name for the agent
       * @param data.sitemap_path - URL for sitemap-based training
       * @param data.files - Files for file-based training
       * @param data.is_shared - Whether agent is publicly accessible
       * 
       * Behavior:
       * - Adds new agent to beginning of list
       * - Auto-selects the new agent
       * - Returns the created agent
       * - Throws error on failure
       */
      createAgent: async (data: {
        project_name: string;
        sitemap_path?: string;
        files?: File[];
        is_shared?: boolean;
      }) => {
        set({ loading: true, error: null });
        
        try {
          const client = getClient();
          const response = await client.createAgent(data);
          const newAgent = response.data;
          
          // Optimistic update - add to list and select immediately
          set(state => ({ 
            agents: [newAgent, ...state.agents],
            currentAgent: newAgent,
            loading: false,
          }));
          
          return newAgent;
        } catch (error) {
          console.error('Failed to create agent:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create agent',
            loading: false 
          });
          throw error; // Re-throw for component error handling
        }
      },

      /**
       * Select an agent as the current active agent
       * This agent will be used for all chat operations
       * 
       * @param agent - The agent to select
       */
      selectAgent: async (agent: Agent) => {
        // Clear conversation state when switching agents
        const conversationStore = useConversationStore.getState();
        const messageStore = useMessageStore.getState();
        
        // Set the new agent first
        set({ currentAgent: agent });
        
        // Clear current conversation to show welcome screen
        conversationStore.selectConversation(null);
        
        // Clear all messages from the previous agent
        messageStore.clearMessages();
        
        // Fetch conversations for the new agent
        try {
          await conversationStore.fetchConversations(agent.id);
        } catch (error) {
          console.error('Failed to fetch conversations for new agent:', error);
          // Even if fetch fails, we've already cleared the old state
        }
      },

      /**
       * Manually set the agents list
       * Used for optimistic updates or manual state management
       * 
       * Features:
       * - Validates current agent still exists
       * - Auto-selects first agent if current is removed
       * - Maintains agent selection when possible
       * 
       * @param agents - New list of agents
       */
      setAgents: (agents: Agent[]) => {
        set({ 
          agents,
          // Update current agent if it's no longer in the list
          currentAgent: (() => {
            const current = get().currentAgent;
            if (!current) return agents.length > 0 ? agents[0] : null;
            
            // Check if current agent still exists in new list
            const stillExists = agents.find(a => a.id === current.id);
            return stillExists || (agents.length > 0 ? agents[0] : null);
          })()
        });
      },
      
      updateAgent: async (id: number, data: { project_name?: string; are_licenses_allowed?: boolean; is_shared?: boolean; sitemap_path?: string }) => {
        set({ loading: true, error: null });
        
        try {
          const client = getClient();
          const response = await client.updateAgent(id, data);
          const updatedAgent = response.data;
          
          set(state => ({
            agents: state.agents.map(a => a.id === id ? updatedAgent : a),
            currentAgent: state.currentAgent?.id === id ? updatedAgent : state.currentAgent,
            loading: false,
          }));
          
          return updatedAgent;
        } catch (error) {
          console.error('Failed to update agent:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update agent',
            loading: false 
          });
          throw error;
        }
      },
      
      deleteAgent: async (id: number) => {
        set({ loading: true, error: null });
        
        try {
          const client = getClient();
          await client.deleteAgent(id);
          
          set(state => {
            const filteredAgents = state.agents.filter(a => a.id !== id);
            return {
              agents: filteredAgents,
              currentAgent: state.currentAgent?.id === id 
                ? (filteredAgents.length > 0 ? filteredAgents[0] : null)
                : state.currentAgent,
              loading: false,
            };
          });
        } catch (error) {
          console.error('Failed to delete agent:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete agent',
            loading: false 
          });
          throw error;
        }
      },
      
      replicateAgent: async (id: number) => {
        set({ loading: true, error: null });
        
        try {
          const client = getClient();
          const response = await client.replicateAgent(id);
          const newAgent = response.data;
          
          set(state => ({ 
            agents: [newAgent, ...state.agents],
            currentAgent: newAgent,
            loading: false,
          }));
          
          return newAgent;
        } catch (error) {
          console.error('Failed to replicate agent:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to replicate agent',
            loading: false 
          });
          throw error;
        }
      },
      
      getAgentStats: async (id: number) => {
        try {
          const client = getClient();
          const response = await client.getAgentStats(id);
          return response.data;
        } catch (error) {
          console.error('Failed to get agent stats:', error);
          throw error;
        }
      },
    }),
    {
      name: 'customgpt-agents',
      partialize: (state) => ({
        currentAgent: state.currentAgent,
      }),
    }
  )
);