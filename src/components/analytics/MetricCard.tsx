import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  suffix?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    icon: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    icon: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    icon: 'text-purple-600',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    icon: 'text-orange-600',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    icon: 'text-red-600',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon: Icon,
  color,
  suffix,
}) => {
  const colors = colorClasses[color];
  const { isMobile } = useBreakpoint();
  
  return (
    <Card className={cn(
      "hover:shadow-lg transition-shadow",
      isMobile ? "p-4" : "p-6"
    )}>
      <div className={cn(
        "flex items-center justify-between",
        isMobile ? "mb-3" : "mb-4"
      )}>
        <h3 className={cn(
          "font-medium text-gray-600",
          isMobile ? "text-xs" : "text-sm"
        )}>{title}</h3>
        <div className={cn(
          'rounded-lg',
          colors.bg,
          isMobile ? "p-1.5" : "p-2"
        )}>
          <Icon className={cn(
            colors.icon,
            isMobile ? "w-4 h-4" : "w-5 h-5"
          )} />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className={cn(
          "flex items-baseline",
          isMobile ? "gap-1.5 flex-wrap" : "gap-2"
        )}>
          <span className={cn(
            "font-bold text-gray-900",
            isMobile ? "text-xl" : "text-2xl"
          )}>{value}</span>
          {trend !== undefined && (
            <div className={cn(
              'flex items-center',
              isMobile ? "gap-0.5 text-xs" : "gap-1 text-sm",
              trend > 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {trend > 0 ? (
                <TrendingUp className={cn(
                  isMobile ? "w-3 h-3" : "w-4 h-4"
                )} />
              ) : (
                <TrendingDown className={cn(
                  isMobile ? "w-3 h-3" : "w-4 h-4"
                )} />
              )}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        {suffix && (
          <p className={cn(
            "text-gray-500",
            isMobile ? "text-xs" : "text-sm"
          )}>{suffix}</p>
        )}
      </div>
    </Card>
  );
};