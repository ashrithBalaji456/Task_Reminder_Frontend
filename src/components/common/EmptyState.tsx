import React from 'react';
import { Sparkles } from 'lucide-react';
import { AnimatedButton } from './AnimatedButton';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="glass-card rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-6 border border-dashed border-rose-200/80">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-100 to-purple-100 flex items-center justify-center text-rose-500 shadow-inner">
        {icon || <Sparkles className="w-8 h-8 text-rose-500" />}
      </div>
      <h4 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h4>
      <p className="text-sm text-slate-500 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <AnimatedButton onClick={onAction} size="sm">
            {actionLabel}
          </AnimatedButton>
        </div>
      )}
    </div>
  );
};
