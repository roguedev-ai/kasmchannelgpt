/**
 * Mobile Agent Management Component
 * 
 * Mobile-optimized agent management interface accessible from "More" menu.
 * Provides streamlined access to agent settings and management functions.
 * 
 * Features:
 * - Agent list with search
 * - Quick actions (settings, analytics)
 * - Create new agent
 * - Touch-optimized UI
 * - Bottom sheet interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  BarChart3, 
  Plus,
  Search,
  Bot,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

import type { Agent } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAgentStore } from '@/store';
import { Spinner } from '@/components/ui/loading';

interface MobileAgentManagementProps {
  /** Callback when close is requested */
  onClose?: () => void;
}

interface MobileAgentItemProps {
  agent: Agent;
  onSettingsClick: (agent: Agent) => void;
  onAnalyticsClick: (agent: Agent) => void;
}

/**
 * Mobile Agent Item Component
 * 
 * Touch-optimized agent card with quick actions
 */
const MobileAgentItem: React.FC<MobileAgentItemProps> = ({
  agent,
  onSettingsClick,
  onAnalyticsClick
}) => {
  const avatarUrl = agent.settings?.chatbot_avatar;
  const isActive = agent.is_chat_active;
  
  return (
    <div className="p-4 border border-border rounded-xl bg-card">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${agent.project_name} avatar`}
              className="w-full h-full object-cover"
            />
          ) : (
            <Bot className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        
        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate mobile-text-base">
            {agent.project_name}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isActive ? 'bg-green-500' : 'bg-gray-400'
              )} />
              <span>{isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <span>ID: {agent.id}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSettingsClick(agent)}
              className="flex-1 h-9"
            >
              <Settings className="w-4 h-4 mr-1.5" />
              Settings
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAnalyticsClick(agent)}
              className="flex-1 h-9"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Mobile Agent Management Component
 * 
 * Main component providing mobile-optimized agent management
 */
export const MobileAgentManagement: React.FC<MobileAgentManagementProps> = ({
  onClose
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    agents, 
    loading, 
    error, 
    fetchAgents, 
    loadMoreAgents,
    paginationMeta
  } = useAgentStore();
  
  // Filter agents based on search
  const filteredAgents = agents.filter(agent =>
    agent.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.id.toString().includes(searchQuery)
  );
  
  // Fetch agents on mount
  useEffect(() => {
    if (agents.length === 0) {
      fetchAgents();
    }
  }, []);
  
  const handleSettingsClick = (agent: Agent) => {
    // Navigate to project settings page
    router.push(`/projects?id=${agent.id}`);
    onClose?.();
  };
  
  const handleAnalyticsClick = (agent: Agent) => {
    // Navigate to analytics tab
    router.push(`/projects?id=${agent.id}&tab=analytics`);
    onClose?.();
  };
  
  const handleCreateAgent = () => {
    router.push('/dashboard/projects/create');
    onClose?.();
  };
  
  const handleRefresh = async () => {
    try {
      await fetchAgents();
      toast.success('Agents refreshed');
    } catch (error) {
      toast.error('Failed to refresh agents');
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Manage Agents
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn(
              'h-4 w-4',
              loading && 'animate-spin'
            )} />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-base border border-input bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && agents.length === 0 ? (
          // Loading state
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-border rounded-xl animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-muted rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Failed to load agents
            </h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              {error}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : filteredAgents.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? 'No agents found' : 'No agents yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {searchQuery 
                ? 'Try adjusting your search terms.' 
                : 'Create your first agent to get started with CustomGPT.'
              }
            </p>
          </div>
        ) : (
          // Agent list
          <>
            <div className="space-y-3">
              {filteredAgents.map((agent) => (
                <MobileAgentItem
                  key={agent.id}
                  agent={agent}
                  onSettingsClick={handleSettingsClick}
                  onAnalyticsClick={handleAnalyticsClick}
                />
              ))}
            </div>
            
            {/* Load More */}
            {paginationMeta?.hasMore && !searchQuery && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={loadMoreAgents}
                  disabled={loading}
                  variant="outline"
                  className="mobile-btn"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Load More
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Footer - Create Agent Button */}
      <div className="px-6 py-4 border-t border-border safe-area-pb">
        <Button 
          className="w-full mobile-btn touch-target" 
          onClick={handleCreateAgent}
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Agent
        </Button>
      </div>
    </div>
  );
};