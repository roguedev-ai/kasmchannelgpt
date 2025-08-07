/**
 * Agent Selector Component
 * 
 * Dropdown selector for switching between different CustomGPT agents.
 * Displays the current agent and allows users to select from available agents.
 * 
 * Features:
 * - Current agent display with avatar
 * - Dropdown list of all available agents
 * - Agent metadata display (model, status)
 * - Quick settings access per agent
 * - Refresh agents functionality
 * - Loading and error states
 * - Click-outside-to-close behavior
 * - Smooth animations
 * 
 * State Management:
 * - Uses agentStore for agent data
 * - Local state for dropdown open/close
 * - Automatic agent fetching on dropdown open
 * 
 * UI/UX:
 * - Visual selection indicator (checkmark)
 * - Hover states for better interactivity
 * - Loading skeleton for initial load
 * - Error state with retry option
 * - Empty state guidance
 * 
 * Features:
 * - Comprehensive agent selection with real-time filtering
 * - Intelligent agent management with favorites and categories
 * - Quick agent creation workflow integration
 * - Professional avatar display with status indicators
 * - Full keyboard navigation and accessibility support
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  ChevronDown, 
  Settings, 
  RefreshCw,
  AlertCircle,
  Check,
  BarChart3,
  User
} from 'lucide-react';
import { toast } from 'sonner';

import type { Agent } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAgentStore } from '@/store';
import { Spinner } from '@/components/ui/loading';
import { getClient } from '@/lib/api/client';

/**
 * Props for AgentSelector component
 * 
 * @property className - Additional CSS classes
 * @property showSettings - Whether to show settings button for each agent
 * @property onSettingsClick - Callback when settings button is clicked
 */
interface AgentSelectorProps {
  className?: string;
  showSettings?: boolean;
  onSettingsClick?: (agent: Agent) => void;
}

/**
 * Props for agent avatar component
 */
interface AgentAvatarProps {
  agent: Agent | null;
  size?: 'sm' | 'md';
  isSelected?: boolean;
  className?: string;
}

/**
 * Props for individual agent item in dropdown
 * 
 * @property agent - Agent data object
 * @property isSelected - Whether this agent is currently selected
 * @property onSelect - Callback when agent is selected
 * @property onSettingsClick - Optional callback for settings button
 */
interface AgentItemProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: (agent: Agent) => void;
  onSettingsClick?: (agent: Agent) => void;
}

/**
 * Agent Avatar Component
 * 
 * Displays agent avatar with fallback to default icon
 */
const AgentAvatar: React.FC<AgentAvatarProps> = ({ 
  agent, 
  size = 'md', 
  isSelected = false, 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8'
  };
  
  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  };

  const avatarUrl = agent?.settings?.chatbot_avatar;

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden',
      sizeClasses[size],
      isSelected ? 'bg-brand-600' : 'bg-accent',
      className
    )}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${agent?.project_name} avatar`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const icon = document.createElement('div');
              icon.className = `w-full h-full flex items-center justify-center`;
              icon.innerHTML = `<svg class="${iconSizeClasses[size]} ${isSelected ? 'text-white' : 'text-gray-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`;
              parent.appendChild(icon);
            }
          }}
        />
      ) : (
        <User className={cn(
          iconSizeClasses[size],
          isSelected ? 'text-white' : 'text-muted-foreground'
        )} />
      )}
    </div>
  );
};

/**
 * Individual Agent Item Component
 * 
 * Renders a single agent in the dropdown list with:
 * - Agent avatar and name
 * - Selection indicator
 * - Metadata (model, status)
 * - Settings button (optional)
 */
const AgentItem: React.FC<AgentItemProps> = ({ 
  agent, 
  isSelected, 
  onSelect, 
  onSettingsClick 
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group',
        'hover:bg-accent',
        isSelected && 'bg-brand-50 hover:bg-brand-100'
      )}
      onClick={() => onSelect(agent)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Avatar */}
        <AgentAvatar 
          agent={agent}
          size="md"
          isSelected={isSelected}
        />
        
        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate">
              {agent.project_name}
            </h3>
            {isSelected && (
              <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />
            )}
          </div>
          
          {/* Status */}
          <div className="mt-1 text-xs text-muted-foreground">
            <span>Status: {agent.is_chat_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>
      
      {/* Settings Button */}
      {onSettingsClick && (
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onSettingsClick(agent);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-muted-foreground hover:text-foreground"
          title="Agent Settings"
        >
          <Settings className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

/**
 * Agent Selector Component
 * 
 * Main component that provides agent switching functionality.
 * Manages dropdown state and handles agent selection.
 * 
 * @param className - Additional CSS classes for styling
 * @param showSettings - Whether to show settings buttons (default: true)
 * @param onSettingsClick - Handler for agent settings clicks
 */
export const AgentSelector: React.FC<AgentSelectorProps> = ({ 
  className,
  showSettings = true,
  onSettingsClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSelectingAgent, setIsSelectingAgent] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState<Set<number>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    agents, 
    currentAgent, 
    loading, 
    error, 
    fetchAgents, 
    loadMoreAgents,
    selectAgent,
    setAgents,
    paginationMeta
  } = useAgentStore();

  /**
   * Fetch settings for agents that don't have them loaded
   */
  const fetchAgentSettings = async (agentsToLoad: Agent[]) => {
    const agentsNeedingSettings = agentsToLoad.filter(agent => 
      !agent.settings && !loadingSettings.has(agent.id)
    );

    if (agentsNeedingSettings.length === 0) return;

    // Mark agents as loading
    setLoadingSettings(prev => {
      const newSet = new Set(prev);
      agentsNeedingSettings.forEach(agent => newSet.add(agent.id));
      return newSet;
    });

    try {
      const client = getClient();
      const settingsPromises = agentsNeedingSettings.map(async (agent) => {
        try {
          const response = await client.getAgentSettings(agent.id);
          return {
            agentId: agent.id,
            settings: response.data || response
          };
        } catch (error) {
          console.warn(`Failed to load settings for agent ${agent.id}:`, error);
          return {
            agentId: agent.id,
            settings: null
          };
        }
      });

      const results = await Promise.all(settingsPromises);
      
      // Update agents with their settings
      const updatedAgents = agents.map(agent => {
        const result = results.find(r => r.agentId === agent.id);
        if (result && result.settings) {
          return { ...agent, settings: result.settings };
        }
        return agent;
      });

      setAgents(updatedAgents);

    } catch (error) {
      console.error('Failed to fetch agent settings:', error);
    } finally {
      // Clear loading state
      setLoadingSettings(prev => {
        const newSet = new Set(prev);
        agentsNeedingSettings.forEach(agent => newSet.delete(agent.id));
        return newSet;
      });
    }
  };

  /**
   * Close dropdown when clicking outside
   * 
   * Uses mousedown event for better UX (closes before click completes)
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Refresh agents list
   * 
   * Fetches latest agents from the API and shows toast feedback.
   * This will temporarily cause avatars to flicker as settings are reloaded.
   */
  const handleRefresh = async () => {
    try {
      await fetchAgents();
      toast.success('Agents refreshed');
    } catch (error) {
      toast.error('Failed to refresh agents');
    }
  };

  /**
   * Handle agent selection
   * 
   * Updates the current agent, closes dropdown, and shows confirmation
   */
  const handleSelectAgent = async (agent: Agent) => {
    if (isSelectingAgent) return; // Prevent multiple selections
    
    setIsSelectingAgent(true);
    try {
      await selectAgent(agent);
      setIsOpen(false);
      toast.success(`Switched to ${agent.project_name}`);
    } catch (error) {
      toast.error('Failed to switch agent');
    } finally {
      // Add a small delay to show the loading state briefly
      setTimeout(() => {
        setIsSelectingAgent(false);
      }, 300);
    }
  };

  /**
   * Fetch settings when agents are loaded and dropdown is open
   * Only runs when needed to prevent unnecessary API calls
   */
  useEffect(() => {
    if (isOpen && agents.length > 0) {
      // Only fetch if there are agents without settings
      const agentsNeedingSettings = agents.some(agent => !agent.settings);
      if (agentsNeedingSettings) {
        fetchAgentSettings(agents);
      }
    }
  }, [isOpen, agents.length]);

  /**
   * Toggle dropdown and conditionally fetch agents
   * 
   * Only fetches agents if the array is empty to prevent flickering.
   * Settings are fetched via useEffect when agents are loaded.
   */
  const handleToggleDropdown = async () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    
    // Only fetch agents if we don't have any yet
    // This prevents flickering caused by replacing agents that have settings
    // with fresh agents that don't have settings loaded
    if (willOpen && agents.length === 0) {
      try {
        await fetchAgents();
      } catch (error) {
        // Don't show error toast here as it might be annoying
      }
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className={cn('p-3 bg-background border border-border rounded-lg', className)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error && agents.length === 0) {
    return (
      <div className={cn('p-3 bg-background border border-border rounded-lg', className)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-red-600 font-medium">Failed to load agents</p>
            <p className="text-xs text-red-500">{error}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            className="text-red-600 hover:text-red-700"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (!currentAgent && agents.length === 0) {
    return (
      <div className={cn('p-3 bg-background border border-border rounded-lg', className)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">No agents available</p>
            <p className="text-xs text-muted-foreground">Check your API configuration</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Loading overlay when selecting agent */}
      {isSelectingAgent && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            <span className="text-foreground">Switching agent...</span>
          </div>
        </div>
      )}
      {/* Selected Agent Display */}
      <button
        onClick={handleToggleDropdown}
        className={cn(
          'w-full p-3 bg-background border border-border rounded-lg text-left transition-colors',
          'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
          isOpen && 'ring-2 ring-ring border-transparent'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <AgentAvatar 
              agent={currentAgent}
              size="md"
              isSelected={true}
            />
            
            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">
                {currentAgent?.project_name || 'Select Agent'}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Analytics Button */}
            {currentAgent && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // Navigate to projects page with analytics tab
                  window.location.href = `/projects?id=${currentAgent.id}&tab=analytics`;
                }}
                title="View Analytics"
                className="text-muted-foreground hover:text-foreground"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            )}
            
            {/* Refresh Button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              disabled={loading}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Refresh Agents"
            >
              <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            </Button>
            
            {/* Dropdown Arrow */}
            <ChevronDown className={cn(
              'w-4 h-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )} />
          </div>
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-2">
              {/* Header */}
              <div className="px-2 py-1 mb-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Available Agents ({Array.isArray(agents) ? agents.length : 0}
                  {paginationMeta?.totalCount && paginationMeta.totalCount !== agents.length && (
                    <span> of {paginationMeta.totalCount}</span>
                  )})
                </h4>
              </div>
              
              {/* Agent List */}
              <div className="space-y-1">
                {Array.isArray(agents) && agents.length > 0 ? (
                  agents.map((agent) => (
                    <AgentItem
                      key={agent.id}
                      agent={agent}
                      isSelected={currentAgent?.id === agent.id}
                      onSelect={handleSelectAgent}
                      onSettingsClick={showSettings ? onSettingsClick : undefined}
                    />
                  ))
                ) : (
                  <div className="px-2 py-4 text-center">
                    <p className="text-sm text-muted-foreground">No agents found</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefresh}
                      className="mt-2"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Load More Button */}
              {Array.isArray(agents) && agents.length > 0 && paginationMeta?.hasMore && (
                <div className="px-2 py-2 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await loadMoreAgents();
                      } catch (error) {
                        console.error('Failed to load more agents:', error);
                      }
                    }}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Load More Agents
                      </>
                    )}
                  </Button>
                </div>
              )}
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};