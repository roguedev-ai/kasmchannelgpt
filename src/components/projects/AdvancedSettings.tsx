'use client';

import React, { useEffect, useState } from 'react';
import { Save, Settings, AlertCircle, RefreshCw, Zap, Brain, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useProjectSettingsStore } from '@/store';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import type { Agent } from '@/types';
import { useDemoModeContext } from '@/contexts/DemoModeContext';

interface AdvancedSettingsProps {
  project?: Agent;
  settings?: {
    chatbot_model?: string;
    agent_capability?: string;
    enable_feedbacks?: boolean;
    is_loading_indicator_enabled?: boolean;
    enable_agent_knowledge_base_awareness?: boolean;
    markdown_enabled?: boolean;
  };
  onChange?: (field: string, value: any) => void;
}

export function AdvancedSettings({ project, settings: propSettings, onChange: propOnChange }: AdvancedSettingsProps) {
  const { isFreeTrialMode } = useDemoModeContext();
  const { 
    settings: storeSettings, 
    settingsLoading, 
    settingsError, 
    fetchSettings, 
    updateSettings 
  } = useProjectSettingsStore();
  
  const { isMobile } = useBreakpoint();
  const [formData, setFormData] = useState({
    chatbot_model: 'gpt-4-o',
    agent_capability: 'optimal-choice' as 'fastest-responses' | 'optimal-choice' | 'advanced-reasoning' | 'complex-tasks',
    enable_feedbacks: true,
    is_loading_indicator_enabled: true,
    enable_agent_knowledge_base_awareness: true,
    markdown_enabled: true,
  });
  
  const [isModified, setIsModified] = useState(false);
  
  // Use either prop settings or store settings
  const settings = propSettings || storeSettings;
  const handleInputChange = propOnChange || ((field: string, value: any) => {
    if (isFreeTrialMode) {
      toast.error('Advanced settings are not available in free trial mode');
      return;
    }
    
    // Handle agent capability change
    if (field === 'agent_capability' && value === 'fastest-responses') {
      // Check if current model is a mini model
      const miniModels = ['gpt-4o-mini', 'gpt-4-1-mini', 'gpt-o4-mini-low', 'gpt-o4-mini-medium', 'gpt-o4-mini-high'];
      if (!miniModels.includes(formData.chatbot_model)) {
        // Switch to first available mini model
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          chatbot_model: 'gpt-4o-mini'
        }));
        toast.info('Model changed to GPT-4o Mini for Fastest Responses mode');
        setIsModified(true);
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
  });
  
  useEffect(() => {
    if (project) {
      fetchSettings(project.id);
    }
  }, [project?.id, fetchSettings]);
  
  useEffect(() => {
    if (settings) {
      setFormData({
        chatbot_model: settings.chatbot_model || 'gpt-4-o',
        agent_capability: (settings.agent_capability || 'optimal-choice') as 'fastest-responses' | 'optimal-choice' | 'advanced-reasoning' | 'complex-tasks',
        enable_feedbacks: settings.enable_feedbacks !== false,
        is_loading_indicator_enabled: settings.is_loading_indicator_enabled !== false,
        enable_agent_knowledge_base_awareness: settings.enable_agent_knowledge_base_awareness !== false,
        markdown_enabled: settings.markdown_enabled !== false,
      });
      setIsModified(false);
    }
  }, [settings]);
  
  const handleSave = async () => {
    if (!project || isFreeTrialMode) {
      toast.error('Cannot save settings in free trial mode');
      return;
    }
    
    try {
      // Only send fields that are documented in the API
      const { agent_capability, ...settingsToSave } = formData;
      await updateSettings(project.id, settingsToSave);
      setIsModified(false);
      toast.success('Advanced settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };
  
  const handleRefresh = () => {
    if (project) {
      fetchSettings(project.id);
      setIsModified(false);
    }
  };
  
  return (
    <div className={cn(
      "max-w-4xl mx-auto",
      isMobile ? "p-4" : "p-6"
    )}>
      {/* Header */}
      <div className={cn(
        "mb-6",
        isMobile ? "flex-col gap-4" : "flex items-center justify-between"
      )}>
        <div className={isMobile ? "w-full" : ""}>
          <h2 className={cn(
            "font-bold text-foreground",
            isMobile ? "text-xl" : "text-2xl"
          )}>Advanced Settings</h2>
          <p className={cn(
            "text-muted-foreground mt-1",
            isMobile ? "text-sm" : ""
          )}>
            Configure advanced AI model and feature settings
          </p>
        </div>
        
        {project && (
          <div className={cn(
            "flex gap-3",
            isMobile ? "w-full grid grid-cols-2 gap-2 mt-4" : "items-center"
          )}>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={settingsLoading}
              size="sm"
              className={isMobile ? "h-9 px-3 text-sm" : ""}
            >
              <RefreshCw className={cn('w-4 h-4 mr-1.5', settingsLoading && 'animate-spin')} />
              Refresh
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!isModified || settingsLoading || isFreeTrialMode}
              size="sm"
              className={cn(
                isMobile ? "h-9 px-3 text-sm" : "",
                isFreeTrialMode && "opacity-50 cursor-not-allowed"
              )}
              title={isFreeTrialMode ? 'Saving is not available in free trial mode' : ''}
            >
              <Save className="w-4 h-4 mr-1.5" />
              {settingsLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
      
      {/* Error State */}
      {settingsError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading settings</span>
          </div>
          <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{settingsError}</p>
        </div>
      )}
      
      <div className="space-y-6">
        <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure the AI model and response behavior
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chatbot_model">AI Model</Label>
            <Select
              value={formData.chatbot_model}
              onValueChange={(value) => handleInputChange('chatbot_model', value)}
              disabled={isFreeTrialMode}
            >
              <SelectTrigger id="chatbot_model" className={cn(
                isFreeTrialMode && "opacity-50 cursor-not-allowed"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formData.agent_capability === 'fastest-responses' ? (
                  // Only show mini models for fastest-responses
                  <>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4-1-mini">GPT-4.1 Mini</SelectItem>
                    <SelectItem value="gpt-o4-mini-low">GPT O4 Mini (Low)</SelectItem>
                    <SelectItem value="gpt-o4-mini-medium">GPT O4 Mini (Medium)</SelectItem>
                    <SelectItem value="gpt-o4-mini-high">GPT O4 Mini (High)</SelectItem>
                  </>
                ) : (
                  // Show all models for other capabilities
                  <>
                    <SelectItem value="gpt-4-o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4-1">GPT-4.1</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4-1-mini">GPT-4.1 Mini</SelectItem>
                    <SelectItem value="gpt-o4-mini-low">GPT O4 Mini (Low)</SelectItem>
                    <SelectItem value="gpt-o4-mini-medium">GPT O4 Mini (Medium)</SelectItem>
                    <SelectItem value="gpt-o4-mini-high">GPT O4 Mini (High)</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.agent_capability === 'fastest-responses' 
                ? 'Only mini models are available for fastest response mode.'
                : 'Select the AI model that best suits your use case. GPT-4 models offer better understanding and responses.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_capability">Agent Capability</Label>
            <Select
              value={formData.agent_capability}
              onValueChange={(value) => handleInputChange('agent_capability', value)}
              disabled={isFreeTrialMode}
            >
              <SelectTrigger id="agent_capability" className={cn(
                isFreeTrialMode && "opacity-50 cursor-not-allowed"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fastest-responses">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Fastest Responses</span>
                    <span className="text-xs text-muted-foreground">(Enterprise)</span>
                  </div>
                </SelectItem>
                <SelectItem value="optimal-choice">
                  <div className="flex items-center gap-2">
                    <Settings className="h-3.5 w-3.5" />
                    <span>Optimal Choice</span>
                  </div>
                </SelectItem>
                <SelectItem value="advanced-reasoning">
                  <div className="flex items-center gap-2">
                    <Brain className="h-3.5 w-3.5" />
                    <span>Advanced Reasoning</span>
                    <span className="text-xs text-muted-foreground">(Enterprise)</span>
                  </div>
                </SelectItem>
                <SelectItem value="complex-tasks">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Complex Tasks</span>
                    <span className="text-xs text-muted-foreground">(Enterprise)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Select the agent capability level. Higher capabilities provide better reasoning but may require enterprise access.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="markdown_enabled">Enable Markdown</Label>
              <p className="text-sm text-muted-foreground">
                Allow markdown formatting in responses
              </p>
            </div>
            <Switch
              id="markdown_enabled"
              checked={formData.markdown_enabled}
              onCheckedChange={(checked) => handleInputChange('markdown_enabled', checked)}
              disabled={isFreeTrialMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable_agent_knowledge_base_awareness">Knowledge Base Awareness</Label>
              <p className="text-sm text-muted-foreground">
                Allow agent to be aware of its knowledge base content
              </p>
            </div>
            <Switch
              id="enable_agent_knowledge_base_awareness"
              checked={formData.enable_agent_knowledge_base_awareness}
              onCheckedChange={(checked) => handleInputChange('enable_agent_knowledge_base_awareness', checked)}
              disabled={isFreeTrialMode}
            />
          </div>
        </CardContent>
        </Card>

        <Card>
        <CardHeader>
          <CardTitle>User Experience Features</CardTitle>
          <p className="text-sm text-muted-foreground">
            Toggle features that enhance user interaction
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable_feedbacks">Enable Feedback</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to provide feedback on responses
              </p>
            </div>
            <Switch
              id="enable_feedbacks"
              checked={formData.enable_feedbacks}
              onCheckedChange={(checked) => handleInputChange('enable_feedbacks', checked)}
              disabled={isFreeTrialMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_loading_indicator_enabled">Show Loading Indicator</Label>
              <p className="text-sm text-muted-foreground">
                Display loading animation while generating responses
              </p>
            </div>
            <Switch
              id="is_loading_indicator_enabled"
              checked={formData.is_loading_indicator_enabled}
              onCheckedChange={(checked) => handleInputChange('is_loading_indicator_enabled', checked)}
              disabled={isFreeTrialMode}
            />
          </div>

        </CardContent>
        </Card>
      </div>
      
      {/* Save Button at Bottom */}
      {project && (
        <div className={cn(
          "flex mt-6",
          isMobile ? "justify-center" : "justify-end"
        )}>
          <Button
            onClick={handleSave}
            disabled={!isModified || settingsLoading || isFreeTrialMode}
            size="sm"
            className={cn(
              isMobile ? "h-9 px-6 text-sm" : "",
              isFreeTrialMode && "opacity-50 cursor-not-allowed"
            )}
            title={isFreeTrialMode ? 'Saving is not available in free trial mode' : ''}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {settingsLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}