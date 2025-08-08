'use client';

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useBreakpoint } from '@/hooks/useMediaQuery';

interface LineChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  yKey,
  color = '#3B82F6',
  height = 300,
}) => {
  const { isMobile } = useBreakpoint();
  
  // Format date for display
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    if (isMobile) {
      // Shorter format for mobile
      return date.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric' 
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : height}>
      <RechartsLineChart
        data={data}
        margin={{ 
          top: 5, 
          right: isMobile ? 10 : 30, 
          left: isMobile ? 0 : 20, 
          bottom: 5 
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey={xKey}
          tick={{ fontSize: isMobile ? 10 : 12 }}
          tickFormatter={formatXAxis}
          stroke="#6B7280"
          interval={isMobile ? 'preserveStartEnd' : 0}
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
          labelFormatter={(label) => formatXAxis(label)}
        />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={isMobile ? 1.5 : 2}
          dot={isMobile ? false : { fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: isMobile ? 4 : 6 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};