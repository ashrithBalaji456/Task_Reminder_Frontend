import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  isSyncing: boolean;
  wasOffline: boolean;
  onSyncClick?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  isSyncing,
  wasOffline,
  onSyncClick,
}) => {
  if (isOnline && !isSyncing && !wasOffline) {
    return null;
  }

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 shadow-md flex items-center justify-between text-xs font-semibold"
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-center text-center">
            <WifiOff className="w-4 h-4 text-amber-200 animate-pulse shrink-0" />
            <span>
              <strong>Offline Mode</strong> — Showing cached data. Offline changes will sync automatically when reconnected.
            </span>
          </div>
        </motion.div>
      )}

      {isOnline && isSyncing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="sticky top-0 z-50 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white px-4 py-2 shadow-md flex items-center justify-between text-xs font-semibold"
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-center text-center">
            <RefreshCw className="w-4 h-4 text-purple-200 animate-spin shrink-0" />
            <span>
              <strong>Back Online</strong> — Synchronizing offline changes with database...
            </span>
          </div>
        </motion.div>
      )}

      {isOnline && !isSyncing && wasOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="sticky top-0 z-50 w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2 shadow-md flex items-center justify-between text-xs font-semibold"
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-center text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>
              <strong>Connected</strong> — All offline changes successfully synchronized!
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
