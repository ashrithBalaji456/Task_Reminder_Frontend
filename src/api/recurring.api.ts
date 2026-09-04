import { apiClient } from './axios';
import { ApiResponse, RecurringTaskResponse, CreateTaskRequest, UpdateTaskRequest } from '../types';

export const recurringTasksApi = {
  createRecurringTask: async (data: CreateTaskRequest): Promise<RecurringTaskResponse> => {
    const res = await apiClient.post<ApiResponse<RecurringTaskResponse>>('/recurring-tasks', data);
    return res.data.data;
  },

  getRecurringTasks: async (): Promise<RecurringTaskResponse[]> => {
    const res = await apiClient.get<ApiResponse<RecurringTaskResponse[]>>('/recurring-tasks');
    return res.data.data;
  },

  updateRecurringTask: async (id: number, data: UpdateTaskRequest): Promise<RecurringTaskResponse> => {
    const res = await apiClient.put<ApiResponse<RecurringTaskResponse>>(`/recurring-tasks/${id}`, data);
    return res.data.data;
  },

  lockRecurringTask: async (id: number): Promise<RecurringTaskResponse> => {
    const res = await apiClient.patch<ApiResponse<RecurringTaskResponse>>(`/recurring-tasks/${id}/lock`);
    return res.data.data;
  },

  unlockRecurringTask: async (id: number): Promise<RecurringTaskResponse> => {
    const res = await apiClient.patch<ApiResponse<RecurringTaskResponse>>(`/recurring-tasks/${id}/unlock`);
    return res.data.data;
  },

  deleteRecurringTask: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/recurring-tasks/${id}`);
  },
};
