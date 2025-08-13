'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, Mic, User, X, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAgentStore } from '@/store/agents';
import { useVoiceSettingsStore } from '@/store/voice-settings';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export function VoiceSettings({ isOpen, onClose, projectId }: VoiceSettingsProps) {
  console.log('🎛️ VoiceSettings render - isOpen:', isOpen);
  
  // Use persisted settings from store
  const { selectedVoice, selectedPersona, setVoice, setPersona } = useVoiceSettingsStore();
  const router = useRouter();
  const { currentAgent, updateSettings } = useAgentStore();
  
  // Local state for preview before saving
  const [previewVoice, setPreviewVoice] = useState(selectedVoice);
  const [previewPersona, setPreviewPersona] = useState(selectedPersona);
  const [previewModel, setPreviewModel] = useState(currentAgent?.settings?.chatbot_model || 'gpt-3.5-turbo');
  
  // Reset preview to saved values when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewVoice(selectedVoice);
      setPreviewPersona(selectedPersona);
      setPreviewModel(currentAgent?.settings?.chatbot_model || 'gpt-3.5-turbo');
    }
  }, [isOpen, selectedVoice, selectedPersona, currentAgent]);

  const voices = [
    { id: 'alloy', name: 'Alloy', desc: 'Neutral' },
    { id: 'echo', name: 'Echo', desc: 'Clear' },
    { id: 'fable', name: 'Fable', desc: 'Warm' },
    { id: 'onyx', name: 'Onyx', desc: 'Deep' },
    { id: 'nova', name: 'Nova', desc: 'Bright' },
    { id: 'shimmer', name: 'Shimmer', desc: 'Smooth' }
  ];

  const personas = [
    { id: 'assistant', name: 'Assistant', desc: 'Helpful' },
    { id: 'creative', name: 'Creative', desc: 'Artistic' },
    { id: 'analytical', name: 'Analytical', desc: 'Logical' },
    { id: 'casual', name: 'Casual', desc: 'Relaxed' },
    { id: 'professional', name: 'Professional', desc: 'Formal' }
  ];
  
  const handleOpenProjectSettings = () => {
    if (projectId) {
      onClose();
      router.push(`/projects?id=${projectId}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Voice Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Settings Grid */}
          <div className="grid grid-cols-1 gap-6">
            {/* Voice Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mic className="w-4 h-4 text-white" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Voice</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {voices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setPreviewVoice(voice.id as any)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      previewVoice === voice.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">{voice.name}</div>
                    <div className="text-xs text-gray-400">{voice.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Persona Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-white" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Persona</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => setPreviewPersona(persona.id as any)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      previewPersona === persona.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">{persona.name}</div>
                    <div className="text-xs text-gray-400">{persona.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            {projectId && currentAgent && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-white" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Model</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPreviewModel('gpt-3.5-turbo')}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      previewModel === 'gpt-3.5-turbo'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">GPT-3.5</div>
                    <div className="text-xs text-gray-400">Fast</div>
                  </button>
                  <button
                    onClick={() => setPreviewModel('gpt-4')}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      previewModel === 'gpt-4'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">GPT-4</div>
                    <div className="text-xs text-gray-400">Powerful</div>
                  </button>
                  <button
                    onClick={() => setPreviewModel('gpt-4-o')}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      previewModel === 'gpt-4-o'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">GPT-4o</div>
                    <div className="text-xs text-gray-400">Optimized</div>
                  </button>
                  <button
                    onClick={() => setPreviewModel('claude-3-opus')}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      previewModel === 'claude-3-opus'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">Claude 3 Opus</div>
                    <div className="text-xs text-gray-400">Powerful</div>
                  </button>
                  <button
                    onClick={() => setPreviewModel('claude-3-sonnet')}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      previewModel === 'claude-3-sonnet'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">Claude 3 Sonnet</div>
                    <div className="text-xs text-gray-400">Balanced</div>
                  </button>
                  <button
                    onClick={() => setPreviewModel('claude-3-haiku')}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      previewModel === 'claude-3-haiku'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">Claude 3 Haiku</div>
                    <div className="text-xs text-gray-400">Fast</div>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Recommended for voice: Mini models provide faster responses
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={() => {
              setPreviewVoice(selectedVoice);
              setPreviewPersona(selectedPersona);
              setPreviewModel(currentAgent?.settings?.chatbot_model || 'gpt-3.5-turbo');
              onClose();
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              // Save voice and persona settings
              setVoice(previewVoice as any);
              setPersona(previewPersona as any);
              
              // Update agent's model setting if it changed
              if (currentAgent && previewModel !== currentAgent.settings?.chatbot_model) {
                try {
                  await updateSettings(currentAgent.id, {
                    chatbot_model: previewModel
                  });
                } catch (error) {
                  console.error('Failed to update model setting:', error);
                  // Continue with closing the modal even if model update fails
                }
              }
              
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}