'use client';

import { useState } from 'react';
import { Settings, Mic, Volume2, Palette, User } from 'lucide-react';
import { useVoiceSettingsStore } from '@/store/voice-settings';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceSettings({ isOpen, onClose }: VoiceSettingsProps) {
  console.log('🎛️ VoiceSettings render - isOpen:', isOpen);
  
  // Use persisted settings from store
  const { selectedVoice, selectedPersona, selectedColorScheme, setVoice, setPersona, setColorScheme } = useVoiceSettingsStore();
  
  // Local state for preview before saving
  const [previewVoice, setPreviewVoice] = useState(selectedVoice);
  const [previewPersona, setPreviewPersona] = useState(selectedPersona);
  const [previewColorScheme, setPreviewColorScheme] = useState(selectedColorScheme);

  const voices = [
    { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
    { id: 'echo', name: 'Echo', description: 'Clear and crisp' },
    { id: 'fable', name: 'Fable', description: 'Warm and storytelling' },
    { id: 'onyx', name: 'Onyx', description: 'Deep and professional' },
    { id: 'nova', name: 'Nova', description: 'Bright and energetic' },
    { id: 'shimmer', name: 'Shimmer', description: 'Smooth and melodic' }
  ];

  const personas = [
    { id: 'assistant', name: 'Assistant', description: 'Helpful and informative' },
    { id: 'creative', name: 'Creative', description: 'Imaginative and artistic' },
    { id: 'analytical', name: 'Analytical', description: 'Logical and precise' },
    { id: 'casual', name: 'Casual', description: 'Relaxed and conversational' },
    { id: 'professional', name: 'Professional', description: 'Formal and business-like' }
  ];

  const colorSchemes = [
    { 
      id: 'gemini', 
      name: 'Gemini', 
      colors: ['#4285F4', '#34A853', '#EA4335'],
      description: 'Google Gemini inspired'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      colors: ['#E4405F', '#F77737', '#FCAF45'],
      description: 'Instagram gradient'
    },
    { 
      id: 'ocean', 
      name: 'Ocean Wave', 
      colors: ['#0077BE', '#00A8E8', '#00C9FF'],
      description: 'Ocean wave theme'
    },
    { 
      id: 'sunset', 
      name: 'Sunset', 
      colors: ['#FF6B6B', '#FFE66D', '#FF8E53'],
      description: 'Warm sunset colors'
    },
    { 
      id: 'aurora', 
      name: 'Aurora', 
      colors: ['#00C9FF', '#92FE9D', '#00FFC1'],
      description: 'Northern lights'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Voice Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <span className="text-white text-lg">×</span>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Voice Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mic className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Voice</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {voices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setPreviewVoice(voice.id as any)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    previewVoice === voice.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="font-medium text-white">{voice.name}</div>
                  <div className="text-sm text-gray-400 mt-1">{voice.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Persona Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Persona</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {personas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => setPreviewPersona(persona.id as any)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    previewPersona === persona.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="font-medium text-white">{persona.name}</div>
                  <div className="text-sm text-gray-400 mt-1">{persona.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Color Scheme</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => setPreviewColorScheme(scheme.id as any)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    previewColorScheme === scheme.id
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {scheme.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div>
                      <div className="font-medium text-white">{scheme.name}</div>
                      <div className="text-xs text-gray-400">{scheme.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          <div className="border border-gray-600 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Preview</h3>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-300">
                <strong>Voice:</strong> {voices.find(v => v.id === previewVoice)?.name}
              </div>
              <div className="text-sm text-gray-300">
                <strong>Persona:</strong> {personas.find(p => p.id === previewPersona)?.name}
              </div>
              <div className="text-sm text-gray-300">
                <strong>Theme:</strong> {colorSchemes.find(c => c.id === previewColorScheme)?.name}
              </div>
              <button className="w-full mt-3 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
                Test Voice Settings
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={() => {
              // Reset preview to current saved values
              setPreviewVoice(selectedVoice);
              setPreviewPersona(selectedPersona);
              setPreviewColorScheme(selectedColorScheme);
              onClose();
            }}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Save preview settings to store
              setVoice(previewVoice as any);
              setPersona(previewPersona as any);
              setColorScheme(previewColorScheme as any);
              onClose();
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}