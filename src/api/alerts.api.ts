import { apiClient } from './axios';
import { ApiResponse, AlertResponse } from '../types';

export const alertsApi = {
  getAlerts: async (): Promise<AlertResponse[]> => {
    const res = await apiClient.get<ApiResponse<AlertResponse[]>>('/alerts');
    return res.data.data;
  },
};
