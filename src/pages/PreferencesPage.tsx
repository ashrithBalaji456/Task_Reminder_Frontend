import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { GlassCard } from '../components/common/GlassCard';
import { AnimatedButton } from '../components/common/AnimatedButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { preferencesApi } from '../api/preferences.api';
import { UserEmailPreferenceResponse, NotificationLogResponse } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Bell, Mail, Clock, Globe, History, Save, Smartphone, Sparkles, CheckCircle2, LogOut } from 'lucide-react';
import { GlassSelect } from '../components/common/GlassSelect';
import { TIMEZONE_OPTIONS } from '../constants/timezones';
import { pushNotificationService } from '../pwa/notifications/pushNotificationService';

import { PwaDiagnosticsCard } from '../pwa/components/PwaDiagnosticsCard';

export const PreferencesPage: React.FC = () => {
  const toast = useToast();
  const { user, logout } = useAuth();

  const [taskReminderEnabled, setTaskReminderEnabled] = useState(true);
  const [pushNotificationEnabled, setPushNotificationEnabled] = useState(true);
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);
  const [monthlyReportEnabled, setMonthlyReportEnabled] = useState(true);
  const [preferredWeeklyReportDay, setPreferredWeeklyReportDay] = useState('SUNDAY');
  const [preferredWeeklyReportTime, setPreferredWeeklyReportTime] = useState('18:00');
  const [timezone, setTimezone] = useState('UTC');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPref, setIsLoadingPref] = useState(true);
  const [isPushSubscribing, setIsPushSubscribing] = useState(false);

  // Notification logs history
  const [notifications, setNotifications] = useState<NotificationLogResponse[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // Email & Push Test state
  const [testingReminder, setTestingReminder] = useState(false);
  const [testingWeekly, setTestingWeekly] = useState(false);
  const [testingMonthly, setTestingMonthly] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await preferencesApi.sendTestPushNotification();
      toast.success(res.message || "Test Web Push notification sent!");
      loadLogs();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to send test push notification.");
    } finally {
      setTestingPush(false);
    }
  };

  const loadPreferences = useCallback(async () => {
    setIsLoadingPref(true);
    try {
      const pref = await preferencesApi.getUserPreferences();
      setTaskReminderEnabled(pref.taskReminderEnabled);
      setPushNotificationEnabled(pref.pushNotificationEnabled ?? true);
      setWeeklyReportEnabled(pref.weeklyReportEnabled);
      setMonthlyReportEnabled(pref.monthlyReportEnabled);
      setPreferredWeeklyReportDay(pref.preferredWeeklyReportDay || 'SUNDAY');
      setPreferredWeeklyReportTime(pref.preferredWeeklyReportTime ? pref.preferredWeeklyReportTime.substring(0, 5) : '18:00');
      setTimezone(pref.timezone || 'UTC');
    } catch (e: any) {
      toast.error('Failed to load notification preferences.');
    } finally {
      setIsLoadingPref(false);
    }
  }, [toast]);

  const loadLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const paged = await preferencesApi.getNotificationHistory({ page: 0, size: 20 });
      setNotifications(paged.content || []);
    } catch (e: any) {
      toast.error('Failed to load notification logs.');
    } finally {
      setIsLoadingLogs(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPreferences();
    loadLogs();
  }, [loadPreferences, loadLogs]);

  const handleTestReminder = async () => {
    setTestingReminder(true);
    try {
      const res = await preferencesApi.sendTestReminderEmail("Meeting Preparation & Deck Review");
      toast.success(res.message || "Test reminder email sent to your inbox!");
      loadLogs();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to send test reminder email.");
    } finally {
      setTestingReminder(false);
    }
  };

  const handleTestWeekly = async () => {
    setTestingWeekly(true);
    try {
      const res = await preferencesApi.sendTestWeeklyReport();
      toast.success(res.message || "Test weekly report email sent!");
      loadLogs();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to send test weekly report.");
    } finally {
      setTestingWeekly(false);
    }
  };

  const handleTestMonthly = async () => {
    setTestingMonthly(true);
    try {
      const res = await preferencesApi.sendTestMonthlyReport();
      toast.success(res.message || "Test monthly report email sent!");
      loadLogs();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to send test monthly report.");
    } finally {
      setTestingMonthly(false);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    setPushNotificationEnabled(enabled);
    if (enabled) {
      // Synchronous permission request in user gesture
      let perm: NotificationPermission = 'default';
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          perm = await Notification.requestPermission();
        } catch (e) {
          console.warn('Error during Notification.requestPermission():', e);
        }
      }

      if (perm !== 'granted') {
        toast.warning(`Notification permission was not granted (Permission state: '${perm}').`);
        setPushNotificationEnabled(false);
        return;
      }

      setIsPushSubscribing(true);
      try {
        const success = await pushNotificationService.subscribeToPushNotifications();
        if (success) {
          toast.success('Web Push Notifications enabled & device registered! 🔔');
        } else {
          toast.warning('Browser notification permission was not granted.');
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to register push notifications.');
      } finally {
        setIsPushSubscribing(false);
      }
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await preferencesApi.updateUserPreferences({
        taskReminderEnabled,
        pushNotificationEnabled,
        weeklyReportEnabled,
        monthlyReportEnabled,
        preferredWeeklyReportDay,
        preferredWeeklyReportTime: preferredWeeklyReportTime.length === 5 ? `${preferredWeeklyReportTime}:00` : preferredWeeklyReportTime,
        timezone,
      });
      toast.success('Notification preferences saved successfully! 🌸');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <Header
        title="Notification Preferences & Logs ✉️"
        subtitle="Manage Brevo email notifications, Web Push alerts, report schedules, and delivery logs."
      />

      <div className="mb-8">
        <PwaDiagnosticsCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-rose-500" />
              Notification Toggles & Channels
            </h3>

            {isLoadingPref ? (
              <CardSkeleton />
            ) : (
              <form onSubmit={handleSavePreferences} className="space-y-6">
                {/* Toggles List */}
                <div className="space-y-4">
                  {/* Web Push Notifications */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/90 to-purple-50/90 border border-rose-200/90 hover:border-rose-300 transition-all space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-purple-600" />
                          Web Push Notifications
                          <span className="text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg border border-purple-200">
                            PWA Alarm
                          </span>
                        </span>
                        <p className="text-xs text-slate-500">
                          Receive instant native notifications on your phone or desktop for upcoming tasks
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        disabled={isPushSubscribing}
                        checked={pushNotificationEnabled}
                        onChange={(e) => handlePushToggle(e.target.checked)}
                        className="w-5 h-5 text-purple-600 rounded-sm focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                      />
                    </label>

                    {/* Prominent Direct Test Button */}
                    <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-purple-900">
                        Test mobile push delivery instantly:
                      </span>
                      <AnimatedButton
                        type="button"
                        variant="primary"
                        size="sm"
                        isLoading={testingPush}
                        onClick={handleTestPush}
                        icon={<Smartphone className="w-3.5 h-3.5" />}
                        className="text-xs py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md hover:shadow-lg"
                      >
                        Send Test Push 📲
                      </AnimatedButton>
                    </div>
                  </div>

                  {/* Task Reminders */}
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-white/70 border border-rose-100 hover:border-rose-200 transition-all cursor-pointer">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Bell className="w-4 h-4 text-rose-500" />
                        Email Task Reminders
                      </span>
                      <p className="text-xs text-slate-500">
                        Receive Brevo email notifications before task due times
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={taskReminderEnabled}
                      onChange={(e) => setTaskReminderEnabled(e.target.checked)}
                      className="w-5 h-5 text-rose-600 rounded-sm focus:ring-rose-500 cursor-pointer"
                    />
                  </label>

                  {/* Weekly Report */}
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-white/70 border border-purple-100 hover:border-purple-200 transition-all cursor-pointer">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-500" />
                        Weekly Productivity Report
                      </span>
                      <p className="text-xs text-slate-500">
                        Receive a weekly summary email with embedded trend charts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={weeklyReportEnabled}
                      onChange={(e) => setWeeklyReportEnabled(e.target.checked)}
                      className="w-5 h-5 text-purple-600 rounded-sm focus:ring-purple-500 cursor-pointer"
                    />
                  </label>

                  {/* Monthly Report */}
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-white/70 border border-amber-100 hover:border-amber-200 transition-all cursor-pointer">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Mail className="w-4 h-4 text-amber-500" />
                        Monthly Productivity Report
                      </span>
                      <p className="text-xs text-slate-500">
                        Receive a monthly deep-dive email with priority performance breakdown
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={monthlyReportEnabled}
                      onChange={(e) => setMonthlyReportEnabled(e.target.checked)}
                      className="w-5 h-5 text-amber-600 rounded-sm focus:ring-amber-500 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Report Schedule & Timezone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-rose-100/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Weekly Report Day
                    </label>
                    <GlassSelect
                      options={[
                        { value: 'SUNDAY', label: 'Sunday Evening' },
                        { value: 'MONDAY', label: 'Monday Morning' },
                        { value: 'FRIDAY', label: 'Friday Afternoon' },
                      ]}
                      value={preferredWeeklyReportDay}
                      onChange={setPreferredWeeklyReportDay}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Weekly Report Time
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        type="time"
                        value={preferredWeeklyReportTime}
                        onChange={(e) => setPreferredWeeklyReportTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    User Timezone
                  </label>
                  <GlassSelect
                    options={TIMEZONE_OPTIONS}
                    value={timezone}
                    onChange={setTimezone}
                    icon={<Globe className="w-4 h-4 text-slate-700" />}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <AnimatedButton type="submit" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
                    Save Preferences
                  </AnimatedButton>
                </div>
              </form>
            )}
          </GlassCard>
        </div>

        {/* Notification History Column */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-500" />
              Delivery History Logs
            </h3>

            {isLoadingLogs ? (
              <CardSkeleton />
            ) : notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No notification logs recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {notifications.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-white/60 border border-rose-100 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.notificationType}</span>
                      <StatusBadge status={log.status} />
                    </div>

                    {log.periodIdentifier && (
                      <p className="text-slate-500">Period: {log.periodIdentifier}</p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Attempts: {log.attemptCount}</span>
                      <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Instant Email Dispatch Test Card */}
          <GlassCard className="border-purple-200/80 bg-gradient-to-r from-purple-50/60 to-rose-50/60">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-600" />
              Instant Email & Push Dispatch Test
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Send immediate test emails and native mobile push alerts to verify notification delivery to <strong>{user?.email}</strong>.
            </p>

            <div className="space-y-2">
              <AnimatedButton
                type="button"
                variant="secondary"
                size="sm"
                isLoading={testingPush}
                onClick={handleTestPush}
                icon={<Smartphone className="w-4 h-4 text-indigo-600" />}
                className="w-full justify-start text-xs font-bold border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 shadow-sm"
              >
                Send Test Mobile Web Push Notification 📲
              </AnimatedButton>

              <AnimatedButton
                type="button"
                variant="secondary"
                size="sm"
                isLoading={testingReminder}
                onClick={handleTestReminder}
                icon={<Bell className="w-4 h-4 text-amber-600" />}
                className="w-full justify-start text-xs"
              >
                Send Test Task Reminder Email 📩
              </AnimatedButton>

              <AnimatedButton
                type="button"
                variant="secondary"
                size="sm"
                isLoading={testingWeekly}
                onClick={handleTestWeekly}
                icon={<Sparkles className="w-4 h-4 text-purple-600" />}
                className="w-full justify-start text-xs"
              >
                Send Test Weekly Analytics Report
              </AnimatedButton>

              <AnimatedButton
                type="button"
                variant="secondary"
                size="sm"
                isLoading={testingMonthly}
                onClick={handleTestMonthly}
                icon={<History className="w-4 h-4 text-rose-600" />}
                className="w-full justify-start text-xs"
              >
                Send Test Monthly Analytics Report
              </AnimatedButton>
            </div>
          </GlassCard>

          {/* Account & Logout Card */}
          <GlassCard className="border-rose-200/80 bg-gradient-to-r from-rose-50/60 to-purple-50/60">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-rose-500" />
              Account Session
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Signed in as <strong className="text-slate-800">{user?.name || 'User'}</strong> ({user?.email || 'authenticated'})
            </p>
            <AnimatedButton
              type="button"
              variant="danger"
              size="sm"
              onClick={logout}
              icon={<LogOut className="w-4 h-4" />}
              className="w-full"
            >
              Sign Out of Account
            </AnimatedButton>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
};
