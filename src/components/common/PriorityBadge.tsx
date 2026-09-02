import React from 'react';
import { Priority } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const styles = {
    HIGH: 'bg-rose-100/80 text-rose-700 border-rose-200/80',
    MEDIUM: 'bg-amber-100/80 text-amber-800 border-amber-200/80',
    LOW: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/80',
  };

  const labels = {
    HIGH: '🔴 High',
    MEDIUM: '🟡 Medium',
    LOW: '🟢 Low',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-xs ${
        styles[priority] || styles.LOW
      } ${className}`}
    >
      {labels[priority]}
    </span>
  );
};
