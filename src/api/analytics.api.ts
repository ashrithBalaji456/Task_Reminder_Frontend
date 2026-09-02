import { apiClient } from './axios';
import { ApiResponse, WeeklyAnalyticsResponse, MonthlyAnalyticsResponse } from '../types';

export const analyticsApi = {
  getWeeklyAnalytics: async (date?: string): Promise<WeeklyAnalyticsResponse> => {
    const res = await apiClient.get<ApiResponse<WeeklyAnalyticsResponse>>('/analytics/weekly', {
      params: date ? { date } : {},
    });
    return res.data.data;
  },

  getMonthlyAnalytics: async (date?: string): Promise<MonthlyAnalyticsResponse> => {
    const res = await apiClient.get<ApiResponse<MonthlyAnalyticsResponse>>('/analytics/monthly', {
      params: date ? { date } : {},
    });
    return res.data.data;
  },
};
