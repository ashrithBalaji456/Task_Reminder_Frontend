import React from 'react';
import { TaskStatus, NotificationStatus } from '../../types';

interface StatusBadgeProps {
  status: TaskStatus | NotificationStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-purple-100/80 text-purple-700 border-purple-200/80',
    PROCESSING: 'bg-blue-100/80 text-blue-700 border-blue-200/80 animate-pulse',
    COMPLETED: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/80',
    SENT: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/80',
    CANCELLED: 'bg-slate-100/80 text-slate-600 border-slate-200/80',
    MOVED: 'bg-sky-100/80 text-sky-700 border-sky-200/80',
    FAILED: 'bg-rose-100/80 text-rose-700 border-rose-200/80',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md capitalize ${
        styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'
      } ${className}`}
    >
      {status.toLowerCase()}
    </span>
  );
};
