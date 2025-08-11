import { create } from 'zustand';
import { getClient } from '@/lib/api/client';
import { toast } from 'sonner';

export interface AnalyticsData {
  conversations: {
    total: number;
    active: number;
    trend: number;
    data: Array<{
      date: string;
      count: number;
    }>;
  };
  queries: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
    topQueries: Array<{
      query: string;
      count: number;
    }>;
    data: Array<{
      date: string;
      count: number;
    }>;
  };
  traffic: {
    uniqueUsers: number;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
    data: Array<{
      date: string;
      users: number;
      pageViews: number;
    }>;
  };
  statistics: {
    totalMessages: number;
    totalConversations: number;
    avgMessagesPerConversation: number;
    satisfactionRate: number;
    responseAccuracy: number;
  };
}

interface AnalyticsState {
  analytics: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  
  // Actions
  fetchAnalytics: (projectId: number) => Promise<void>;
  setDateRange: (startDate: string, endDate: string) => void;
  exportAnalytics: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
  reset: () => void;
}

// Helper function to format dates for API
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get default date range (last 30 days)
const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  analytics: null,
  loading: false,
  error: null,
  dateRange: getDefaultDateRange(),

  fetchAnalytics: async (projectId: number) => {
    set({ loading: true, error: null });
    
    try {
      const client = getClient();
      
      // Fetch all reports data in parallel using documented endpoints
      const [trafficReport, queriesReport, conversationsReport, analysisReport] = await Promise.all([
        client.getTrafficReport(projectId),
        client.getQueriesReport(projectId),
        client.getConversationsReport(projectId),
        client.getAnalysisReport(projectId, 'daily'),
      ]);

      // Transform the data to match our interface using actual API response structure
      // Handle cases where API returns empty arrays instead of numbers
      const conversationsTotal = Array.isArray(conversationsReport.data?.total) ? 0 : (conversationsReport.data?.total || 0);
      const queriesTotal = Array.isArray(queriesReport.data?.total) ? 0 : (queriesReport.data?.total || 0);
      const avgQueriesPerConv = Array.isArray(conversationsReport.data?.average_queries_per_conversation) 
        ? 0 
        : (Number(conversationsReport.data?.average_queries_per_conversation) || 0);

      const analyticsData: AnalyticsData = {
        conversations: {
          total: conversationsTotal,
          active: Math.floor(conversationsTotal * 0.7), // Estimate active conversations
          trend: 0, // Calculate trend from data if needed
          data: Array.isArray(analysisReport.data?.conversations) 
            ? analysisReport.data.conversations.map((item: any) => ({
                date: item.created_at_interval,
                count: Number(item.queries_number) || 0,
              }))
            : [],
        },
        queries: {
          total: queriesTotal,
          successful: Array.isArray(queriesReport.data?.query_status) 
            ? (queriesReport.data.query_status.find((s: any) => s.status === 'success')?.count || 0)
            : 0,
          failed: Array.isArray(queriesReport.data?.query_status)
            ? (queriesReport.data.query_status.find((s: any) => s.status === 'failed')?.count || 0)
            : 0,
          avgResponseTime: 0, // Not provided by API
          topQueries: [], // Not provided by these endpoints
          data: Array.isArray(analysisReport.data?.queries)
            ? analysisReport.data.queries.map((item: any) => ({
                date: item.created_at_interval,
                count: Number(item.queries_number) || 0,
              }))
            : [],
        },
        traffic: {
          uniqueUsers: Array.isArray(trafficReport.data?.sources)
            ? trafficReport.data.sources.reduce((acc: number, source: any) => acc + (source.request_source_number || 0), 0)
            : 0,
          pageViews: Array.isArray(trafficReport.data?.sources)
            ? trafficReport.data.sources.reduce((acc: number, source: any) => acc + (source.request_source_number || 0), 0)
            : 0,
          avgSessionDuration: 0, // Not provided by API
          bounceRate: 0, // Not provided by API
          data: Array.isArray(trafficReport.data?.sources)
            ? trafficReport.data.sources.map((source: any) => ({
                date: new Date().toISOString().split('T')[0], // Current date as traffic report doesn't have dates
                users: source.request_source_number || 0,
                pageViews: source.request_source_number || 0,
              }))
            : [],
        },
        statistics: {
          totalMessages: queriesTotal,
          totalConversations: conversationsTotal,
          avgMessagesPerConversation: avgQueriesPerConv,
          satisfactionRate: 0, // Not provided by API
          responseAccuracy: 0, // Not provided by API
        },
      };

      set({ analytics: analyticsData, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      
      let errorMessage = 'Failed to fetch analytics';
      if (error.status === 401) {
        const deploymentMode = typeof window !== 'undefined' ? localStorage.getItem('customgpt.deploymentMode') : 'production';
        const isDemoMode = deploymentMode === 'demo';
        if (isDemoMode) {
          errorMessage = 'API key authentication failed. Please check your API key.';
          toast.error('Authentication failed. Please check your API key in demo settings.');
        } else {
          errorMessage = 'Authentication required. Please check your API key configuration.';
          toast.error('Authentication failed. Please check your API key configuration.');
        }
      } else if (error.status === 404) {
        errorMessage = 'Analytics data not found for this project.';
        toast.error('No analytics data available yet.');
      } else if (error.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to fetch analytics data');
      }
      
      set({ 
        analytics: null,
        error: errorMessage,
        loading: false,
      });
    }
  },

  setDateRange: (startDate: string, endDate: string) => {
    set({ dateRange: { startDate, endDate } });
  },

  exportAnalytics: async (format: 'csv' | 'json' | 'pdf') => {
    const analytics = get().analytics;
    if (!analytics) {
      toast.error('No analytics data to export');
      return;
    }

    try {
      // Implementation would depend on the format
      switch (format) {
        case 'json':
          const jsonData = JSON.stringify(analytics, null, 2);
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-${new Date().toISOString()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Analytics exported successfully');
          break;
          
        case 'csv':
          // Would need a CSV conversion library or custom implementation
          toast.info('CSV export not yet implemented');
          break;
          
        case 'pdf':
          // Would need a PDF generation library
          toast.info('PDF export not yet implemented');
          break;
      }
    } catch (error) {
      console.error('Failed to export analytics:', error);
      toast.error('Failed to export analytics');
    }
  },

  reset: () => {
    set({
      analytics: null,
      loading: false,
      error: null,
      dateRange: getDefaultDateRange(),
    });
  },
}));