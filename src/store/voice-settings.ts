import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VoiceOption = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type PersonaOption = 'assistant' | 'creative' | 'analytical' | 'casual' | 'professional';
export type ColorSchemeOption = 'gemini' | 'instagram' | 'ocean' | 'sunset' | 'aurora';

interface VoiceSettings {
  selectedVoice: VoiceOption;
  selectedPersona: PersonaOption;
  selectedColorScheme: ColorSchemeOption;
}

interface VoiceSettingsActions {
  setVoice: (voice: VoiceOption) => void;
  setPersona: (persona: PersonaOption) => void;
  setColorScheme: (colorScheme: ColorSchemeOption) => void;
  getSettings: () => VoiceSettings;
}

export type VoiceSettingsStore = VoiceSettings & VoiceSettingsActions;

/**
 * Voice Settings Store
 * 
 * Persists user's voice preferences including:
 * - Voice selection (OpenAI TTS voices)
 * - Persona selection (conversation style)
 * - Color scheme (visual effects in voice modal)
 */
export const useVoiceSettingsStore = create<VoiceSettingsStore>()(
  persist(
    (set, get) => ({
      // Default settings
      selectedVoice: 'alloy',
      selectedPersona: 'assistant',
      selectedColorScheme: 'gemini',

      setVoice: (voice: VoiceOption) => {
        set({ selectedVoice: voice });
      },

      setPersona: (persona: PersonaOption) => {
        set({ selectedPersona: persona });
      },

      setColorScheme: (colorScheme: ColorSchemeOption) => {
        set({ selectedColorScheme: colorScheme });
      },

      getSettings: () => {
        const state = get();
        return {
          selectedVoice: state.selectedVoice,
          selectedPersona: state.selectedPersona,
          selectedColorScheme: state.selectedColorScheme,
        };
      },
    }),
    {
      name: 'customgpt-voice-settings',
      // Persist all voice settings
      partialize: (state) => ({
        selectedVoice: state.selectedVoice,
        selectedPersona: state.selectedPersona,
        selectedColorScheme: state.selectedColorScheme,
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

// Export color schemes for particle manager
export const getColorScheme = (scheme: ColorSchemeOption) => {
  const schemes: Record<ColorSchemeOption, { colors: number[][]; name: string }> = {
    gemini: {
      name: 'Gemini',
      colors: [[66, 133, 244], [52, 168, 83], [234, 67, 53]], // Google colors
    },
    instagram: {
      name: 'Instagram',
      colors: [[228, 64, 95], [247, 119, 55], [252, 175, 69]], // Instagram gradient
    },
    ocean: {
      name: 'Ocean Wave', 
      colors: [[0, 119, 190], [0, 168, 232], [0, 201, 255]], // Ocean blues
    },
    sunset: {
      name: 'Sunset',
      colors: [[255, 107, 107], [255, 230, 109], [255, 142, 83]], // Warm sunset
    },
    aurora: {
      name: 'Aurora',
      colors: [[0, 201, 255], [146, 254, 157], [0, 255, 193]], // Northern lights
    },
  };
  
  return schemes[scheme];
};