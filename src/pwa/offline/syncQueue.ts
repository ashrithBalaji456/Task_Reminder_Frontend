import { getDB, PendingOperation } from './db';
import { tasksApi } from '../../api/tasks.api';
import { taskStorage } from './taskStorage';

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

let isSyncingInProgress = false;

export const syncQueue = {
  /**
   * Add offline action to IndexedDB queue with intelligent operation merging
   */
  enqueueOperation: async (
    userId: number,
    actionType: PendingOperation['actionType'],
    payload: any
  ): Promise<PendingOperation | null> => {
    const db = await getDB();
    const taskId = payload?.taskId || payload?.id || payload?.tempTaskId;

    // Intelligent Operation Merging
    if (taskId) {
      const existingOps = await db.getAllFromIndex('syncQueue', 'by-user', userId);
      const sameTaskOps = existingOps.filter(
        (op) => (op.payload?.taskId === taskId || op.payload?.tempTaskId === taskId || op.payload?.id === taskId) && op.status === 'PENDING'
      );

      // Scenario: CREATE + DELETE on un-synced task -> cancel both!
      if (actionType === 'DELETE_TASK') {
        const hasPendingCreate = sameTaskOps.some((op) => op.actionType === 'CREATE_TASK');
        if (hasPendingCreate) {
          for (const op of sameTaskOps) {
            await db.delete('syncQueue', op.clientOperationId);
          }
          await taskStorage.deleteLocalTask(userId, taskId);
          return null;
        }
      }

      // Scenario: Multiple UPDATE/MOVE/COMPLETE on same task -> merge into latest operation
      if (actionType === 'UPDATE_TASK' || actionType === 'MOVE_TASK' || actionType === 'MARK_COMPLETED') {
        for (const op of sameTaskOps) {
          if (op.actionType === actionType) {
            // Replace payload of existing operation
            op.payload = { ...op.payload, ...payload };
            op.timestamp = Date.now();
            await db.put('syncQueue', op);
            return op;
          }
        }
      }
    }

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
   * Get pending operations for current user ordered by timestamp
   */
  getPendingOperations: async (userId: number): Promise<PendingOperation[]> => {
    if (!userId) return [];
    try {
      const db = await getDB();
      const allOps = await db.getAllFromIndex('syncQueue', 'by-user', userId);
      return allOps
        .filter((op) => op.status === 'PENDING' || op.status === 'FAILED')
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch (err) {
      console.warn('Failed to read pending ops:', err);
      return [];
    }
  },

  /**
   * Process and synchronize all queued operations with Spring Boot backend (with active sync lock)
   */
  processQueue: async (userId: number): Promise<{ successCount: number; failureCount: number }> => {
    if (!navigator.onLine || !userId || isSyncingInProgress) {
      return { successCount: 0, failureCount: 0 };
    }

    isSyncingInProgress = true;
    let successCount = 0;
    let failureCount = 0;

    try {
      const pendingOps = await syncQueue.getPendingOperations(userId);
      if (pendingOps.length === 0) {
        return { successCount: 0, failureCount: 0 };
      }

      const db = await getDB();
      // Client-to-server ID mapping table for offline created tasks
      const idMap: Record<number, number> = {};

      for (const op of pendingOps) {
        try {
          op.status = 'SYNCING';
          await db.put('syncQueue', op);

          let targetTaskId = op.payload?.taskId || op.payload?.id;
          if (targetTaskId && idMap[targetTaskId]) {
            targetTaskId = idMap[targetTaskId];
            if (op.payload.taskId) op.payload.taskId = targetTaskId;
            if (op.payload.id) op.payload.id = targetTaskId;
          }

          if (op.actionType === 'CREATE_TASK') {
            const tempId = op.payload.tempTaskId || op.payload.id;
            const createdTask = await tasksApi.createTask(op.payload, true); // forceDirectApi=true
            if (tempId && createdTask?.id) {
              idMap[tempId] = createdTask.id;
              await taskStorage.replaceLocalTaskId(userId, tempId, createdTask);
            }
          } else if (op.actionType === 'MARK_COMPLETED') {
            const updatedTask = await tasksApi.completeTask(targetTaskId, true);
            await taskStorage.updateLocalTask(userId, targetTaskId, { ...updatedTask, syncStatus: 'SYNCED' } as any);
          } else if (op.actionType === 'MOVE_TASK') {
            const { targetDate } = op.payload;
            const updatedTask = await tasksApi.moveTask(targetTaskId, targetDate, true);
            await taskStorage.updateLocalTask(userId, targetTaskId, { ...updatedTask, syncStatus: 'SYNCED' } as any);
          } else if (op.actionType === 'UPDATE_TASK') {
            const updatedTask = await tasksApi.updateTask(targetTaskId, op.payload.data, true);
            await taskStorage.updateLocalTask(userId, targetTaskId, { ...updatedTask, syncStatus: 'SYNCED' } as any);
          } else if (op.actionType === 'DELETE_TASK') {
            await tasksApi.deleteTask(targetTaskId, true);
            await taskStorage.deleteLocalTask(userId, targetTaskId);
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
          console.error(`Sync operation ${op.actionType} failed for op ID ${op.clientOperationId}:`, err);
        }
      }
    } finally {
      isSyncingInProgress = false;
    }

    return { successCount, failureCount };
  },
};
