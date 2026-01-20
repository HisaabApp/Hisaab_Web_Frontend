// Push Notification Configuration and Utilities

// VAPID Public Key - Generate your own at https://vapidkeys.com/
// Store private key securely on backend
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Convert VAPID key to Uint8Array for subscription
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 
    'serviceWorker' in navigator && 
    'PushManager' in window &&
    'Notification' in window;
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  
  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('[Push] Already subscribed');
      return subscription;
    }

    // Subscribe with VAPID key
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log('[Push] Subscribed successfully');
    return subscription;
  } catch (error) {
    console.error('[Push] Subscription failed:', error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Push] Unsubscribed successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error);
    return false;
  }
}

// Get current subscription
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[Push] Get subscription failed:', error);
    return null;
  }
}

// Send subscription to server
export async function sendSubscriptionToServer(
  subscription: PushSubscription,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Push] Send subscription to server failed:', error);
    return false;
  }
}

// Remove subscription from server
export async function removeSubscriptionFromServer(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ userId }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Push] Remove subscription from server failed:', error);
    return false;
  }
}

// Notification types for the app
export type NotificationType = 
  | 'payment_reminder'
  | 'payment_received'
  | 'daily_summary'
  | 'monthly_report'
  | 'customer_added'
  | 'low_collection'
  | 'system';

export interface NotificationPreferences {
  paymentReminders: boolean;
  paymentReceived: boolean;
  dailySummary: boolean;
  monthlyReport: boolean;
  customerUpdates: boolean;
  systemAlerts: boolean;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  paymentReminders: true,
  paymentReceived: true,
  dailySummary: false,
  monthlyReport: true,
  customerUpdates: true,
  systemAlerts: true,
};

// Save preferences to localStorage
export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  localStorage.setItem('notification-preferences', JSON.stringify(prefs));
}

// Load preferences from localStorage
export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem('notification-preferences');
    if (stored) {
      return { ...defaultNotificationPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('[Push] Load preferences failed:', error);
  }
  return defaultNotificationPreferences;
}

// Show local notification (for in-app events)
export function showLocalNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    console.warn('[Push] Cannot show notification - permission not granted');
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });
  });
}
