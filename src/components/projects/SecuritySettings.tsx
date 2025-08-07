'use client';

import React, { useEffect, useState } from 'react';
import { 
  Shield,
  Eye,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Clock,
  Zap,
  Trash2,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';

interface SecurityConfig {
  anti_hallucination: {
    enabled: boolean;
    strictness_level: 'low' | 'medium' | 'high' | 'strict';
    custom_prompts: string[];
  };
  agent_visibility: {
    public: boolean;
    discoverable: boolean;
    require_authentication: boolean;
    allowed_domains: string[];
  };
  recaptcha: {
    enabled: boolean;
    site_key?: string;
    secret_key?: string;
    threshold: number;
  };
  whitelisted_domains: string[];
  blacklisted_domains: string[];
  rate_limiting: {
    enabled: boolean;
    requests_per_minute: number;
    requests_per_hour: number;
    block_duration_minutes: number;
  };
  data_retention: {
    conversation_retention_days: number;
    analytics_retention_days: number;
    auto_delete_enabled: boolean;
  };
}

interface SecuritySettingsProps {
  project: Agent;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ project }) => {
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);


  useEffect(() => {
    loadSecurityConfig();
  }, [project.id]);

  const loadSecurityConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      // Initialize with default security configuration
      setConfig({
        anti_hallucination: {
          enabled: true,
          strictness_level: 'medium',
          custom_prompts: []
        },
        agent_visibility: {
          public: false,
          discoverable: false,
          require_authentication: true,
          allowed_domains: []
        },
        recaptcha: {
          enabled: false,
          threshold: 0.5
        },
        whitelisted_domains: [],
        blacklisted_domains: [],
        rate_limiting: {
          enabled: true,
          requests_per_minute: 60,
          requests_per_hour: 1000,
          block_duration_minutes: 15
        },
        data_retention: {
          conversation_retention_days: 30,
          analytics_retention_days: 90,
          auto_delete_enabled: false
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load security configuration';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadSecurityConfig();
  };

  const handleUpdateConfig = (updates: Partial<SecurityConfig>) => {
    if (!config) return;
    
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    setIsModified(true);
  };

  const handleSave = async () => {
    if (!config || !isModified) return;

    setSettingsLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Security settings updated successfully');
      setIsModified(false);
    } catch (err) {
      toast.error('Failed to update security settings');
    } finally {
      setSettingsLoading(false);
    }
  };


  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
          <p className="text-gray-600 mt-1">
            Configure security, access control, and data protection for {project.project_name}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
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
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading security settings</span>
          </div>
          <p className="text-red-700 mt-1 text-sm">{error}</p>
          {error.includes('403') && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="text-yellow-800">
                <strong>Premium Feature:</strong> Advanced security features may require a premium subscription.
              </p>
            </div>
          )}
        </div>
      )}

      {loading && !config ? (
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : config ? (
        <div className="space-y-6">
          {/* Anti-Hallucination */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Anti-Hallucination</h3>
                  <p className="text-sm text-gray-600">Prevent AI from generating false or misleading information</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                POST /projects/{project.id}/security
              </span>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={config.anti_hallucination.enabled}
                  onChange={(e) => handleUpdateConfig({
                    anti_hallucination: {
                      ...config.anti_hallucination,
                      enabled: e.target.checked
                    }
                  })}
                />
                <span className="text-sm font-medium text-gray-900">Enable anti-hallucination protection</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Strictness Level
                </label>
                <select 
                  value={config.anti_hallucination.strictness_level}
                  onChange={(e) => handleUpdateConfig({
                    anti_hallucination: {
                      ...config.anti_hallucination,
                      strictness_level: e.target.value as any
                    }
                  })}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="low">Low - Minimal restrictions</option>
                  <option value="medium">Medium - Balanced approach</option>
                  <option value="high">High - Strict filtering</option>
                  <option value="strict">Strict - Maximum protection</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Custom Safety Prompts
                </label>
                <div className="space-y-2">
                  {config.anti_hallucination.custom_prompts.map((prompt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={prompt}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        readOnly
                      />
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline">Add Safety Prompt</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Agent Visibility */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Agent Visibility</h3>
                  <p className="text-sm text-gray-600">Control who can access and discover your agent</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                POST /projects/{project.id}/security
              </span>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={config.agent_visibility.public}
                  onChange={(e) => handleUpdateConfig({
                    agent_visibility: {
                      ...config.agent_visibility,
                      public: e.target.checked
                    }
                  })}
                />
                <span className="text-sm font-medium text-gray-900">Make agent publicly accessible</span>
              </label>

              <label className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={config.agent_visibility.discoverable}
                  onChange={(e) => handleUpdateConfig({
                    agent_visibility: {
                      ...config.agent_visibility,
                      discoverable: e.target.checked
                    }
                  })}
                />
                <span className="text-sm font-medium text-gray-900">Allow discovery in search engines</span>
              </label>

              <label className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={config.agent_visibility.require_authentication}
                  onChange={(e) => handleUpdateConfig({
                    agent_visibility: {
                      ...config.agent_visibility,
                      require_authentication: e.target.checked
                    }
                  })}
                />
                <span className="text-sm font-medium text-gray-900">Require user authentication</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Allowed Domains
                </label>
                <div className="space-y-2">
                  {config.agent_visibility.allowed_domains.map((domain, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={domain}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        readOnly
                      />
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline">Add Domain</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* reCAPTCHA */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">reCAPTCHA Protection</h3>
                  <p className="text-sm text-gray-600">Protect against bots and automated abuse</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                POST /projects/{project.id}/security
              </span>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={config.recaptcha.enabled}
                  onChange={(e) => handleUpdateConfig({
                    recaptcha: {
                      ...config.recaptcha,
                      enabled: e.target.checked
                    }
                  })}
                />
                <span className="text-sm font-medium text-gray-900">Enable reCAPTCHA protection</span>
              </label>

              {config.recaptcha.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Site Key
                    </label>
                    <input 
                      type="text"
                      value={config.recaptcha.site_key || ''}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="6Lc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Score Threshold (0.0 - 1.0)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.recaptcha.threshold}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Lower values are more restrictive (0.5 recommended)
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Rate Limiting */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Rate Limiting</h3>
                  <p className="text-sm text-gray-600">Control request frequency to prevent abuse</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                POST /projects/{project.id}/security
              </span>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={config.rate_limiting.enabled}
                  onChange={(e) => handleUpdateConfig({
                    rate_limiting: {
                      ...config.rate_limiting,
                      enabled: e.target.checked
                    }
                  })}
                />
                <span className="text-sm font-medium text-gray-900">Enable rate limiting</span>
              </label>

              {config.rate_limiting.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Requests per minute
                    </label>
                    <input 
                      type="number"
                      value={config.rate_limiting.requests_per_minute}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Requests per hour
                    </label>
                    <input 
                      type="number"
                      value={config.rate_limiting.requests_per_hour}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Block duration (minutes)
                    </label>
                    <input 
                      type="number"
                      value={config.rate_limiting.block_duration_minutes}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Data Retention */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Data Retention</h3>
                  <p className="text-sm text-gray-600">Configure how long data is stored</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                POST /projects/{project.id}/security
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Conversation retention (days)
                  </label>
                  <input 
                    type="number"
                    value={config.data_retention.conversation_retention_days}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Analytics retention (days)
                  </label>
                  <input 
                    type="number"
                    value={config.data_retention.analytics_retention_days}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={config.data_retention.auto_delete_enabled}
                  onChange={(e) => handleUpdateConfig({
                    data_retention: {
                      ...config.data_retention,
                      auto_delete_enabled: e.target.checked
                    }
                  })}
                />
                <span className="text-sm font-medium text-gray-900">Enable automatic data deletion</span>
              </label>
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
      ) : null}
    </div>
  );
};