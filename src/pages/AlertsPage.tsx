import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout/Layout';
import { Header } from '../components/layout/Header';
import { GlassCard } from '../components/common/GlassCard';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { AnimatedButton } from '../components/common/AnimatedButton';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { alertsApi } from '../api/alerts.api';
import { tasksApi } from '../api/tasks.api';
import { AlertResponse } from '../types';
import { useToast } from '../context/ToastContext';
import { Bell, Clock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const toast = useToast();

  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await alertsApi.getAlerts();
      setAlerts(data);
    } catch (e: any) {
      toast.error('Failed to load urgent alerts.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAlerts();
    // Configurable polling interval (every 60s)
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const handleCompleteAlertTask = async (id: number) => {
    try {
      await tasksApi.completeTask(id);
      toast.success('Task marked completed! 🎉');
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      toast.error('Failed to complete task.');
    }
  };

  return (
    <Layout>
      <Header
        title="Urgent Alerts ⏰"
        subtitle="Tasks due within the next 30 minutes requiring your immediate attention."
        action={
          <AnimatedButton
            variant="secondary"
            size="sm"
            onClick={loadAlerts}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh Alerts
          </AnimatedButton>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-rose-500" />}
          title="No Urgent Alerts Right Now"
          description="You have no pending tasks due within the next 30 minutes. Great job stay relaxed! 🌸"
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <GlassCard key={alert.id} className="border-rose-200/80 bg-rose-50/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={alert.priority} />
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-xs animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Due in {alert.minutesRemaining} mins
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">{alert.title}</h3>
                  {alert.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium pt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                      <span>
                        Due at {alert.dueTime ? alert.dueTime.substring(0, 5) : '09:00'} ({alert.dueDate})
                      </span>
                    </div>
                  </div>
                </div>

                <AnimatedButton
                  size="sm"
                  onClick={() => handleCompleteAlertTask(alert.id)}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Complete Now
                </AnimatedButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </Layout>
  );
};
