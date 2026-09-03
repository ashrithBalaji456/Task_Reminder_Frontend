import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { AnimatedButton } from '../common/AnimatedButton';
import { GlassSelect } from '../common/GlassSelect';
import { GlassDatePicker } from '../common/GlassDatePicker';
import { Priority, ReminderOption, TaskResponse, CreateTaskRequest, RepeatStopCondition } from '../../types';
import { Calendar, Clock, Bell, Repeat, AlertTriangle, Check, Volume2, Mail } from 'lucide-react';

import { GlassTimePicker } from '../common/GlassTimePicker';

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
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentTimeStr = useMemo(() => {
    const d = new Date();
    const hrs = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
  }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState(() => defaultDate || todayStr);
  const [dueTime, setDueTime] = useState('09:00');
  const [recurring, setRecurring] = useState(false);
  const [reminderOption, setReminderOption] = useState<ReminderOption>('TEN_MINUTES');
  const [customReminderMinutes, setCustomReminderMinutes] = useState<number | undefined>(undefined);
  
  // Repeat reminder settings
  const [repeatFrequencyMinutes, setRepeatFrequencyMinutes] = useState<number | undefined>(2);
  const [repeatStopCondition, setRepeatStopCondition] = useState<RepeatStopCondition>('UNTIL_TASK_TIME');
  const [maxReminderCount, setMaxReminderCount] = useState<number>(5);
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [notifyByPush, setNotifyByPush] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || '');
      setDescription(editTask.description || '');
      setPriority(editTask.priority || 'MEDIUM');
      setDueDate(editTask.dueDate || defaultDate || todayStr);
      setDueTime(editTask.dueTime ? editTask.dueTime.substring(0, 5) : '09:00');
      setRecurring(editTask.recurring || false);
      setReminderOption(editTask.reminderOption || 'TEN_MINUTES');
      setCustomReminderMinutes(editTask.customReminderMinutes);
      setRepeatFrequencyMinutes(editTask.repeatFrequencyMinutes ?? 2);
      setRepeatStopCondition(editTask.repeatStopCondition || 'UNTIL_TASK_TIME');
      setMaxReminderCount(editTask.maxReminderCount || 5);
      setNotifyByEmail(editTask.notifyByEmail ?? true);
      setNotifyByPush(editTask.notifyByPush ?? true);
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate(defaultDate || todayStr);
      // If default date is today, default time to 15 mins from now
      const now = new Date();
      now.setMinutes(now.getMinutes() + 15);
      const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setDueTime(defaultTime);
      setRecurring(false);
      setReminderOption('TEN_MINUTES');
      setCustomReminderMinutes(undefined);
      setRepeatFrequencyMinutes(2);
      setRepeatStopCondition('UNTIL_TASK_TIME');
      setMaxReminderCount(5);
      setNotifyByEmail(true);
      setNotifyByPush(true);
    }
  }, [editTask, defaultDate, isOpen, todayStr]);

  // Real-time Date/Time Validation
  const validationError = useMemo(() => {
    if (dueDate < todayStr) {
      return 'Task date cannot be in the past. Please select today or a future date.';
    }
    if (dueDate === todayStr) {
      const now = new Date();
      const currentHrs = now.getHours();
      const currentMins = now.getMinutes();

      const [selectedHrs, selectedMins] = dueTime.split(':').map(Number);
      if (
        selectedHrs < currentHrs ||
        (selectedHrs === currentHrs && selectedMins <= currentMins)
      ) {
        return `The selected time (${dueTime}) has already passed for today. Please choose a future time.`;
      }
    }
    return null;
  }, [dueDate, dueTime, todayStr]);

  // Calculate First Reminder Offset Minutes
  const firstReminderOffsetMinutes = useMemo(() => {
    switch (reminderOption) {
      case 'TEN_MINUTES': return 10;
      case 'THIRTY_MINUTES': return 30;
      case 'ONE_HOUR': return 60;
      case 'TWO_HOURS': return 120;
      case 'ONE_DAY': return 1440;
      case 'CUSTOM': return customReminderMinutes || 0;
      default: return 0;
    }
  }, [reminderOption, customReminderMinutes]);

  // Live Reminder Schedule Preview Generator
  const reminderSchedulePreview = useMemo(() => {
    if (reminderOption === 'NONE' || validationError || !dueDate || !dueTime) return [];

    try {
      const [hrs, mins] = dueTime.split(':').map(Number);
      const taskDate = new Date(`${dueDate}T${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`);

      const firstReminderTime = new Date(taskDate.getTime() - firstReminderOffsetMinutes * 60 * 1000);
      const schedule: string[] = [];

      let current = new Date(firstReminderTime);
      let count = 0;

      while (current < taskDate) {
        schedule.push(
          current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        );
        count++;

        if (!repeatFrequencyMinutes || repeatFrequencyMinutes <= 0) break;
        if (repeatStopCondition === 'AFTER_MAX_COUNT' && count >= maxReminderCount) break;

        current = new Date(current.getTime() + repeatFrequencyMinutes * 60 * 1000);
      }

      return schedule;
    } catch (e) {
      return [];
    }
  }, [dueDate, dueTime, reminderOption, firstReminderOffsetMinutes, repeatFrequencyMinutes, repeatStopCondition, maxReminderCount, validationError]);

  const handleQuickDate = (type: 'today' | 'tomorrow') => {
    const d = new Date();
    if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || validationError) return;

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
        repeatFrequencyMinutes: reminderOption !== 'NONE' ? repeatFrequencyMinutes : undefined,
        repeatStopCondition: reminderOption !== 'NONE' ? repeatStopCondition : undefined,
        maxReminderCount: reminderOption !== 'NONE' && repeatStopCondition === 'AFTER_MAX_COUNT' ? maxReminderCount : undefined,
        notifyByEmail,
        notifyByPush,
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
      subtitle={editTask ? 'Update task options and reminder schedule' : 'Add a new task occurrence with smart repeat reminders'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Validation Warning Banner */}
        {validationError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-300/60 text-rose-900 flex items-center gap-3 text-xs font-semibold animate-shake">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

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
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl bg-purple-50/60 border border-purple-100 w-full hover:bg-purple-50 transition-colors">
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
            min={todayStr}
            onChange={setDueDate}
            placeholder="Select task date..."
            popoverPosition="top"
          />
        </div>

        {/* Time & Initial Email Reminder Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Due Time *
            </label>
            <GlassTimePicker
              value={dueTime}
              onChange={setDueTime}
              popoverPosition="top"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              First Reminder Time
            </label>
            <GlassSelect
              options={[
                { value: 'NONE', label: 'No Reminder' },
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

        {/* Extended Repeat Reminder Settings Section */}
        {reminderOption !== 'NONE' && (
          <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100/80 space-y-4">
            <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <span>Configurable Repeat Reminders & Channels</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Repeat Frequency
                </label>
                <GlassSelect
                  options={[
                    { value: '0', label: 'No Repeat (Single Alert)' },
                    { value: '1', label: 'Every 1 Minute' },
                    { value: '2', label: 'Every 2 Minutes' },
                    { value: '5', label: 'Every 5 Minutes' },
                    { value: '10', label: 'Every 10 Minutes' },
                    { value: '15', label: 'Every 15 Minutes' },
                  ]}
                  value={String(repeatFrequencyMinutes ?? 0)}
                  onChange={(val) => setRepeatFrequencyMinutes(parseInt(val) || undefined)}
                  popoverPosition="top"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stop Condition
                </label>
                <GlassSelect
                  options={[
                    { value: 'UNTIL_TASK_TIME', label: 'Stop at Task Due Time' },
                    { value: 'AFTER_MAX_COUNT', label: 'Stop After Max Reminders' },
                    { value: 'ON_COMPLETION', label: 'Stop When Completed' },
                  ]}
                  value={repeatStopCondition}
                  onChange={(val) => setRepeatStopCondition(val as RepeatStopCondition)}
                  popoverPosition="top"
                />
              </div>
            </div>

            {repeatStopCondition === 'AFTER_MAX_COUNT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maximum Reminder Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={maxReminderCount}
                  onChange={(e) => setMaxReminderCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-medium"
                />
              </div>
            )}

            {/* Channels Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Notification Channels
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={notifyByPush}
                    onChange={(e) => setNotifyByPush(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded-sm cursor-pointer"
                  />
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span>Web Push Notification</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={notifyByEmail}
                    onChange={(e) => setNotifyByEmail(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded-sm cursor-pointer"
                  />
                  <Mail className="w-4 h-4 text-rose-600" />
                  <span>Brevo Email</span>
                </label>
              </div>
            </div>

            {/* Live Schedule Preview */}
            {reminderSchedulePreview.length > 0 && (
              <div className="pt-2 border-t border-purple-100">
                <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                  🔔 Live Reminder Schedule Preview ({reminderSchedulePreview.length} alerts)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {reminderSchedulePreview.map((time, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-100/80 text-purple-800 border border-purple-200/80 flex items-center gap-1 shadow-2xs"
                    >
                      <Bell className="w-3 h-3 text-purple-600" />
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-rose-100/60">
          <AnimatedButton type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </AnimatedButton>
          <AnimatedButton
            type="submit"
            size="sm"
            isLoading={isLoading}
            disabled={!!validationError}
          >
            {editTask ? 'Save Changes' : 'Create Task'}
          </AnimatedButton>
        </div>
      </form>
    </Modal>
  );
};
