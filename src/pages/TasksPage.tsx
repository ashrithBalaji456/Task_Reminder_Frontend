import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { TaskCard } from '../components/task/TaskCard';
import { CreateTaskModal } from '../components/task/CreateTaskModal';
import { MoveTaskModal } from '../components/task/MoveTaskModal';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { AnimatedButton } from '../components/common/AnimatedButton';
import { GlassSelect } from '../components/common/GlassSelect';
import { GlassDatePicker } from '../components/common/GlassDatePicker';
import { tasksApi } from '../api/tasks.api';
import { TaskResponse, CreateTaskRequest, Priority } from '../types';
import { useToast } from '../context/ToastContext';
import { Plus, Search, Calendar, CheckSquare, Sparkles, Filter } from 'lucide-react';

type TaskViewTab = 'today' | 'tomorrow' | 'date' | 'pending';

export const TasksPage: React.FC = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TaskViewTab>('today');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');

  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null);
  const [movingTask, setMovingTask] = useState<TaskResponse | null>(null);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: TaskResponse[] = [];
      if (activeTab === 'today') {
        data = await tasksApi.getTodayTasks();
      } else if (activeTab === 'tomorrow') {
        data = await tasksApi.getTomorrowTasks();
      } else if (activeTab === 'date') {
        data = await tasksApi.getTasksForDate(selectedDate);
      } else if (activeTab === 'pending') {
        const paged = await tasksApi.getPendingTasks({
          priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
          page: 0,
          size: 50,
        });
        data = paged.content || [];
      }
      setTasks(data);
    } catch (e: any) {
      toast.error('Failed to load tasks.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedDate, priorityFilter, toast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const handleCreateTask = async (data: CreateTaskRequest) => {
    try {
      if (editingTask) {
        await tasksApi.updateTask(editingTask.id, {
          title: data.title,
          description: data.description,
          priority: data.priority,
          dueTime: data.dueTime,
          reminderOption: data.reminderOption,
          customReminderMinutes: data.customReminderMinutes,
        });
        toast.success('Task updated successfully! 🌸');
      } else {
        await tasksApi.createTask(data);
        toast.success('Task created successfully! 🌸');
      }
      loadTasks();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save task.');
      throw e;
    }
  };

  const handleCompleteTask = async (id: number) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'COMPLETED' } : t))
    );
    try {
      await tasksApi.completeTask(id);
      toast.success('Task marked as completed! 🎉');
    } catch (e: any) {
      // Rollback on failure
      loadTasks();
      toast.error('Failed to mark task completed.');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await tasksApi.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success('Task deleted.');
    } catch (e: any) {
      toast.error('Failed to delete task.');
    }
  };

  const handleMoveToTomorrow = async () => {
    if (!movingTask) return;
    try {
      await tasksApi.moveTaskToTomorrow(movingTask.id);
      toast.success(`Moved "${movingTask.title}" to tomorrow! 🌸`);
      loadTasks();
    } catch (e: any) {
      toast.error('Failed to move task.');
    }
  };

  const handleMoveToDate = async (targetDate: string) => {
    if (!movingTask) return;
    try {
      await tasksApi.moveTask(movingTask.id, targetDate);
      toast.success(`Moved "${movingTask.title}" to ${targetDate}! 🌸`);
      loadTasks();
    } catch (e: any) {
      toast.error('Failed to move task.');
    }
  };

  return (
    <Layout>
      <Header
        title="Task Management 🌸"
        subtitle="View, schedule, complete, and move your daily task occurrences."
        action={
          <AnimatedButton
            onClick={() => {
              setEditingTask(null);
              setIsCreateModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Task
          </AnimatedButton>
        }
      />

      {/* Tabs & Filters Bar */}
      <div className="glass-card rounded-3xl p-4 mb-8 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100/60 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-rose-50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('tomorrow')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tomorrow'
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-rose-50'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setActiveTab('date')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'date'
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-rose-50'
              }`}
            >
              Pick Date
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-rose-50'
              }`}
            >
              All Pending
            </button>
          </div>

          {activeTab === 'date' && (
            <div className="w-56">
              <GlassDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Pick custom date..."
              />
            </div>
          )}
        </div>

        {/* Search & Priority Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-xs font-medium"
            />
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <GlassSelect
              options={[
                { value: 'ALL', label: 'All Priorities' },
                { value: 'HIGH', label: '🔴 High Priority Only' },
                { value: 'MEDIUM', label: '🟡 Medium Priority Only' },
                { value: 'LOW', label: '🟢 Low Priority Only' },
              ]}
              value={priorityFilter}
              onChange={(val) => setPriorityFilter(val as any)}
              icon={<Filter className="w-4 h-4 text-slate-700" />}
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-8 h-8 text-rose-500" />}
          title={searchQuery ? 'No matching tasks found' : 'You\'re all caught up! 🎉'}
          description={
            searchQuery
              ? 'Try adjusting your search query or priority filters.'
              : 'No tasks recorded for this view. Create a new task to stay organized.'
          }
          actionLabel="Create New Task"
          onAction={() => {
            setEditingTask(null);
            setIsCreateModalOpen(true);
          }}
        />
      ) : (
        <motion.div layout className="space-y-4">
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <TaskCard
                  task={task}
                  onComplete={handleCompleteTask}
                  onMove={(t) => setMovingTask(t)}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setIsCreateModalOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create / Edit Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateTask}
        editTask={editingTask}
        defaultDate={activeTab === 'date' ? selectedDate : undefined}
      />

      {/* Move Task Modal */}
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
