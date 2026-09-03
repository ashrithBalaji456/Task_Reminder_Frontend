import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  TaskResponse,
  DashboardResponse,
  AlertResponse,
  WeeklyAnalyticsResponse,
  MonthlyAnalyticsResponse,
  DailyHistoryResponse,
} from '../../types';

export interface PendingOperation {
  clientOperationId: string; // UUID v4 for idempotency
  userId: number;
  actionType: 'MARK_COMPLETED' | 'MARK_PENDING' | 'MOVE_TASK' | 'CREATE_TASK' | 'UPDATE_TASK' | 'DELETE_TASK';
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  errorMessage?: string;
}

export interface TaskReminderDBSchema extends DBSchema {
  tasks: {
    key: string; // `${userId}_${taskId}`
    value: TaskResponse & {
      userId: number;
      compositeKey: string;
      cachedAt: number;
      syncStatus?: 'PENDING_CREATE' | 'PENDING_UPDATE' | 'PENDING_DELETE' | 'SYNCED';
    };
    indexes: {
      'by-user': number;
      'by-user-date': [number, string];
    };
  };
  dashboard: {
    key: string; // `${userId}_${date}`
    value: {
      compositeKey: string;
      userId: number;
      date: string;
      data: DashboardResponse;
      cachedAt: number;
    };
    indexes: {
      'by-user': number;
    };
  };
  alerts: {
    key: number; // userId
    value: {
      userId: number;
      alerts: AlertResponse[];
      cachedAt: number;
    };
  };
  analytics: {
    key: string; // `${userId}_${type}_${date}`
    value: {
      compositeKey: string;
      userId: number;
      type: 'weekly' | 'monthly';
      date: string;
      data: WeeklyAnalyticsResponse | MonthlyAnalyticsResponse;
      cachedAt: number;
    };
    indexes: {
      'by-user': number;
    };
  };
  history: {
    key: string; // `${userId}_${date}`
    value: {
      compositeKey: string;
      userId: number;
      date: string;
      data: DailyHistoryResponse;
      cachedAt: number;
    };
    indexes: {
      'by-user': number;
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
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: number;
    };
  };
}

const DB_NAME = 'TaskReminderPWA_DB';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<TaskReminderDBSchema>> | null = null;

export const getDB = (): Promise<IDBPDatabase<TaskReminderDBSchema>> => {
  if (!dbPromise) {
    dbPromise = openDB<TaskReminderDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'compositeKey' });
          taskStore.createIndex('by-user', 'userId');
          taskStore.createIndex('by-user-date', ['userId', 'dueDate']);
        }
        if (!db.objectStoreNames.contains('dashboard')) {
          const dashStore = db.createObjectStore('dashboard', { keyPath: 'compositeKey' });
          dashStore.createIndex('by-user', 'userId');
        }
        if (!db.objectStoreNames.contains('alerts')) {
          db.createObjectStore('alerts', { keyPath: 'userId' });
        }
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'compositeKey' });
          analyticsStore.createIndex('by-user', 'userId');
        }
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'compositeKey' });
          historyStore.createIndex('by-user', 'userId');
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'clientOperationId' });
          queueStore.createIndex('by-user', 'userId');
          queueStore.createIndex('by-status', 'status');
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
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
    const stores = ['tasks', 'dashboard', 'alerts', 'analytics', 'history', 'syncQueue'] as const;
    for (const storeName of stores) {
      try {
        const tx = db.transaction(storeName as any, 'readwrite');
        const store = tx.objectStore(storeName as any);
        if (storeName === 'alerts') {
          await (store as any).delete(userId);
        } else {
          const keys = await (store as any).index('by-user').getAllKeys(userId);
          for (const k of keys) {
            await (store as any).delete(k);
          }
        }
        await tx.done;
      } catch (e) {}
    }
  } catch (err) {
    console.error('Failed to clear user IndexedDB cache:', err);
  }
};
