import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentSettings } from '@/types';

interface ChatSettingsState {
  // Current chat settings per agent
  settings: Record<number, Partial<AgentSettings>>;
  
  // Get settings for a specific agent
  getSettings: (agentId: number) => Partial<AgentSettings>;
  
  // Update settings for a specific agent
  updateSettings: (agentId: number, updates: Partial<AgentSettings>) => void;
  
  // Clear settings for an agent
  clearSettings: (agentId: number) => void;
}

export const useChatSettingsStore = create<ChatSettingsState>()(
  persist(
    (set, get) => ({
      settings: {},

      getSettings: (agentId: number) => {
        const settings = get().settings[agentId] || {};
        return {
          response_source: settings.response_source || 'own_content',
          chatbot_model: settings.chatbot_model || 'gpt-4-o',
          custom_persona: settings.custom_persona || 'professional',
          agent_capability: settings.agent_capability || 'optimal-choice',
          ...settings,
        };
      },

      updateSettings: (agentId: number, updates: Partial<AgentSettings>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [agentId]: {
              ...state.settings[agentId],
              ...updates,
            },
          },
        }));
      },

      clearSettings: (agentId: number) => {
        set((state) => {
          const newSettings = { ...state.settings };
          delete newSettings[agentId];
          return { settings: newSettings };
        });
      },
    }),
    {
      name: 'customgpt-chat-settings',
    }
  )
);