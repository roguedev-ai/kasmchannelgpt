import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VoiceOption = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type PersonaOption = 'assistant' | 'creative' | 'analytical' | 'casual' | 'professional';

interface VoiceSettings {
  selectedVoice: VoiceOption;
  selectedPersona: PersonaOption;
  isVoiceModalOpen: boolean;
}

interface VoiceSettingsActions {
  setVoice: (voice: VoiceOption) => void;
  setPersona: (persona: PersonaOption) => void;
  setVoiceModalOpen: (isOpen: boolean) => void;
  getSettings: () => Omit<VoiceSettings, 'isVoiceModalOpen'>;
}

export type VoiceSettingsStore = VoiceSettings & VoiceSettingsActions;

/**
 * Voice Settings Store
 * 
 * Persists user's voice preferences including:
 * - Voice selection (OpenAI TTS voices)
 * - Persona selection (conversation style)
 */
export const useVoiceSettingsStore = create<VoiceSettingsStore>()(
  persist(
    (set, get) => ({
      // Default settings
      selectedVoice: 'alloy',
      selectedPersona: 'assistant',
      isVoiceModalOpen: false,

      setVoice: (voice: VoiceOption) => {
        set({ selectedVoice: voice });
      },

      setPersona: (persona: PersonaOption) => {
        set({ selectedPersona: persona });
      },

      setVoiceModalOpen: (isOpen: boolean) => {
        set({ isVoiceModalOpen: isOpen });
      },

      getSettings: () => {
        const state = get();
        return {
          selectedVoice: state.selectedVoice,
          selectedPersona: state.selectedPersona,
        };
      },
    }),
    {
      name: 'customgpt-voice-settings',
      // Persist all voice settings except modal state
      partialize: (state) => ({
        selectedVoice: state.selectedVoice,
        selectedPersona: state.selectedPersona,
        // Don't persist isVoiceModalOpen - always start as false
      }),
    }
  )
);

// Export helper to get persona system prompts
export const getPersonaSystemPrompt = (persona: PersonaOption): string => {
  const prompts: Record<PersonaOption, string> = {
    assistant: 'You are a helpful assistant with a voice interface. Keep your responses concise and informative, limited to 1-2 sentences since the user is interacting through voice.',
    creative: 'You are a creative and imaginative assistant with a voice interface. Be playful and artistic in your responses while keeping them brief (1-2 sentences) for voice interaction.',
    analytical: 'You are a logical and precise assistant with a voice interface. Provide clear, data-driven responses in 1-2 concise sentences suitable for voice interaction.',
    casual: 'You are a relaxed and conversational assistant with a voice interface. Keep responses friendly and informal, limited to 1-2 sentences for natural voice interaction.',
    professional: 'You are a formal and business-focused assistant with a voice interface. Maintain a professional tone while keeping responses brief (1-2 sentences) for voice interaction.',
  };
  
  return prompts[persona];
};