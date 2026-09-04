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
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { GlassCard } from '../components/common/GlassCard';
import { AnimatedButton } from '../components/common/AnimatedButton';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { TaskCard } from '../components/task/TaskCard';
import { CreateTaskModal } from '../components/task/CreateTaskModal';
import { MoveTaskModal } from '../components/task/MoveTaskModal';
import { MetricSkeleton, ChartSkeleton } from '../components/common/LoadingSkeleton';
import { DashboardCompletionPieChart } from '../components/dashboard/DashboardCompletionPieChart';
import { DashboardPriorityChart } from '../components/dashboard/DashboardPriorityChart';
import { dashboardApi } from '../api/dashboard.api';
import { alertsApi } from '../api/alerts.api';
import { tasksApi } from '../api/tasks.api';
import { DashboardResponse, AlertResponse, TaskResponse, CreateTaskRequest } from '../types';
import { useToast } from '../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null);
  const [movingTask, setMovingTask] = useState<TaskResponse | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dash, alertList, tasks] = await Promise.all([
        dashboardApi.getDailyDashboard(),
        alertsApi.getAlerts(),
        tasksApi.getTodayTasks(),
      ]);
      setDashboardData(dash);
      setAlerts(alertList);
      setTodayTasks(tasks || []);
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

  // Task Actions directly on Dashboard
  const handleCreateTask = async (data: CreateTaskRequest) => {
    try {
      if (editingTask) {
        await tasksApi.updateTask(editingTask.id, data);
        toast.success('Task updated successfully! ✨');
      } else {
        await tasksApi.createTask(data);
        toast.success('Task created successfully! 🎉');
      }
      setIsCreateModalOpen(false);
      setEditingTask(null);
      await loadDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save task.');
    }
  };

  const handleCompleteTask = async (id: number) => {
    // Optimistic UI update
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'COMPLETED' } : t))
    );
    try {
      await tasksApi.completeTask(id);
      toast.success('Task completed! Keep up the great momentum! 🚀');
      await loadDashboardData();
    } catch (err: any) {
      await loadDashboardData();
      toast.error('Failed to complete task.');
    }
  };

  const handleDeleteTask = async (id: number) => {
    // Optimistic UI removal
    setTodayTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await tasksApi.deleteTask(id);
      toast.info('Task deleted.');
      await loadDashboardData();
    } catch (err: any) {
      await loadDashboardData();
      toast.error('Failed to delete task.');
    }
  };

  const handleMoveToTomorrow = async () => {
    if (!movingTask) return;
    try {
      await tasksApi.moveTaskToTomorrow(movingTask.id);
      toast.success('Task moved to tomorrow! 📅');
      setMovingTask(null);
      await loadDashboardData();
    } catch (err: any) {
      toast.error('Failed to move task.');
    }
  };

  const handleMoveToDate = async (targetDate: string) => {
    if (!movingTask) return;
    try {
      await tasksApi.moveTask(movingTask.id, targetDate);
      toast.success(`Task moved to ${targetDate}! 📅`);
      setMovingTask(null);
      await loadDashboardData();
    } catch (err: any) {
      toast.error('Failed to move task.');
    }
  };

  return (
    <Layout>
      <Header
        subtitle="Here is your daily productivity overview, urgent alerts, and today's due tasks."
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
              onClick={() => {
                setEditingTask(null);
                setIsCreateModalOpen(true);
              }}
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

      {/* Main Metric Cards Grid (Fully Navigatable) */}
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
            <GlassCard
              onClick={() => navigate('/tasks')}
              className="cursor-pointer hover:border-purple-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-100/80 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Flame className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{dashboardData?.totalTasks || 0}</p>
              <p className="text-xs text-purple-600 font-semibold mt-1 flex items-center gap-1">
                <span>Scheduled for today</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </GlassCard>

            {/* Completed Tasks Card */}
            <GlassCard
              onClick={() => navigate('/tasks')}
              className="cursor-pointer hover:border-emerald-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{dashboardData?.completedTasks || 0}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <span>{dashboardData?.completionPercentage || 0}% finished</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </GlassCard>

            {/* Pending Tasks Card */}
            <GlassCard
              onClick={() => navigate('/tasks')}
              className="cursor-pointer hover:border-amber-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-100/80 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{dashboardData?.pendingTasks || 0}</p>
              <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
                <span>Needs action</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </GlassCard>

            {/* Completion Percentage Meter */}
            <GlassCard
              onClick={() => navigate('/analytics')}
              className="cursor-pointer hover:border-rose-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completion Rate</span>
                <div className="w-10 h-10 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
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

      {/* TODAY'S DUE TASKS SECTION (Directly Navigatable & Interactive) */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-500" />
              <span>Today's Due Tasks</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                {todayTasks.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete, move, edit, or delete today's tasks directly from your dashboard
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AnimatedButton
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditingTask(null);
                setIsCreateModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Today's Task
            </AnimatedButton>

            <AnimatedButton
              size="sm"
              onClick={() => navigate('/tasks')}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              View Full Workspace
            </AnimatedButton>
          </div>
        </div>

        {/* Task Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        ) : todayTasks.length === 0 ? (
          <GlassCard className="text-center py-10">
            <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No tasks scheduled for today yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              You are all caught up for today! Click below to create your first task.
            </p>
            <AnimatedButton
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setIsCreateModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Today's Task
            </AnimatedButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleCompleteTask}
                onMove={(t) => setMovingTask(t)}
                onEdit={(t) => {
                  setEditingTask(t);
                  setIsCreateModalOpen(true);
                }}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
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
              <div
                onClick={() => navigate('/tasks')}
                className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/60 border border-rose-100 hover:border-rose-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <PriorityBadge priority="HIGH" />
                  <span className="text-sm font-semibold text-slate-700">Urgent & Important</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-rose-700">
                    {dashboardData?.highPriorityPendingCount || 0} pending
                  </span>
                  <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Medium Priority Item */}
              <div
                onClick={() => navigate('/tasks')}
                className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/60 border border-amber-100 hover:border-amber-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <PriorityBadge priority="MEDIUM" />
                  <span className="text-sm font-semibold text-slate-700">Standard Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-700">
                    {dashboardData?.mediumPriorityPendingCount || 0} pending
                  </span>
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Low Priority Item */}
              <div
                onClick={() => navigate('/tasks')}
                className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <PriorityBadge priority="LOW" />
                  <span className="text-sm font-semibold text-slate-700">Routine Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-emerald-700">
                    {dashboardData?.lowPriorityPendingCount || 0} pending
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </div>
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

      {/* Modals for Direct Action on Dashboard */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateTask}
        editTask={editingTask}
      />

      <MoveTaskModal
        isOpen={!!movingTask}
        onClose={() => setMovingTask(null)}
        taskTitle={movingTask?.title || ''}
        onMoveToTomorrow={handleMoveToTomorrow}
        onMoveToDate={handleMoveToDate}
      />
    </Layout>
  );
};
