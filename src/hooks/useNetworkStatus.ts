import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  setIsSyncing: (syncing: boolean) => void;
  setLastSyncedAt: (timestamp: number) => void;
}

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAtState] = useState<number | null>(() => {
    const saved = localStorage.getItem('pwa_last_synced_at');
    return saved ? parseInt(saved, 10) : null;
  });

  const setLastSyncedAt = useCallback((timestamp: number) => {
    setLastSyncedAtState(timestamp);
    localStorage.setItem('pwa_last_synced_at', timestamp.toString());
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
    isSyncing,
    lastSyncedAt,
    setIsSyncing,
    setLastSyncedAt,
  };
};
