import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Checks notification permission across Capacitor Android and Web browsers.
 * Returns 'granted' | 'denied' | 'default' | 'unsupported'.
 */
export const getNotificationPermission = async () => {
  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display === 'granted') return 'granted';
      if (perm.display === 'denied') return 'denied';
      return 'default';
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
  } catch {
    // ignore permission check failure
  }
  return 'unsupported';
};

/**
 * Requests OS/browser notification permission from the user.
 */
export const requestNotificationPermission = async () => {
  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === 'granted' ? 'granted' : perm.display === 'denied' ? 'denied' : 'default';
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return await Notification.requestPermission();
    }
  } catch {
    // ignore permission request failure
  }
  return 'unsupported';
};

/**
 * Dispatches an OS/browser notification ONLY when user permission is explicitly granted.
 * Otherwise returns false so the alert remains strictly in the in-app bell icon.
 */
export const sendSystemNotificationIfAllowed = async (title, body, id) => {
  try {
    const status = await getNotificationPermission();
    if (status !== 'granted') return false;

    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      const numericId = Math.abs(parseInt(id, 10) || (Date.now() % 2147483000));
      await LocalNotifications.schedule({
        notifications: [
          {
            id: numericId,
            title: title || 'KisanDirect',
            body: body || '',
            schedule: { at: new Date(Date.now() + 200) },
          },
        ],
      });
      return true;
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification(title || 'KisanDirect', {
        body: body || '',
        icon: '/logo.png',
        tag: `kd-notif-${id || Date.now()}`,
      });
      return true;
    }
  } catch {
    // fallback silently to in-app bell
  }
  return false;
};
