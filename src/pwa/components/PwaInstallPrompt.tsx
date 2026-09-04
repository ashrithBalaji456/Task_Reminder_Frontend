import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__pwaInstallPrompt = e;

      const lastDismissed = localStorage.getItem('pwa_install_dismissed');
      if (lastDismissed) {
        const dismissedTime = parseInt(lastDismissed, 10);
        if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
          return;
        }
      }
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      (window as any).__pwaInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).__pwaInstallPrompt;
    if (!promptEvent) {
      alert("PWA Installation is managed by your browser. On Android Chrome, tap the menu (⋮) at the top right and select 'Install app' or 'Add to Home screen'.");
      return;
    }
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
    (window as any).__pwaInstallPrompt = null;
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-1"
      >
        <div className="rounded-3xl bg-white/95 backdrop-blur-2xl border border-rose-200/90 p-5 shadow-2xl shadow-rose-900/15 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  Install Daily Planner <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add to your phone or desktop for instant reminders & offline access.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleDismiss}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Not Now
            </button>
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 transition-all shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
