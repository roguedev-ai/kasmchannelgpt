'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart3,
  TrendingUp,
  Users,
  MessageCircle,
  Globe,
  RefreshCw,
  AlertCircle,
  Activity,
  Loader2,
  PieChart,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SimpleSelect } from '@/components/ui/simple-select';
import { cn } from '@/lib/utils';
import { getClient, isClientInitialized } from '@/lib/api/client';
import type { Agent } from '@/types';
import type { 
  TrafficSource, 
  QueryStatus,
  AnalysisDataPoint,
  AnalysisInterval
} from '@/types/reports.types';

interface ReportsData {
  traffic: TrafficSource[];
  queries: {
    total: number;
    query_status: QueryStatus[];
  };
  conversations: {
    total: number;
    average_queries_per_conversation: number | string;
  };
  analysis: {
    queries: AnalysisDataPoint[];
    conversations: AnalysisDataPoint[];
    queries_per_conversation: AnalysisDataPoint[];
  };
}

interface ReportsAnalyticsProps {
  project: Agent;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ project }) => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<AnalysisInterval>('weekly');
  const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'analysis'>('overview');

  useEffect(() => {
    loadReports();
  }, [project.id, interval]);

  const loadReports = async () => {
    if (!isClientInitialized()) {
      setError('API client not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = getClient();
      
      // Fetch all reports in parallel
      const [trafficResponse, queriesResponse, conversationsResponse, analysisResponse] = await Promise.all([
        client.getTrafficReport(project.id),
        client.getQueriesReport(project.id),
        client.getConversationsReport(project.id),
        client.getAnalysisReport(project.id, interval)
      ]);

      console.log('Analytics API responses:', {
        traffic: trafficResponse,
        queries: queriesResponse,
        conversations: conversationsResponse,
        analysis: analysisResponse
      });

      // Handle different API response formats - some endpoints return arrays instead of numbers
      const processedData = {
        traffic: Array.isArray(trafficResponse.data.sources) ? trafficResponse.data.sources : [],
        queries: {
          total: Array.isArray(queriesResponse.data.total) ? 0 : (queriesResponse.data.total || 0),
          query_status: Array.isArray(queriesResponse.data.query_status) ? queriesResponse.data.query_status : []
        },
        conversations: {
          total: Array.isArray(conversationsResponse.data.total) ? 0 : (conversationsResponse.data.total || 0),
          average_queries_per_conversation: Array.isArray(conversationsResponse.data.average_queries_per_conversation) 
            ? 0 
            : (conversationsResponse.data.average_queries_per_conversation || 0)
        },
        analysis: {
          queries: Array.isArray(analysisResponse.data.queries) ? analysisResponse.data.queries : [],
          conversations: Array.isArray(analysisResponse.data.conversations) ? analysisResponse.data.conversations : [],
          queries_per_conversation: Array.isArray(analysisResponse.data.queries_per_conversation) 
            ? analysisResponse.data.queries_per_conversation 
            : []
        }
      };

      setData(processedData);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      
      let errorMessage = 'Failed to load analytics reports';
      if (err.status === 400) {
        errorMessage = 'Invalid request. Please check the project ID.';
      } else if (err.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.status === 404) {
        errorMessage = 'Project not found.';
      } else if (err.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadReports();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success':
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-accent text-foreground';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports & Analytics</h2>
          <p className="text-muted-foreground mt-1">
            View traffic, queries, and conversation metrics for {project.project_name}
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
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading reports</span>
          </div>
          <p className="text-red-700 mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-1 bg-accent rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'traffic', label: 'Traffic Sources', icon: Globe },
            { id: 'analysis', label: 'Time Analysis', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-3" />
              <div className="h-8 bg-muted rounded w-16" />
            </Card>
          ))}
        </div>
      ) : data ? (
        // Check if we have any data at all
        data.queries.total === 0 && data.conversations.total === 0 && data.traffic.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <PieChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Analytics Data Yet</h3>
              <p className="text-muted-foreground">
                Analytics data will appear here once your agent starts receiving traffic and conversations.
              </p>
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="mt-4"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
            </div>
          </div>
        ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Queries</p>
                      <p className="text-2xl font-bold text-foreground">
                        {data.queries.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                      <p className="text-2xl font-bold text-foreground">
                        {data.conversations.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Queries/Conversation</p>
                      <p className="text-2xl font-bold text-foreground">
                        {typeof data.conversations.average_queries_per_conversation === 'number' 
                          ? data.conversations.average_queries_per_conversation.toFixed(2)
                          : Number(data.conversations.average_queries_per_conversation || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Query Status Breakdown */}
              {data.queries.query_status.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Query Status Breakdown</h3>
                  <div className="space-y-3">
                    {data.queries.query_status.map((status) => {
                      const percentage = data.queries.total > 0 
                        ? (status.count / data.queries.total * 100).toFixed(1)
                        : '0';
                      
                      return (
                        <div key={status.status} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn(
                                'text-sm font-medium px-2 py-1 rounded',
                                getStatusColor(status.status)
                              )}>
                                {status.status}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {status.count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={cn(
                                  'h-2 rounded-full',
                                  status.status === 'failed' ? 'bg-red-500' : 'bg-green-500'
                                )}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Traffic Sources Tab */}
          {activeTab === 'traffic' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Traffic Sources</h3>
              {data.traffic.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No traffic data available</p>
              ) : (
                <div className="space-y-4">
                  {data.traffic.map((source) => {
                    const total = data.traffic.reduce((sum, s) => sum + s.request_source_number, 0);
                    const percentage = total > 0 
                      ? (source.request_source_number / total * 100).toFixed(1)
                      : '0';
                    
                    return (
                      <div key={source.request_source} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-brand-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground capitalize">
                              {source.request_source}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {source.request_source_number} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-brand-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Time Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Interval Selector */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Time-based Analysis</h3>
                <SimpleSelect
                  value={interval}
                  onValueChange={(value) => setInterval(value as AnalysisInterval)}
                  options={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ]}
                  className="w-32"
                />
              </div>

              {/* Queries Over Time */}
              <Card className="p-6">
                <h4 className="font-medium text-foreground mb-4">Queries Over Time</h4>
                {data.analysis.queries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No query data available</p>
                ) : (
                  <div className="h-48 flex items-end justify-between gap-1">
                    {data.analysis.queries.map((point, index) => {
                      const maxQueries = Math.max(...data.analysis.queries.map(p => Number(p.queries_number || 0)));
                      const height = maxQueries > 0 ? (Number(point.queries_number || 0) / maxQueries) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="relative group w-full">
                            <div 
                              className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                              style={{ height: `${height}%`, minHeight: '4px' }}
                            />
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-white text-xs rounded py-1 px-2 mt-1 whitespace-nowrap z-10">
                              {point.queries_number} queries
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground mt-2 rotate-45 origin-left">
                            {point.created_at_interval}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Conversations Over Time */}
              <Card className="p-6">
                <h4 className="font-medium text-foreground mb-4">Conversations Over Time</h4>
                {data.analysis.conversations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No conversation data available</p>
                ) : (
                  <div className="h-48 flex items-end justify-between gap-1">
                    {data.analysis.conversations.map((point, index) => {
                      const maxConversations = Math.max(...data.analysis.conversations.map(p => Number(p.queries_number || 0)));
                      const height = maxConversations > 0 ? (Number(point.queries_number || 0) / maxConversations) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="relative group w-full">
                            <div 
                              className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                              style={{ height: `${height}%`, minHeight: '4px' }}
                            />
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-white text-xs rounded py-1 px-2 mt-1 whitespace-nowrap z-10">
                              {point.queries_number} conversations
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground mt-2 rotate-45 origin-left">
                            {point.created_at_interval}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Average Queries per Conversation */}
              <Card className="p-6">
                <h4 className="font-medium text-foreground mb-4">Average Queries per Conversation</h4>
                {data.analysis.queries_per_conversation.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No data available</p>
                ) : (
                  <div className="h-48 flex items-end justify-between gap-1">
                    {data.analysis.queries_per_conversation.map((point, index) => {
                      const maxAvg = Math.max(...data.analysis.queries_per_conversation.map(p => Number(p.queries_number || 0)));
                      const height = maxAvg > 0 ? (Number(point.queries_number || 0) / maxAvg) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="relative group w-full">
                            <div 
                              className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors"
                              style={{ height: `${height}%`, minHeight: '4px' }}
                            />
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-white text-xs rounded py-1 px-2 mt-1 whitespace-nowrap z-10">
                              {Number(point.queries_number || 0).toFixed(2)} avg
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground mt-2 rotate-45 origin-left">
                            {point.created_at_interval}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
        )
      ) : null}
    </div>
  );
};