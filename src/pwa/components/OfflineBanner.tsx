import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, triggerSync } = useNetworkStatus();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full mb-6"
      >
        <div
          className={`px-4 py-3 rounded-2xl backdrop-blur-xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md ${
            !isOnline
              ? 'bg-amber-500/15 border-amber-300/60 text-amber-900'
              : 'bg-purple-500/15 border-purple-300/60 text-purple-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                !isOnline ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
              }`}
            >
              {!isOnline ? (
                <WifiOff className="w-5 h-5" />
              ) : isSyncing ? (
                <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold tracking-tight">
                {!isOnline
                  ? 'You are currently offline'
                  : isSyncing
                  ? 'Synchronizing changes with server...'
                  : `${pendingCount} offline action(s) waiting to sync`}
              </h4>
              <p className="text-[11px] opacity-80 mt-0.5">
                {!isOnline
                  ? 'Showing cached tasks. Offline changes will synchronize when internet connection returns.'
                  : 'Your changes will be pushed safely to the cloud.'}
              </p>
            </div>
          </div>

          {isOnline && pendingCount > 0 && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
