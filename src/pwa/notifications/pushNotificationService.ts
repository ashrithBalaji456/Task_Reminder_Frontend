import { pushApi } from '../../api/push.api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}



export interface PushDiagnosticStatus {
  origin: string;
  notificationSupported: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  serviceWorkerSupported: boolean;
  serviceWorkerRegistration: 'success' | 'failure' | 'none';
  serviceWorkerState: 'active' | 'waiting' | 'installing' | 'missing';
  pushManagerAvailable: boolean;
  existingPushSubscription: boolean;
  backendSubscription: 'saved' | 'failed' | 'untested';
  lastError: string | null;
}

export const pushNotificationService = {
  /**
   * Request push permission and subscribe device to Spring Boot backend
   * Logs every diagnostic stage (STEP A through STEP G) separately.
   */
  subscribeToPushNotifications: async (): Promise<boolean> => {
    // STEP A: Check Browser Support & Notification Permission State
    console.log('[PUSH DIAGNOSTIC] STEP A: Checking Notification support & initial permission state...');
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      console.error('[PUSH DIAGNOSTIC] STEP A FAILED: Web Push is not supported by this browser.');
      throw new Error('Web Push notifications are not supported by this browser.');
    }

    console.log('[PUSH DIAGNOSTIC] STEP A: Initial Notification.permission value:', Notification.permission);
    const permission = await Notification.requestPermission();
    console.log('[PUSH DIAGNOSTIC] STEP A: Post-request Notification.permission value:', permission);

    if (permission !== 'granted') {
      console.warn('[PUSH DIAGNOSTIC] STEP A FAILED: Notification permission was not granted by user. Current state:', permission);
      throw new Error(`Notification permission was not granted (Permission state: '${permission}').`);
    }

    // STEP B: Service Worker Registration Check / Active Retrieval
    console.log('[PUSH DIAGNOSTIC] STEP B: Checking Service Worker registration...');
    let registration: ServiceWorkerRegistration | undefined;
    try {
      registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log('[PUSH DIAGNOSTIC] STEP B: No existing registration found. Registering /sw.js...');
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      console.log('[PUSH DIAGNOSTIC] STEP B SUCCESS: Service Worker registration active scope:', registration.scope);
    } catch (swRegErr: any) {
      console.error('[PUSH DIAGNOSTIC] STEP B FAILED: Service Worker registration error:', swRegErr);
      throw new Error(`Service Worker registration failed: ${swRegErr?.message || swRegErr}`);
    }

    // STEP C: Await Service Worker Ready (with 10-second safety timeout)
    console.log('[PUSH DIAGNOSTIC] STEP C: Awaiting navigator.serviceWorker.ready...');
    try {
      const swReadyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Service Worker ready state timed out after 10 seconds.')), 10000)
      );
      const activeReg = await Promise.race([swReadyPromise, timeoutPromise]);
      registration = activeReg;
      console.log('[PUSH DIAGNOSTIC] STEP C SUCCESS: Service Worker is ready! Worker state:', registration.active?.state || 'active');
    } catch (swReadyErr: any) {
      console.error('[PUSH DIAGNOSTIC] STEP C FAILED: Service Worker ready state error:', swReadyErr);
      throw new Error(`Service Worker ready check failed: ${swReadyErr?.message || swReadyErr}`);
    }

    // STEP D: Check PushManager & Fetch VAPID Public Key from Backend
    console.log('[PUSH DIAGNOSTIC] STEP D: Checking PushManager availability & fetching VAPID public key from backend...');
    if (!registration.pushManager) {
      console.error('[PUSH DIAGNOSTIC] STEP D FAILED: PushManager is unavailable on ServiceWorkerRegistration.');
      throw new Error('PushManager is unavailable on the Service Worker registration.');
    }

    let publicKey: string;
    try {
      publicKey = await pushApi.getVapidPublicKey();
      console.log('[PUSH DIAGNOSTIC] STEP D SUCCESS: VAPID public key retrieved successfully.');
    } catch (vapidErr: any) {
      console.error('[PUSH DIAGNOSTIC] STEP D FAILED: Failed to fetch VAPID key from Spring Boot backend:', vapidErr);
      throw new Error(`Backend VAPID key request failed: ${vapidErr?.response?.data?.message || vapidErr?.message || 'Server error'}`);
    }

    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // STEP E: Existing Push Subscription Lookup & Unsubscribe Stale Subscription
    console.log('[PUSH DIAGNOSTIC] STEP E: Checking for existing PushSubscription...');
    let subscription: PushSubscription | null = null;
    try {
      subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log('[PUSH DIAGNOSTIC] STEP E: Unsubscribing existing stale subscription to re-pair with latest VAPID key...');
        try {
          await subscription.unsubscribe();
          console.log('[PUSH DIAGNOSTIC] STEP E SUCCESS: Stale subscription unsubscribed.');
        } catch (unsubErr) {
          console.warn('[PUSH DIAGNOSTIC] STEP E WARN: Failed to unsubscribe stale subscription:', unsubErr);
        }
      } else {
        console.log('[PUSH DIAGNOSTIC] STEP E: No pre-existing push subscription found.');
      }
    } catch (subCheckErr: any) {
      console.warn('[PUSH DIAGNOSTIC] STEP E WARN: Push subscription lookup warning:', subCheckErr);
    }

    // STEP F: New Subscription Creation via PushManager
    console.log('[PUSH DIAGNOSTIC] STEP F: Creating new PushSubscription via PushManager.subscribe()...');
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
      console.log('[PUSH DIAGNOSTIC] STEP F SUCCESS: New PushSubscription created with endpoint:', subscription.endpoint.substring(0, 45) + '...');
    } catch (subCreateErr: any) {
      console.error('[PUSH DIAGNOSTIC] STEP F FAILED: PushManager.subscribe() failed:', subCreateErr);
      throw new Error(`Browser Push Subscription failed: ${subCreateErr?.message || subCreateErr}`);
    }

    // STEP G: Subscription Keys Extraction & Registration with Spring Boot Backend
    console.log('[PUSH DIAGNOSTIC] STEP G: Extracting subscription keys & sending to Spring Boot backend...');
    const jsonSub = subscription.toJSON();
    if (jsonSub.endpoint && jsonSub.keys?.p256dh && jsonSub.keys?.auth) {
      try {
        await pushApi.registerSubscription({
          endpoint: jsonSub.endpoint,
          p256dhKey: jsonSub.keys.p256dh,
          authKey: jsonSub.keys.auth,
        });
        console.log('[PUSH DIAGNOSTIC] STEP G SUCCESS: Push subscription registered with backend database!');
        return true;
      } catch (backendErr: any) {
        console.error('[PUSH DIAGNOSTIC] STEP G FAILED: Backend subscription registration failed:', backendErr);
        throw new Error(`Backend registration failed: ${backendErr?.response?.data?.message || backendErr?.message || 'Failed to save subscription on server'}`);
      }
    } else {
      console.error('[PUSH DIAGNOSTIC] STEP G FAILED: Subscription created but missing required keys (endpoint/p256dh/auth).');
      throw new Error('Push subscription was created by browser but lacked valid p256dh or auth keys.');
    }
  },

  /**
   * Check if current device is subscribed
   */
  isSubscribed: async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return false;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  },

  /**
   * Run full diagnostics for STEP 7
   */
  getDiagnostics: async (): Promise<PushDiagnosticStatus> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
    const notificationSupported = typeof window !== 'undefined' && 'Notification' in window;
    const notificationPermission = notificationSupported ? Notification.permission : 'unsupported';
    const serviceWorkerSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
    const pushManagerAvailable = typeof window !== 'undefined' && 'PushManager' in window;

    let serviceWorkerRegistration: 'success' | 'failure' | 'none' = 'none';
    let serviceWorkerState: 'active' | 'waiting' | 'installing' | 'missing' = 'missing';
    let existingPushSubscription = false;
    let lastError: string | null = null;

    if (serviceWorkerSupported) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          serviceWorkerRegistration = 'success';
          if (reg.active) serviceWorkerState = 'active';
          else if (reg.waiting) serviceWorkerState = 'waiting';
          else if (reg.installing) serviceWorkerState = 'installing';

          if (reg.pushManager) {
            const sub = await reg.pushManager.getSubscription();
            existingPushSubscription = !!sub;
          }
        }
      } catch (e: any) {
        serviceWorkerRegistration = 'failure';
        lastError = e?.message || 'Failed to inspect Service Worker registration';
      }
    }

    return {
      origin,
      notificationSupported,
      notificationPermission,
      serviceWorkerSupported,
      serviceWorkerRegistration,
      serviceWorkerState,
      pushManagerAvailable,
      existingPushSubscription,
      backendSubscription: existingPushSubscription ? 'saved' : 'untested',
      lastError,
    };
  },
};

