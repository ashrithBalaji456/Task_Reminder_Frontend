import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  Plus,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart2,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { GlassCard } from '../components/common/GlassCard';
import { AnimatedButton } from '../components/common/AnimatedButton';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { MetricSkeleton, ChartSkeleton } from '../components/common/LoadingSkeleton';
import { DashboardCompletionPieChart } from '../components/dashboard/DashboardCompletionPieChart';
import { DashboardPriorityChart } from '../components/dashboard/DashboardPriorityChart';
import { dashboardApi } from '../api/dashboard.api';
import { alertsApi } from '../api/alerts.api';
import { DashboardResponse, AlertResponse } from '../types';
import { useToast } from '../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dash, alertList] = await Promise.all([
        dashboardApi.getDailyDashboard(),
        alertsApi.getAlerts(),
      ]);
      setDashboardData(dash);
      setAlerts(alertList);
    } catch (e: any) {
      if (navigator.onLine) {
        toast.error('Failed to load dashboard statistics.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <Layout>
      <Header
        subtitle="Here is your daily productivity overview and urgent alerts."
        action={
          <div className="flex items-center gap-3">
            <AnimatedButton
              variant="secondary"
              size="sm"
              onClick={loadDashboardData}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </AnimatedButton>
            <AnimatedButton
              size="sm"
              onClick={() => navigate('/tasks')}
              icon={<Plus className="w-4 h-4" />}
            >
              New Task
            </AnimatedButton>
          </div>
        }
      />

      {/* Urgent Alerts Banner (if any) */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-rose-500/90 to-amber-500/90 text-white backdrop-blur-xl shadow-xl shadow-rose-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-yellow-200 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-base tracking-tight">
                {alerts.length} Task{alerts.length > 1 ? 's' : ''} Due Very Soon!
              </h4>
              <p className="text-xs text-white/90">
                "{alerts[0].title}" is due in {alerts[0].minutesRemaining} minutes!
              </p>
            </div>
          </div>
          <AnimatedButton
            size="sm"
            variant="secondary"
            onClick={() => navigate('/alerts')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            View All Alerts
          </AnimatedButton>
        </motion.div>
      )}

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            {/* Total Tasks Card */}
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-100/80 text-purple-600 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{dashboardData?.totalTasks || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Scheduled for today</p>
            </GlassCard>

            {/* Completed Tasks Card */}
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{dashboardData?.completedTasks || 0}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {dashboardData?.completionPercentage || 0}% finished
              </p>
            </GlassCard>

            {/* Pending Tasks Card */}
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-100/80 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{dashboardData?.pendingTasks || 0}</p>
              <p className="text-xs text-amber-600 font-medium mt-1">Needs action</p>
            </GlassCard>

            {/* Completion Percentage Meter */}
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Rate</span>
                <div className="w-10 h-10 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{dashboardData?.completionPercentage || 0}%</p>
              <div className="w-full bg-slate-200/60 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(dashboardData?.completionPercentage || 0, 100)}%` }}
                />
              </div>
            </GlassCard>
          </>
        )}
      </div>

      {/* Visual Analytics & Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Today's Task Completion Donut Chart */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Task Completion Pie Chart</h3>
              <p className="text-xs text-slate-500">Visual ratio of completed vs pending tasks for today</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-rose-500" />
          </div>

          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <DashboardCompletionPieChart
              completed={dashboardData?.completedTasks || 0}
              pending={dashboardData?.pendingTasks || 0}
              total={dashboardData?.totalTasks || 0}
            />
          )}
        </GlassCard>

        {/* Today's Priority Distribution Bar Chart */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Pending Priority Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of High, Medium, and Low pending items</p>
            </div>
            <BarChart2 className="w-5 h-5 text-purple-500" />
          </div>

          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <DashboardPriorityChart
              high={dashboardData?.highPriorityPendingCount || 0}
              medium={dashboardData?.mediumPriorityPendingCount || 0}
              low={dashboardData?.lowPriorityPendingCount || 0}
            />
          )}
        </GlassCard>
      </div>

      {/* Priority Breakdown & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Priority Breakdown Section */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Pending Tasks by Priority</h3>
                <p className="text-xs text-slate-500">Focus on high-priority items first</p>
              </div>
              <AnimatedButton variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
                Manage Tasks
              </AnimatedButton>
            </div>

            <div className="space-y-4">
              {/* High Priority Item */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                <div className="flex items-center gap-3">
                  <PriorityBadge priority="HIGH" />
                  <span className="text-sm font-semibold text-slate-700">Urgent & Important</span>
                </div>
                <span className="text-lg font-bold text-rose-700">
                  {dashboardData?.highPriorityPendingCount || 0} pending
                </span>
              </div>

              {/* Medium Priority Item */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-3">
                  <PriorityBadge priority="MEDIUM" />
                  <span className="text-sm font-semibold text-slate-700">Standard Tasks</span>
                </div>
                <span className="text-lg font-bold text-amber-700">
                  {dashboardData?.mediumPriorityPendingCount || 0} pending
                </span>
              </div>

              {/* Low Priority Item */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <PriorityBadge priority="LOW" />
                  <span className="text-sm font-semibold text-slate-700">Routine Tasks</span>
                </div>
                <span className="text-lg font-bold text-emerald-700">
                  {dashboardData?.lowPriorityPendingCount || 0} pending
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions & Tips Card */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Quick Navigation</h3>
            <p className="text-xs text-slate-500 mb-6">Easily manage every aspect of your routine</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/tasks')}
                className="w-full p-3.5 rounded-2xl bg-white/70 hover:bg-white border border-rose-100/80 flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-rose-600 transition-all cursor-pointer shadow-xs"
              >
                <span>View Today & Tomorrow Tasks</span>
                <ArrowRight className="w-4 h-4 text-rose-400" />
              </button>

              <button
                onClick={() => navigate('/recurring')}
                className="w-full p-3.5 rounded-2xl bg-white/70 hover:bg-white border border-rose-100/80 flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-purple-600 transition-all cursor-pointer shadow-xs"
              >
                <span>Manage Recurring Templates</span>
                <ArrowRight className="w-4 h-4 text-purple-400" />
              </button>

              <button
                onClick={() => navigate('/analytics')}
                className="w-full p-3.5 rounded-2xl bg-white/70 hover:bg-white border border-rose-100/80 flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-amber-600 transition-all cursor-pointer shadow-xs"
              >
                <span>Weekly & Monthly Analytics</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-rose-100/60 to-purple-100/60 border border-white text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">💡 Pro Productivity Tip</p>
            <p>Complete your High Priority tasks in the morning for maximum focus!</p>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
};

const SparklesIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);
