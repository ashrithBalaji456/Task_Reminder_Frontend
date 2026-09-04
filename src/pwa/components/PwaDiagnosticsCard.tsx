import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { Smartphone, CheckCircle2, AlertCircle, RefreshCw, Download, Info, BellRing } from 'lucide-react';
import { AnimatedButton } from '../../components/common/AnimatedButton';
import { pushNotificationService } from '../notifications/pushNotificationService';

export const PwaDiagnosticsCard: React.FC = () => {
  const [manifestStatus, setManifestStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [swStatus, setSwStatus] = useState<'checking' | 'active' | 'registered' | 'none'>('checking');
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [promptAvailable, setPromptAvailable] = useState<boolean>(false);
  const [iconsValid, setIconsValid] = useState<'checking' | 'ok' | 'error'>('checking');
  const [diagnosticMsg, setDiagnosticMsg] = useState<string>('');

  const [pushDiag, setPushDiag] = useState<any>(null);

  const runDiagnostics = async () => {
    setManifestStatus('checking');
    setSwStatus('checking');
    setIconsValid('checking');

    // 1. Check Standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // 2. Check Install Prompt Availability
    setPromptAvailable(!!(window as any).__pwaInstallPrompt);

    // 3. Check Manifest
    try {
      const link = document.querySelector('link[rel="manifest"]');
      if (!link) {
        setManifestStatus('error');
        setDiagnosticMsg('Manifest link tag missing in HTML');
      } else {
        const res = await fetch('/manifest.webmanifest');
        if (res.ok && (res.headers.get('content-type')?.includes('json') || res.headers.get('content-type')?.includes('manifest'))) {
          const data = await res.json();
          if (data.icons && data.icons.length >= 2 && data.display === 'standalone') {
            setManifestStatus('ok');
          } else {
            setManifestStatus('error');
            setDiagnosticMsg('Manifest missing required icons or standalone display');
          }
        } else {
          setManifestStatus('error');
          setDiagnosticMsg(`Manifest returned HTTP ${res.status} (${res.headers.get('content-type')})`);
        }
      }
    } catch (e: any) {
      setManifestStatus('error');
      setDiagnosticMsg('Failed to fetch manifest: ' + e.message);
    }

    // 4. Check Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.active) {
          setSwStatus('active');
        } else if (reg) {
          setSwStatus('registered');
        } else {
          setSwStatus('none');
        }
      } catch (e) {
        setSwStatus('none');
      }
    } else {
      setSwStatus('none');
    }

    // 5. Check PWA PNG Icons
    try {
      const img192 = new Image();
      img192.src = '/pwa-192x192.png';
      await new Promise((resolve, reject) => {
        img192.onload = resolve;
        img192.onerror = reject;
      });
      setIconsValid('ok');
    } catch (e) {
      setIconsValid('error');
    }

    // 6. Push Notification Diagnostics (STEP 7)
    try {
      const diag = await pushNotificationService.getDiagnostics();
      setPushDiag(diag);
    } catch (e) {
      console.warn('Failed to load push diagnostics:', e);
    }
  };

  useEffect(() => {
    runDiagnostics();

    const handlePrompt = () => setPromptAvailable(true);
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const triggerInstall = async () => {
    const promptEvent = (window as any).__pwaInstallPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        (window as any).__pwaInstallPrompt = null;
        setPromptAvailable(false);
      }
    } else {
      alert("Android Installation Instructions:\n1. Tap the Chrome menu (⋮) in the top right.\n2. Tap 'Install app' or 'Add to Home screen'.\n3. The app icon will appear on your Android home screen.");
    }
  };

  return (
    <GlassCard className="p-6 space-y-5 border border-rose-200/80 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">
              Android PWA App Status & Diagnostics
            </h3>
            <p className="text-xs text-slate-500">
              Live status of Service Worker, Web App Manifest, and Android Installation
            </p>
          </div>
        </div>

        <button
          onClick={runDiagnostics}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          title="Refresh PWA Diagnostics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Manifest Status */}
        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Web App Manifest</span>
          {manifestStatus === 'ok' ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Valid PWA Manifest
            </span>
          ) : manifestStatus === 'error' ? (
            <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Invalid Manifest
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-400">Checking...</span>
          )}
        </div>

        {/* Service Worker Status */}
        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Service Worker</span>
          {swStatus === 'active' || swStatus === 'registered' ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active & Offline Ready
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Registering...
            </span>
          )}
        </div>

        {/* Display Mode */}
        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Display Mode</span>
          {isStandalone ? (
            <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Standalone App
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-600">Browser Tab</span>
          )}
        </div>

        {/* PNG Icons */}
        <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">192x192 & 512x512 Icons</span>
          {iconsValid === 'ok' ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Valid PNG Icons
            </span>
          ) : (
            <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Icon Error
            </span>
          )}
        </div>
      </div>

      {/* Diagnostics Message / Instructions Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-purple-50 border border-rose-100/90 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-rose-900">
          <Info className="w-4 h-4 text-rose-600 shrink-0" />
          <span>How to Install on Android Chrome:</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
          1. Open Google Chrome on your Android device.<br />
          2. Tap the menu icon <strong>(⋮)</strong> in the top right corner.<br />
          3. Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.<br />
          4. Confirm installation. The application will be added to your Android Home Screen & App Drawer as a standalone app!
        </p>
      </div>

      {/* STEP 7 — Web Push Notification Diagnostics Panel */}
      {pushDiag && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-rose-400 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-rose-500" />
              Live Push Notification Diagnostics
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{pushDiag.origin}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="block text-slate-400 text-[10px]">Notification Supported</span>
              <span className={`font-bold ${pushDiag.notificationSupported ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pushDiag.notificationSupported ? 'true' : 'false'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="block text-slate-400 text-[10px]">Notification.permission</span>
              <span className={`font-bold ${pushDiag.notificationPermission === 'granted' ? 'text-emerald-400' : pushDiag.notificationPermission === 'denied' ? 'text-rose-400' : 'text-amber-400'}`}>
                {pushDiag.notificationPermission}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="block text-slate-400 text-[10px]">Service Worker Supported</span>
              <span className={`font-bold ${pushDiag.serviceWorkerSupported ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pushDiag.serviceWorkerSupported ? 'true' : 'false'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="block text-slate-400 text-[10px]">SW Registration</span>
              <span className={`font-bold ${pushDiag.serviceWorkerRegistration === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {pushDiag.serviceWorkerRegistration}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="block text-slate-400 text-[10px]">SW Active State</span>
              <span className={`font-bold ${pushDiag.serviceWorkerState === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {pushDiag.serviceWorkerState}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="block text-slate-400 text-[10px]">PushManager</span>
              <span className={`font-bold ${pushDiag.pushManagerAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pushDiag.pushManagerAvailable ? 'available' : 'unavailable'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="block text-slate-400 text-[10px]">Existing Push Sub</span>
              <span className={`font-bold ${pushDiag.existingPushSubscription ? 'text-emerald-400' : 'text-slate-400'}`}>
                {pushDiag.existingPushSubscription ? 'present' : 'missing'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="block text-slate-400 text-[10px]">Backend Sub Status</span>
              <span className="font-bold text-emerald-400">
                {pushDiag.backendSubscription}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="block text-slate-400 text-[10px]">Last Error</span>
              <span className="font-medium text-slate-300 truncate block">
                {pushDiag.lastError || 'None'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Install Action */}
      {!isStandalone && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 font-medium">
            {promptAvailable ? 'Direct PWA install prompt ready' : 'Ready for Android Chrome installation'}
          </span>
          <AnimatedButton
            size="sm"
            onClick={triggerInstall}
            icon={<Download className="w-4 h-4" />}
          >
            Install App Now
          </AnimatedButton>
        </div>
      )}
    </GlassCard>
  );
};
