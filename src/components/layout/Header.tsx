import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Calendar, LogOut, User } from 'lucide-react';
import { AnimatedButton } from '../common/AnimatedButton';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, action }) => {
  const { user, logout } = useAuth();
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

      <div className="flex items-center gap-3 shrink-0">
        {action && <div>{action}</div>}

        {/* Mobile & Desktop Header Profile & Logout */}
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md p-1.5 pl-3 rounded-2xl border border-rose-100/80 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <span className="text-xs font-bold text-slate-700 hidden xs:inline max-w-[100px] truncate">
              {user?.name || 'Account'}
            </span>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
