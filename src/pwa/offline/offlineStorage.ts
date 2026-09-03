import { getDB } from './db';
import {
  DashboardResponse,
  AlertResponse,
  WeeklyAnalyticsResponse,
  MonthlyAnalyticsResponse,
  DailyHistoryResponse,
} from '../../types';

export const offlineStorage = {
  // --- Dashboard Storage ---
  saveDashboard: async (userId: number, date: string, data: DashboardResponse): Promise<void> => {
    if (!userId || !data) return;
    try {
      const db = await getDB();
      const compositeKey = `${userId}_${date || 'today'}`;
      await db.put('dashboard', {
        compositeKey,
        userId,
        date: date || 'today',
        data,
        cachedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to save dashboard to IndexedDB:', err);
    }
  },

  getDashboard: async (userId: number, date?: string): Promise<DashboardResponse | null> => {
    if (!userId) return null;
    try {
      const db = await getDB();
      const compositeKey = `${userId}_${date || 'today'}`;
      const record = await db.get('dashboard', compositeKey);
      return record ? record.data : null;
    } catch (err) {
      console.warn('Failed to read dashboard from IndexedDB:', err);
      return null;
    }
  },

  // --- Alerts Storage ---
  saveAlerts: async (userId: number, alerts: AlertResponse[]): Promise<void> => {
    if (!userId || !alerts) return;
    try {
      const db = await getDB();
      await db.put('alerts', {
        userId,
        alerts,
        cachedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to save alerts to IndexedDB:', err);
    }
  },

  getAlerts: async (userId: number): Promise<AlertResponse[]> => {
    if (!userId) return [];
    try {
      const db = await getDB();
      const record = await db.get('alerts', userId);
      return record ? record.alerts : [];
    } catch (err) {
      console.warn('Failed to read alerts from IndexedDB:', err);
      return [];
    }
  },

  // --- Analytics Storage ---
  saveAnalytics: async (
    userId: number,
    type: 'weekly' | 'monthly',
    date: string,
    data: WeeklyAnalyticsResponse | MonthlyAnalyticsResponse
  ): Promise<void> => {
    if (!userId || !data) return;
    try {
      const db = await getDB();
      const compositeKey = `${userId}_${type}_${date || 'current'}`;
      await db.put('analytics', {
        compositeKey,
        userId,
        type,
        date: date || 'current',
        data,
        cachedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to save analytics to IndexedDB:', err);
    }
  },

  getAnalytics: async <T extends WeeklyAnalyticsResponse | MonthlyAnalyticsResponse>(
    userId: number,
    type: 'weekly' | 'monthly',
    date?: string
  ): Promise<T | null> => {
    if (!userId) return null;
    try {
      const db = await getDB();
      const compositeKey = `${userId}_${type}_${date || 'current'}`;
      const record = await db.get('analytics', compositeKey);
      return record ? (record.data as T) : null;
    } catch (err) {
      console.warn('Failed to read analytics from IndexedDB:', err);
      return null;
    }
  },

  // --- History Storage ---
  saveHistory: async (userId: number, date: string, data: DailyHistoryResponse): Promise<void> => {
    if (!userId || !data) return;
    try {
      const db = await getDB();
      const compositeKey = `${userId}_${date || 'today'}`;
      await db.put('history', {
        compositeKey,
        userId,
        date: date || 'today',
        data,
        cachedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to save history to IndexedDB:', err);
    }
  },

  getHistory: async (userId: number, date?: string): Promise<DailyHistoryResponse | null> => {
    if (!userId) return null;
    try {
      const db = await getDB();
      const compositeKey = `${userId}_${date || 'today'}`;
      const record = await db.get('history', compositeKey);
      return record ? record.data : null;
    } catch (err) {
      console.warn('Failed to read history from IndexedDB:', err);
      return null;
    }
  },
};
