import { getDB, PendingOperation } from './db';
import { tasksApi } from '../../api/tasks.api';
import { taskStorage } from './taskStorage';

// Simple UUID v4 generator for clientOperationId
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const syncQueue = {
  /**
   * Add offline action to IndexedDB queue
   */
  enqueueOperation: async (
    userId: number,
    actionType: PendingOperation['actionType'],
    payload: any
  ): Promise<PendingOperation> => {
    const db = await getDB();
    const op: PendingOperation = {
      clientOperationId: generateUUID(),
      userId,
      actionType,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'PENDING',
    };
    await db.put('syncQueue', op);
    return op;
  },

  /**
   * Get pending operations for current user
   */
  getPendingOperations: async (userId: number): Promise<PendingOperation[]> => {
    if (!userId) return [];
    try {
      const db = await getDB();
      const allOps = await db.getAllFromIndex('syncQueue', 'by-user', userId);
      return allOps.filter((op) => op.status === 'PENDING' || op.status === 'FAILED');
    } catch (err) {
      console.warn('Failed to read pending ops:', err);
      return [];
    }
  },

  /**
   * Process and synchronize all queued operations with Spring Boot backend
   */
  processQueue: async (userId: number): Promise<{ successCount: number; failureCount: number }> => {
    if (!navigator.onLine || !userId) {
      return { successCount: 0, failureCount: 0 };
    }

    const pendingOps = await syncQueue.getPendingOperations(userId);
    if (pendingOps.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    let successCount = 0;
    let failureCount = 0;
    const db = await getDB();

    for (const op of pendingOps) {
      try {
        // Mark as syncing
        op.status = 'SYNCING';
        await db.put('syncQueue', op);

        if (op.actionType === 'MARK_COMPLETED') {
          const { taskId } = op.payload;
          const updatedTask = await tasksApi.completeTask(taskId);
          await taskStorage.updateLocalTask(userId, taskId, updatedTask);
        } else if (op.actionType === 'MOVE_TASK') {
          const { taskId, targetDate } = op.payload;
          const updatedTask = await tasksApi.moveTask(taskId, targetDate);
          await taskStorage.updateLocalTask(userId, taskId, updatedTask);
        } else if (op.actionType === 'CREATE_TASK') {
          const createdTask = await tasksApi.createTask(op.payload);
          await taskStorage.saveUserTasks(userId, [createdTask]);
        }

        // Operation synced successfully -> remove from queue
        await db.delete('syncQueue', op.clientOperationId);
        successCount++;
      } catch (err: any) {
        failureCount++;
        op.retryCount += 1;
        op.status = 'FAILED';
        op.errorMessage = err?.response?.data?.message || err.message || 'Sync failed';
        await db.put('syncQueue', op);
      }
    }

    return { successCount, failureCount };
  },
};
