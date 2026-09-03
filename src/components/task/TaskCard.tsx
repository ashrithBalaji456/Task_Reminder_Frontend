import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TaskResponse } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { GlassCard } from '../common/GlassCard';
import { AnimatedButton } from '../common/AnimatedButton';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Bell,
  Repeat,
  ArrowRightLeft,
  Trash2,
  Edit2,
} from 'lucide-react';

interface TaskCardProps {
  task: TaskResponse;
  onComplete: (id: number) => Promise<void>;
  onMove: (task: TaskResponse) => void;
  onEdit: (task: TaskResponse) => void;
  onDelete: (id: number) => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onMove,
  onEdit,
  onDelete,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCompleted = task.status === 'COMPLETED';
  const isMoved = task.status === 'MOVED';
  const isCancelled = task.status === 'CANCELLED';

  const handleCompleteClick = async () => {
    if (isCompleted || isCompleting) return;
    setIsCompleting(true);
    try {
      await onComplete(task.id);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (isDeleting) return;
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(task.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatReminder = (option: string, minutes?: number) => {
    switch (option) {
      case 'TEN_MINUTES':
        return '10 mins before';
      case 'THIRTY_MINUTES':
        return '30 mins before';
      case 'ONE_HOUR':
        return '1 hr before';
      case 'TWO_HOURS':
        return '2 hrs before';
      case 'ONE_DAY':
        return '1 day before';
      case 'CUSTOM':
        return `${minutes || 0} mins before`;
      default:
        return null;
    }
  };

  const reminderLabel = formatReminder(task.reminderOption, task.customReminderMinutes);

  return (
    <GlassCard
      className={`transition-all duration-300 ${
        isCompleted
          ? 'opacity-80 bg-emerald-50/40 border-emerald-200/50'
          : isMoved
          ? 'opacity-70 bg-sky-50/40 border-sky-200/50'
          : 'hover:border-rose-300/80'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Main Details */}
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            {task.recurring && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100/80 text-purple-700 border border-purple-200/80">
                <Repeat className="w-3 h-3" />
                Daily
              </span>
            )}
            {reminderLabel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-100">
                <Bell className="w-3 h-3" />
                {reminderLabel}
              </span>
            )}
            {((task as any).syncStatus && (task as any).syncStatus !== 'SYNCED') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100/90 text-amber-800 border border-amber-300 shadow-xs animate-pulse">
                <Clock className="w-3 h-3 text-amber-600" />
                Waiting to sync ⏳
              </span>
            )}
          </div>

          <h3
            className={`text-lg font-bold text-slate-800 tracking-tight leading-snug ${
              isCompleted ? 'line-through text-slate-400' : ''
            }`}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">{task.description}</p>
          )}

          {/* Timing Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span>{task.dueDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>{task.dueTime ? task.dueTime.substring(0, 5) : 'All Day'}</span>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          {!isCompleted && !isMoved && !isCancelled && (
            <AnimatedButton
              size="sm"
              onClick={handleCompleteClick}
              isLoading={isCompleting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Complete
            </AnimatedButton>
          )}

          {isCompleted && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 px-3 py-1.5 bg-emerald-100/60 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              <span>Done</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            {!isCompleted && !isMoved && !isCancelled && (
              <>
                <button
                  onClick={() => onMove(task)}
                  title="Move to another date"
                  className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(task)}
                  title="Edit task"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              title="Delete task"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
