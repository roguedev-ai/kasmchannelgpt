'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings,
  Palette,
  MessageSquare,
  Globe,
  Shield,
  Code,
  Save,
  RotateCcw,
  Upload,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  Key,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  FileText,
  Bot,
  Link2,
  Share2,
  Download,
  Clock,
  Hash,
  Type,
  User,
  DollarSign,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { LicenseManager } from '@/components/licenses/LicenseManager';
import { getClient } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { GeneralSettings } from '@/components/projects/GeneralSettings';
import { AppearanceSettings } from '@/components/projects/AppearanceSettings';
import { BehaviorSettings } from '@/components/projects/BehaviorSettings';
import { MessagesSettings } from '@/components/projects/MessagesSettings';
import { CitationsSettings } from '@/components/projects/CitationsSettings';
import { PagesSettings } from '@/components/projects/PagesSettings';
import { AdvancedSettings } from '@/components/projects/AdvancedSettings';
import { UserInterfaceSettings } from '@/components/projects/UserInterfaceSettings';
import { SecurityPrivacySettings } from '@/components/projects/SecurityPrivacySettings';
import { BusinessSettings } from '@/components/projects/BusinessSettings';
import { LicenseToggle } from '@/components/agent/LicenseToggle';
import { AnalyticsTab } from '@/components/projects/AnalyticsTab';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AgentAvatar } from '@/components/ui/avatar';
import type { Agent } from '@/types';
import { useAgentStore } from '@/store/agents';
import { useBreakpoint } from '@/hooks/useMediaQuery';

interface AgentSettingsProps {
  agentId: number;
  agentName: string;
  onBack?: () => void;
}

interface TabContentProps {
  children: React.ReactNode;
  className?: string;
}

const TabContent: React.FC<TabContentProps> = ({ children, className }) => (
  <div className={cn('space-y-6', className)}>
    {children}
  </div>
);

const FormGroup: React.FC<{
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ label, description, required, children, className }) => (
  <div className={cn("space-y-2", className)}>
    <label className="block text-sm font-medium text-gray-900">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {description && (
      <p className="text-sm text-gray-600">{description}</p>
    )}
    {children}
  </div>
);

const ColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const presets = [
    '#007acc', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          placeholder="#007acc"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className="w-8 h-8 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};

const LanguageSelector: React.FC<{
  value: string;
  onChange: (language: string) => void;
}> = ({ value, onChange }) => {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
};

export const AgentSettings: React.FC<AgentSettingsProps> = ({ agentId, agentName, onBack }) => {
  const { agents } = useAgentStore();
  const currentAgent = agents.find(a => a.id === agentId);
  const { isMobile } = useBreakpoint();
  
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isChangingTab, setIsChangingTab] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Settings state based on API schema - using exact field names from API
  const [settings, setSettings] = useState({
    // Appearance
    chatbot_avatar: '',
    chatbot_background_type: 'image' as 'image' | 'color',
    chatbot_background: '',
    chatbot_background_color: '#F5F5F5',
    chatbot_color: '#000000',
    chatbot_toolbar_color: '#000000',
    chatbot_title: '',
    chatbot_title_color: '#000000',
    user_avatar: '',
    spotlight_avatar_enabled: false,
    spotlight_avatar: '',
    spotlight_avatar_shape: 'rectangle' as 'rectangle' | 'circle',
    spotlight_avatar_type: 'default' as 'default' | 'custom',
    user_avatar_orientation: 'agent-left-user-right' as 'agent-left-user-right' | 'agent-right-user-left',
    
    // Messages & Behavior
    default_prompt: 'How can I help you?',
    example_questions: ['How do I get started?'],
    persona_instructions: 'You are a custom agent assistant called CustomGPT.ai, a friendly lawyer who answers questions based on the given context.',
    response_source: 'own_content' as 'own_content' | 'openai_content' | 'default',
    chatbot_model: 'gpt-4-o',
    chatbot_msg_lang: 'en',
    input_field_addendum: '',
    
    // Messages
    hang_in_there_msg: 'Hang in there! I\'m thinking..',
    chatbot_siesta_msg: 'Oops! The agent is taking a siesta. We are aware of this and will get it back soon! Please try again later.',
    no_answer_message: 'Sorry, I don\'t have an answer for that.',
    ending_message: 'Please email us for further support',
    try_asking_questions_msg: 'Try asking these questions...',
    view_more_msg: 'View more',
    view_less_msg: 'View less',
    
    // Citations
    enable_citations: 3,
    citations_view_type: 'user' as 'user' | 'show' | 'hide',
    citations_answer_source_label_msg: 'Where did this answer come from?',
    citations_sources_label_msg: 'Sources',
    image_citation_display: 'default' as 'default' | 'inline' | 'none',
    enable_inline_citations_api: false,
    hide_sources_from_responses: true,
    
    // Features
    enable_feedbacks: true,
    is_loading_indicator_enabled: true,
    remove_branding: false,
    private_deployment: false,
    enable_recaptcha_for_public_chatbots: false,
    is_selling_enabled: false,
    license_slug: true,
    selling_url: '',
    can_share_conversation: false,
    can_export_conversation: false,
    conversation_time_window: false,
    conversation_retention_period: 'year' as 'year' | 'month' | 'week' | 'day',
    conversation_retention_days: 180,
    enable_agent_knowledge_base_awareness: true,
    markdown_enabled: true,
  });
  
  // File states for image uploads
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [userAvatarFile, setUserAvatarFile] = useState<File | null>(null);
  const [spotlightAvatarFile, setSpotlightAvatarFile] = useState<File | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [agentId]);
  
  // Debounce tab changes to prevent multiple clicks
  const handleTabChange = useCallback((tabId: string) => {
    if (isChangingTab || tabId === activeTab) return;
    
    setIsChangingTab(true);
    setActiveTab(tabId);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setIsChangingTab(false);
    }, 300);
  }, [activeTab, isChangingTab]);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const client = getClient();
      const response = await client.getAgentSettings(agentId);
      
      logger.info('AGENT_SETTINGS', 'Settings fetched', {
        agentId,
        hasData: !!response.data
      });
      
      if (response.data) {
        // Merge API response with default values
        setSettings(prev => ({
          ...prev,
          ...response.data
        }));
      }
    } catch (error: any) {
      logger.error('AGENT_SETTINGS', 'Failed to fetch settings', error);
      
      let errorMessage = 'Failed to load agent settings';
      if (error.status === 404) {
        errorMessage = 'Agent not found or you don\'t have access to it';
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please check your API key';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'behavior', label: 'Behavior', icon: MessageSquare },
    { id: 'messages', label: 'Messages', icon: Globe },
    { id: 'citations', label: 'Citations', icon: FileText },
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'interface', label: 'User Interface', icon: Type },
    { id: 'advanced', label: 'Advanced', icon: Settings },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'business', label: 'Business', icon: DollarSign },
    ...(settings.license_slug ? [{ id: 'licenses', label: 'Licenses', icon: Key }] : []),
    { id: 'embed', label: 'Embed Code', icon: Code },
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      logger.info('AGENT_SETTINGS', 'Saving settings', {
        agentId,
        hasFiles: !!(avatarFile || backgroundFile || userAvatarFile || spotlightAvatarFile)
      });
      
      const client = getClient();
      
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add all non-file settings
      Object.entries(settings).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === 'boolean' || typeof value === 'number') {
            formData.append(key, value.toString());
          } else if (Array.isArray(value)) {
            // For array fields like example_questions
            value.forEach((item, index) => {
              formData.append(`${key}[${index}]`, item);
            });
          } else {
            formData.append(key, value as string);
          }
        }
      });
      
      // Add file uploads if present
      if (avatarFile) {
        formData.append('chatbot_avatar', avatarFile);
      }
      if (backgroundFile) {
        formData.append('chatbot_background', backgroundFile);
      }
      if (userAvatarFile) {
        formData.append('user_avatar', userAvatarFile);
      }
      if (spotlightAvatarFile) {
        formData.append('spotlight_avatar', spotlightAvatarFile);
      }
      
      const response = await client.updateAgentSettings(agentId, formData);
      
      logger.info('AGENT_SETTINGS', 'Settings saved successfully', {
        agentId,
        response
      });
      
      toast.success('Settings saved successfully');
      setHasUnsavedChanges(false);
      
      // Clear file states after successful save
      setAvatarFile(null);
      setBackgroundFile(null);
      setUserAvatarFile(null);
      setSpotlightAvatarFile(null);
    } catch (error: any) {
      logger.error('AGENT_SETTINGS', 'Failed to save settings', error);
      
      let errorMessage = 'Failed to save settings';
      if (error.status === 400) {
        if (error.message.includes('valid image')) {
          errorMessage = 'Please upload a valid image file';
        } else {
          errorMessage = error.message;
        }
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please check your API key';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Reload settings from API
    fetchSettings();
    setHasUnsavedChanges(false);
    // Clear file states
    setAvatarFile(null);
    setBackgroundFile(null);
    setUserAvatarFile(null);
    setSpotlightAvatarFile(null);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading agent settings...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Settings</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchSettings}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const renderLicensesTab = () => {
    return (
      <TabContent>
        <div className="h-full">
          <LicenseManager embedded={true} />
        </div>
      </TabContent>
    );
  };

  const renderEmbedTab = () => {
    const embedCode = `<iframe 
  src="https://app.customgpt.ai/embed/${agentId}" 
  width="100%" 
  height="600" 
  frameborder="0">
</iframe>`;

    const widgetCode = `<script src="https://app.customgpt.ai/widget.js"></script>
<script>
  CustomGPTWidget.init({
    agentId: ${agentId},
    mode: 'floating',
    position: 'bottom-right'
  });
</script>`;

    return (
      <TabContent>
        <div className="space-y-6">
          <FormGroup 
            label="Iframe Embed" 
            description="Embed the chat directly in your website"
          >
            <div className="relative">
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto border">
                <code>{embedCode}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(embedCode)}
                className="absolute top-2 right-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </FormGroup>

          <FormGroup 
            label="Widget Code" 
            description="Add a floating chat widget to your site"
          >
            <div className="relative">
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto border">
                <code>{widgetCode}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(widgetCode)}
                className="absolute top-2 right-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </FormGroup>

          <FormGroup label="Preview">
            <div className="flex gap-4">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview Chat
              </Button>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </FormGroup>
        </div>
      </TabContent>
    );
  };

  const renderTabContent = () => {
    // Create a minimal project object for components that need it
    const projectProp: Agent = { 
      id: agentId, 
      project_name: agentName,
      is_chat_active: true,
      user_id: 0, // Placeholder
      team_id: 0, // Placeholder
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: 'SITEMAP',
      is_shared: false
    };
    
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            project={projectProp}
          />
        );
      case 'analytics':
        return (
          <TabContent>
            <AnalyticsTab
              agentId={agentId}
              agentName={agentName}
            />
          </TabContent>
        );
      case 'appearance':
        return (
          <AppearanceSettings
            project={projectProp}
          />
        );
      case 'behavior':
        return (
          <BehaviorSettings
            project={projectProp}
          />
        );
      case 'messages':
        return (
          <MessagesSettings
            project={projectProp}
          />
        );
      case 'citations':
        return (
          <TabContent>
            <CitationsSettings
              settings={settings}
              onChange={handleSettingChange}
            />
          </TabContent>
        );
      case 'pages':
        return (
          <PagesSettings
            project={projectProp}
          />
        );
      case 'interface':
        return (
          <TabContent>
            <UserInterfaceSettings
              settings={settings}
              onChange={handleSettingChange}
            />
          </TabContent>
        );
      case 'advanced':
        return (
          <TabContent>
            <AdvancedSettings
              settings={settings}
              onChange={handleSettingChange}
            />
          </TabContent>
        );
      case 'security':
        return (
          <TabContent>
            <SecurityPrivacySettings
              settings={settings}
              onChange={handleSettingChange}
            />
          </TabContent>
        );
      case 'business':
        return (
          <TabContent>
            {currentAgent && (
              <div className="mb-6">
                <LicenseToggle
                  agentId={agentId}
                  initialValue={currentAgent.are_licenses_allowed || false}
                  onUpdate={(newValue) => {
                    // Update the display of the licenses tab
                    if (newValue) {
                      setSettings(prev => ({ ...prev, license_slug: true }));
                    } else {
                      setSettings(prev => ({ ...prev, license_slug: false }));
                    }
                  }}
                />
              </div>
            )}
            <BusinessSettings
              settings={settings}
              onChange={handleSettingChange}
            />
          </TabContent>
        );
      case 'licenses':
        return renderLicensesTab();
      case 'embed':
        return renderEmbedTab();
      default:
        return (
          <GeneralSettings
            project={projectProp}
          />
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className={cn(
        "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
        isMobile ? "px-4 py-3" : "px-6 py-4"
      )}>
        <div className={cn(
          "flex items-center justify-between",
          isMobile && "flex-col gap-3"
        )}>
          <div className="flex items-center gap-3">
            {/* Back Button */}
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className={cn(
                  "flex-shrink-0",
                  isMobile ? "h-9 w-9" : "h-10 w-10"
                )}
              >
                <ArrowLeft className={cn(
                  isMobile ? "h-4 w-4" : "h-5 w-5"
                )} />
              </Button>
            )}
            {/* Agent Avatar */}
            <AgentAvatar 
              agent={currentAgent}
              size={isMobile ? "md" : "lg"}
              className="flex-shrink-0"
            />
            <div>
              <h1 className={cn(
                "font-semibold text-gray-900",
                isMobile ? "text-base" : "text-xl"
              )}>Agent Settings</h1>
              <p className={cn(
                "text-gray-600 mt-1",
                isMobile ? "text-xs" : "text-sm"
              )}>{agentName}</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-3",
            isMobile && "w-full justify-end"
          )}>
            {hasUnsavedChanges && !isMobile && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Unsaved changes</span>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasUnsavedChanges}
              size={isMobile ? "sm" : "default"}
            >
              <RotateCcw className={cn(
                "mr-2",
                isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
              )} />
              {!isMobile && "Reset"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              size={isMobile ? "sm" : "default"}
            >
              <Save className={cn(
                "mr-2",
                isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
              )} />
              {!isMobile && "Save Changes"}
            </Button>
          </div>
        </div>
        {hasUnsavedChanges && isMobile && (
          <div className="flex items-center gap-2 text-amber-600 mt-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs">Unsaved changes</span>
          </div>
        )}
      </div>

      <div className={cn(
        "flex-1",
        isMobile ? "flex flex-col" : "flex"
      )}>
        {/* Mobile Tab Scrollable Header */}
        {isMobile && (
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <nav className="flex min-w-full px-2 py-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    data-tab={tab.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTabChange(tab.id);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-w-fit',
                      activeTab === tab.id
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Desktop Sidebar Tabs */}
        {!isMobile && (
          <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    data-tab={tab.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTabChange(tab.id);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                      activeTab === tab.id
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border-r-2 border-brand-600 dark:border-brand-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className={cn(
            "max-w-4xl",
            isMobile ? "p-4" : "p-6"
          )}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};