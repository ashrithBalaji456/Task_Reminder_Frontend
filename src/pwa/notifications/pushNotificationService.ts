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

export const pushNotificationService = {
  /**
   * Request push permission and subscribe device to Spring Boot backend
   */
  subscribeToPushNotifications: async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Web Push notifications are not supported by this browser.');
    }

    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    // 2. Fetch VAPID public key from Spring Boot
    const publicKey = await pushApi.getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // 3. Register push manager (unsubscribe stale subscription if any to force fresh VAPID key pairing)
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch (e) {
        console.warn('Stale subscription unsubscribe warning:', e);
      }
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as unknown as BufferSource,
    });

    // 4. Extract keys and send to backend
    const jsonSub = subscription.toJSON();
    if (jsonSub.endpoint && jsonSub.keys?.p256dh && jsonSub.keys?.auth) {
      await pushApi.registerSubscription({
        endpoint: jsonSub.endpoint,
        p256dhKey: jsonSub.keys.p256dh,
        authKey: jsonSub.keys.auth,
      });
      return true;
    }

    return false;
  },

  /**
   * Check if current device is subscribed
   */
  isSubscribed: async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  },
};
