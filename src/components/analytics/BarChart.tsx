'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useBreakpoint } from '@/hooks/useMediaQuery';

interface BarChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  color = '#8B5CF6',
  height = 300,
}) => {
  const { isMobile } = useBreakpoint();
  
  // Truncate long labels
  const formatXAxis = (tickItem: string) => {
    const maxLength = isMobile ? 10 : 20;
    if (tickItem.length > maxLength) {
      return tickItem.substring(0, maxLength) + '...';
    }
    return tickItem;
  };

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : height}>
      <RechartsBarChart
        data={data}
        margin={{ 
          top: isMobile ? 10 : 20, 
          right: isMobile ? 10 : 30, 
          left: isMobile ? 0 : 20, 
          bottom: isMobile ? 80 : 60 
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey={xKey}
          tick={{ fontSize: isMobile ? 10 : 12 }}
          tickFormatter={formatXAxis}
          stroke="#6B7280"
          angle={isMobile ? -90 : -45}
          textAnchor="end"
          height={isMobile ? 80 : 100}
          interval={isMobile ? 0 : 'preserveEnd'}
        />
        <YAxis 
          tick={{ fontSize: isMobile ? 10 : 12 }}
          stroke="#6B7280"
          width={isMobile ? 40 : 60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontSize: isMobile ? '12px' : '14px',
          }}
          formatter={(value: any) => [value, 'Count']}
          labelStyle={{ color: '#111827' }}
        />
        <Bar 
          dataKey={yKey} 
          fill={color}
          radius={[4, 4, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};