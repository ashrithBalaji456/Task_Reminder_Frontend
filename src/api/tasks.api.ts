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
  createTask: async (data: CreateTaskRequest, forceDirectApi = false): Promise<TaskResponse> => {
    const userId = getStoredUserId();
    if (!forceDirectApi && (!navigator.onLine || !userId)) {
      const tempId = Date.now();
      const payloadWithTemp = { ...data, tempTaskId: tempId };
      if (userId) {
        await syncQueue.enqueueOperation(userId, 'CREATE_TASK', payloadWithTemp);
      }

      const tempTask: TaskResponse & { syncStatus?: string } = {
        id: tempId,
        taskDefinitionId: tempId,
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
        syncStatus: 'PENDING_CREATE',
      };

      if (userId) {
        await taskStorage.saveUserTasks(userId, [tempTask]);
      }
      return tempTask;
    }

    const res = await apiClient.post<ApiResponse<TaskResponse>>('/tasks', data);
    if (userId && res.data.data) {
      await taskStorage.saveUserTasks(userId, [res.data.data]);
    }
    return res.data.data;
  },

  getTaskById: async (id: number): Promise<TaskResponse> => {
    const userId = getStoredUserId();
    if (!navigator.onLine && userId) {
      const cachedTasks = await taskStorage.getUserTasks(userId);
      const target = cachedTasks.find((t) => t.id === id);
      if (target) return target;
    }
    const res = await apiClient.get<ApiResponse<TaskResponse>>(`/tasks/${id}`);
    return res.data.data;
  },

  getTasksForDate: async (date?: string): Promise<TaskResponse[]> => {
    const userId = getStoredUserId();
    if (!navigator.onLine && userId) {
      return taskStorage.getUserTasks(userId, date);
    }
    try {
      const res = await apiClient.get<ApiResponse<TaskResponse[]>>('/tasks', {
        params: date ? { date } : {},
      });
      if (userId && res.data.data) {
        await taskStorage.saveUserTasks(userId, res.data.data);
      }
      return res.data.data;
    } catch (err) {
      if (userId) {
        const cached = await taskStorage.getUserTasks(userId, date);
        if (cached.length > 0) return cached;
      }
      throw err;
    }
  },

  getTodayTasks: async (): Promise<TaskResponse[]> => {
    const userId = getStoredUserId();
    const todayStr = new Date().toISOString().split('T')[0];
    if (!navigator.onLine && userId) {
      return taskStorage.getUserTasks(userId, todayStr);
    }
    try {
      const res = await apiClient.get<ApiResponse<TaskResponse[]>>('/tasks/today');
      if (userId && res.data.data) {
        await taskStorage.saveUserTasks(userId, res.data.data);
      }
      return res.data.data;
    } catch (err) {
      if (userId) {
        const cached = await taskStorage.getUserTasks(userId, todayStr);
        if (cached.length > 0) return cached;
      }
      throw err;
    }
  },

  getTomorrowTasks: async (): Promise<TaskResponse[]> => {
    const userId = getStoredUserId();
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (!navigator.onLine && userId) {
      return taskStorage.getUserTasks(userId, tomorrowStr);
    }
    try {
      const res = await apiClient.get<ApiResponse<TaskResponse[]>>('/tasks/tomorrow');
      if (userId && res.data.data) {
        await taskStorage.saveUserTasks(userId, res.data.data);
      }
      return res.data.data;
    } catch (err) {
      if (userId) {
        const cached = await taskStorage.getUserTasks(userId, tomorrowStr);
        if (cached.length > 0) return cached;
      }
      throw err;
    }
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
    const userId = getStoredUserId();
    if (!navigator.onLine && userId) {
      const cached = await taskStorage.getUserTasks(userId, params?.date);
      const pending = cached.filter((t) => t.status === 'PENDING');
      return {
        content: pending,
        pageable: { pageNumber: 0, pageSize: pending.length },
        totalElements: pending.length,
        totalPages: 1,
        last: true,
        first: true,
        size: pending.length,
        number: 0,
        numberOfElements: pending.length,
        empty: pending.length === 0,
      };
    }
    try {
      const res = await apiClient.get<ApiResponse<PageResponse<TaskResponse>>>('/tasks/pending', {
        params,
      });
      if (userId && res.data.data?.content) {
        await taskStorage.saveUserTasks(userId, res.data.data.content);
      }
      return res.data.data;
    } catch (err) {
      if (userId) {
        const cached = await taskStorage.getUserTasks(userId, params?.date);
        const pending = cached.filter((t) => t.status === 'PENDING');
        return {
          content: pending,
          pageable: { pageNumber: 0, pageSize: pending.length },
          totalElements: pending.length,
          totalPages: 1,
          last: true,
          first: true,
          size: pending.length,
          number: 0,
          numberOfElements: pending.length,
          empty: pending.length === 0,
        };
      }
      throw err;
    }
  },

  updateTask: async (id: number, data: UpdateTaskRequest, forceDirectApi = false): Promise<TaskResponse> => {
    const userId = getStoredUserId();
    if (!forceDirectApi && (!navigator.onLine || !userId)) {
      if (userId) {
        await syncQueue.enqueueOperation(userId, 'UPDATE_TASK', { id, data });
        await taskStorage.updateLocalTask(userId, id, {
          ...data,
          syncStatus: 'PENDING_UPDATE',
          updatedAt: new Date().toISOString(),
        } as any);
        const cached = await taskStorage.getUserTasks(userId);
        const target = cached.find((t) => t.id === id);
        if (target) return target;
      }
    }

    const res = await apiClient.put<ApiResponse<TaskResponse>>(`/tasks/${id}`, data);
    if (userId && res.data.data) {
      await taskStorage.updateLocalTask(userId, id, { ...res.data.data, syncStatus: 'SYNCED' } as any);
    }
    return res.data.data;
  },

  deleteTask: async (id: number, forceDirectApi = false): Promise<void> => {
    const userId = getStoredUserId();
    if (!forceDirectApi && (!navigator.onLine || !userId)) {
      if (userId) {
        await syncQueue.enqueueOperation(userId, 'DELETE_TASK', { id });
        await taskStorage.updateLocalTask(userId, id, { syncStatus: 'PENDING_DELETE' } as any);
      }
      return;
    }

    await apiClient.delete<ApiResponse<void>>(`/tasks/${id}`);
    if (userId) {
      await taskStorage.deleteLocalTask(userId, id);
    }
  },

  completeTask: async (id: number, forceDirectApi = false): Promise<TaskResponse> => {
    const userId = getStoredUserId();
    if (!forceDirectApi && (!navigator.onLine || !userId)) {
      if (userId) {
        await syncQueue.enqueueOperation(userId, 'MARK_COMPLETED', { taskId: id, completed: true });
        await taskStorage.updateLocalTask(userId, id, {
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          syncStatus: 'PENDING_UPDATE',
        } as any);
        const cached = await taskStorage.getUserTasks(userId);
        const target = cached.find((t) => t.id === id);
        return target || ({ id, status: 'COMPLETED' } as TaskResponse);
      }
    }

    const res = await apiClient.patch<ApiResponse<TaskResponse>>(`/tasks/${id}/complete`);
    if (userId && res.data.data) {
      await taskStorage.updateLocalTask(userId, id, { ...res.data.data, syncStatus: 'SYNCED' } as any);
    }
    return res.data.data;
  },

  moveTask: async (id: number, targetDate: string, forceDirectApi = false): Promise<TaskResponse> => {
    const userId = getStoredUserId();
    if (!forceDirectApi && (!navigator.onLine || !userId)) {
      if (userId) {
        await syncQueue.enqueueOperation(userId, 'MOVE_TASK', { taskId: id, targetDate });
        await taskStorage.updateLocalTask(userId, id, {
          status: 'MOVED',
          dueDate: targetDate,
          syncStatus: 'PENDING_UPDATE',
        } as any);
        const cached = await taskStorage.getUserTasks(userId);
        const target = cached.find((t) => t.id === id);
        return target || ({ id, status: 'MOVED', dueDate: targetDate } as TaskResponse);
      }
    }

    const res = await apiClient.patch<ApiResponse<TaskResponse>>(`/tasks/${id}/move`, { targetDate } as MoveTaskRequest);
    if (userId && res.data.data) {
      await taskStorage.updateLocalTask(userId, id, { ...res.data.data, syncStatus: 'SYNCED' } as any);
    }
    return res.data.data;
  },

  moveTaskToTomorrow: async (id: number): Promise<TaskResponse> => {
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return tasksApi.moveTask(id, tomorrowStr);
  },
};
