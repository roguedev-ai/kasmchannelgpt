'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Bot,
  Users,
  MessageSquare,
  Calendar,
  Globe,
  Lock,
  Settings,
  BarChart3,
  Copy,
  Edit3,
  Trash2,
  ExternalLink,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Clock,
  Code,
  Link
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAgentStore } from '@/store/agents';
import type { Agent, AgentStats } from '@/types';
import { useRouter } from 'next/navigation';

interface ExtendedAgent extends Agent {
  stats?: AgentStats;
  isLoadingStats?: boolean;
}

interface AgentCardProps {
  agent: ExtendedAgent;
  onEdit: (agent: ExtendedAgent) => void;
  onDelete: (agent: ExtendedAgent) => void;
  onToggleStatus: (agent: ExtendedAgent) => void;
  onViewAnalytics: (agent: ExtendedAgent) => void;
  onReplicate: (agent: ExtendedAgent) => void;
  onViewEmbed: (agent: ExtendedAgent) => void;
  onViewShareLink: (agent: ExtendedAgent) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewAnalytics,
  onReplicate,
  onViewEmbed,
  onViewShareLink
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatus = () => {
    if (!agent.is_chat_active) return 'inactive';
    if (agent.type === 'SITEMAP' && agent.stats && agent.stats.pages_crawled < agent.stats.pages_found) {
      return 'processing';
    }
    return 'active';
  };

  const status = getStatus();
  
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    inactive: { color: 'bg-gray-100 text-gray-800', icon: Pause },
    processing: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot className="h-5 w-5 text-brand-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">{agent.project_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                statusConfig[status].color
              )}>
                <StatusIcon className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              {agent.is_shared && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Globe className="h-3 w-3" />
                  Public
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent text-foreground">
                {agent.type}
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="absolute right-0 top-8 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50"
              >
                <div className="py-1">
                  <button
                    onClick={() => { onEdit(agent); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Agent
                  </button>
                  <button
                    onClick={() => { onViewAnalytics(agent); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    <BarChart3 className="h-4 w-4" />
                    View Analytics
                  </button>
                  <button
                    onClick={() => { onReplicate(agent); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    <Copy className="h-4 w-4" />
                    Replicate
                  </button>
                  <button
                    onClick={() => { onToggleStatus(agent); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    {agent.is_chat_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {agent.is_chat_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => { onDelete(agent); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-accent rounded-lg">
          <div className="text-lg font-semibold text-foreground">
            {agent.stats?.total_queries?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Total Queries
          </div>
        </div>
        <div className="text-center p-3 bg-accent rounded-lg">
          <div className="text-lg font-semibold text-foreground">
            {agent.stats?.pages_indexed?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Pages Indexed
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-2 mb-4">
        {agent.stats && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pages Crawled</span>
              <span className="text-sm font-medium text-foreground">
                {agent.stats.pages_crawled}/{agent.stats.pages_found}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Credits Used</span>
              <span className="text-sm font-medium text-foreground">
                {(agent.stats.crawl_credits_used + agent.stats.query_credits_used).toLocaleString()}
              </span>
            </div>
          </>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Type</span>
          <span className="text-sm font-medium text-gray-900">{agent.type}</span>
        </div>
        {agent.type === 'SITEMAP' && agent.sitemap_path && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Sitemap</span>
            <a 
              href={agent.sitemap_path} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              View
            </a>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Licenses</span>
          <span className="text-sm font-medium text-gray-900">
            {agent.are_licenses_allowed ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        {agent.updated_at && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(agent.updated_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      
      {/* Additional Actions */}
      {(agent.shareable_link || agent.embed_code) && (
        <div className="flex gap-2 mb-4">
          {agent.shareable_link && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewShareLink(agent)}
              className="flex-1 h-7 text-xs"
            >
              <Link className="h-3 w-3 mr-1" />
              Share Link
            </Button>
          )}
          {agent.embed_code && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewEmbed(agent)}
              className="flex-1 h-7 text-xs"
            >
              <Code className="h-3 w-3 mr-1" />
              Embed
            </Button>
          )}
        </div>
      )}

      {/* Expandable Details Section */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border space-y-2"
          >
            <h4 className="text-sm font-medium text-foreground mb-2">Additional Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">User ID:</span>
                <span className="ml-2 font-medium text-foreground">{agent.user_id}</span>
              </div>
              <div>
                <span className="text-gray-600">Team ID:</span>
                <span className="ml-2 font-medium text-foreground">{agent.team_id}</span>
              </div>
              {agent.shareable_slug && (
                <div className="col-span-2">
                  <span className="text-gray-600">Shareable Slug:</span>
                  <span className="ml-2 font-medium text-foreground">{agent.shareable_slug}</span>
                </div>
              )}
              {agent.live_chat_code && (
                <div className="col-span-2">
                  <span className="text-gray-600">Live Chat Code:</span>
                  <code className="ml-2 text-xs bg-accent px-2 py-1 rounded font-mono">
                    {agent.live_chat_code}
                  </code>
                </div>
              )}
              {agent.deleted_at && (
                <div className="col-span-2">
                  <span className="text-gray-600">Deleted At:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {new Date(agent.deleted_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          Created {new Date(agent.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-7 px-2 text-xs"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(agent)}
            className="h-7 px-2 text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const AgentManagement: React.FC = () => {
  const router = useRouter();
  const { agents, loading, error, fetchAgents, deleteAgent, replicateAgent, updateAgent, getAgentStats } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'processing'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'id'>('created');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [extendedAgents, setExtendedAgents] = useState<ExtendedAgent[]>([]);
  const [showShareModal, setShowShareModal] = useState<ExtendedAgent | null>(null);
  const [showEmbedModal, setShowEmbedModal] = useState<ExtendedAgent | null>(null);
  
  useEffect(() => {
    fetchAgents();
  }, []);
  
  // Load stats for each agent
  useEffect(() => {
    const loadStats = async () => {
      const agentsWithStats = await Promise.all(
        agents.map(async (agent) => {
          try {
            const stats = await getAgentStats(agent.id);
            return { ...agent, stats } as ExtendedAgent;
          } catch (err) {
            console.error(`Failed to load stats for agent ${agent.id}:`, err);
            return agent as ExtendedAgent;
          }
        })
      );
      setExtendedAgents(agentsWithStats);
    };
    
    if (agents.length > 0) {
      loadStats();
    }
  }, [agents]);

  const getAgentStatus = (agent: ExtendedAgent) => {
    if (!agent.is_chat_active) return 'inactive';
    if (agent.type === 'SITEMAP' && agent.stats && agent.stats.pages_crawled < agent.stats.pages_found) {
      return 'processing';
    }
    return 'active';
  };

  const filteredAgents = extendedAgents.filter(agent => {
    const matchesSearch = agent.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || getAgentStatus(agent) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateAgent = () => {
    router.push('/dashboard/projects/create');
  };

  const handleEditAgent = (agent: ExtendedAgent) => {
    router.push(`/dashboard/projects/${agent.id}/settings`);
  };

  const handleDeleteAgent = async (agent: ExtendedAgent) => {
    if (confirm(`Are you sure you want to delete "${agent.project_name}"?`)) {
      try {
        await deleteAgent(agent.id);
        toast.success(`Agent "${agent.project_name}" deleted successfully`);
      } catch (err) {
        console.error('Failed to delete agent:', err);
        toast.error('Failed to delete agent. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (agent: ExtendedAgent) => {
    // Note: API doesn't support toggling is_chat_active directly
    // This would need to be done through agent settings
    router.push(`/dashboard/projects/${agent.id}/settings`);
  };

  const handleViewAnalytics = (agent: ExtendedAgent) => {
    router.push(`/dashboard/projects/${agent.id}/analytics`);
  };

  const handleReplicate = async (agent: ExtendedAgent) => {
    try {
      const newAgent = await replicateAgent(agent.id);
      toast.success(`Agent "${agent.project_name}" replicated successfully as "${newAgent.project_name}"`);
    } catch (err) {
      console.error('Failed to replicate agent:', err);
      toast.error('Failed to replicate agent. Please try again.');
    }
  };
  
  const handleViewShareLink = (agent: ExtendedAgent) => {
    setShowShareModal(agent);
  };
  
  const handleViewEmbed = (agent: ExtendedAgent) => {
    setShowEmbedModal(agent);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage your AI agents</p>
        </div>
        <Button onClick={handleCreateAgent} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-80 bg-background text-foreground"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-background text-foreground"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="processing">Processing</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-background text-foreground"
          >
            <option value="created">Created Date</option>
            <option value="name">Name</option>
            <option value="id">ID</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{extendedAgents.length}</p>
              <p className="text-sm text-muted-foreground">Total Agents</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{extendedAgents.filter(a => getAgentStatus(a) === 'active').length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{extendedAgents.filter(a => a.is_shared).length}</p>
              <p className="text-sm text-muted-foreground">Public Agents</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {extendedAgents.reduce((sum, a) => sum + (a.stats?.total_queries || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Queries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
            <p className="text-muted-foreground">Loading agents...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Error loading agents</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => fetchAgents()}>Try Again</Button>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No agents found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first agent to get started'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button onClick={handleCreateAgent}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Agent
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        )}>
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEditAgent}
              onDelete={handleDeleteAgent}
              onToggleStatus={handleToggleStatus}
              onViewAnalytics={handleViewAnalytics}
              onReplicate={handleReplicate}
              onViewShareLink={handleViewShareLink}
              onViewEmbed={handleViewEmbed}
            />
          ))}
        </div>
      )}
      
      {/* Share Link Modal */}
      {showShareModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-background rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Share Link</h3>
            <p className="text-muted-foreground mb-4">Share this link to give others access to your agent:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={showShareModal.shareable_link || ''}
                readOnly
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-accent text-foreground"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(showShareModal.shareable_link || '');
                  alert('Link copied to clipboard!');
                }}
              >
                Copy
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowShareModal(null)}
            >
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
      
      {/* Embed Code Modal */}
      {showEmbedModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEmbedModal(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-background rounded-lg p-6 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Embed Code</h3>
            <p className="text-muted-foreground mb-4">Add this code to your website to embed the agent:</p>
            <textarea
              value={showEmbedModal.embed_code || ''}
              readOnly
              rows={10}
              className="w-full px-3 py-2 border border-border rounded-lg bg-accent font-mono text-sm text-foreground"
            />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(showEmbedModal.embed_code || '');
                  alert('Code copied to clipboard!');
                }}
                className="flex-1"
              >
                Copy Code
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmbedModal(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};