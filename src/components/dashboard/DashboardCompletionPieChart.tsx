import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardCompletionPieChartProps {
  completed: number;
  pending: number;
  total: number;
}

export const DashboardCompletionPieChart: React.FC<DashboardCompletionPieChartProps> = ({
  completed,
  pending,
  total,
}) => {
  if (total === 0) {
    return (
      <div className="w-full h-56 flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
        <span>No tasks scheduled for today yet.</span>
      </div>
    );
  }

  const data = [
    { name: 'Completed Tasks', value: completed, color: '#10b981' },
    { name: 'Pending Tasks', value: pending, color: '#f59e0b' },
  ];

  return (
    <div className="w-full h-56 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              border: '1px solid rgba(244, 114, 182, 0.3)',
              boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.2)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
        <span className="text-2xl font-black text-slate-800">{total}</span>
        <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
      </div>
    </div>
  );
};
