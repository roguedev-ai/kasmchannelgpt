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
import { useBreakpoint } from '@/hooks/useMediaQuery';
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
  const { isMobile } = useBreakpoint();
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
    <div 
      className={cn(
        "max-w-4xl mx-auto",
        isMobile ? "p-4 mobile-px" : "p-6"
      )}
      style={isMobile ? { touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' } : {}}
    >
      {/* Header */}
      <div className={cn(
        "mb-6",
        isMobile ? "flex-col gap-4" : "flex items-center justify-between"
      )}>
        <div className={isMobile ? "w-full" : ""}>
          <h2 className={cn(
            "font-bold text-foreground",
            isMobile ? "text-xl mobile-text-xl" : "text-2xl"
          )}>Security Settings</h2>
          <p className={cn(
            "text-muted-foreground mt-1",
            isMobile ? "text-sm mobile-text-sm" : ""
          )}>
            Configure security, access control, and data protection for {project.project_name}
          </p>
        </div>
        
        <div className={cn(
          "flex gap-3",
          isMobile ? "w-full grid grid-cols-2 gap-2 mt-4" : "items-center"
        )}>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            size="sm"
            className={isMobile ? "h-9 px-3 text-sm" : ""}
          >
            <RefreshCw className={cn('w-4 h-4 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!isModified || settingsLoading}
            size="sm"
            className={isMobile ? "h-9 px-3 text-sm" : ""}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {settingsLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading security settings</span>
          </div>
          <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{error}</p>
          {error.includes('403') && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
              <p className="text-yellow-700 dark:text-yellow-400">
                <strong>Premium Feature:</strong> Advanced security features may require a premium subscription.
              </p>
            </div>
          )}
        </div>
      )}

      {loading && !config ? (
        <div className={cn(
          "space-y-6",
          isMobile && "space-y-4"
        )}>
          {[...Array(4)].map((_, i) => (
            <Card key={i} className={cn(
              "animate-pulse",
              isMobile ? "p-4 mobile-px mobile-py" : "p-6"
            )}>
              <div className="h-4 bg-muted rounded w-1/4 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : config ? (
        <div className={cn(
          "space-y-6",
          isMobile && "space-y-4"
        )}>
          {/* Anti-Hallucination */}
          <Card className={cn(
            isMobile ? "p-4 mobile-px mobile-py" : "p-6"
          )}>
            <div className={cn(
              "mb-4",
              isMobile ? "flex-col gap-3" : "flex items-start justify-between"
            )}>
              <div className={cn(
                "flex items-center gap-3",
                isMobile && "mb-2"
              )}>
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className={cn(
                    "font-semibold text-foreground",
                    isMobile ? "text-base mobile-text-lg" : "text-lg"
                  )}>Anti-Hallucination</h3>
                  <p className={cn(
                    "text-muted-foreground",
                    isMobile ? "text-xs mobile-text-sm" : "text-sm"
                  )}>Prevent AI from generating false or misleading information</p>
                </div>
              </div>
              {!isMobile && (
                <span className="text-xs text-muted-foreground font-mono bg-accent px-2 py-1 rounded">
                  POST /projects/{project.id}/security
                </span>
              )}
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
                  className={isMobile ? "touch-target" : ""}
                />
                <span className={cn(
                  "font-medium text-foreground",
                  isMobile ? "text-sm mobile-text-base" : "text-sm"
                )}>Enable anti-hallucination protection</span>
              </label>

              <div>
                <label className={cn(
                  "block font-medium text-foreground mb-2",
                  isMobile ? "text-sm mobile-text-base" : "text-sm"
                )}>
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
                  className={cn(
                    "border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                    isMobile ? "w-full px-4 py-3 text-base mobile-input" : "px-3 py-2"
                  )}
                >
                  <option value="low">Low - Minimal restrictions</option>
                  <option value="medium">Medium - Balanced approach</option>
                  <option value="high">High - Strict filtering</option>
                  <option value="strict">Strict - Maximum protection</option>
                </select>
              </div>

              <div>
                <label className={cn(
                  "block font-medium text-foreground mb-2",
                  isMobile ? "text-sm mobile-text-base" : "text-sm"
                )}>
                  Custom Safety Prompts
                </label>
                <div className="space-y-2">
                  {config.anti_hallucination.custom_prompts.map((prompt, index) => (
                    <div key={index} className={cn(
                      "flex items-center gap-2",
                      isMobile && "flex-col gap-2"
                    )}>
                      <input 
                        type="text"
                        value={prompt}
                        className={cn(
                          "border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                          isMobile ? "w-full px-4 py-3 text-base mobile-input" : "flex-1 px-3 py-2"
                        )}
                        readOnly
                      />
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className={isMobile ? "h-8 px-3 text-xs w-full" : ""}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {isMobile ? 'Remove' : ''}
                      </Button>
                    </div>
                  ))}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={isMobile ? "w-full h-8 px-3 text-xs" : ""}
                  >
                    Add Safety Prompt
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Agent Visibility */}
          <Card className={cn(
            isMobile ? "p-4 mobile-px mobile-py" : "p-6"
          )}>
            <div className={cn(
              "mb-4",
              isMobile ? "flex-col gap-3" : "flex items-start justify-between"
            )}>
              <div className={cn(
                "flex items-center gap-3",
                isMobile && "mb-2"
              )}>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className={cn(
                    "font-semibold text-foreground",
                    isMobile ? "text-base mobile-text-lg" : "text-lg"
                  )}>Agent Visibility</h3>
                  <p className={cn(
                    "text-muted-foreground",
                    isMobile ? "text-xs mobile-text-sm" : "text-sm"
                  )}>Control who can access and discover your agent</p>
                </div>
              </div>
              {!isMobile && (
                <span className="text-xs text-muted-foreground font-mono bg-accent px-2 py-1 rounded">
                  POST /projects/{project.id}/security
                </span>
              )}
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
                  className={isMobile ? "touch-target" : ""}
                />
                <span className={cn(
                  "font-medium text-foreground",
                  isMobile ? "text-sm mobile-text-base" : "text-sm"
                )}>Make agent publicly accessible</span>
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
                  className={isMobile ? "touch-target" : ""}
                />
                <span className={cn(
                  "font-medium text-foreground",
                  isMobile ? "text-sm mobile-text-base" : "text-sm"
                )}>Allow discovery in search engines</span>
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
                  className={isMobile ? "touch-target" : ""}
                />
                <span className={cn(
                  "font-medium text-foreground",
                  isMobile ? "text-sm mobile-text-base" : "text-sm"
                )}>Require user authentication</span>
              </label>

              <div>
                <label className={cn(
                  "block font-medium text-foreground mb-2",
                  isMobile ? "text-sm mobile-text-base" : "text-sm"
                )}>
                  Allowed Domains
                </label>
                <div className="space-y-2">
                  {config.agent_visibility.allowed_domains.map((domain, index) => (
                    <div key={index} className={cn(
                      "flex items-center gap-2",
                      isMobile && "flex-col gap-2"
                    )}>
                      <input 
                        type="text"
                        value={domain}
                        className={cn(
                          "border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                          isMobile ? "w-full px-4 py-3 text-base mobile-input" : "flex-1 px-3 py-2"
                        )}
                        readOnly
                      />
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className={isMobile ? "h-8 px-3 text-xs w-full" : ""}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {isMobile ? 'Remove' : ''}
                      </Button>
                    </div>
                  ))}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={isMobile ? "w-full h-8 px-3 text-xs" : ""}
                  >
                    Add Domain
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* reCAPTCHA */}
          <Card className={cn(
            isMobile ? "p-4 mobile-px mobile-py" : "p-6"
          )}>
            <div className={cn(
              "mb-4",
              isMobile ? "flex-col gap-3" : "flex items-start justify-between"
            )}>
              <div className={cn(
                "flex items-center gap-3",
                isMobile && "mb-2"
              )}>
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className={cn(
                    "font-semibold text-foreground",
                    isMobile ? "text-base mobile-text-lg" : "text-lg"
                  )}>reCAPTCHA Protection</h3>
                  <p className={cn(
                    "text-muted-foreground",
                    isMobile ? "text-xs mobile-text-sm" : "text-sm"
                  )}>Protect against bots and automated abuse</p>
                </div>
              </div>
              {!isMobile && (
                <span className="text-xs text-muted-foreground font-mono bg-accent px-2 py-1 rounded">
                  POST /projects/{project.id}/security
                </span>
              )}
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
                  className={isMobile ? "touch-target" : ""}
                />
                <span className={cn(
                  "font-medium text-foreground",
                  isMobile ? "text-sm mobile-text-base" : "text-sm"
                )}>Enable reCAPTCHA protection</span>
              </label>

              {config.recaptcha.enabled && (
                <>
                  <div>
                    <label className={cn(
                      "block font-medium text-foreground mb-2",
                      isMobile ? "text-sm mobile-text-base" : "text-sm"
                    )}>
                      Site Key
                    </label>
                    <input 
                      type="text"
                      value={config.recaptcha.site_key || ''}
                      className={cn(
                        "w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                        isMobile ? "px-4 py-3 text-base mobile-input" : "px-3 py-2"
                      )}
                      placeholder="6Lc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className={cn(
                      "block font-medium text-foreground mb-2",
                      isMobile ? "text-sm mobile-text-base" : "text-sm"
                    )}>
                      Score Threshold (0.0 - 1.0)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.recaptcha.threshold}
                      className={cn(
                        "border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                        isMobile ? "w-full px-4 py-3 text-base mobile-input" : "px-3 py-2"
                      )}
                    />
                    <p className={cn(
                      "text-muted-foreground mt-1",
                      isMobile ? "text-xs mobile-text-sm" : "text-xs"
                    )}>
                      Lower values are more restrictive (0.5 recommended)
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Rate Limiting */}
          <Card className={cn(
            isMobile ? "p-4 mobile-px mobile-py" : "p-6"
          )}>
            <div className={cn(
              "mb-4",
              isMobile ? "flex-col gap-3" : "flex items-start justify-between"
            )}>
              <div className={cn(
                "flex items-center gap-3",
                isMobile && "mb-2"
              )}>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className={cn(
                    "font-semibold text-foreground",
                    isMobile ? "text-base mobile-text-lg" : "text-lg"
                  )}>Rate Limiting</h3>
                  <p className={cn(
                    "text-muted-foreground",
                    isMobile ? "text-xs mobile-text-sm" : "text-sm"
                  )}>Control request frequency to prevent abuse</p>
                </div>
              </div>
              {!isMobile && (
                <span className="text-xs text-muted-foreground font-mono bg-accent px-2 py-1 rounded">
                  POST /projects/{project.id}/security
                </span>
              )}
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
                  className={isMobile ? "touch-target" : ""}
                />
                <span className={cn(
                  "font-medium text-foreground",
                  isMobile ? "text-sm mobile-text-base" : "text-sm"
                )}>Enable rate limiting</span>
              </label>

              {config.rate_limiting.enabled && (
                <div className={cn(
                  "gap-4",
                  isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-3"
                )}>
                  <div>
                    <label className={cn(
                      "block font-medium text-foreground mb-2",
                      isMobile ? "text-sm mobile-text-base" : "text-sm"
                    )}>
                      Requests per minute
                    </label>
                    <input 
                      type="number"
                      value={config.rate_limiting.requests_per_minute}
                      className={cn(
                        "w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                        isMobile ? "px-4 py-3 text-base mobile-input" : "px-3 py-2"
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn(
                      "block font-medium text-foreground mb-2",
                      isMobile ? "text-sm mobile-text-base" : "text-sm"
                    )}>
                      Requests per hour
                    </label>
                    <input 
                      type="number"
                      value={config.rate_limiting.requests_per_hour}
                      className={cn(
                        "w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                        isMobile ? "px-4 py-3 text-base mobile-input" : "px-3 py-2"
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn(
                      "block font-medium text-foreground mb-2",
                      isMobile ? "text-sm mobile-text-base" : "text-sm"
                    )}>
                      Block duration (minutes)
                    </label>
                    <input 
                      type="number"
                      value={config.rate_limiting.block_duration_minutes}
                      className={cn(
                        "w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                        isMobile ? "px-4 py-3 text-base mobile-input" : "px-3 py-2"
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Data Retention */}
          <Card className={cn(
            isMobile ? "p-4 mobile-px mobile-py" : "p-6"
          )}>
            <div className={cn(
              "mb-4",
              isMobile ? "flex-col gap-3" : "flex items-start justify-between"
            )}>
              <div className={cn(
                "flex items-center gap-3",
                isMobile && "mb-2"
              )}>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className={cn(
                    "font-semibold text-foreground",
                    isMobile ? "text-base mobile-text-lg" : "text-lg"
                  )}>Data Retention</h3>
                  <p className={cn(
                    "text-muted-foreground",
                    isMobile ? "text-xs mobile-text-sm" : "text-sm"
                  )}>Configure how long data is stored</p>
                </div>
              </div>
              {!isMobile && (
                <span className="text-xs text-muted-foreground font-mono bg-accent px-2 py-1 rounded">
                  POST /projects/{project.id}/security
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className={cn(
                "gap-4",
                isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2"
              )}>
                <div>
                  <label className={cn(
                    "block font-medium text-foreground mb-2",
                    isMobile ? "text-sm mobile-text-base" : "text-sm"
                  )}>
                    Conversation retention (days)
                  </label>
                  <input 
                    type="number"
                    value={config.data_retention.conversation_retention_days}
                    className={cn(
                      "w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                      isMobile ? "px-4 py-3 text-base mobile-input" : "px-3 py-2"
                    )}
                  />
                </div>

                <div>
                  <label className={cn(
                    "block font-medium text-foreground mb-2",
                    isMobile ? "text-sm mobile-text-base" : "text-sm"
                  )}>
                    Analytics retention (days)
                  </label>
                  <input 
                    type="number"
                    value={config.data_retention.analytics_retention_days}
                    className={cn(
                      "w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-background text-foreground",
                      isMobile ? "px-4 py-3 text-base mobile-input" : "px-3 py-2"
                    )}
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
                  className={isMobile ? "touch-target" : ""}
                />
                <span className={cn(
                  "font-medium text-foreground",
                  isMobile ? "text-sm mobile-text-base" : "text-sm"
                )}>Enable automatic data deletion</span>
              </label>
            </div>
          </Card>

          {/* Save Button at Bottom */}
          <div className={cn(
            "flex mt-6",
            isMobile ? "justify-center" : "justify-end"
          )}>
            <Button
              onClick={handleSave}
              disabled={!isModified || settingsLoading}
              size="sm"
              className={isMobile ? "h-9 px-6 text-sm" : ""}
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