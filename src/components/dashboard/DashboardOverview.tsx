'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  MessageSquare, 
  Users, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Globe,
  Zap,
  FileText,
  Database,
  Activity,
  HardDrive,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useLimits } from '@/hooks/useLimits';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              {change.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : change.trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <Activity className="h-4 w-4 text-gray-500" />
              )}
              <span className={cn(
                'text-sm font-medium',
                change.trend === 'up' && 'text-green-600',
                change.trend === 'down' && 'text-red-600',
                change.trend === 'neutral' && 'text-gray-600'
              )}>
                {change.value}
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-lg border flex items-center justify-center',
          colorClasses[color]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  color?: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  color = 'bg-brand-600'
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 text-left hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </motion.button>
  );
};

interface RecentActivityItem {
  id: string;
  type: 'conversation' | 'agent_created' | 'page_indexed' | 'settings_updated';
  title: string;
  description: string;
  timestamp: string;
  agent?: string;
}

const ActivityItem: React.FC<{ item: RecentActivityItem }> = ({ item }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'conversation':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'agent_created':
        return <Bot className="h-4 w-4 text-green-600" />;
      case 'page_indexed':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'settings_updated':
        return <Activity className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{item.title}</p>
        <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
        {item.agent && (
          <p className="text-xs text-gray-500 mt-1">Agent: {item.agent}</p>
        )}
      </div>
      <div className="text-xs text-gray-500 flex-shrink-0">
        {item.timestamp}
      </div>
    </div>
  );
};

export const DashboardOverview: React.FC = () => {
  const { limits, isLoading, error } = useLimits();
  const router = useRouter();

  // Calculate percentages for display
  const projectsUsagePercentage = limits 
    ? Math.round((limits.current_projects_num / limits.max_projects_num) * 100) 
    : 0;
  const storageUsagePercentage = limits 
    ? Math.round((limits.current_total_storage_credits / limits.max_total_storage_credits) * 100)
    : 0;
  const queriesUsagePercentage = limits 
    ? Math.round((limits.current_queries / limits.max_queries) * 100)
    : 0;

  const metrics = [
    {
      title: 'Projects',
      value: limits ? `${limits.current_projects_num}/${limits.max_projects_num}` : '-',
      change: { value: `${projectsUsagePercentage}% used`, trend: 'neutral' as const },
      icon: Bot,
      color: 'blue' as const,
    },
    {
      title: 'Storage Credits',
      value: limits ? `${limits.current_total_storage_credits}/${limits.max_total_storage_credits}` : '-',
      change: { value: `${storageUsagePercentage}% used`, trend: 'neutral' as const },
      icon: HardDrive,
      color: 'green' as const,
    },
    {
      title: 'Queries',
      value: limits ? `${limits.current_queries.toLocaleString()}/${limits.max_queries.toLocaleString()}` : '-',
      change: { value: `${queriesUsagePercentage}% used`, trend: 'neutral' as const },
      icon: MessageSquare,
      color: 'purple' as const,
    },
    {
      title: 'API Status',
      value: error ? 'Error' : 'Active',
      change: error 
        ? { value: 'Connection issue', trend: 'down' as const }
        : { value: 'All systems operational', trend: 'up' as const },
      icon: Activity,
      color: error ? 'red' as const : 'orange' as const,
    },
  ];

  const quickActions = [
    {
      title: 'Create New Agent',
      description: 'Set up a new AI agent with your content',
      icon: Bot,
      color: 'bg-brand-600',
      onClick: () => router.push('/dashboard/projects/create'),
    },
    {
      title: 'View Analytics',
      description: 'Check your agent performance and usage',
      icon: BarChart3,
      color: 'bg-purple-600',
      onClick: () => router.push('/dashboard/analytics'),
    },
    {
      title: 'Manage Sources',
      description: 'Add or update your data sources',
      icon: Database,
      color: 'bg-green-600',
      onClick: () => router.push('/dashboard/sources'),
    },
    {
      title: 'Agent Settings',
      description: 'Configure appearance and behavior',
      icon: Activity,
      color: 'bg-orange-600',
      onClick: () => router.push('/dashboard/projects'),
    },
  ];

  const recentActivity: RecentActivityItem[] = [
    {
      id: '1',
      type: 'conversation',
      title: 'New conversation started',
      description: 'User asked about product pricing',
      timestamp: '2 min ago',
      agent: 'Support Bot',
    },
    {
      id: '2',
      type: 'agent_created',
      title: 'Agent created successfully',
      description: 'New agent "Sales Assistant" is now active',
      timestamp: '1 hour ago',
    },
    {
      id: '3',
      type: 'page_indexed',
      title: 'Pages indexed',
      description: '15 new pages added to knowledge base',
      timestamp: '3 hours ago',
      agent: 'Support Bot',
    },
    {
      id: '4',
      type: 'settings_updated',
      title: 'Settings updated',
      description: 'Updated response tone and style',
      timestamp: '5 hours ago',
      agent: 'Marketing Bot',
    },
    {
      id: '5',
      type: 'conversation',
      title: 'High engagement session',
      description: '25 messages exchanged about technical support',
      timestamp: '1 day ago',
      agent: 'Tech Support',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your agents.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="col-span-full bg-red-50 rounded-lg border border-red-200 p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Failed to load usage limits</p>
                <p className="text-sm text-red-700 mt-1">Please check your connection and try again.</p>
              </div>
            </div>
          </div>
        ) : (
          // Metrics display
          metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="divide-y divide-gray-200">
              {recentActivity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
            <div className="p-4 text-center border-t border-gray-200">
              <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                View all activity
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Response Time</h3>
            <p className="text-2xl font-bold text-blue-600 mt-1">1.2s</p>
            <p className="text-sm text-gray-500">Average response time</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
              <Globe className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Global Reach</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">23</p>
            <p className="text-sm text-gray-500">Countries served</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Uptime</h3>
            <p className="text-2xl font-bold text-purple-600 mt-1">99.9%</p>
            <p className="text-sm text-gray-500">Service availability</p>
          </div>
        </div>
      </div>
    </div>
  );
};