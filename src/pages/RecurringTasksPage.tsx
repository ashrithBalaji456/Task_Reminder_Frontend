import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { GlassCard } from '../components/common/GlassCard';
import { AnimatedButton } from '../components/common/AnimatedButton';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { recurringTasksApi } from '../api/recurring.api';
import { RecurringTaskResponse, CreateTaskRequest } from '../types';
import { useToast } from '../context/ToastContext';
import { CreateTaskModal } from '../components/task/CreateTaskModal';
import { Repeat, Lock, Unlock, Plus, Info, Clock, Calendar, Trash2 } from 'lucide-react';

export const RecurringTasksPage: React.FC = () => {
  const toast = useToast();

  const [recurringTasks, setRecurringTasks] = useState<RecurringTaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadRecurringTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await recurringTasksApi.getRecurringTasks();
      setRecurringTasks(data);
    } catch (e: any) {
      toast.error('Failed to load recurring task templates.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRecurringTasks();
  }, [loadRecurringTasks]);

  const handleCreateRecurringTask = async (data: CreateTaskRequest) => {
    try {
      await recurringTasksApi.createRecurringTask(data);
      toast.success('Daily recurring task created! 🌸');
      loadRecurringTasks();
    } catch (e: any) {
      toast.error('Failed to create recurring task template.');
      throw e;
    }
  };

  const handleToggleLock = async (id: number, currentLocked: boolean) => {
    try {
      if (currentLocked) {
        await recurringTasksApi.unlockRecurringTask(id);
        toast.success('Recurring task template unlocked.');
      } else {
        await recurringTasksApi.lockRecurringTask(id);
        toast.info('Recurring task template locked.');
      }
      loadRecurringTasks();
    } catch (e: any) {
      toast.error('Failed to update lock state.');
    }
  };

  const handleDeleteRecurringTask = async (id: number) => {
    try {
      await recurringTasksApi.deleteRecurringTask(id);
      toast.success('Daily recurring stopped for this task. Future occurrences will no longer be generated.');
      loadRecurringTasks();
    } catch (e: any) {
      toast.error('Failed to stop recurring task template.');
    }
  };

  return (
    <Layout>
      <Header
        title="Recurring Task Templates 🔁"
        subtitle="Manage daily recurring task templates that automatically generate occurrences every morning."
        action={
          <AnimatedButton
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Recurring Task
          </AnimatedButton>
        }
      />

      {/* Info Explanation Card */}
      <GlassCard className="mb-8 bg-gradient-to-r from-purple-50/80 to-rose-50/80 border-purple-200/80">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm">How Daily Recurring Tasks Work</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Recurring task templates automatically materialize a new task occurrence for you every day.
              You can click <strong>"Stop Daily Recurring"</strong> below at any time to disable future daily occurrences.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Recurring Tasks List */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : recurringTasks.length === 0 ? (
        <EmptyState
          icon={<Repeat className="w-8 h-8 text-purple-500" />}
          title="No Recurring Tasks Found"
          description="Create a daily recurring task template to automatically generate occurrences every morning."
          actionLabel="Create Recurring Template"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recurringTasks.map((task) => (
            <GlassCard key={task.id} className="flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <PriorityBadge priority={task.priority} />
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      task.locked
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {task.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {task.locked ? 'Locked' : 'Active'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800">{task.title}</h3>
                {task.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    <span>Starts {task.startDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Due {task.dueTime ? task.dueTime.substring(0, 5) : '09:00'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-rose-100/60 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200/60">
                  Daily Recurrence Active
                </span>
                <div className="flex items-center gap-2">
                  <AnimatedButton
                    size="sm"
                    variant={task.locked ? 'secondary' : 'outline'}
                    onClick={() => handleToggleLock(task.id, task.locked)}
                    icon={task.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  >
                    {task.locked ? 'Unlock' : 'Lock'}
                  </AnimatedButton>
                  <AnimatedButton
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteRecurringTask(task.id)}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Stop Recurring
                  </AnimatedButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRecurringTask}
      />
    </Layout>
  );
};
