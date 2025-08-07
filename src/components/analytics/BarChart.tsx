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
  // Truncate long labels
  const formatXAxis = (tickItem: string) => {
    if (tickItem.length > 20) {
      return tickItem.substring(0, 20) + '...';
    }
    return tickItem;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey={xKey}
          tick={{ fontSize: 12 }}
          tickFormatter={formatXAxis}
          stroke="#6B7280"
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#6B7280"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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