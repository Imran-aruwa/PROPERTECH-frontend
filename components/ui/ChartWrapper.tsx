'use client';

import { ReactNode } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartWrapperProps {
  type: 'line' | 'bar' | 'pie';
  data: any[];
  dataKey?: string;
  xAxisKey?: string;
  title?: string;
  className?: string;
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500,
];

export function ChartWrapper({
  type,
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  title,
  className = '',
  colors = DEFAULT_COLORS,
  height = 300,
}: ChartWrapperProps) {
  const renderChart = () => {
    if (!data || data.length === 0) {
      return <div className="flex items-center justify-center h-full text-tx-muted">No data available</div>;
    }

    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0] }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill={colors[0]} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      default:
        return <div className="flex items-center justify-center h-full text-tx-muted">Invalid chart type</div>;
    }
  };

  return (
    <div className={`bg-bg-card rounded-lg shadow-sm border border-bd p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-tx-primary mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
