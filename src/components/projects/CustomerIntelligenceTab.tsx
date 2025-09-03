'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Brain,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  MapPin,
  Globe,
  MessageSquare,
  Heart,
  Target,
  Chrome,
  Laptop,
  ThumbsUp,
  ThumbsDown,
  Meh,
  BarChart3,
  TrendingUp,
  Users,
  MessageCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  X,
  FileText,
  Copy,
  Clock,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { proxyClient } from '@/lib/api/proxy-client';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SimpleSelect } from '@/components/ui/simple-select';
import { cn } from '@/lib/utils';
import type { CustomerIntelligenceItem, CustomerIntelligenceResponse } from '@/types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useBreakpoint } from '@/hooks/useMediaQuery';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Area, AreaChart
} from 'recharts';

interface CustomerIntelligenceTabProps {
  agentId: number;
  agentName: string;
}

// Color palette for charts
const COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  tertiary: '#f59e0b',
  quaternary: '#ec4899'
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 150) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Advanced filter interface
interface AdvancedFilters {
  emotion: string;
  intent: string;
  feedback: string;
  language: string;
  deployment: string;
  browser: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  contentSource: string;
  location: string;
}

export const CustomerIntelligenceTab: React.FC<CustomerIntelligenceTabProps> = ({ agentId, agentName }) => {
  const { isMobile, isTablet } = useBreakpoint();
  const [data, setData] = useState<CustomerIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  
  const [selectedFilters, setSelectedFilters] = useState<AdvancedFilters>({
    emotion: 'all',
    intent: 'all',
    feedback: 'all',
    language: 'all',
    deployment: 'all',
    browser: 'all',
    dateRange: {
      start: null,
      end: null
    },
    contentSource: 'all',
    location: ''
  });

  // Quick date range presets
  const dateRangePresets = [
    { label: 'Today', value: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
    { label: 'Last 7 days', value: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
    { label: 'Last 30 days', value: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
    { label: 'Last 90 days', value: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
    { label: 'All time', value: () => ({ start: null, end: null }) }
  ];

  // Fetch customer intelligence data
  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Format dates for API (YYYY-MM-DD format)
      const startDate = selectedFilters.dateRange.start 
        ? format(selectedFilters.dateRange.start, 'yyyy-MM-dd')
        : undefined;
      const endDate = selectedFilters.dateRange.end 
        ? format(selectedFilters.dateRange.end, 'yyyy-MM-dd') 
        : undefined;
      
      const response = await proxyClient.getCustomerIntelligence(agentId, page, 100, startDate, endDate);
      
      logger.info('CUSTOMER_INTELLIGENCE', 'Data fetched', {
        agentId,
        page,
        startDate,
        endDate,
        total: response.data.total
      });
      
      setData(response);
      setCurrentPage(page);
    } catch (error: any) {
      logger.error('CUSTOMER_INTELLIGENCE', 'Failed to fetch data', error);
      
      let errorMessage = 'Failed to load customer intelligence data';
      if (error.status === 404) {
        errorMessage = 'Agent not found or you don\'t have access to it';
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please check your API key';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [agentId, currentPage]);

  // Reset to page 1 when date range changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchData(1);
    }
  }, [selectedFilters.dateRange.start, selectedFilters.dateRange.end]);

  const handleRefresh = () => {
    fetchData(currentPage);
    toast.success('Customer intelligence data refreshed');
  };

  const handleExport = () => {
    if (!data) return;
    
    const csvData = convertToCSV(filteredData);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-intelligence-${agentName}-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  const convertToCSV = (items: CustomerIntelligenceItem[]) => {
    const headers = [
      'Prompt ID',
      'Conversation ID',
      'User Query',
      'AI Response',
      'Created At',
      'Content Source',
      'User Emotion',
      'User Intent',
      'Language',
      'Feedback',
      'User Location',
      'Deployment',
      'Browser'
    ];
    
    const rows = items.map(item => [
      item.prompt_id,
      item.conversation_id,
      `"${item.user_query.replace(/"/g, '""')}"`,
      `"${item.ai_response.replace(/"/g, '""')}"`,
      item.created_at,
      item.content_source,
      item.user_emotion,
      item.user_intent,
      item.language,
      item.feedback,
      item.user_location,
      item.chatbot_deployment,
      item.browser
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'positive':
      case 'happy':
        return <Heart className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'negative':
      case 'frustrated':
        return <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'neutral':
      default:
        return <Meh className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getFeedbackIcon = (feedback: string) => {
    switch (feedback.toLowerCase()) {
      case 'positive':
        return <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'negative':
        return <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Meh className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const toggleItemExpansion = (promptId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Filter data based on all criteria
  const filteredData = useMemo(() => {
    if (!data?.data.data) return [];
    
    return data.data.data.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.user_query.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ai_response.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilters = 
        (selectedFilters.emotion === 'all' || item.user_emotion === selectedFilters.emotion) &&
        (selectedFilters.intent === 'all' || item.user_intent === selectedFilters.intent) &&
        (selectedFilters.feedback === 'all' || item.feedback === selectedFilters.feedback) &&
        (selectedFilters.language === 'all' || item.language === selectedFilters.language) &&
        (selectedFilters.deployment === 'all' || item.chatbot_deployment === selectedFilters.deployment) &&
        (selectedFilters.browser === 'all' || item.browser === selectedFilters.browser) &&
        (selectedFilters.contentSource === 'all' || item.content_source === selectedFilters.contentSource) &&
        (selectedFilters.location === '' || item.user_location?.toLowerCase().includes(selectedFilters.location.toLowerCase()));
      
      // Note: Date range filtering is now handled by the API
      return matchesSearch && matchesFilters;
    });
  }, [data, searchQuery, selectedFilters]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!filteredData.length) return null;

    // Emotion distribution
    const emotionCounts = filteredData.reduce((acc, item) => {
      acc[item.user_emotion] = (acc[item.user_emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const emotionData = Object.entries(emotionCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: Math.round((value / filteredData.length) * 100)
    }));

    // Intent distribution
    const intentCounts = filteredData.reduce((acc, item) => {
      acc[item.user_intent] = (acc[item.user_intent] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const intentData = Object.entries(intentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

    // Language distribution
    const languageCounts = filteredData.reduce((acc, item) => {
      acc[item.language] = (acc[item.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const languageData = Object.entries(languageCounts).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));

    // Feedback sentiment
    const feedbackCounts = filteredData.reduce((acc, item) => {
      acc[item.feedback] = (acc[item.feedback] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalFeedback = Object.values(feedbackCounts).reduce((a, b) => a + b, 0);
    const sentimentScore = totalFeedback > 0
      ? Math.round(((feedbackCounts.positive || 0) / totalFeedback) * 100)
      : 0;

    // Time-based trends (last 7 days)
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      return {
        date: format(date, 'MMM dd'),
        dateObj: startOfDay(date),
        count: 0
      };
    });

    filteredData.forEach(item => {
      const itemDate = startOfDay(new Date(item.created_at));
      const dayData = last7Days.find(day => 
        itemDate.getTime() === day.dateObj.getTime()
      );
      if (dayData) {
        dayData.count++;
      }
    });

    return {
      totalConversations: filteredData.length,
      sentimentScore,
      emotionData,
      intentData,
      languageData,
      feedbackCounts,
      trendsData: last7Days.map(({ date, count }) => ({ date, count }))
    };
  }, [filteredData]);

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    if (!data?.data.data) return {
      intents: [],
      contentSources: [],
      locations: [],
      browsers: [],
      deployments: []
    };

    const items = data.data.data;
    return {
      intents: [...new Set(items.map(item => item.user_intent))].filter(Boolean),
      contentSources: [...new Set(items.map(item => item.content_source))].filter(Boolean),
      locations: [...new Set(items.map(item => item.user_location))].filter(Boolean),
      browsers: [...new Set(items.map(item => item.browser))].filter(Boolean),
      deployments: [...new Set(items.map(item => item.chatbot_deployment))].filter(Boolean)
    };
  }, [data]);

  // Loading state
  if (loading && !data) {
    return (
      <div className={cn(
        "max-w-7xl mx-auto overflow-hidden",
        isMobile ? "p-4" : "p-6"
      )}>
        <div className={cn(
          "mb-6",
          isMobile ? "flex-col gap-4" : "flex items-center justify-between"
        )}>
          <div className={isMobile ? "w-full" : ""}>
            <h2 className={cn(
              "font-bold text-foreground",
              isMobile ? "text-xl" : "text-2xl"
            )}>Customer Intelligence</h2>
            <p className={cn(
              "text-muted-foreground mt-1",
              isMobile ? "text-sm" : ""
            )}>
              Advanced analytics and insights about user interactions
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Summary cards skeleton */}
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"
          )}>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              </Card>
            ))}
          </div>
          
          {/* Charts skeleton */}
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
          )}>
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn(
        "max-w-7xl mx-auto overflow-hidden",
        isMobile ? "p-4" : "p-6"
      )}>
        <div className={cn(
          "mb-6",
          isMobile ? "flex-col gap-4" : "flex items-center justify-between"
        )}>
          <div className={isMobile ? "w-full" : ""}>
            <h2 className={cn(
              "font-bold text-foreground",
              isMobile ? "text-xl" : "text-2xl"
            )}>Customer Intelligence</h2>
            <p className={cn(
              "text-muted-foreground mt-1",
              isMobile ? "text-sm" : ""
            )}>
              Advanced analytics and insights about user interactions
            </p>
          </div>
        </div>
        
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-100">Error loading data</h4>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(currentPage)}
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
    <div className={cn(
      "max-w-7xl mx-auto overflow-hidden",
      isMobile ? "p-4" : "p-6"
    )}>
      {/* Header with controls */}
      <div className={cn(
        "mb-6",
        isMobile ? "flex-col gap-4" : "flex items-center justify-between"
      )}>
        <div className={isMobile ? "w-full" : ""}>
          <h2 className={cn(
            "font-bold text-foreground",
            isMobile ? "text-xl" : "text-2xl"
          )}>Customer Intelligence</h2>
          <p className={cn(
            "text-muted-foreground mt-1",
            isMobile ? "text-sm" : ""
          )}>
            Advanced analytics and insights about user interactions
          </p>
        </div>
        
        <div className={cn(
          "flex gap-3",
          isMobile ? "w-full flex flex-wrap gap-2 mt-4" : "items-center"
        )}>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
            className={cn(
              isMobile ? "h-9 px-3 text-sm flex-1" : "",
              showFilters && "bg-brand-50 dark:bg-brand-900/20 border-brand-500"
            )}
          >
            <Filter className="w-4 h-4 mr-1.5" />
            Filters {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
          
          <div className="flex gap-1 border border-border rounded-lg p-0.5">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-2"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-2"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
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
            onClick={handleExport}
            disabled={!data || filteredData.length === 0}
            size="sm"
            className={isMobile ? "h-9 px-3 text-sm" : ""}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {analyticsData && (
        <div className={cn(
          "grid gap-4 mb-6",
          isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"
        )}>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {analyticsData.totalConversations.toLocaleString()}
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-brand-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sentiment Score</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {analyticsData.sentimentScore}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  2.3s
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {new Set(filteredData.map(d => d.conversation_id)).size}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {analyticsData && analyticsData.totalConversations > 0 && (
        <div className={cn(
          "grid gap-4 mb-6 overflow-hidden",
          isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}>
          {/* Emotion Distribution */}
          <Card className="p-6 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Emotion Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.emotionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name.toLowerCase() === 'positive' ? COLORS.positive :
                      entry.name.toLowerCase() === 'negative' ? COLORS.negative :
                      COLORS.neutral
                    } />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Intent Distribution */}
          <Card className="p-6 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Top User Intents</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData.intentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Conversation Trends */}
          <Card className="p-6 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Conversation Trends (7 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analyticsData.trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Language Distribution */}
          <Card className="p-6 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Language Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData.languageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={cn("mb-6 overflow-hidden", isMobile ? "p-3" : "p-4")}>
              <div className="space-y-4 overflow-x-auto">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={isMobile ? "Search..." : "Search queries or responses..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                      isMobile ? "py-2.5 text-sm" : "py-2"
                    )}
                  />
                </div>

                {/* Date Range Presets */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Date Range</label>
                  <div className={cn(
                    "gap-2",
                    isMobile ? "grid grid-cols-2" : "flex flex-wrap"
                  )}>
                    {dateRangePresets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant={
                          selectedFilters.dateRange.start === preset.value().start &&
                          selectedFilters.dateRange.end === preset.value().end
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => setSelectedFilters({ ...selectedFilters, dateRange: preset.value() })}
                        className="text-xs"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Filter Grid */}
                <div className={cn(
                  "gap-3",
                  isMobile ? "grid grid-cols-1" : "grid grid-cols-2 lg:grid-cols-4"
                )}>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Emotion</label>
                    <SimpleSelect
                      value={selectedFilters.emotion}
                      onValueChange={(value) => setSelectedFilters({ ...selectedFilters, emotion: value })}
                      options={[
                        { value: 'all', label: 'All Emotions' },
                        { value: 'positive', label: 'Positive' },
                        { value: 'negative', label: 'Negative' },
                        { value: 'neutral', label: 'Neutral' }
                      ]}
                      className="w-full h-8 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Feedback</label>
                    <SimpleSelect
                      value={selectedFilters.feedback}
                      onValueChange={(value) => setSelectedFilters({ ...selectedFilters, feedback: value })}
                      options={[
                        { value: 'all', label: 'All Feedback' },
                        { value: 'positive', label: 'Positive' },
                        { value: 'negative', label: 'Negative' },
                        { value: 'neutral', label: 'Neutral' }
                      ]}
                      className="w-full h-8 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Language</label>
                    <SimpleSelect
                      value={selectedFilters.language}
                      onValueChange={(value) => setSelectedFilters({ ...selectedFilters, language: value })}
                      options={[
                        { value: 'all', label: 'All Languages' },
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Spanish' },
                        { value: 'fr', label: 'French' },
                        { value: 'de', label: 'German' },
                        { value: 'zh', label: 'Chinese' },
                        { value: 'ja', label: 'Japanese' }
                      ]}
                      className="w-full h-8 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Intent</label>
                    <SimpleSelect
                      value={selectedFilters.intent}
                      onValueChange={(value) => setSelectedFilters({ ...selectedFilters, intent: value })}
                      options={[
                        { value: 'all', label: 'All Intents' },
                        ...filterOptions.intents.map(intent => ({
                          value: intent,
                          label: intent
                        }))
                      ]}
                      className="w-full h-8 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Browser</label>
                    <SimpleSelect
                      value={selectedFilters.browser}
                      onValueChange={(value) => setSelectedFilters({ ...selectedFilters, browser: value })}
                      options={[
                        { value: 'all', label: 'All Browsers' },
                        ...filterOptions.browsers.map(browser => ({
                          value: browser,
                          label: browser
                        }))
                      ]}
                      className="w-full h-8 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Deployment</label>
                    <SimpleSelect
                      value={selectedFilters.deployment}
                      onValueChange={(value) => setSelectedFilters({ ...selectedFilters, deployment: value })}
                      options={[
                        { value: 'all', label: 'All Deployments' },
                        ...filterOptions.deployments.map(deployment => ({
                          value: deployment,
                          label: deployment
                        }))
                      ]}
                      className="w-full h-8 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Content Source</label>
                    <SimpleSelect
                      value={selectedFilters.contentSource}
                      onValueChange={(value) => setSelectedFilters({ ...selectedFilters, contentSource: value })}
                      options={[
                        { value: 'all', label: 'All Sources' },
                        ...filterOptions.contentSources.map(source => ({
                          value: source,
                          label: source
                        }))
                      ]}
                      className="w-full h-8 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="Filter by location..."
                      value={selectedFilters.location}
                      onChange={(e) => setSelectedFilters({ ...selectedFilters, location: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFilters({
                        emotion: 'all',
                        intent: 'all',
                        feedback: 'all',
                        language: 'all',
                        deployment: 'all',
                        browser: 'all',
                        dateRange: { start: null, end: null },
                        contentSource: 'all',
                        location: ''
                      });
                      setSearchQuery('');
                    }}
                    className="text-sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Summary */}
      {data && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {data.data.total} conversations
          </p>
        </div>
      )}

      {/* Data View */}
      {data && (
        <>
          {viewMode === 'cards' ? (
            <div className="space-y-4">
              {filteredData.map((item) => {
                const isExpanded = expandedItems.has(item.prompt_id);
                
                return (
                  <Card key={item.prompt_id} className={cn(
                    "hover:shadow-lg transition-all duration-200 overflow-hidden",
                    isMobile ? "p-4" : "p-6"
                  )}>
                    <div className={cn(
                      "space-y-4",
                      isMobile && "space-y-3"
                    )}>
                      {/* Header */}
                      <div className={cn(
                        "gap-2",
                        isMobile ? "flex flex-col space-y-2" : "flex flex-col sm:flex-row sm:items-center justify-between"
                      )}>
                        <div className={cn(
                          "text-sm text-gray-600 dark:text-gray-400",
                          isMobile ? "flex flex-col gap-1" : "flex items-center gap-4"
                        )}>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span className={isMobile ? "text-xs" : ""}>
                              {format(new Date(item.created_at), isMobile ? 'MMM dd, HH:mm' : 'MMM dd, yyyy HH:mm')}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span className={isMobile ? "text-xs" : ""}>
                              Conv #{item.conversation_id}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            {getEmotionIcon(item.user_emotion)}
                            <span className="text-xs">{item.user_emotion}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            {getFeedbackIcon(item.feedback)}
                            <span className="text-xs">{item.feedback}</span>
                          </span>
                        </div>
                      </div>

                      {/* User Query */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={cn(
                            "font-medium text-gray-900 dark:text-gray-100",
                            isMobile ? "text-sm" : "text-sm"
                          )}>User Query</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(item.user_query, 'Query')}
                            className="h-6 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className={cn(
                          "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg",
                          isMobile ? "text-sm p-3" : "text-sm p-3"
                        )}>
                          {item.user_query}
                        </p>
                      </div>

                      {/* AI Response */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={cn(
                            "font-medium text-gray-900 dark:text-gray-100",
                            isMobile ? "text-sm" : "text-sm"
                          )}>AI Response</h4>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(item.ai_response, 'Response')}
                              className="h-6 px-2"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleItemExpansion(item.prompt_id)}
                              className="h-6 px-2"
                            >
                              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                        <div className={cn(
                          "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg",
                          isMobile ? "text-sm p-3" : "text-sm p-3"
                        )}>
                          <p className={cn("transition-all duration-200", !isExpanded && "line-clamp-3")}>
                            {item.ai_response}
                          </p>
                          {item.ai_response.length > 150 && !isExpanded && (
                            <button
                              onClick={() => toggleItemExpansion(item.prompt_id)}
                              className="text-brand-600 hover:text-brand-700 text-sm font-medium mt-2"
                            >
                              View more
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className={cn(
                        "pt-4 border-t border-gray-200 dark:border-gray-700",
                        isMobile 
                          ? "grid grid-cols-2 gap-3" 
                          : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
                      )}>
                        <div className="text-center">
                          <Target className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">Intent</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate" title={item.user_intent}>
                            {item.user_intent}
                          </p>
                        </div>
                        <div className="text-center">
                          <Globe className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">Language</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {item.language.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-center">
                          <MapPin className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">Location</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate" title={item.user_location || 'Unknown'}>
                            {item.user_location || 'Unknown'}
                          </p>
                        </div>
                        <div className="text-center">
                          <Laptop className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">Deployment</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate" title={item.chatbot_deployment}>
                            {item.chatbot_deployment}
                          </p>
                        </div>
                        <div className="text-center">
                          <Chrome className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">Browser</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate" title={item.browser}>
                            {item.browser}
                          </p>
                        </div>
                        <div className="text-center">
                          <Brain className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">Source</p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate" title={item.content_source}>
                            {item.content_source}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            // Table View
            <Card className="overflow-hidden w-full">
              <div className="overflow-x-auto max-w-full">
                <table className="w-full min-w-[768px]">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                        Date/Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User Query
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                        Emotion
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                        Intent
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                        Feedback
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredData.map((item) => (
                      <tr key={item.prompt_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {format(new Date(item.created_at), 'MMM dd, HH:mm')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          <p className="truncate max-w-xs lg:max-w-md xl:max-w-lg">{item.user_query}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className="flex items-center gap-1">
                            {getEmotionIcon(item.user_emotion)}
                            <span className="truncate max-w-[80px]">{item.user_emotion}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          <p className="truncate max-w-[120px]">{item.user_intent}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className="flex items-center gap-1">
                            {getFeedbackIcon(item.feedback)}
                            <span className="truncate max-w-[80px]">{item.feedback}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleItemExpansion(item.prompt_id)}
                            className="h-7 px-2"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {filteredData.length === 0 && (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No conversations found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your filters or search query
              </p>
            </Card>
          )}

          {/* Pagination */}
          {data.data.last_page > 1 && (
            <div className={cn(
              "mt-6",
              isMobile 
                ? "flex flex-col gap-3" 
                : "flex items-center justify-between"
            )}>
              <p className={cn(
                "text-gray-600 dark:text-gray-400",
                isMobile ? "text-sm text-center" : "text-sm"
              )}>
                Showing {data.data.from} to {data.data.to} of {data.data.total} results
              </p>
              
              <div className={cn(
                "flex items-center justify-center gap-2",
                isMobile && "w-full"
              )}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className={cn(
                    isMobile ? "h-9 px-3 text-sm flex-1 max-w-24" : ""
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {!isMobile && "Previous"}
                </Button>
                
                <span className={cn(
                  "px-3 py-1 text-sm font-medium text-center min-w-max",
                  isMobile ? "text-xs" : ""
                )}>
                  {isMobile 
                    ? `${data.data.current_page}/${data.data.last_page}`
                    : `Page ${data.data.current_page} of ${data.data.last_page}`
                  }
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === data.data.last_page || loading}
                  className={cn(
                    isMobile ? "h-9 px-3 text-sm flex-1 max-w-24" : ""
                  )}
                >
                  {!isMobile && "Next"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};