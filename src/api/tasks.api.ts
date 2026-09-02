import { apiClient } from './axios';
import { ApiResponse, TaskResponse, CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest, Priority, PageResponse } from '../types';
import { taskStorage } from '../pwa/offline/taskStorage';
import { syncQueue } from '../pwa/offline/syncQueue';

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

export const tasksApi = {
  createTask: async (data: CreateTaskRequest): Promise<TaskResponse> => {
    const userId = getStoredUserId();
    if (!navigator.onLine && userId) {
      await syncQueue.enqueueOperation(userId, 'CREATE_TASK', data);
      const tempTask: TaskResponse = {
        id: Date.now(), // Temporary client ID
        taskDefinitionId: Date.now(),
        title: data.title,
        description: data.description,
        priority: data.priority,
        taskType: (data.taskType as any) || 'DAILY',
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        dueDateTime: `${data.dueDate}T${data.dueTime}:00Z`,
        reminderOption: data.reminderOption || 'NONE',
        customReminderMinutes: data.customReminderMinutes,
        status: 'PENDING',
        recurring: data.recurring || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await taskStorage.saveUserTasks(userId, [tempTask]);
      return tempTask;
    }

    const res = await apiClient.post<ApiResponse<TaskResponse>>('/tasks', data);
    if (userId && res.data.data) {
      await taskStorage.saveUserTasks(userId, [res.data.data]);
    }
    return res.data.data;
  },

  getTaskById: async (id: number): Promise<TaskResponse> => {
    const res = await apiClient.get<ApiResponse<TaskResponse>>(`/tasks/${id}`);
    return res.data.data;
  },

  getTasksForDate: async (date?: string): Promise<TaskResponse[]> => {
    const userId = getStoredUserId();
    try {
      const res = await apiClient.get<ApiResponse<TaskResponse[]>>('/tasks', {
        params: date ? { date } : {},
      });
      if (userId && res.data.data) {
        await taskStorage.saveUserTasks(userId, res.data.data);
      }
      return res.data.data;
    } catch (err) {
      if (!navigator.onLine && userId) {
        console.info('Offline mode: Loading tasks from IndexedDB');
        const cached = await taskStorage.getUserTasks(userId, date);
        return cached;
      }
      throw err;
    }
  },

  getTodayTasks: async (): Promise<TaskResponse[]> => {
    const userId = getStoredUserId();
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const res = await apiClient.get<ApiResponse<TaskResponse[]>>('/tasks/today');
      if (userId && res.data.data) {
        await taskStorage.saveUserTasks(userId, res.data.data);
      }
      return res.data.data;
    } catch (err) {
      if (!navigator.onLine && userId) {
        console.info('Offline mode: Loading today tasks from IndexedDB');
        const cached = await taskStorage.getUserTasks(userId, todayStr);
        return cached;
      }
      throw err;
    }
  },

  getTomorrowTasks: async (): Promise<TaskResponse[]> => {
    const res = await apiClient.get<ApiResponse<TaskResponse[]>>('/tasks/tomorrow');
    return res.data.data;
  },

  getPendingTasks: async (params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    priority?: Priority;
    recurring?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<TaskResponse>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<TaskResponse>>>('/tasks/pending', {
      params,
    });
    return res.data.data;
  },

  updateTask: async (id: number, data: UpdateTaskRequest): Promise<TaskResponse> => {
    const res = await apiClient.put<ApiResponse<TaskResponse>>(`/tasks/${id}`, data);
    return res.data.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/tasks/${id}`);
  },

  completeTask: async (id: number): Promise<TaskResponse> => {
    const userId = getStoredUserId();
    if (!navigator.onLine && userId) {
      await syncQueue.enqueueOperation(userId, 'MARK_COMPLETED', { taskId: id, completed: true });
      await taskStorage.updateLocalTask(userId, id, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      });
      const cached = await taskStorage.getUserTasks(userId);
      const target = cached.find((t) => t.id === id);
      return target || ({ id, status: 'COMPLETED' } as TaskResponse);
    }

    const res = await apiClient.patch<ApiResponse<TaskResponse>>(`/tasks/${id}/complete`);
    if (userId && res.data.data) {
      await taskStorage.updateLocalTask(userId, id, res.data.data);
    }
    return res.data.data;
  },

  moveTask: async (id: number, targetDate: string): Promise<TaskResponse> => {
    const userId = getStoredUserId();
    if (!navigator.onLine && userId) {
      await syncQueue.enqueueOperation(userId, 'MOVE_TASK', { taskId: id, targetDate });
      await taskStorage.updateLocalTask(userId, id, {
        status: 'MOVED',
        dueDate: targetDate,
      });
      const cached = await taskStorage.getUserTasks(userId);
      const target = cached.find((t) => t.id === id);
      return target || ({ id, status: 'MOVED', dueDate: targetDate } as TaskResponse);
    }

    const res = await apiClient.patch<ApiResponse<TaskResponse>>(`/tasks/${id}/move`, { targetDate } as MoveTaskRequest);
    if (userId && res.data.data) {
      await taskStorage.updateLocalTask(userId, id, res.data.data);
    }
    return res.data.data;
  },

  moveTaskToTomorrow: async (id: number): Promise<TaskResponse> => {
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return tasksApi.moveTask(id, tomorrowStr);
  },
};
