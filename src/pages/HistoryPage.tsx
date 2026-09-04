import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { GlassCard } from '../components/common/GlassCard';
import { MetricSkeleton, CardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { GlassDatePicker } from '../components/common/GlassDatePicker';
import { GlassSelect } from '../components/common/GlassSelect';
import { historyApi } from '../api/history.api';
import { tasksApi } from '../api/tasks.api';
import { DailyHistoryResponse, TaskResponse, Priority, TaskStatus } from '../types';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  History as HistoryIcon,
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Trash2,
  ArrowRight,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(''); // Default empty = All History
  const [historyData, setHistoryData] = useState<DailyHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NEWEST_FIRST');

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await historyApi.getDailyHistory(selectedDate || undefined);
      setHistoryData(res);
    } catch (err: any) {
      toast.error('Failed to load history data.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, toast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDeleteTask = async (id: number) => {
    try {
      await tasksApi.deleteTask(id);
      toast.success('History task deleted 🗑️');
      setHistoryData((prev) =>
        prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== id) } : null
      );
    } catch (err: any) {
      toast.error('Failed to delete history task.');
    }
  };

  // Filter and Sort Logic (Hides CANCELLED tasks from main history view)
  const filteredAndSortedTasks = useMemo(() => {
    if (!historyData?.tasks) return [];

    let result = historyData.tasks.filter((t) => t.status !== 'CANCELLED');

    // Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Priority Filter
    if (priorityFilter !== 'ALL') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Sorting Logic
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
      } else if (sortBy === 'STATUS_COMPLETED') {
        const statusOrder: Record<TaskStatus, number> = { COMPLETED: 1, PENDING: 2, MOVED: 3, CANCELLED: 4 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return 0;
    });

    return result;
  }, [historyData, searchQuery, statusFilter, priorityFilter, sortBy]);

  return (
    <Layout>
      <Header
        title="Task History 📜"
        subtitle={
          selectedDate
            ? `Viewing historical occurrences for ${selectedDate}`
            : 'Viewing completed, pending, and active historical task occurrences'
        }
      />

      {/* Date Selection Header */}
      <GlassCard className="mb-8 relative z-30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">History Time Scope</h3>
              {selectedDate ? (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                  Date: {selectedDate}
                </span>
              ) : (
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                  ✨ All Historical Data
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Filter history by specific date or view all historical records
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Show All History</span>
              </button>
            )}

            <div className="w-full sm:w-60 shrink-0">
              <GlassDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Pick date to inspect..."
                align="right"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Daily History Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
        {isLoading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            {/* Total Historical Occurrences */}
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <HistoryIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{historyData?.totalTasks || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Total active recorded items</p>
            </GlassCard>

            {/* Completed Tasks */}
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{historyData?.completedTasks || 0}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {historyData?.completionPercentage || 0}% completion rate
              </p>
            </GlassCard>

            {/* Pending Tasks */}
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{historyData?.pendingTasks || 0}</p>
              <p className="text-xs text-amber-600 font-medium mt-1">Awaiting completion</p>
            </GlassCard>

            {/* Cancelled Tasks (Link to /cancelled) */}
            <GlassCard
              onClick={() => navigate('/cancelled')}
              className="cursor-pointer hover:border-rose-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cancelled Tasks</span>
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">{historyData?.cancelledTasks || 0}</p>
              <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <span>View Cancelled Page</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </GlassCard>
          </>
        )}
      </div>

      {/* Search, Filter & Sort Bar */}
      <GlassCard className="mb-6 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-xs font-medium"
            />
          </div>

          {/* Status Filter */}
          <GlassSelect
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'COMPLETED', label: '✅ Completed Only' },
              { value: 'PENDING', label: '⏰ Pending Only' },
              { value: 'MOVED', label: '➡️ Moved Only' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            icon={<Filter className="w-4 h-4 text-slate-700" />}
          />

          {/* Priority Filter */}
          <GlassSelect
            options={[
              { value: 'ALL', label: 'All Priorities' },
              { value: 'HIGH', label: '🔴 High Priority Only' },
              { value: 'MEDIUM', label: '🟡 Medium Priority Only' },
              { value: 'LOW', label: '🟢 Low Priority Only' },
            ]}
            value={priorityFilter}
            onChange={setPriorityFilter}
            icon={<Filter className="w-4 h-4 text-slate-700" />}
          />

          {/* Sort By Dropdown */}
          <GlassSelect
            options={[
              { value: 'NEWEST_FIRST', label: '📅 Scheduled: Newest First' },
              { value: 'OLDEST_FIRST', label: '📅 Scheduled: Oldest First' },
              { value: 'PRIORITY_HIGH', label: '🔥 Priority: High to Low' },
              { value: 'STATUS_COMPLETED', label: '✅ Status: Completed First' },
            ]}
            value={sortBy}
            onChange={setSortBy}
            icon={<ArrowUpDown className="w-4 h-4 text-slate-700" />}
          />
        </div>
      </GlassCard>

      {/* Results Header Counter */}
      <div className="flex items-center justify-between px-2 mb-4">
        <span className="text-xs font-bold text-slate-600">
          Showing {filteredAndSortedTasks.length} history items
        </span>
        {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* History Items List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : filteredAndSortedTasks.length === 0 ? (
          <GlassCard>
            <EmptyState
              title="No historical task records found"
              description="No tasks match your selected date, filters, or search terms."
            />
          </GlassCard>
        ) : (
          filteredAndSortedTasks.map((task) => (
            <GlassCard key={task.id} className="p-5 hover:border-purple-200 transition-all">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {task.recurring && (
                      <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-lg border border-purple-200">
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
                  <div className="flex flex-col items-end gap-1.5 text-right">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100/70 px-3 py-1.5 rounded-xl border border-slate-200/80">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      <span>{task.dueDate} at {task.dueTime}</span>
                    </div>
                    {task.completedAt && (
                      <span className="text-[11px] font-medium text-emerald-600">
                        Completed: {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    title="Delete history item"
                    className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
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

