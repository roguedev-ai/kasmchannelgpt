'use client';

import React, { useEffect, useState } from 'react';
import { Save, Brain, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';

import { useProjectSettingsStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';

interface BehaviorSettingsProps {
  project: Agent;
}

export const BehaviorSettings: React.FC<BehaviorSettingsProps> = ({ project }) => {
  const { 
    settings, 
    settingsLoading, 
    settingsError, 
    fetchSettings, 
    updateSettings 
  } = useProjectSettingsStore();

  const [formData, setFormData] = useState({
    persona_instructions: '',
    response_source: 'own_content' as 'default' | 'own_content' | 'openai_content',
    chatbot_msg_lang: 'en',
  });

  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    fetchSettings(project.id);
  }, [project.id]);

  useEffect(() => {
    if (settings) {
      setFormData({
        persona_instructions: settings.persona_instructions || '',
        response_source: settings.response_source || 'own_content',
        chatbot_msg_lang: settings.chatbot_msg_lang || 'en',
      });
      setIsModified(false);
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(project.id, formData);
      setIsModified(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleRefresh = () => {
    fetchSettings(project.id);
    setIsModified(false);
  };

  const responseSourceOptions = [
    { 
      value: 'own_content', 
      label: 'My Content Only', 
      description: 'Agent will only use information from your uploaded content and sources',
      recommended: true,
    },
    { 
      value: 'openai_content', 
      label: 'My Content + ChatGPT Knowledge', 
      description: 'Agent can use both your content and ChatGPT\'s general knowledge base',
      recommended: false,
    },
    { 
      value: 'default', 
      label: 'Default Setting', 
      description: 'Use the system default response source configuration',
      recommended: false,
    },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish (Español)' },
    { value: 'fr', label: 'French (Français)' },
    { value: 'de', label: 'German (Deutsch)' },
    { value: 'it', label: 'Italian (Italiano)' },
    { value: 'pt', label: 'Portuguese (Português)' },
    { value: 'zh', label: 'Chinese (中文)' },
    { value: 'ja', label: 'Japanese (日本語)' },
    { value: 'ko', label: 'Korean (한국어)' },
    { value: 'ru', label: 'Russian (Русский)' },
    { value: 'ar', label: 'Arabic (العربية)' },
    { value: 'hi', label: 'Hindi (हिन्दी)' },
  ];

  const personaExamples = [
    {
      title: "Customer Support Agent",
      content: "You are a helpful customer support agent for our company. You should be friendly, professional, and focused on solving customer problems. Always try to provide clear, actionable solutions and escalate complex issues when appropriate."
    },
    {
      title: "Technical Documentation Assistant",
      content: "You are a technical documentation assistant. You help users understand complex technical concepts by breaking them down into simple, easy-to-follow explanations. Always provide examples and step-by-step instructions when possible."
    },
    {
      title: "Sales Assistant",
      content: "You are a knowledgeable sales assistant. You help potential customers understand our products and services, answer questions about features and pricing, and guide them toward making informed purchasing decisions. Be enthusiastic but not pushy."
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Behavior Settings</h2>
          <p className="text-gray-600 mt-1">
            Configure how your AI agent behaves and responds to users
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={settingsLoading}
            size="sm"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', settingsLoading && 'animate-spin')} />
            Refresh
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!isModified || settingsLoading}
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {settingsLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {settingsError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading settings</span>
          </div>
          <p className="text-red-700 mt-1 text-sm">{settingsError}</p>
        </div>
      )}

      {/* Loading State */}
      {settingsLoading && !settings ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Persona Instructions */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <Brain className="w-6 h-6 text-brand-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Persona Instructions</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Define your AI agent's personality, role, and behavior patterns
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                POST /projects/{project.id}/settings
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Instructions
                </label>
                <textarea
                  value={formData.persona_instructions}
                  onChange={(e) => handleInputChange('persona_instructions', e.target.value)}
                  placeholder="You are a helpful assistant that..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  These instructions control your AI's personality and behavior. Be specific about tone, expertise, and how it should interact with users.
                </p>
              </div>

              {/* Persona Examples */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Example Personas
                </h4>
                
                <div className="space-y-3">
                  {personaExamples.map((example, index) => (
                    <div key={index} className="bg-white rounded p-3 border border-blue-100">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        {example.title}
                      </h5>
                      <p className="text-xs text-gray-600 mb-2">
                        {example.content}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange('persona_instructions', example.content)}
                        className="text-xs"
                      >
                        Use This Example
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Response Source */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Knowledge Source</h3>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                POST /projects/{project.id}/settings
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Control what information your AI agent can access when generating responses
            </p>
            
            <div className="space-y-3">
              {responseSourceOptions.map((option) => (
                <label 
                  key={option.value} 
                  className={cn(
                    "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                    formData.response_source === option.value
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <input
                    type="radio"
                    name="response_source"
                    value={option.value}
                    checked={formData.response_source === option.value}
                    onChange={(e) => handleInputChange('response_source', e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{option.label}</span>
                      {option.recommended && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                    
                    {option.value === 'own_content' && formData.response_source === option.value && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                        <strong>Benefits:</strong> More accurate responses based on your specific content, 
                        better brand consistency, and reduced risk of hallucinated information.
                      </div>
                    )}
                    
                    {option.value === 'openai_content' && formData.response_source === option.value && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        <strong>Note:</strong> The AI may provide information beyond your uploaded content, 
                        which could be less accurate or relevant to your specific use case.
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </Card>

          {/* Language Settings */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Language Settings</h3>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                POST /projects/{project.id}/settings
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interface Language
              </label>
              <select
                value={formData.chatbot_msg_lang}
                onChange={(e) => handleInputChange('chatbot_msg_lang', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {languageOptions.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> This setting only affects system messages like "Ask me anything" 
                  or error messages. The AI will respond in whatever language the user uses in their questions.
                </p>
              </div>
            </div>
          </Card>

          {/* Advanced Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Behavior</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Response Guidelines</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• The AI will always try to be helpful and accurate</li>
                  <li>• Responses are generated based on your configured knowledge source</li>
                  <li>• The AI will indicate when it doesn't have enough information</li>
                  <li>• Persona instructions override default behavior patterns</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">Best Practices</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Be specific in your persona instructions</li>
                  <li>• Test different instruction variations to find what works best</li>
                  <li>• Consider your target audience when defining personality</li>
                  <li>• Update instructions as your use case evolves</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Save Button at Bottom */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              disabled={!isModified || settingsLoading}
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {settingsLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};