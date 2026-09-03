import { apiClient } from './axios';
import { ApiResponse, WeeklyAnalyticsResponse, MonthlyAnalyticsResponse } from '../types';
import { offlineStorage } from '../pwa/offline/offlineStorage';

const getStoredUserId = (): number | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id || null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const analyticsApi = {
  getWeeklyAnalytics: async (date?: string): Promise<WeeklyAnalyticsResponse> => {
    const userId = getStoredUserId();
    const queryDate = date || 'current';

    if (!navigator.onLine && userId) {
      const cached = await offlineStorage.getAnalytics<WeeklyAnalyticsResponse>(userId, 'weekly', queryDate);
      if (cached) return cached;
    }

    try {
      const res = await apiClient.get<ApiResponse<WeeklyAnalyticsResponse>>('/analytics/weekly', {
        params: date ? { date } : {},
      });
      if (userId && res.data.data) {
        await offlineStorage.saveAnalytics(userId, 'weekly', queryDate, res.data.data);
      }
      return res.data.data;
    } catch (err) {
      if (userId) {
        const cached = await offlineStorage.getAnalytics<WeeklyAnalyticsResponse>(userId, 'weekly', queryDate);
        if (cached) return cached;
      }
      throw err;
    }
  },

  getMonthlyAnalytics: async (date?: string): Promise<MonthlyAnalyticsResponse> => {
    const userId = getStoredUserId();
    const queryDate = date || 'current';

    if (!navigator.onLine && userId) {
      const cached = await offlineStorage.getAnalytics<MonthlyAnalyticsResponse>(userId, 'monthly', queryDate);
      if (cached) return cached;
    }

    try {
      const res = await apiClient.get<ApiResponse<MonthlyAnalyticsResponse>>('/analytics/monthly', {
        params: date ? { date } : {},
      });
      if (userId && res.data.data) {
        await offlineStorage.saveAnalytics(userId, 'monthly', queryDate, res.data.data);
      }
      return res.data.data;
    } catch (err) {
      if (userId) {
        const cached = await offlineStorage.getAnalytics<MonthlyAnalyticsResponse>(userId, 'monthly', queryDate);
        if (cached) return cached;
      }
      throw err;
    }
  },
};
