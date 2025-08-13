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
import { useBreakpoint } from '@/hooks/useMediaQuery';

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
  const { isMobile } = useBreakpoint();
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
      className={cn(
        "bg-card rounded-lg border border-border hover:shadow-md transition-shadow",
        isMobile ? "p-4" : "p-6"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={cn(
            "font-medium text-muted-foreground mb-1",
            isMobile ? "text-xs" : "text-sm"
          )}>{title}</p>
          <p className={cn(
            "font-bold text-foreground mb-2",
            isMobile ? "text-2xl" : "text-3xl"
          )}>{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              {change.trend === 'up' ? (
                <TrendingUp className={cn(
                  "text-green-500",
                  isMobile ? "h-3 w-3" : "h-4 w-4"
                )} />
              ) : change.trend === 'down' ? (
                <TrendingDown className={cn(
                  "text-red-500",
                  isMobile ? "h-3 w-3" : "h-4 w-4"
                )} />
              ) : (
                <Activity className={cn(
                  "text-muted-foreground",
                  isMobile ? "h-3 w-3" : "h-4 w-4"
                )} />
              )}
              <span className={cn(
                'font-medium',
                isMobile ? 'text-xs' : 'text-sm',
                change.trend === 'up' && 'text-green-600',
                change.trend === 'down' && 'text-red-600',
                change.trend === 'neutral' && 'text-muted-foreground'
              )}>
                {change.value}
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          'rounded-lg border flex items-center justify-center',
          isMobile ? 'w-10 h-10' : 'w-12 h-12',
          colorClasses[color]
        )}>
          <Icon className={cn(
            isMobile ? "h-5 w-5" : "h-6 w-6"
          )} />
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
  const { isMobile } = useBreakpoint();
  
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isMobile ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "bg-card rounded-lg border border-border text-left hover:shadow-md transition-all w-full",
        isMobile ? "p-4 touch-target" : "p-6"
      )}
    >
      <div className={cn(
        "flex items-start gap-3",
        isMobile && "gap-3"
      )}>
        <div className={cn(
          'rounded-lg flex items-center justify-center flex-shrink-0',
          isMobile ? 'w-9 h-9' : 'w-10 h-10',
          color
        )}>
          <Icon className={cn(
            "text-white",
            isMobile ? "h-4 w-4" : "h-5 w-5"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-semibold text-foreground mb-1",
            isMobile ? "text-sm" : "text-base"
          )}>{title}</h3>
          <p className={cn(
            "text-muted-foreground",
            isMobile ? "text-xs" : "text-sm"
          )}>{description}</p>
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
  const { isMobile } = useBreakpoint();
  
  const getIcon = () => {
    const iconClass = isMobile ? "h-3 w-3" : "h-4 w-4";
    switch (item.type) {
      case 'conversation':
        return <MessageSquare className={cn(iconClass, "text-blue-600")} />;
      case 'agent_created':
        return <Bot className={cn(iconClass, "text-green-600")} />;
      case 'page_indexed':
        return <FileText className={cn(iconClass, "text-purple-600")} />;
      case 'settings_updated':
        return <Activity className={cn(iconClass, "text-orange-600")} />;
      default:
        return <Activity className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  return (
    <div className={cn(
      "flex items-start gap-3 hover:bg-accent rounded-lg",
      isMobile ? "p-3" : "p-3"
    )}>
      <div className={cn(
        "rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5",
        isMobile ? "w-7 h-7" : "w-8 h-8"
      )}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-foreground",
          isMobile ? "text-sm" : "text-sm"
        )}>{item.title}</p>
        <p className={cn(
          "text-muted-foreground mt-0.5",
          isMobile ? "text-xs" : "text-sm"
        )}>{item.description}</p>
        {item.agent && (
          <p className={cn(
            "text-muted-foreground mt-1",
            isMobile ? "text-xs" : "text-xs"
          )}>Agent: {item.agent}</p>
        )}
      </div>
      <div className={cn(
        "text-muted-foreground flex-shrink-0",
        isMobile ? "text-xs" : "text-xs"
      )}>
        {item.timestamp}
      </div>
    </div>
  );
};

export const DashboardOverview: React.FC = () => {
  const { limits, isLoading, error } = useLimits();
  const router = useRouter();
  const { isMobile } = useBreakpoint();

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
    <div className={cn(
      "space-y-6",
      isMobile ? "p-4" : "p-6 space-y-8"
    )}>
      {/* Header */}
      <div>
        <h1 className={cn(
          "font-bold text-foreground mb-2",
          isMobile ? "text-xl" : "text-2xl"
        )}>Dashboard Overview</h1>
        <p className={cn(
          "text-muted-foreground",
          isMobile ? "text-sm" : "text-base"
        )}>Welcome back! Here&apos;s what&apos;s happening with your agents.</p>
      </div>

      {/* Metrics Grid */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      )}>
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={cn(
              "bg-card rounded-lg border border-border animate-pulse",
              isMobile ? "p-4" : "p-6"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className={cn(
                    "h-3 bg-muted rounded mb-2",
                    isMobile ? "w-16" : "w-20"
                  )}></div>
                  <div className={cn(
                    "bg-muted rounded mb-2",
                    isMobile ? "h-7 w-24" : "h-8 w-32"
                  )}></div>
                  <div className={cn(
                    "h-3 bg-muted rounded",
                    isMobile ? "w-20" : "w-24"
                  )}></div>
                </div>
                <div className={cn(
                  "rounded-lg bg-muted",
                  isMobile ? "w-10 h-10" : "w-12 h-12"
                )}></div>
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className={cn(
            "col-span-full bg-red-50 rounded-lg border border-red-200",
            isMobile ? "p-4" : "p-6"
          )}>
            <div className="flex items-center gap-3">
              <AlertCircle className={cn(
                "text-red-600 flex-shrink-0",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <div>
                <p className={cn(
                  "font-medium text-red-900",
                  isMobile ? "text-sm" : "text-base"
                )}>Failed to load usage limits</p>
                <p className={cn(
                  "text-red-700 mt-1",
                  isMobile ? "text-xs" : "text-sm"
                )}>Please check your connection and try again.</p>
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

      <div className={cn(
        "grid gap-6",
        isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2 gap-8"
      )}>
        {/* Quick Actions */}
        <div>
          <h2 className={cn(
            "font-semibold text-foreground mb-4",
            isMobile ? "text-base" : "text-lg"
          )}>Quick Actions</h2>
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
          )}>
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className={cn(
            "font-semibold text-foreground mb-4",
            isMobile ? "text-base" : "text-lg"
          )}>Recent Activity</h2>
          <div className="bg-card rounded-lg border border-border">
            <div className="divide-y divide-gray-200">
              {recentActivity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
            <div className={cn(
              "text-center border-t border-border",
              isMobile ? "p-3" : "p-4"
            )}>
              <button className={cn(
                "text-brand-600 hover:text-brand-700 font-medium",
                isMobile ? "text-sm" : "text-sm"
              )}>
                View all activity
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div className={cn(
        "bg-card rounded-lg border border-border",
        isMobile ? "p-4" : "p-6"
      )}>
        <h2 className={cn(
          "font-semibold text-foreground mb-4",
          isMobile ? "text-base" : "text-lg"
        )}>Usage Overview</h2>
        <div className={cn(
          "grid gap-6",
          isMobile ? "grid-cols-1 gap-4" : "grid-cols-1 md:grid-cols-3"
        )}>
          <div className="text-center">
            <div className={cn(
              "mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center",
              isMobile ? "w-14 h-14" : "w-16 h-16"
            )}>
              <Clock className={cn(
                "text-blue-600",
                isMobile ? "h-7 w-7" : "h-8 w-8"
              )} />
            </div>
            <h3 className={cn(
              "font-semibold text-foreground",
              isMobile ? "text-sm" : "text-base"
            )}>Response Time</h3>
            <p className={cn(
              "font-bold text-blue-600 mt-1",
              isMobile ? "text-xl" : "text-2xl"
            )}>1.2s</p>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>Average response time</p>
          </div>
          
          <div className="text-center">
            <div className={cn(
              "mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center",
              isMobile ? "w-14 h-14" : "w-16 h-16"
            )}>
              <Globe className={cn(
                "text-green-600",
                isMobile ? "h-7 w-7" : "h-8 w-8"
              )} />
            </div>
            <h3 className={cn(
              "font-semibold text-foreground",
              isMobile ? "text-sm" : "text-base"
            )}>Global Reach</h3>
            <p className={cn(
              "font-bold text-green-600 mt-1",
              isMobile ? "text-xl" : "text-2xl"
            )}>23</p>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>Countries served</p>
          </div>
          
          <div className="text-center">
            <div className={cn(
              "mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center",
              isMobile ? "w-14 h-14" : "w-16 h-16"
            )}>
              <Zap className={cn(
                "text-purple-600",
                isMobile ? "h-7 w-7" : "h-8 w-8"
              )} />
            </div>
            <h3 className={cn(
              "font-semibold text-foreground",
              isMobile ? "text-sm" : "text-base"
            )}>Uptime</h3>
            <p className={cn(
              "font-bold text-purple-600 mt-1",
              isMobile ? "text-xl" : "text-2xl"
            )}>99.9%</p>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>Service availability</p>
          </div>
        </div>
      </div>
    </div>
  );
};