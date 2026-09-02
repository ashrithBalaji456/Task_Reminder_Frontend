import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PriorityBreakdownChartProps {
  highCompleted: number;
  highPending: number;
  mediumCompleted: number;
  mediumPending: number;
  lowCompleted: number;
  lowPending: number;
}

export const PriorityBreakdownChart: React.FC<PriorityBreakdownChartProps> = ({
  highCompleted,
  highPending,
  mediumCompleted,
  mediumPending,
  lowCompleted,
  lowPending,
}) => {
  const data = [
    { priority: 'High', Completed: highCompleted, Pending: highPending },
    { priority: 'Medium', Completed: mediumCompleted, Pending: mediumPending },
    { priority: 'Low', Completed: lowCompleted, Pending: lowPending },
  ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="priority" stroke="#94a3b8" fontSize={12} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              border: '1px solid rgba(244, 114, 182, 0.3)',
              boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.2)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="Completed" fill="#10b981" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
