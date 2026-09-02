import React, { useState } from 'react';
import { pushNotificationService } from '../../pwa/notifications/pushNotificationService';
import { preferencesApi } from '../../api/preferences.api';

interface NotificationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NotificationPromptModal: React.FC<NotificationPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTurnOn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const success = await pushNotificationService.subscribeToPushNotifications();
      if (success) {
        // Also enable push notification flag in user preferences
        try {
          await preferencesApi.updateUserPreferences({ pushNotificationEnabled: true });
        } catch {
          // Ignore preference sync errors if subscription succeeded
        }
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage('Notification permission was not granted.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to enable notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotNow = () => {
    sessionStorage.setItem('notification_prompt_dismissed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-center text-white transform transition-all animate-scale-up">
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full blur-3xl opacity-30 pointer-events-none" />

        {/* Top Graphic Illustration matching user mockup */}
        <div className="relative mx-auto mb-6 w-32 h-32 flex items-center justify-center">
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-xl flex flex-col items-center justify-center p-3 relative overflow-hidden">
            {/* Phone notch */}
            <div className="w-10 h-1 bg-slate-700 rounded-full mb-3" />
            
            {/* Glowing Icon Banner */}
            <div className="w-full bg-slate-800/90 border border-purple-500/30 rounded-xl p-2.5 flex items-center justify-center gap-2 shadow-lg mb-2">
              <span className="text-lg animate-bounce">⏰</span>
              <span className="text-lg">🌸</span>
              <span className="text-lg">🔔</span>
            </div>

            {/* Toggle Switch Graphic */}
            <div className="w-12 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full p-0.5 flex items-center justify-end shadow-inner">
              <div className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform" />
            </div>
          </div>
        </div>

        {/* Modal Header & Description */}
        <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Your notifications are off
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Don't miss urgent task reminders, daily productivity alerts, and scheduled report updates.
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleTurnOn}
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Enabling...</span>
              </>
            ) : (
              <span>Turn on</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleNotNow}
            disabled={isLoading}
            className="w-full py-2.5 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};
