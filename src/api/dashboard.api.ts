import { apiClient } from './axios';
import { ApiResponse, DashboardResponse } from '../types';
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

export const dashboardApi = {
  getDailyDashboard: async (date?: string): Promise<DashboardResponse> => {
    const userId = getStoredUserId();
    const queryDate = date || new Date().toISOString().split('T')[0];

    if (!navigator.onLine && userId) {
      const cached = await offlineStorage.getDashboard(userId, queryDate);
      if (cached) return cached;
    }

    try {
      const res = await apiClient.get<ApiResponse<DashboardResponse>>('/dashboard/daily', {
        params: date ? { date } : {},
      });
      console.log('[DASHBOARD] server response:', {
        date: res.data.data?.date,
        todayTotal: res.data.data?.totalTasks,
        todayCompleted: res.data.data?.completedTasks,
        todayPending: res.data.data?.pendingTasks,
        allTimeTotal: res.data.data?.allTimeTotalTasks,
        allTimeCompleted: res.data.data?.allTimeCompletedTasks,
        allTimePending: res.data.data?.allTimePendingTasks,
        allTimeCancelled: res.data.data?.allTimeCancelledTasks,
      });
      if (userId && res.data.data) {
        await offlineStorage.saveDashboard(userId, queryDate, res.data.data);
      }
      return res.data.data;
    } catch (err) {
      if (userId) {
        const cached = await offlineStorage.getDashboard(userId, queryDate);
        if (cached) return cached;
      }
      throw err;
    }
  },
};
