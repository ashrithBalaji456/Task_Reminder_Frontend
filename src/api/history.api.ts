import { apiClient } from './axios';
import { ApiResponse, DailyHistoryResponse } from '../types';

export const historyApi = {
  getDailyHistory: async (date?: string): Promise<DailyHistoryResponse> => {
    const res = await apiClient.get<ApiResponse<DailyHistoryResponse>>('/history', {
      params: date ? { date } : {},
    });
    return res.data.data;
  },
};
