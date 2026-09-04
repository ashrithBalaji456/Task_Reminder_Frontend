import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { GlassCard } from '../components/common/GlassCard';
import { MetricSkeleton, CardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { AnimatedButton } from '../components/common/AnimatedButton';
import { GlassSelect } from '../components/common/GlassSelect';
import { historyApi } from '../api/history.api';
import { tasksApi } from '../api/tasks.api';
import { DailyHistoryResponse, TaskResponse, Priority } from '../types';
import { useToast } from '../context/ToastContext';
import {
  XCircle,
  Trash2,
  Calendar,
  Search,
  ArrowLeft,
  ArrowUpDown,
  History,
} from 'lucide-react';

export const CancelledTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [historyData, setHistoryData] = useState<DailyHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NEWEST_FIRST');

  const loadCancelledTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await historyApi.getDailyHistory();
      setHistoryData(res);
    } catch (err: any) {
      toast.error('Failed to load cancelled tasks.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCancelledTasks();
  }, [loadCancelledTasks]);

  const cancelledTasks = useMemo(() => {
    if (!historyData?.tasks) return [];

    let result = historyData.tasks.filter((t) => t.status === 'CANCELLED');

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      );
    }

    if (priorityFilter !== 'ALL') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'NEWEST_FIRST') {
        const dateA = `${a.dueDate}T${a.dueTime}`;
        const dateB = `${b.dueDate}T${b.dueTime}`;
        return dateB.localeCompare(dateA);
      } else if (sortBy === 'OLDEST_FIRST') {
        const dateA = `${a.dueDate}T${a.dueTime}`;
        const dateB = `${b.dueDate}T${b.dueTime}`;
        return dateA.localeCompare(dateB);
      } else if (sortBy === 'PRIORITY_HIGH') {
        const priorityOrder: Record<Priority, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return 0;
    });

    return result;
  }, [historyData, searchQuery, priorityFilter, sortBy]);

  const handleDeleteTask = async (id: number) => {
    try {
      await tasksApi.deleteTask(id);
      toast.success('Cancelled task permanently deleted 🗑️');
      await loadCancelledTasks();
    } catch (err: any) {
      toast.error('Failed to delete cancelled task.');
    }
  };

  const handleClearAllCancelled = async () => {
    if (!cancelledTasks.length) return;
    try {
      await Promise.all(cancelledTasks.map((t) => tasksApi.deleteTask(t.id)));
      toast.success('Cleared all cancelled task records 🗑️');
      loadCancelledTasks();
    } catch (err: any) {
      toast.error('Failed to clear cancelled tasks.');
      loadCancelledTasks();
    }
  };

  return (
    <Layout>
      <Header
        title="Cancelled Tasks ❌"
        subtitle="View and manage all task occurrences that were cancelled or removed from recurring schedules."
        action={
          <div className="flex items-center gap-3">
            <AnimatedButton
              size="sm"
              variant="secondary"
              onClick={() => navigate('/history')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to History
            </AnimatedButton>
            {cancelledTasks.length > 0 && (
              <AnimatedButton
                size="sm"
                variant="secondary"
                onClick={handleClearAllCancelled}
                icon={<Trash2 className="w-4 h-4 text-rose-500" />}
              >
                Clear All Cancelled
              </AnimatedButton>
            )}
          </div>
        }
      />

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {isLoading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cancelled</span>
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{historyData?.cancelledTasks || cancelledTasks.length}</p>
              <p className="text-xs text-rose-500 font-medium mt-1">Isolated cancelled records</p>
            </GlassCard>

            <GlassCard
              onClick={() => navigate('/history')}
              className="cursor-pointer hover:border-purple-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Main History</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <History className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{historyData?.completedTasks || 0}</p>
              <p className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
                <span>View completed & pending tasks</span>
              </p>
            </GlassCard>
          </>
        )}
      </div>

      {/* Filters Bar */}
      <GlassCard className="mb-6 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cancelled tasks..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-xs font-medium"
            />
          </div>

          <GlassSelect
            options={[
              { value: 'ALL', label: 'All Priorities' },
              { value: 'HIGH', label: '🔴 High Priority' },
              { value: 'MEDIUM', label: '🟡 Medium Priority' },
              { value: 'LOW', label: '🟢 Low Priority' },
            ]}
            value={priorityFilter}
            onChange={setPriorityFilter}
          />

          <GlassSelect
            options={[
              { value: 'NEWEST_FIRST', label: '📅 Scheduled: Newest First' },
              { value: 'OLDEST_FIRST', label: '📅 Scheduled: Oldest First' },
              { value: 'PRIORITY_HIGH', label: '🔥 Priority: High to Low' },
            ]}
            value={sortBy}
            onChange={setSortBy}
            icon={<ArrowUpDown className="w-4 h-4 text-slate-700" />}
          />
        </div>
      </GlassCard>

      {/* Task List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : cancelledTasks.length === 0 ? (
          <GlassCard>
            <EmptyState
              title="No cancelled tasks found 🌸"
              description="You have no cancelled tasks. Cancelled tasks will appear here in isolation."
            />
          </GlassCard>
        ) : (
          cancelledTasks.map((task) => (
            <GlassCard key={task.id} className="p-5 hover:border-rose-200 transition-all">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-xl border border-rose-200">
                      ❌ CANCELLED
                    </span>
                    <PriorityBadge priority={task.priority} />
                    {task.recurring && (
                      <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-lg border border-purple-200">
                        Daily Recurring
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-800 text-base">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100/70 px-3 py-1.5 rounded-xl border border-slate-200/80">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>{task.dueDate} at {task.dueTime}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    title="Delete permanently"
                    className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </Layout>
  );
};
