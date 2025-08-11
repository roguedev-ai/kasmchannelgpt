import { create } from 'zustand';
import { toast } from 'sonner';
import { getClient } from '@/lib/api/client';
import type { APIResponse, AgentStats } from '@/types';

export interface ProjectSettings {
  // Appearance
  chatbot_avatar?: string;
  chatbot_background_type?: 'image' | 'color';
  chatbot_background?: string;
  chatbot_background_color?: string;
  chatbot_color?: string;
  chatbot_toolbar_color?: string;
  chatbot_title?: string;
  chatbot_title_color?: string;
  user_avatar?: string;
  spotlight_avatar_enabled?: boolean;
  spotlight_avatar?: string;
  spotlight_avatar_shape?: 'rectangle' | 'circle' | 'rounded' | 'square';
  spotlight_avatar_type?: 'default' | 'animated' | '3d' | 'custom';
  user_avatar_orientation?: 'agent-left-user-right' | 'agent-right-user-left' | 'both-left' | 'both-right';
  
  // Messages & Behavior
  default_prompt?: string;
  example_questions?: string[];
  persona_instructions?: string;
  response_source?: 'default' | 'own_content' | 'openai_content';
  chatbot_model?: string;
  custom_persona?: string;
  agent_capability?: 'fastest-responses' | 'optimal-choice' | 'advanced-reasoning' | 'complex-tasks';
  chatbot_msg_lang?: string;
  input_field_addendum?: string;
  
  // Messages
  hang_in_there_msg?: string;
  chatbot_siesta_msg?: string;
  no_answer_message?: string;
  ending_message?: string;
  try_asking_questions_msg?: string;
  view_more_msg?: string;
  view_less_msg?: string;
  
  // Citations
  enable_citations?: number;
  citations_view_type?: 'user' | 'show' | 'hide';
  citations_answer_source_label_msg?: string;
  citations_sources_label_msg?: string;
  image_citation_display?: 'default' | 'inline' | 'none';
  enable_inline_citations_api?: boolean;
  hide_sources_from_responses?: boolean;
  
  // Features
  enable_feedbacks?: boolean;
  is_loading_indicator_enabled?: boolean;
  remove_branding?: boolean;
  private_deployment?: boolean;
  enable_recaptcha_for_public_chatbots?: boolean;
  is_selling_enabled?: boolean;
  license_slug?: boolean;
  selling_url?: string;
  can_share_conversation?: boolean;
  can_export_conversation?: boolean;
  conversation_time_window?: boolean;
  conversation_retention_period?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  conversation_retention_days?: number;
  enable_agent_knowledge_base_awareness?: boolean;
  markdown_enabled?: boolean;
}

export interface ProjectPlugin {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
  category?: string;
  settings?: Record<string, any>;
}

// Using AgentStats from the API instead of custom ProjectStats
export type ProjectStats = AgentStats;

export interface ProjectSettingsStore {
  // Settings
  settings: ProjectSettings | null;
  settingsLoading: boolean;
  settingsError: string | null;

  // Plugins
  plugins: ProjectPlugin[];
  pluginsLoading: boolean;
  pluginsError: string | null;

  // Stats
  stats: ProjectStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Actions
  fetchSettings: (projectId: number) => Promise<void>;
  updateSettings: (projectId: number, settings: Partial<ProjectSettings>) => Promise<void>;
  fetchPlugins: (projectId: number) => Promise<void>;
  updatePlugin: (projectId: number, pluginId: string, enabled: boolean) => Promise<void>;
  fetchStats: (projectId: number) => Promise<void>;
  reset: () => void;
}

// Track active requests to prevent duplicates
const activeRequests = new Map<string, boolean>();

export const useProjectSettingsStore = create<ProjectSettingsStore>((set, get) => ({
  // Initial state
  settings: null,
  settingsLoading: false,
  settingsError: null,
  plugins: [],
  pluginsLoading: false,
  pluginsError: null,
  stats: null,
  statsLoading: false,
  statsError: null,

  // Fetch project settings
  fetchSettings: async (projectId: number) => {
    const requestKey = `settings-${projectId}`;
    
    // Prevent duplicate requests
    if (activeRequests.get(requestKey)) {
      return;
    }
    
    activeRequests.set(requestKey, true);
    
    // Clear previous errors and set loading state
    set({ settingsLoading: true, settingsError: null });

    try {
      const response = await getClient().getAgentSettings(projectId);

      // The API client returns the data directly, not wrapped with status
      if (response && response.data) {
        set({ 
          settings: response.data, 
          settingsLoading: false,
          settingsError: null // Explicitly clear error on success
        });
      } else if (response) {
        // If response exists but doesn't have data property, it might be the direct data
        set({ 
          settings: response as any, 
          settingsLoading: false,
          settingsError: null
        });
      } else {
        throw new Error('Failed to fetch project settings');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project settings';
      set({ 
        settingsError: errorMessage, 
        settingsLoading: false 
      });
      // Only show toast for actual errors, not for expected scenarios
      if (error instanceof Error && !error.message.includes('404')) {
        toast.error(errorMessage);
      }
    } finally {
      activeRequests.delete(requestKey);
    }
  },

  // Update project settings
  updateSettings: async (projectId: number, settingsUpdate: Partial<ProjectSettings>) => {
    set({ settingsLoading: true, settingsError: null });

    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      Object.entries(settingsUpdate).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'example_questions' && Array.isArray(value)) {
            // Handle array fields - use bracket notation without index
            value.forEach((question) => {
              formData.append(`example_questions[]`, question);
            });
          } else if (value instanceof File) {
            // Handle file uploads
            formData.append(key, value);
          } else {
            // Handle regular fields
            formData.append(key, String(value));
          }
        }
      });

      const response = await getClient().updateAgentSettings(projectId, formData);

      // The API client returns the data directly
      if (response) {
        // Instead of merging, re-fetch the settings to ensure we have the latest data
        set({ settingsLoading: false });
        
        // Re-fetch settings to get the updated data from server
        await get().fetchSettings(projectId);
        
        toast.success('Project settings updated successfully');
      } else {
        throw new Error('Failed to update project settings');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project settings';
      set({ 
        settingsError: errorMessage, 
        settingsLoading: false 
      });
      toast.error(errorMessage);
    }
  },

  // Fetch project plugins
  fetchPlugins: async (projectId: number) => {
    set({ pluginsLoading: true, pluginsError: null });

    try {
      const response = await getClient().getProjectPlugins(projectId);

      // The API client returns the data directly
      if (response) {
        const pluginsData = response.data || response;
        set({ 
          plugins: Array.isArray(pluginsData) ? pluginsData : [], 
          pluginsLoading: false 
        });
      } else {
        throw new Error('Failed to fetch project plugins');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project plugins';
      set({ 
        pluginsError: errorMessage, 
        pluginsLoading: false,
        plugins: [] // Fallback to empty array
      });
      console.warn('Plugins not available:', errorMessage);
    }
  },

  // Update project plugin
  updatePlugin: async (projectId: number, pluginId: string, enabled: boolean) => {
    try {
      // This endpoint might not exist yet, so we'll implement it as a placeholder
      const response = await getClient().updateProjectPlugin(projectId, pluginId, { enabled });

      // The API client returns the data directly
      if (response) {
        // Update plugin in store
        const plugins = get().plugins.map(plugin =>
          plugin.id === pluginId ? { ...plugin, enabled } : plugin
        );
        
        set({ plugins });
        toast.success(`Plugin ${enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        throw new Error('Failed to update plugin');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update plugin';
      toast.error(errorMessage);
    }
  },

  // Fetch project stats
  fetchStats: async (projectId: number) => {
    set({ statsLoading: true, statsError: null });

    try {
      const response = await getClient().getAgentStats(projectId);

      // The API client returns the data directly
      if (response) {
        const statsData = response.data || response;
        set({ 
          stats: statsData, 
          statsLoading: false 
        });
      } else {
        throw new Error('Failed to fetch project stats');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project stats';
      set({ 
        statsError: errorMessage, 
        statsLoading: false 
      });
      toast.error(errorMessage);
    }
  },

  // Reset store
  reset: () => {
    set({
      settings: null,
      settingsLoading: false,
      settingsError: null,
      plugins: [],
      pluginsLoading: false,
      pluginsError: null,
      stats: null,
      statsLoading: false,
      statsError: null,
    });
  },
}));