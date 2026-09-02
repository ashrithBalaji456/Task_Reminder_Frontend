import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { TaskResponse } from '../../types';

export interface PendingOperation {
  clientOperationId: string; // UUID v4 for idempotency
  userId: number;
  actionType: 'MARK_COMPLETED' | 'MARK_PENDING' | 'MOVE_TASK' | 'CREATE_TASK';
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  errorMessage?: string;
}

interface TaskReminderDBSchema extends DBSchema {
  tasks: {
    key: string; // Composite key: `${userId}_${taskOccurrenceId}`
    value: TaskResponse & { userId: number; cachedAt: number };
    indexes: {
      'by-user': number;
      'by-user-date': [number, string];
    };
  };
  syncQueue: {
    key: string; // clientOperationId
    value: PendingOperation;
    indexes: {
      'by-user': number;
      'by-status': string;
    };
  };
}

const DB_NAME = 'TaskReminderPWA_DB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TaskReminderDBSchema>> | null = null;

export const getDB = (): Promise<IDBPDatabase<TaskReminderDBSchema>> => {
  if (!dbPromise) {
    dbPromise = openDB<TaskReminderDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Tasks Store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'compositeKey' });
          taskStore.createIndex('by-user', 'userId');
          taskStore.createIndex('by-user-date', ['userId', 'dueDate']);
        }

        // Sync Queue Store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'clientOperationId' });
          queueStore.createIndex('by-user', 'userId');
          queueStore.createIndex('by-status', 'status');
        }
      },
    });
  }
  return dbPromise;
};

/**
 * Clear cached data for a specific user upon logout
 */
export const clearUserDataFromDB = async (userId: number): Promise<void> => {
  try {
    const db = await getDB();
    const tx = db.transaction(['tasks', 'syncQueue'], 'readwrite');
    
    // Clear tasks
    const taskStore = tx.objectStore('tasks');
    const taskKeys = await taskStore.index('by-user').getAllKeys(userId);
    for (const key of taskKeys) {
      await taskStore.delete(key);
    }

    // Clear sync queue
    const queueStore = tx.objectStore('syncQueue');
    const queueKeys = await queueStore.index('by-user').getAllKeys(userId);
    for (const key of queueKeys) {
      await queueStore.delete(key);
    }

    await tx.done;
  } catch (err) {
    console.error('Failed to clear user IndexedDB cache:', err);
  }
};
