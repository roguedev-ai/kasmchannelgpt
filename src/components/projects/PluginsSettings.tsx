'use client';

import React, { useEffect, useState } from 'react';
import { Plug, Power, AlertCircle, RefreshCw, Settings, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';

import { useProjectSettingsStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plugin Settings</h2>
          <p className="text-gray-600 mt-1">
            Extend your agent's capabilities with plugins and integrations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={pluginsLoading}
            size="sm"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', pluginsLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {pluginsError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading plugin settings</span>
          </div>
          <p className="text-red-700 mt-1 text-sm">
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
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  About Plugins
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Plugins extend your agent's capabilities by integrating with external services and adding new functionality. 
                  Enable only the plugins you need to keep your agent focused and performant.
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
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
            <Card key={category} className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
              
              <div className="space-y-4">
                {(categoryPlugins as any[]).map((plugin: any) => (
                  <div 
                    key={plugin.id}
                    className={cn(
                      "flex items-start gap-4 p-4 border rounded-lg transition-colors",
                      plugin.enabled 
                        ? "border-green-200 bg-green-50" 
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <Plug className="w-6 h-6 text-brand-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{plugin.name}</h4>
                        {plugin.enabled && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Enabled
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
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
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePlugin(plugin.id, !plugin.enabled)}
                          className={cn(
                            plugin.enabled 
                              ? "text-red-600 hover:text-red-700 hover:bg-red-50" 
                              : "text-green-600 hover:text-green-700 hover:bg-green-50"
                          )}
                        >
                          <Power className="w-4 h-4 mr-2" />
                          {plugin.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        
                        {plugin.enabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <Settings className="w-4 h-4 mr-2" />
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
          <Card className="p-6 bg-gray-50 border-gray-200">
            <div className="text-center">
              <Plug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                More Plugins Coming Soon
              </h3>
              <p className="text-gray-600 mb-4">
                We're constantly adding new plugins and integrations to extend your agent's capabilities. 
                Stay tuned for updates!
              </p>
              
              <div className="flex justify-center gap-3">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Browse Plugin Marketplace
                </Button>
                
                <Button variant="outline" size="sm">
                  Request a Plugin
                </Button>
              </div>
            </div>
          </Card>

          {/* Developer Info */}
          <Card className="p-6 bg-purple-50 border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">
              Custom Plugin Development
            </h3>
            
            <p className="text-sm text-purple-800 mb-4">
              Need a custom plugin for your specific use case? Our plugin API allows you to create 
              custom integrations and extend your agent's functionality.
            </p>
            
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                <ExternalLink className="w-4 h-4 mr-2" />
                Plugin API Documentation
              </Button>
              
              <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100">
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