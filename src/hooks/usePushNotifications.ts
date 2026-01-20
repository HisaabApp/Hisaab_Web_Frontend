"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
  sendSubscriptionToServer,
  removeSubscriptionFromServer,
  loadNotificationPreferences,
  saveNotificationPreferences,
  NotificationPreferences,
  defaultNotificationPreferences,
} from '@/lib/push-notifications';
import { useAuth } from '@/contexts/AuthContext';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isLoading: boolean;
  preferences: NotificationPreferences;
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<boolean>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);
      
      if (supported) {
        setPermission(getNotificationPermission());
        const subscription = await getCurrentSubscription();
        setIsSubscribed(!!subscription);
      }
      
      setPreferences(loadNotificationPreferences());
      setIsLoading(false);
    };

    init();
  }, []);

  // Enable push notifications
  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    setIsLoading(true);
    
    try {
      // Request permission
      const perm = await requestNotificationPermission();
      setPermission(perm);
      
      if (perm !== 'granted') {
        setIsLoading(false);
        return false;
      }

      // Subscribe to push
      const subscription = await subscribeToPush();
      
      if (subscription && user?.id) {
        // Send subscription to server
        await sendSubscriptionToServer(subscription, user.id);
        setIsSubscribed(true);
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('[Push Hook] Enable failed:', error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, user?.id]);

  // Disable push notifications
  const disablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    setIsLoading(true);
    
    try {
      const success = await unsubscribeFromPush();
      
      if (success && user?.id) {
        await removeSubscriptionFromServer(user.id);
      }
      
      setIsSubscribed(false);
      setIsLoading(false);
      return success;
    } catch (error) {
      console.error('[Push Hook] Disable failed:', error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, user?.id]);

  // Update notification preferences
  const updatePreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...prefs };
      saveNotificationPreferences(updated);
      return updated;
    });
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    preferences,
    enablePushNotifications,
    disablePushNotifications,
    updatePreferences,
  };
}
