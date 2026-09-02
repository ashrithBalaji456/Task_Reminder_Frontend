import { apiClient } from './axios';
import { ApiResponse, DashboardResponse } from '../types';

export const dashboardApi = {
  getDailyDashboard: async (date?: string): Promise<DashboardResponse> => {
    const res = await apiClient.get<ApiResponse<DashboardResponse>>('/dashboard/daily', {
      params: date ? { date } : {},
    });
    return res.data.data;
  },
};
