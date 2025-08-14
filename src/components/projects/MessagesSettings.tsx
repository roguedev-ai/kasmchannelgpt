'use client';

import React, { useEffect, useState } from 'react';
import { Save, MessageCircle, AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { useProjectSettingsStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';
import { useDemoModeContext } from '@/contexts/DemoModeContext';

interface MessagesSettingsProps {
  project: Agent;
}

export const MessagesSettings: React.FC<MessagesSettingsProps> = ({ project }) => {
  const { isFreeTrialMode } = useDemoModeContext();
  const { 
    settings, 
    settingsLoading, 
    settingsError, 
    fetchSettings, 
    updateSettings 
  } = useProjectSettingsStore();

  const [formData, setFormData] = useState({
    citations_answer_source_label_msg: '',
    citations_sources_label_msg: '',
    hang_in_there_msg: '',
    chatbot_siesta_msg: '',
  });

  const [isModified, setIsModified] = useState(false);

  const defaultMessages = {
    citations_answer_source_label_msg: 'Where did this answer come from?',
    citations_sources_label_msg: 'Sources',
    hang_in_there_msg: 'Hang in there! I\'m thinking..',
    chatbot_siesta_msg: 'Oops! The agent is taking a siesta. We are aware of this and will get it back soon! Please try again later.',
  };

  useEffect(() => {
    fetchSettings(project.id);
  }, [project.id]);

  useEffect(() => {
    if (settings) {
      setFormData({
        citations_answer_source_label_msg: settings.citations_answer_source_label_msg || '',
        citations_sources_label_msg: settings.citations_sources_label_msg || '',
        hang_in_there_msg: settings.hang_in_there_msg || '',
        chatbot_siesta_msg: settings.chatbot_siesta_msg || '',
      });
      setIsModified(false);
    }
  }, [settings]);

  const handleInputChange = (field: string, value: string) => {
    if (isFreeTrialMode) {
      toast.error('Editing message settings is not available in free trial mode');
      return;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
  };

  const handleResetToDefault = (field: string) => {
    const defaultValue = defaultMessages[field as keyof typeof defaultMessages];
    handleInputChange(field, defaultValue);
  };

  const handleResetAllToDefaults = () => {
    setFormData(defaultMessages);
    setIsModified(true);
  };

  const handleSave = async () => {
    if (isFreeTrialMode) {
      toast.error('Updating message settings is not available in free trial mode');
      return;
    }
    
    try {
      // Only send non-empty values
      const updateData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value.trim() !== '') {
          acc[key] = value.trim();
        }
        return acc;
      }, {} as any);

      await updateSettings(project.id, updateData);
      setIsModified(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleRefresh = () => {
    fetchSettings(project.id);
    setIsModified(false);
  };

  const messageFields = [
    {
      key: 'citations_answer_source_label_msg',
      label: 'Citation Source Label',
      description: 'Message shown to indicate where the response came from',
      placeholder: defaultMessages.citations_answer_source_label_msg,
      category: 'Citations',
    },
    {
      key: 'citations_sources_label_msg',
      label: 'Sources Label',
      description: 'Label displayed for the sources section',
      placeholder: defaultMessages.citations_sources_label_msg,
      category: 'Citations',
    },
    {
      key: 'hang_in_there_msg',
      label: 'Thinking Message',
      description: 'Message shown when the agent is processing a response',
      placeholder: defaultMessages.hang_in_there_msg,
      category: 'Status Messages',
    },
    {
      key: 'chatbot_siesta_msg',
      label: 'Error Message',
      description: 'Message shown when the agent encounters an error',
      placeholder: defaultMessages.chatbot_siesta_msg,
      category: 'Status Messages',
    },
  ];

  // Group messages by category
  const messagesByCategory = messageFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof messageFields>);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Messages & Labels</h2>
          <p className="text-gray-600 mt-1">
            Customize system messages and labels shown to users
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleResetAllToDefaults}
            disabled={isFreeTrialMode}
            size="sm"
            className={cn(
              isFreeTrialMode && "opacity-50 cursor-not-allowed"
            )}
            title={isFreeTrialMode ? 'Resetting message settings is not available in free trial mode' : ''}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
          
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
            disabled={!isModified || settingsLoading || isFreeTrialMode}
            size="sm"
            className={cn(
              isFreeTrialMode && "opacity-50 cursor-not-allowed"
            )}
            title={isFreeTrialMode ? 'Saving message settings is not available in free trial mode' : ''}
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
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="space-y-4">
                {[...Array(2)].map((_, j) => (
                  <div key={j}>
                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Info Card */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Customize User Experience
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Personalize the messages your users see to match your brand voice and language preferences. 
                  These messages help guide users and provide feedback during their interaction with your agent.
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Empty fields will use default system messages</li>
                  <li>• Messages support basic text formatting</li>
                  <li>• Consider your target audience when customizing</li>
                  <li>• Test messages in different languages if needed</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Message Categories */}
          {Object.entries(messagesByCategory).map(([category, fields]) => (
            <Card key={category} className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
              
              <div className="space-y-6">
                {fields.map((field) => (
                  <div key={field.key}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetToDefault(field.key)}
                        disabled={isFreeTrialMode}
                        className={cn(
                          "text-xs text-gray-500 hover:text-gray-700",
                          isFreeTrialMode && "opacity-50 cursor-not-allowed"
                        )}
                        title={isFreeTrialMode ? 'Resetting message settings is not available in free trial mode' : ''}
                      >
                        Reset to Default
                      </Button>
                    </div>
                    
                    <input
                      type="text"
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      disabled={isFreeTrialMode}
                      className={cn(
                        "w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
                        isFreeTrialMode && "opacity-50 cursor-not-allowed bg-gray-100"
                      )}
                      title={isFreeTrialMode ? 'Editing message settings is not available in free trial mode' : ''}
                    />
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {field.description}
                    </p>
                    
                    {formData[field.key as keyof typeof formData] === '' && (
                      <p className="text-xs text-blue-600 mt-1">
                        Using default: &ldquo;{field.placeholder}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* Preview Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Preview</h3>
            
            <div className="space-y-4">
              {/* Citation Preview */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Citation Display</h4>
                
                <div className="bg-white rounded p-3 border">
                  <div className="text-sm text-gray-800 mb-3">
                    Here&apos;s some information about your topic...
                  </div>
                  
                  <div className="border-t pt-2">
                    <p className="text-xs text-gray-600 mb-2">
                      {formData.citations_answer_source_label_msg || defaultMessages.citations_answer_source_label_msg}
                    </p>
                    
                    <div className="text-xs">
                      <span className="font-medium text-gray-700">
                        {formData.citations_sources_label_msg || defaultMessages.citations_sources_label_msg}:
                      </span>
                      <span className="text-blue-600 ml-1">Document 1, Page 2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Messages Preview */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Status Messages</h4>
                
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-sm text-blue-800">
                        {formData.hang_in_there_msg || defaultMessages.hang_in_there_msg}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-800">
                        {formData.chatbot_siesta_msg || defaultMessages.chatbot_siesta_msg}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Localization Tips */}
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">Localization Tips</h3>
            
            <div className="text-sm text-yellow-800 space-y-2">
              <p>
                <strong>Multi-language support:</strong> If you serve users in different languages, 
                consider creating separate agents for each language with localized messages.
              </p>
              
              <p>
                <strong>Cultural adaptation:</strong> Adjust the tone and style of messages to match 
                cultural expectations of your target audience.
              </p>
              
              <p>
                <strong>Brand consistency:</strong> Ensure messages align with your brand voice and 
                communication style across all touchpoints.
              </p>
            </div>
          </Card>

          {/* Save Button at Bottom */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              disabled={!isModified || settingsLoading || isFreeTrialMode}
              size="sm"
              className={cn(
                isFreeTrialMode && "opacity-50 cursor-not-allowed"
              )}
              title={isFreeTrialMode ? 'Saving message settings is not available in free trial mode' : ''}
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