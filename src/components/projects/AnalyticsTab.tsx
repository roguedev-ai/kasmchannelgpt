'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock,
  Download,
  RefreshCw,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';

import { useAnalyticsStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Analytics visualization components
import { LineChart } from '@/components/analytics/LineChart';
import { BarChart } from '@/components/analytics/BarChart';
import { MetricCard } from '@/components/analytics/MetricCard';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';

interface AnalyticsTabProps {
  agentId: number;
  agentName: string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ agentId, agentName }) => {
  const { 
    analytics, 
    loading, 
    error, 
    fetchAnalytics, 
    exportAnalytics,
    setDateRange,
    dateRange 
  } = useAnalyticsStore();

  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('json');

  // Fetch analytics when component mounts or date range changes
  useEffect(() => {
    if (agentId) {
      fetchAnalytics(agentId);
    }
  }, [agentId, dateRange, fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics(agentId);
    toast.success('Analytics refreshed');
  };

  const handleExport = () => {
    exportAnalytics(exportFormat);
    toast.success(`Analytics exported as ${exportFormat.toUpperCase()}`);
  };

  // Loading state
  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Analytics Overview</h3>
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-9 w-32 bg-gray-200 rounded" />
            <div className="h-9 w-24 bg-gray-200 rounded" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-48 bg-gray-200 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Analytics Overview</h3>
        </div>
        
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900">Error loading analytics</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-medium">Analytics Overview</h3>
        
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          
          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
            
            <Button
              size="sm"
              onClick={handleExport}
              disabled={!analytics}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Conversations"
              value={analytics.conversations.total}
              trend={analytics.conversations.trend}
              icon={MessageSquare}
              color="blue"
            />
            
            <MetricCard
              title="Total Queries"
              value={analytics.queries.total}
              trend={
                analytics.queries.successful > 0 
                  ? (analytics.queries.successful / analytics.queries.total) * 100
                  : 0
              }
              icon={BarChart3}
              color="green"
              suffix={`${Math.round((analytics.queries.successful / (analytics.queries.total || 1)) * 100)}% success`}
            />
            
            <MetricCard
              title="Unique Users"
              value={analytics.traffic.uniqueUsers}
              icon={Users}
              color="purple"
            />
            
            <MetricCard
              title="Avg Response Time"
              value={`${analytics.queries.avgResponseTime}s`}
              icon={Clock}
              color="orange"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Conversations Over Time */}
            <Card className="p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Conversations Over Time
              </h4>
              <LineChart
                data={analytics.conversations.data}
                xKey="date"
                yKey="count"
                color="#3B82F6"
              />
            </Card>

            {/* Queries Over Time */}
            <Card className="p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Queries Over Time
              </h4>
              <LineChart
                data={analytics.queries.data}
                xKey="date"
                yKey="count"
                color="#10B981"
              />
            </Card>
          </div>

          {/* Top Queries */}
          <Card className="p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Top Queries
            </h4>
            <BarChart
              data={analytics.queries.topQueries.slice(0, 10)}
              xKey="query"
              yKey="count"
              color="#8B5CF6"
            />
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-semibold mt-1">
                    {((analytics.queries.successful / (analytics.queries.total || 1)) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className={cn(
                  "p-2 rounded-full",
                  analytics.queries.successful / analytics.queries.total > 0.8 
                    ? "bg-green-100 text-green-600" 
                    : "bg-yellow-100 text-yellow-600"
                )}>
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Messages/Conversation</p>
                  <p className="text-2xl font-semibold mt-1">
                    {analytics.statistics.avgMessagesPerConversation.toFixed(1)}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Page Views</p>
                  <p className="text-2xl font-semibold mt-1">
                    {analytics.traffic.pageViews}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};