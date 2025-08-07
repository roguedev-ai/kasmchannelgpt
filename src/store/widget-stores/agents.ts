/**
 * Widget-specific Agent Store Factory
 * 
 * Creates an isolated agent store instance for each widget.
 * This ensures agent selection is not shared between different widget instances.
 */

import { create, StoreApi } from 'zustand';
import type { Agent } from '@/types';
import { getClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';

// Agent Store interface - widget-specific version with minimal methods
export interface AgentStore {
  agents: Agent[];
  currentAgent: Agent | null;
  loading: boolean;
  error: string | null;
  
  loadAgents: () => Promise<void>;
  fetchAgents: () => Promise<void>; // Alias for compatibility
  selectAgent: (agent: Agent) => void;
  setAgents: (agents: Agent[]) => void;
  updateAgent: (id: number, data: { are_licenses_allowed?: boolean }) => Promise<Agent>;
  deleteAgent: (id: number) => Promise<void>;
  createAgent: (data: any) => Promise<Agent>;
  replicateAgent: (id: number) => Promise<Agent>;
  getAgentStats: (id: number) => Promise<any>;
  reset: () => void;
}

/**
 * Create an agent store instance for a specific widget
 * @param sessionId - The widget's session ID for isolation
 */
export function createAgentStore(sessionId: string): StoreApi<AgentStore> {
  const AGENTS_STORAGE_KEY = `customgpt-agents-cache-${sessionId}`;
  const SELECTED_AGENT_KEY = `customgpt-selected-agent-${sessionId}`;
  
  // Local storage helpers scoped to this instance
  function saveAgentsToStorage(agents: Agent[]) {
    try {
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
    } catch (error) {
      console.error('Failed to save agents to storage:', error);
    }
  }

  function loadAgentsFromStorage(): Agent[] | null {
    try {
      const stored = localStorage.getItem(AGENTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load agents from storage:', error);
      return null;
    }
  }

  function saveSelectedAgentToStorage(agentId: string | null) {
    try {
      if (agentId) {
        localStorage.setItem(SELECTED_AGENT_KEY, agentId);
      } else {
        localStorage.removeItem(SELECTED_AGENT_KEY);
      }
    } catch (error) {
      console.error('Failed to save selected agent to storage:', error);
    }
  }

  function loadSelectedAgentFromStorage(): string | null {
    try {
      return localStorage.getItem(SELECTED_AGENT_KEY);
    } catch (error) {
      console.error('Failed to load selected agent from storage:', error);
      return null;
    }
  }

  return create<AgentStore>((set, get) => ({
    agents: [],
    currentAgent: null,
    loading: false,
    error: null,

    fetchAgents: async () => {
      // Alias for loadAgents for compatibility
      return get().loadAgents();
    },

    loadAgents: async () => {
      const isDemoMode = typeof window !== 'undefined' && (window as any).__customgpt_demo_mode;
      
      // Get widget instance from window using session ID
      const widgetKey = `__customgpt_widget_${sessionId}`;
      const widget = typeof window !== 'undefined' ? (window as any)[widgetKey] : null;
      
      logger.info('AGENTS', 'Loading agents for widget store', {
        sessionId,
        isDemoMode,
        hasWidget: !!widget,
        configuredAgentId: widget?.config?.agentId
      });

      set({ loading: true, error: null });

      try {
        // If widget has a configured agentId, fetch that specific agent from API
        if (widget?.config?.agentId) {
          const client = getClient();
          
          if (isDemoMode) {
            // Demo mode - create fake agent
            const singleAgent: Agent = {
              id: widget.config.agentId,
              project_name: widget.config.name || 'CustomGPT Assistant',
              type: 'WIDGET',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_chat_active: true,
              is_shared: false,
              user_id: 0,
              team_id: 0,
            };

            set({
              agents: [singleAgent],
              currentAgent: singleAgent,
              loading: false,
            });

            saveAgentsToStorage([singleAgent]);
            saveSelectedAgentToStorage(singleAgent.id.toString());
            return;
          }
          
          try {
            // Fetch the specific agent from API
            const response = await client.getAgent(widget.config.agentId);
            const agent = response.data || response;
            
            logger.info('AGENTS', 'Fetched specific agent from API', {
              agentId: agent.id,
              agentName: agent.project_name
            });
            
            set({
              agents: [agent],
              currentAgent: agent,
              loading: false,
            });

            saveAgentsToStorage([agent]);
            saveSelectedAgentToStorage(agent.id.toString());
            return;
          } catch (error) {
            logger.error('AGENTS', 'Failed to fetch specific agent', error);
            // Fall back to cached data if available
            const cachedAgents = loadAgentsFromStorage();
            if (cachedAgents && cachedAgents.length > 0) {
              const agent = cachedAgents.find(a => a.id === widget.config.agentId) || cachedAgents[0];
              set({
                agents: cachedAgents,
                currentAgent: agent,
                loading: false,
              });
              return;
            }
            throw error;
          }
        }

        // No specific agent ID - fetch agents from API with enterprise-scale pagination
        if (!isDemoMode) {
          const client = getClient();
          // Load first batch with larger page size for better widget performance
          const response = await client.getAgents({ page: 1, per_page: 100 });
          
          // Handle different response formats
          let agents: Agent[] = [];
          if (response && typeof response === 'object') {
            if ('data' in response && 'total' in response) {
              // Paginated response format
              agents = (response as { data: Agent[] }).data;
            } else if (Array.isArray((response as any).data)) {
              // Legacy format: { data: [...] }
              agents = (response as any).data;
            } else if (Array.isArray(response)) {
              // Legacy format: [...]
              agents = response as Agent[];
            }
          }
          
          logger.info('AGENTS', 'Fetched agents from API (first page)', {
            count: agents.length,
            total: (response as any)?.total || agents.length
          });
          
          // Select first agent or previously selected
          const selectedAgentId = loadSelectedAgentFromStorage();
          const selectedAgent = selectedAgentId 
            ? agents.find(a => a.id.toString() === selectedAgentId) || agents[0]
            : agents[0];
          
          set({
            agents,
            currentAgent: selectedAgent || null,
            loading: false,
          });
          
          saveAgentsToStorage(agents);
          if (selectedAgent) {
            saveSelectedAgentToStorage(selectedAgent.id.toString());
          }
          return;
        }

        // Demo mode without specific agent ID
        if (isDemoMode) {
          // Create demo agents
          const demoAgents: Agent[] = [
            {
              id: 1,
              project_name: 'Demo Assistant',
              type: 'DEMO',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_chat_active: true,
              is_shared: false,
              user_id: 0,
              team_id: 0,
            },
          ];
          
          set({
            agents: demoAgents,
            currentAgent: demoAgents[0],
            loading: false,
          });
          
          saveAgentsToStorage(demoAgents);
          saveSelectedAgentToStorage(demoAgents[0].id.toString());
          return;
        }

        // Should not reach here
        set({
          agents: [],
          currentAgent: null,
          loading: false,
        });
      } catch (error) {
        logger.error('AGENTS', 'Failed to load agents', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load agents',
          loading: false,
        });
      }
    },

    selectAgent: (agent: Agent) => {
      logger.info('AGENTS', 'Selecting agent in widget store', {
        sessionId,
        agentId: agent?.id,
        agentName: agent?.project_name
      });

      set({ currentAgent: agent });
      saveSelectedAgentToStorage(agent?.id.toString() || null);

      // Update widget instance if available
      const widgetKey = `__customgpt_widget_${sessionId}`;
      const widget = typeof window !== 'undefined' ? (window as any)[widgetKey] : null;
      
      if (widget && agent) {
        widget.config.agentId = agent.id;
        widget.config.name = agent.project_name;
      }
    },

    setAgents: (agents: Agent[]) => {
      set({ agents });
      saveAgentsToStorage(agents);
    },

    updateAgent: async (id: number, data: { project_name?: string; are_licenses_allowed?: boolean; is_shared?: boolean; sitemap_path?: string }) => {
      logger.info('AGENTS', 'Updating agent in widget store', {
        sessionId,
        agentId: id,
        data
      });

      const agent = get().agents.find(a => a.id === id);
      if (!agent) {
        throw new Error('Agent not found');
      }

      const updatedAgent = { ...agent, ...data };
      
      set(state => ({
        agents: state.agents.map(a =>
          a.id === id ? updatedAgent : a
        ),
        currentAgent: state.currentAgent?.id === id
          ? updatedAgent
          : state.currentAgent,
      }));

      // Save to storage
      saveAgentsToStorage(get().agents);
      
      return updatedAgent;
    },

    deleteAgent: async (id: number) => {
      logger.info('AGENTS', 'Deleting agent from widget store', {
        sessionId,
        agentId: id
      });

      set(state => ({
        agents: state.agents.filter(a => a.id !== id),
        currentAgent: state.currentAgent?.id === id ? null : state.currentAgent,
      }));

      // Save to storage
      saveAgentsToStorage(get().agents);
    },

    createAgent: async (data: any) => {
      // Widgets typically don't create agents, but we need this for compatibility
      throw new Error('Creating agents is not supported in widget mode');
    },

    replicateAgent: async (id: number) => {
      // Widgets typically don't replicate agents
      throw new Error('Replicating agents is not supported in widget mode');
    },

    getAgentStats: async (id: number) => {
      // Return empty stats for widget mode
      return {
        messages_sent: 0,
        users_interacted: 0,
        last_message_at: null
      };
    },

    reset: () => {
      set({
        agents: [],
        currentAgent: null,
        loading: false,
        error: null,
      });
      
      // Clear storage
      try {
        localStorage.removeItem(AGENTS_STORAGE_KEY);
        localStorage.removeItem(SELECTED_AGENT_KEY);
      } catch (error) {
        console.error('Failed to clear agent storage:', error);
      }
    },
  }));
}