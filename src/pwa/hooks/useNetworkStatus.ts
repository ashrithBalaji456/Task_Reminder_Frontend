import { useState, useEffect, useCallback } from 'react';
import { syncQueue } from '../offline/syncQueue';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const useNetworkStatus = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const checkPendingQueue = useCallback(async () => {
    if (user?.id) {
      const ops = await syncQueue.getPendingOperations(user.id);
      setPendingCount(ops.length);
    } else {
      setPendingCount(0);
    }
  }, [user?.id]);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || !user?.id || isSyncing) return;

    setIsSyncing(true);
    try {
      const { successCount, failureCount } = await syncQueue.processQueue(user.id);
      if (successCount > 0) {
        toast.success(`Successfully synchronized ${successCount} offline action(s)! ✨`);
      }
      if (failureCount > 0) {
        toast.error(`Failed to sync ${failureCount} action(s). Will retry automatically.`);
      }
    } catch (err) {
      console.warn('Queue sync error:', err);
    } finally {
      setIsSyncing(false);
      await checkPendingQueue();
    }
  }, [user?.id, isSyncing, toast, checkPendingQueue]);

  useEffect(() => {
    checkPendingQueue();

    const handleOnline = () => {
      setIsOnline(true);
      toast.info('Internet connection restored. Synchronizing your changes...');
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are currently offline. Showing cached tasks.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync, checkPendingQueue, toast]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    triggerSync,
    checkPendingQueue,
  };
};
