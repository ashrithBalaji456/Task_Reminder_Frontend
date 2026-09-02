import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyTrendChartProps {
  dailyMap: Record<string, number>;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ dailyMap }) => {
  const data = Object.entries(dailyMap || {}).map(([dateStr, count]) => {
    const dayNo = new Date(dateStr).getDate();
    return {
      day: `Day ${dayNo}`,
      date: dateStr,
      completed: count,
    };
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} interval={4} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.2)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed Tasks"
            stroke="#a855f7"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#areaGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
