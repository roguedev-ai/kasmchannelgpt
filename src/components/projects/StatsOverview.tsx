'use client';

import React, { useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  FileText, 
  Database, 
  Clock, 
  TrendingUp,
  Calendar,
  RefreshCw,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

import { useProjectSettingsStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, formatTimestamp } from '@/lib/utils';
import type { Agent } from '@/types';

interface StatsOverviewProps {
  project: Agent;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color, 
  trend 
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100',
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colorClasses[color])}>
              <Icon className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
            </div>
          </div>
          
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
          
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className={cn(
                'w-4 h-4',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )} />
              <span className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export const StatsOverview: React.FC<StatsOverviewProps> = ({ project }) => {
  const { 
    stats, 
    statsLoading, 
    statsError, 
    fetchStats 
  } = useProjectSettingsStore();

  useEffect(() => {
    fetchStats(project.id);
  }, [project.id]);

  const handleRefresh = () => {
    fetchStats(project.id);
  };

  // Use stats from store - AgentStats has different fields
  const displayStats = stats || {
    pages_found: 0,
    pages_crawled: 0,
    pages_indexed: 0,
    crawl_credits_used: 0,
    query_credits_used: 0,
    total_queries: 0,
    total_words_indexed: 0,
  };

  const statCards = [
    {
      title: 'Total Queries',
      value: displayStats.total_queries?.toLocaleString() || '0',
      description: 'User queries processed',
      icon: MessageSquare,
      color: 'blue' as const,
    },
    {
      title: 'Pages Indexed',
      value: displayStats.pages_indexed?.toLocaleString() || '0',
      description: 'Successfully indexed pages',
      icon: FileText,
      color: 'green' as const,
    },
    {
      title: 'Query Credits Used',
      value: displayStats.query_credits_used?.toLocaleString() || '0',
      description: 'Credits consumed by queries',
      icon: Users,
      color: 'purple' as const,
    },
    {
      title: 'Total Words',
      value: displayStats.total_words_indexed?.toLocaleString() || '0',
      description: 'Words in knowledge base',
      icon: Database,
      color: 'orange' as const,
    },
  ];


  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Statistics</h2>
          <p className="text-gray-600 mt-1">
            Usage analytics and performance metrics for {project.project_name}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.open('/analytics', '_blank')}
            size="sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Full Analytics
          </Button>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={statsLoading}
            size="sm"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', statsLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {statsError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading statistics</span>
          </div>
          <p className="text-red-700 mt-1 text-sm">
            Statistics features are not yet available.
          </p>
        </div>
      )}

      {/* Loading State */}
      {statsLoading && !stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                    <div className="h-6 bg-gray-200 rounded w-16" />
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-32" />
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Project Overview */}
          <Card className="p-6 bg-gradient-to-r from-brand-50 to-blue-50 border-brand-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-brand-900 mb-2">
                  Project Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-brand-600 font-medium">Created:</span>
                    <span className="text-brand-800 ml-2">{formatTimestamp(project.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-brand-600 font-medium">Last Updated:</span>
                    <span className="text-brand-800 ml-2">{formatTimestamp(project.updated_at)}</span>
                  </div>
                  <div>
                    <span className="text-brand-600 font-medium">Last Activity:</span>
                    <span className="text-brand-800 ml-2">N/A</span>
                  </div>
                </div>
              </div>
              
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-brand-600" />
              </div>
            </div>
          </Card>

          {/* Usage Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          </div>


          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => window.open('/analytics', '_blank')}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm">View Detailed Analytics</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => window.open('/sources', '_blank')}
              >
                <Database className="w-5 h-5" />
                <span className="text-sm">Manage Data Sources</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => window.open('/pages', '_blank')}
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm">Manage Content Pages</span>
              </Button>
            </div>
          </Card>

        </div>
      )}
    </div>
  );
};