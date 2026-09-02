import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface DashboardPriorityChartProps {
  high: number;
  medium: number;
  low: number;
}

export const DashboardPriorityChart: React.FC<DashboardPriorityChartProps> = ({
  high,
  medium,
  low,
}) => {
  const data = [
    { priority: 'High', count: high, color: '#ef4444' },
    { priority: 'Medium', count: medium, color: '#f59e0b' },
    { priority: 'Low', count: low, color: '#10b981' },
  ];

  const total = high + medium + low;

  if (total === 0) {
    return (
      <div className="w-full h-56 flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
        <span>No priority tasks pending.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="priority" stroke="#94a3b8" fontSize={12} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.2)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          />
          <Bar dataKey="count" name="Pending Tasks" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
