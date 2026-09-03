import { getDB } from './db';
import { TaskResponse } from '../../types';

export const taskStorage = {
  /**
   * Save array of task responses to IndexedDB scoped by current userId
   */
  saveUserTasks: async (userId: number, tasks: TaskResponse[]): Promise<void> => {
    if (!userId || !tasks) return;
    try {
      const db = await getDB();
      const tx = db.transaction('tasks', 'readwrite');
      const store = tx.objectStore('tasks');

      const now = Date.now();
      for (const task of tasks) {
        const compositeKey = `${userId}_${task.id}`;
        const existing = await store.get(compositeKey);
        await store.put({
          ...(task as any),
          compositeKey,
          userId,
          cachedAt: now,
          syncStatus: existing?.syncStatus || 'SYNCED',
        });
      }
      await tx.done;
    } catch (err) {
      console.warn('Failed to save tasks to IndexedDB:', err);
    }
  },

  /**
   * Get cached tasks for user (optionally filtered by date YYYY-MM-DD)
   */
  getUserTasks: async (userId: number, date?: string): Promise<TaskResponse[]> => {
    if (!userId) return [];
    try {
      const db = await getDB();
      const store = db.transaction('tasks', 'readonly').objectStore('tasks');

      let allUserTasks: (TaskResponse & { userId: number; syncStatus?: string })[];
      if (date) {
        allUserTasks = await store.index('by-user-date').getAll([userId, date]);
      } else {
        allUserTasks = await store.index('by-user').getAll(userId);
      }

      // Filter out PENDING_DELETE tasks from normal UI display
      return allUserTasks
        .filter((item: any) => item.syncStatus !== 'PENDING_DELETE')
        .map((item: any) => {
          const { compositeKey, userId, cachedAt, ...task } = item;
          return task as TaskResponse;
        });
    } catch (err) {
      console.warn('Failed to read tasks from IndexedDB:', err);
      return [];
    }
  },

  /**
   * Optimistically update single task in IndexedDB (for offline actions)
   */
  updateLocalTask: async (userId: number, taskId: number, updates: Partial<TaskResponse>): Promise<void> => {
    if (!userId || !taskId) return;
    try {
      const db = await getDB();
      const compositeKey = `${userId}_${taskId}`;
      const existing = await db.get('tasks', compositeKey);
      if (existing) {
        await db.put('tasks', {
          ...existing,
          ...updates,
          cachedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn('Failed to update local task in IndexedDB:', err);
    }
  },

  /**
   * Replace local temporary client ID with real server ID upon sync
   */
  replaceLocalTaskId: async (userId: number, oldTaskId: number, serverTask: TaskResponse): Promise<void> => {
    if (!userId || !oldTaskId || !serverTask) return;
    try {
      const db = await getDB();
      const oldCompositeKey = `${userId}_${oldTaskId}`;
      const newCompositeKey = `${userId}_${serverTask.id}`;

      const tx = db.transaction('tasks', 'readwrite');
      const store = tx.objectStore('tasks');
      await store.delete(oldCompositeKey);
      await store.put({
        ...(serverTask as any),
        compositeKey: newCompositeKey,
        userId,
        cachedAt: Date.now(),
        syncStatus: 'SYNCED',
      });
      await tx.done;
    } catch (err) {
      console.warn('Failed to replace local task ID in IndexedDB:', err);
    }
  },

  /**
   * Delete task from IndexedDB
   */
  deleteLocalTask: async (userId: number, taskId: number): Promise<void> => {
    if (!userId || !taskId) return;
    try {
      const db = await getDB();
      const compositeKey = `${userId}_${taskId}`;
      await db.delete('tasks', compositeKey);
    } catch (err) {
      console.warn('Failed to delete local task from IndexedDB:', err);
    }
  },
};
