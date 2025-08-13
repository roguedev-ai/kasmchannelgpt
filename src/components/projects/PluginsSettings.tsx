'use client';

import React, { useEffect, useState } from 'react';
import { Plug, Power, AlertCircle, RefreshCw, Settings, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';

import { useProjectSettingsStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import type { Agent } from '@/types';

interface PluginsSettingsProps {
  project: Agent;
}

export const PluginsSettings: React.FC<PluginsSettingsProps> = ({ project }) => {
  const { 
    plugins, 
    pluginsLoading, 
    pluginsError, 
    fetchPlugins, 
    updatePlugin 
  } = useProjectSettingsStore();
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    fetchPlugins(project.id);
  }, [project.id]);

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      await updatePlugin(project.id, pluginId, enabled);
    } catch (error) {
      console.error('Failed to update plugin:', error);
    }
  };

  const handleRefresh = () => {
    fetchPlugins(project.id);
  };

  // Use plugins from store
  const displayPlugins = plugins;
  
  // Group plugins by category
  const pluginsByCategory = (displayPlugins as any[]).reduce((acc, plugin) => {
    const category = plugin.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(plugin);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className={cn(
      "mx-auto",
      isMobile ? "p-4 max-w-full" : "p-6 max-w-4xl"
    )}>
      {/* Header */}
      <div className={cn(
        "flex justify-between mb-6",
        isMobile ? "flex-col gap-4" : "items-center"
      )}>
        <div>
          <h2 className={cn(
            "font-bold text-gray-900",
            isMobile ? "text-xl" : "text-2xl"
          )}>Plugin Settings</h2>
          <p className={cn(
            "text-gray-600 mt-1",
            isMobile && "text-sm"
          )}>
            Extend your agent&apos;s capabilities with plugins and integrations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={pluginsLoading}
            size={isMobile ? "default" : "sm"}
            className={isMobile ? "w-full" : ""}
          >
            <RefreshCw className={cn(
              'mr-2',
              isMobile ? "w-4 h-4" : "w-4 h-4",
              pluginsLoading && 'animate-spin'
            )} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {pluginsError && (
        <div className={cn(
          "mb-6 bg-red-50 border border-red-200 rounded-lg",
          isMobile ? "p-3" : "p-4"
        )}>
          <div className={cn(
            "flex items-center gap-2 text-red-800",
            isMobile && "text-sm"
          )}>
            <AlertCircle className={cn(
              isMobile ? "w-4 h-4" : "w-5 h-5"
            )} />
            <span className="font-medium">Error loading plugin settings</span>
          </div>
          <p className={cn(
            "text-red-700 mt-1",
            isMobile ? "text-xs" : "text-sm"
          )}>
            Plugin features are not yet available.
          </p>
        </div>
      )}

      {/* Loading State */}
      {pluginsLoading && plugins.length === 0 ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
                <div className="w-12 h-6 bg-gray-200 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : displayPlugins.length > 0 ? (
        <div className="space-y-6">
          {/* Info Card */}
          <Card className={cn(
            "bg-blue-50 border-blue-200",
            isMobile ? "p-4" : "p-6"
          )}>
            <div className={cn(
              "flex gap-3",
              isMobile ? "flex-col" : "items-start"
            )}>
              <Info className={cn(
                "text-blue-600 flex-shrink-0",
                isMobile ? "w-5 h-5" : "w-6 h-6 mt-1"
              )} />
              <div>
                <h3 className={cn(
                  "font-semibold text-blue-900 mb-2",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  About Plugins
                </h3>
                <p className={cn(
                  "text-blue-800 mb-3",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Plugins extend your agent&apos;s capabilities by integrating with external services and adding new functionality. 
                  Enable only the plugins you need to keep your agent focused and performant.
                </p>
                <ul className={cn(
                  "text-blue-800 space-y-1",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  <li>• Some plugins may require additional configuration</li>
                  <li>• Enabled plugins may affect response time</li>
                  <li>• Plugin availability depends on your subscription plan</li>
                  <li>• Changes take effect immediately</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Plugin Categories */}
          {Object.entries(pluginsByCategory).map(([category, categoryPlugins]) => (
            <Card key={category} className={isMobile ? "p-4" : "p-6"}>
              <h3 className={cn(
                "font-semibold text-gray-900 mb-4",
                isMobile ? "text-base" : "text-lg"
              )}>{category}</h3>
              
              <div className="space-y-4">
                {(categoryPlugins as any[]).map((plugin: any) => (
                  <div 
                    key={plugin.id}
                    className={cn(
                      "flex gap-4 border rounded-lg transition-colors",
                      isMobile ? "flex-col p-3" : "items-start p-4",
                      plugin.enabled 
                        ? "border-green-200 bg-green-50" 
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    {!isMobile && (
                      <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <Plug className="w-6 h-6 text-brand-600" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isMobile && (
                          <Plug className="w-4 h-4 text-brand-600 flex-shrink-0" />
                        )}
                        <h4 className={cn(
                          "font-semibold text-gray-900",
                          isMobile && "text-sm"
                        )}>{plugin.name}</h4>
                        {plugin.enabled && (
                          <span className={cn(
                            "px-2 py-1 bg-green-100 text-green-800 rounded-full",
                            isMobile ? "text-xs" : "text-xs"
                          )}>
                            Enabled
                          </span>
                        )}
                      </div>
                      
                      <p className={cn(
                        "text-gray-600 mb-3",
                        isMobile ? "text-xs" : "text-sm"
                      )}>
                        {plugin.description}
                      </p>
                      
                      {plugin.settings && Object.keys(plugin.settings).length > 0 && (
                        <div className="mb-3">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                              View Configuration
                            </summary>
                            <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-xs">
                              <pre className="text-gray-600">
                                {JSON.stringify(plugin.settings, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      )}
                      
                      <div className={cn(
                        "flex gap-2",
                        isMobile ? "flex-col" : "items-center"
                      )}>
                        <Button
                          variant="outline"
                          size={isMobile ? "default" : "sm"}
                          onClick={() => handleTogglePlugin(plugin.id, !plugin.enabled)}
                          className={cn(
                            isMobile && "w-full h-10 touch-target",
                            plugin.enabled 
                              ? "text-red-600 hover:text-red-700 hover:bg-red-50" 
                              : "text-green-600 hover:text-green-700 hover:bg-green-50"
                          )}
                        >
                          <Power className={cn(
                            "mr-2",
                            isMobile ? "w-4 h-4" : "w-4 h-4"
                          )} />
                          {plugin.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        
                        {plugin.enabled && (
                          <Button
                            variant="ghost"
                            size={isMobile ? "default" : "sm"}
                            className={cn(
                              "text-gray-600 hover:text-gray-700",
                              isMobile && "w-full h-10 touch-target"
                            )}
                          >
                            <Settings className={cn(
                              "mr-2",
                              isMobile ? "w-4 h-4" : "w-4 h-4"
                            )} />
                            Configure
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* Plugin Marketplace */}
          <Card className={cn(
            "bg-gray-50 border-gray-200",
            isMobile ? "p-4" : "p-6"
          )}>
            <div className="text-center">
              <Plug className={cn(
                "text-gray-400 mx-auto mb-4",
                isMobile ? "w-10 h-10" : "w-12 h-12"
              )} />
              <h3 className={cn(
                "font-semibold text-gray-900 mb-2",
                isMobile ? "text-base" : "text-lg"
              )}>
                More Plugins Coming Soon
              </h3>
              <p className={cn(
                "text-gray-600 mb-4",
                isMobile && "text-sm"
              )}>
                We&apos;re constantly adding new plugins and integrations to extend your agent&apos;s capabilities. 
                Stay tuned for updates!
              </p>
              
              <div className={cn(
                "flex gap-3",
                isMobile ? "flex-col" : "justify-center"
              )}>
                <Button 
                  variant="outline" 
                  size={isMobile ? "default" : "sm"}
                  className={isMobile ? "w-full h-11 touch-target" : ""}
                >
                  <ExternalLink className={cn(
                    "mr-2",
                    isMobile ? "w-4 h-4" : "w-4 h-4"
                  )} />
                  Browse Plugin Marketplace
                </Button>
                
                <Button 
                  variant="outline" 
                  size={isMobile ? "default" : "sm"}
                  className={isMobile ? "w-full h-11 touch-target" : ""}
                >
                  Request a Plugin
                </Button>
              </div>
            </div>
          </Card>

          {/* Developer Info */}
          <Card className={cn(
            "bg-purple-50 border-purple-200",
            isMobile ? "p-4" : "p-6"
          )}>
            <h3 className={cn(
              "font-semibold text-purple-900 mb-3",
              isMobile ? "text-base" : "text-lg"
            )}>
              Custom Plugin Development
            </h3>
            
            <p className={cn(
              "text-purple-800 mb-4",
              isMobile ? "text-xs" : "text-sm"
            )}>
              Need a custom plugin for your specific use case? Our plugin API allows you to create 
              custom integrations and extend your agent&apos;s functionality.
            </p>
            
            <div className={cn(
              "flex gap-3",
              isMobile ? "flex-col" : ""
            )}>
              <Button 
                variant="outline" 
                size={isMobile ? "default" : "sm"} 
                className={cn(
                  "border-purple-300 text-purple-700 hover:bg-purple-100",
                  isMobile && "w-full h-11 touch-target"
                )}
              >
                <ExternalLink className={cn(
                  "mr-2",
                  isMobile ? "w-4 h-4" : "w-4 h-4"
                )} />
                Plugin API Documentation
              </Button>
              
              <Button 
                variant="outline" 
                size={isMobile ? "default" : "sm"} 
                className={cn(
                  "border-purple-300 text-purple-700 hover:bg-purple-100",
                  isMobile && "w-full h-11 touch-target"
                )}
              >
                Developer Examples
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* No plugins available */}
          <Card className="p-6 bg-gray-50 border-gray-200">
            <div className="text-center">
              <Plug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Plugins Available
              </h3>
              <p className="text-gray-600">
                Plugin features are not yet available. Check back later for updates.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};