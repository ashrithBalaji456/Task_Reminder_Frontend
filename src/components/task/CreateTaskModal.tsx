import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { AnimatedButton } from '../common/AnimatedButton';
import { GlassSelect } from '../common/GlassSelect';
import { GlassDatePicker } from '../common/GlassDatePicker';
import { Priority, ReminderOption, TaskResponse, CreateTaskRequest } from '../../types';
import { Calendar, Clock, Bell, Repeat } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskRequest) => Promise<void>;
  editTask?: TaskResponse | null;
  defaultDate?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editTask,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState(() => defaultDate || new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('09:00');
  const [recurring, setRecurring] = useState(false);
  const [reminderOption, setReminderOption] = useState<ReminderOption>('TEN_MINUTES');
  const [customReminderMinutes, setCustomReminderMinutes] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || '');
      setDescription(editTask.description || '');
      setPriority(editTask.priority || 'MEDIUM');
      setDueDate(editTask.dueDate || defaultDate || new Date().toISOString().split('T')[0]);
      setDueTime(editTask.dueTime ? editTask.dueTime.substring(0, 5) : '09:00');
      setRecurring(editTask.recurring || false);
      setReminderOption(editTask.reminderOption || 'TEN_MINUTES');
      setCustomReminderMinutes(editTask.customReminderMinutes);
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate(defaultDate || new Date().toISOString().split('T')[0]);
      setDueTime('09:00');
      setRecurring(false);
      setReminderOption('TEN_MINUTES');
      setCustomReminderMinutes(undefined);
    }
  }, [editTask, defaultDate, isOpen]);

  const handleQuickDate = (type: 'today' | 'tomorrow') => {
    const d = new Date();
    if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const payload: CreateTaskRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate,
        dueTime: dueTime.length === 5 ? `${dueTime}:00` : dueTime,
        recurring,
        recurrenceType: recurring ? 'DAILY' : undefined,
        reminderOption,
        customReminderMinutes: reminderOption === 'CUSTOM' ? customReminderMinutes : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      await onSubmit(payload);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTask ? 'Edit Task' : 'Create New Task'}
      subtitle={editTask ? 'Update task options' : 'Add a new task occurrence to your schedule'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Task Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Team Standup & Morning Sync"
            className="w-full px-4 py-3 rounded-2xl glass-input text-sm font-medium"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes or subtasks..."
            rows={2}
            className="w-full px-4 py-3 rounded-2xl glass-input text-sm"
          />
        </div>

        {/* Priority & Recurrence Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <GlassSelect
              options={[
                { value: 'HIGH', label: '🔴 High Priority' },
                { value: 'MEDIUM', label: '🟡 Medium Priority' },
                { value: 'LOW', label: '🟢 Low Priority' },
              ]}
              value={priority}
              onChange={(val) => setPriority(val as Priority)}
            />
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-purple-50/60 border border-purple-100 w-full">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded-sm focus:ring-purple-500 cursor-pointer"
              />
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Repeat className="w-4 h-4 text-purple-600" />
                <span>Daily Recurring Task</span>
              </div>
            </label>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Due Date *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickDate('today')}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('tomorrow')}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl cursor-pointer"
              >
                Tomorrow
              </button>
            </div>
          </div>
          <GlassDatePicker
            value={dueDate}
            onChange={setDueDate}
            placeholder="Select task date..."
            popoverPosition="top"
          />
        </div>

        {/* Time & Email Reminder Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Due Time *
            </label>
            <div className="relative">
              <Clock className="w-5 h-5 text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-sm font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Reminder
            </label>
            <GlassSelect
              options={[
                { value: 'NONE', label: 'No Email Reminder' },
                { value: 'TEN_MINUTES', label: '10 Minutes Before' },
                { value: 'THIRTY_MINUTES', label: '30 Minutes Before' },
                { value: 'ONE_HOUR', label: '1 Hour Before' },
                { value: 'TWO_HOURS', label: '2 Hours Before' },
                { value: 'ONE_DAY', label: '1 Day Before' },
                { value: 'CUSTOM', label: 'Custom Minutes' },
              ]}
              value={reminderOption}
              onChange={(val) => setReminderOption(val as ReminderOption)}
              icon={<Bell className="w-5 h-5 text-slate-700" />}
              popoverPosition="top"
            />
          </div>
        </div>

        {reminderOption === 'CUSTOM' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Custom Reminder Minutes
            </label>
            <input
              type="number"
              min="1"
              max="10080"
              value={customReminderMinutes || ''}
              onChange={(e) => setCustomReminderMinutes(parseInt(e.target.value) || undefined)}
              placeholder="e.g. 45"
              className="w-full px-4 py-3 rounded-2xl glass-input text-sm"
              required
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-rose-100/60">
          <AnimatedButton type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </AnimatedButton>
          <AnimatedButton type="submit" size="sm" isLoading={isLoading}>
            {editTask ? 'Save Changes' : 'Create Task'}
          </AnimatedButton>
        </div>
      </form>
    </Modal>
  );
};
