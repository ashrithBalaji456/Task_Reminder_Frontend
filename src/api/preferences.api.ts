import { apiClient } from './axios';
import { ApiResponse, UserEmailPreferenceResponse, UserEmailPreferenceRequest, NotificationLogResponse, NotificationType, PageResponse } from '../types';

export const preferencesApi = {
  getUserPreferences: async (): Promise<UserEmailPreferenceResponse> => {
    const res = await apiClient.get<ApiResponse<UserEmailPreferenceResponse>>('/users/email-preferences');
    return res.data.data;
  },

  updateUserPreferences: async (data: UserEmailPreferenceRequest): Promise<UserEmailPreferenceResponse> => {
    const res = await apiClient.put<ApiResponse<UserEmailPreferenceResponse>>('/users/email-preferences', data);
    return res.data.data;
  },

  getNotificationHistory: async (params?: {
    type?: NotificationType;
    page?: number;
    size?: number;
  }): Promise<PageResponse<NotificationLogResponse>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<NotificationLogResponse>>>('/notifications', {
      params,
    });
    return res.data.data;
  },

  sendTestReminderEmail: async (taskTitle?: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/notifications/test/reminder', null, {
      params: { taskTitle },
    });
    return res.data.data || (res.data as any);
  },

  sendTestWeeklyReport: async (): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/notifications/test/weekly-report');
    return res.data.data || (res.data as any);
  },

  sendTestMonthlyReport: async (): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/notifications/test/monthly-report');
    return res.data.data || (res.data as any);
  },

  sendTestPushNotification: async (): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/notifications/test/push');
    return res.data.data || (res.data as any);
  },
};
