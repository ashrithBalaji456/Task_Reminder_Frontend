import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Calendar } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, action }) => {
  const { user } = useAuth();
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold uppercase tracking-wider mb-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{todayStr}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          {title || `Welcome back, ${user?.name || 'Friend'}! 🌸`}
        </h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
};
