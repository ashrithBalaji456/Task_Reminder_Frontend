import { apiClient } from './axios';
import { ApiResponse, DailyHistoryResponse } from '../types';
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

export const historyApi = {
  getDailyHistory: async (date?: string): Promise<DailyHistoryResponse> => {
    const userId = getStoredUserId();
    const queryDate = date || 'today';

    if (!navigator.onLine && userId) {
      const cached = await offlineStorage.getHistory(userId, queryDate);
      if (cached) return cached;
    }

    try {
      const res = await apiClient.get<ApiResponse<DailyHistoryResponse>>('/history', {
        params: date ? { date } : {},
      });
      if (userId && res.data.data) {
        await offlineStorage.saveHistory(userId, queryDate, res.data.data);
      }
      return res.data.data;
    } catch (err) {
      if (userId) {
        const cached = await offlineStorage.getHistory(userId, queryDate);
        if (cached) return cached;
      }
      throw err;
    }
  },
};
