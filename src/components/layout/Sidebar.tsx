import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  History,
  XCircle,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/recurring', label: 'Recurring', icon: Repeat },
  { path: '/history', label: 'History', icon: History },
  { path: '/cancelled', label: 'Cancelled', icon: XCircle },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/preferences', label: 'Preferences', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={`hidden md:flex flex-col glass-card border-r border-white/60 min-h-screen p-4 fixed top-0 left-0 z-30 justify-between transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header & Toggle Button */}
        <div className="flex items-center justify-between px-2 py-3 mb-6 relative">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-rose-200 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <h1 className="font-bold text-lg text-slate-800 tracking-tight leading-tight truncate">RemindMe 🌸</h1>
                <span className="text-xs text-rose-500 font-medium truncate block">Task & Productivity</span>
              </motion.div>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-xl bg-white/80 border border-rose-200/80 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shadow-xs shrink-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 ${
                    isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
                  } rounded-2xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-200 font-semibold'
                      : 'text-slate-600 hover:bg-rose-50/60 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-700'}`} />
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="pt-4 border-t border-rose-100/60 space-y-3">
        <div
          className={`flex items-center gap-3 ${
            isCollapsed ? 'justify-center p-2' : 'px-3 py-2'
          } bg-white/50 rounded-2xl border border-white/80`}
          title={isCollapsed ? user?.name : undefined}
        >
          <div className="w-9 h-9 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          title={isCollapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center justify-center gap-2 ${
            isCollapsed ? 'p-3' : 'px-4 py-2.5'
          } rounded-2xl text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/80 transition-colors cursor-pointer`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </motion.button>
      </div>
    </aside>
  );
};
