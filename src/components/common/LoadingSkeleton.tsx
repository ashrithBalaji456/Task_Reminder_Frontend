import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="glass-card rounded-3xl p-6 animate-pulse space-y-4">
    <div className="flex items-center justify-between">
      <div className="h-4 bg-rose-200/50 rounded-full w-24"></div>
      <div className="h-6 bg-purple-200/50 rounded-full w-16"></div>
    </div>
    <div className="h-6 bg-slate-200/60 rounded-xl w-3/4"></div>
    <div className="h-4 bg-slate-200/40 rounded-xl w-1/2"></div>
    <div className="pt-2 flex justify-between items-center">
      <div className="h-4 bg-slate-200/40 rounded-full w-20"></div>
      <div className="h-8 bg-rose-200/40 rounded-2xl w-24"></div>
    </div>
  </div>
);

export const MetricSkeleton: React.FC = () => (
  <div className="glass-card rounded-3xl p-6 animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-4 bg-slate-200/60 rounded-full w-24"></div>
      <div className="w-10 h-10 bg-purple-200/50 rounded-2xl"></div>
    </div>
    <div className="h-8 bg-slate-300/60 rounded-xl w-1/3"></div>
    <div className="h-3 bg-slate-200/40 rounded-full w-1/2"></div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="glass-card rounded-3xl p-6 animate-pulse space-y-6">
    <div className="h-6 bg-slate-200/60 rounded-xl w-48"></div>
    <div className="h-64 bg-rose-100/30 rounded-2xl w-full flex items-end justify-between p-4 gap-3">
      {[40, 70, 50, 90, 60, 80, 45].map((height, i) => (
        <div
          key={i}
          className="bg-rose-300/40 rounded-xl w-full"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  </div>
);
