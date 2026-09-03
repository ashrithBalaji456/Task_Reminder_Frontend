import { apiClient } from './axios';
import { ApiResponse, AlertResponse } from '../types';
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

export const alertsApi = {
  getAlerts: async (): Promise<AlertResponse[]> => {
    const userId = getStoredUserId();
    if (!navigator.onLine && userId) {
      return offlineStorage.getAlerts(userId);
    }

    try {
      const res = await apiClient.get<ApiResponse<AlertResponse[]>>('/alerts');
      if (userId && res.data.data) {
        await offlineStorage.saveAlerts(userId, res.data.data);
      }
      return res.data.data;
    } catch (err) {
      if (userId) {
        const cached = await offlineStorage.getAlerts(userId);
        if (cached.length > 0) return cached;
      }
      throw err;
    }
  },
};
