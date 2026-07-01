

// import messaging from '@react-native-firebase/messaging';
// import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
// import { Platform, PermissionsAndroid } from 'react-native';

// class NotificationService {
//   constructor() {
//     this._tokenCache = null;
//     this._configured = false;
//     this.configure();
//   }

//   // ─── Check if Firebase Messaging is available ──────────────────────────────
//   // Returns false on emulators / devices without Google Play Services
//   async _isMessagingAvailable() {
//     try {
//       // This will throw if Play Services are unavailable
//       await messaging().getToken();
//       return true;
//     } catch (error) {
//       const msg = error?.message || '';
//       if (
//         msg.includes('SERVICE_NOT_AVAILABLE') ||
//         msg.includes('java.io.IOException') ||
//         msg.includes('MISSING_INSTANCEID_SERVICE') ||
//         msg.includes('unknown')
//       ) {
//         return false;
//       }
//       return false;
//     }
//   }

//   // ─── Request Permissions ───────────────────────────────────────────────────
//   async requestPermission() {
//     try {
//       if (Platform.OS === 'android') {
//         if (Platform.Version >= 33) {
//           const granted = await PermissionsAndroid.request(
//             PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
//           );
//           return granted === PermissionsAndroid.RESULTS.GRANTED;
//         }
//         return true; // Android < 13 doesn't need runtime permission
//       } else {
//         // iOS
//         const authStatus = await messaging().requestPermission();
//         return (
//           authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//           authStatus === messaging.AuthorizationStatus.PROVISIONAL
//         );
//       }
//     } catch (error) {
//       console.warn('[Notifications] Permission request failed:', error?.message);
//       return false;
//     }
//   }

//   // ─── Get FCM Token ─────────────────────────────────────────────────────────
//   // Returns null safely if Play Services are unavailable (emulator / no GMS)
//   async getToken() {
//     // Return cached token if already fetched
//     if (this._tokenCache) return this._tokenCache;

//     try {
//       const hasPermission = await this.requestPermission();
//       if (!hasPermission) {
//         console.warn('[Notifications] Permission denied — skipping token fetch');
//         return null;
//       }

//       const token = await messaging().getToken();
//       this._tokenCache = token;
//       console.log('[Notifications] FCM token obtained');
//       return token;

//     } catch (error) {
//       const msg = error?.message || '';

//       // ✅ Graceful handling — these errors mean no Google Play Services
//       if (
//         msg.includes('SERVICE_NOT_AVAILABLE') ||
//         msg.includes('java.io.IOException') ||
//         msg.includes('MISSING_INSTANCEID_SERVICE') ||
//         msg.includes('[messaging/unknown]')
//       ) {
//         console.warn(
//           '[Notifications] FCM unavailable — running on emulator or device without Google Play Services. Push notifications disabled.'
//         );
//         return null; // App continues normally without push notifications
//       }

//       // Unexpected error — still return null to not crash the app
//       console.warn('[Notifications] Unexpected error getting FCM token:', msg);
//       return null;
//     }
//   }

//   // Alias for compatibility
//   async getFCMToken() {
//     return this.getToken();
//   }

//   // ─── Create Notification Channels (Android only) ───────────────────────────
//   async createNotificationChannel() {
//     if (Platform.OS !== 'android') return;

//     try {
//       await notifee.createChannel({
//         id: 'default',
//         name: 'Default Channel',
//         importance: AndroidImportance.HIGH,
//         sound: 'default',
//         vibration: true,
//       });
//       await notifee.createChannel({
//         id: 'offers',
//         name: 'Offers & Promotions',
//         importance: AndroidImportance.HIGH,
//         sound: 'default',
//         vibration: true,
//       });
//       await notifee.createChannel({
//         id: 'orders',
//         name: 'Order Updates',
//         importance: AndroidImportance.HIGH,
//         sound: 'default',
//         vibration: true,
//       });
//       console.log('[Notifications] Channels created');
//     } catch (error) {
//       console.warn('[Notifications] Error creating channels:', error?.message);
//     }
//   }

//   // ─── Display Local Notification ────────────────────────────────────────────
//   async displayNotification(title, body, data = {}) {
//     try {
//       await notifee.displayNotification({
//         title,
//         body,
//         android: {
//           channelId:
//             data.type === 'order'
//               ? 'orders'
//               : data.type === 'welcome_offer'
//               ? 'offers'
//               : 'default',
//           importance: AndroidImportance.HIGH,
//           pressAction: { id: 'default', launchActivity: 'default' },
//           sound: 'default',
//           vibrationPattern: [300, 500],
//         },
//         ios: {
//           sound: 'default',
//           foregroundPresentationOptions: { alert: true, badge: true, sound: true },
//         },
//         data,
//       });
//     } catch (error) {
//       console.warn('[Notifications] Error displaying notification:', error?.message);
//     }
//   }

//   // ─── Configure Listeners ───────────────────────────────────────────────────
//   configure() {
//     if (this._configured) return;
//     this._configured = true;

//     // Create channels immediately
//     this.createNotificationChannel();

//     // ── Safely attach Firebase listeners ──────────────────────────────────
//     // Wrapped in try/catch so emulator crashes don't break the app
//     try {
//       // Foreground messages
//       messaging().onMessage(async (remoteMessage) => {
//         const { notification, data } = remoteMessage;
//         if (notification) {
//           await this.displayNotification(
//             notification.title || 'New Notification',
//             notification.body || '',
//             data || {}
//           );
//         }
//       });

//       // Background messages
//       messaging().setBackgroundMessageHandler(async (remoteMessage) => {
//         const { notification, data } = remoteMessage;
//         if (notification) {
//           await this.displayNotification(
//             notification.title || 'New Notification',
//             notification.body || '',
//             data || {}
//           );
//         }
//       });

//       // Notification opened (app in background)
//       messaging().onNotificationOpenedApp((remoteMessage) => {
//         this.handleNotificationAction(remoteMessage);
//       });

//       // App opened from quit state via notification
//       messaging()
//         .getInitialNotification()
//         .then((remoteMessage) => {
//           if (remoteMessage) this.handleNotificationAction(remoteMessage);
//         })
//         .catch((err) => {
//           console.warn('[Notifications] getInitialNotification error:', err?.message);
//         });

//     } catch (error) {
//       console.warn(
//         '[Notifications] Firebase messaging listeners not attached — likely no Play Services:',
//         error?.message
//       );
//     }

//     // ── Notifee event handlers ────────────────────────────────────────────
//     try {
//       notifee.onForegroundEvent(({ type, detail }) => {
//         if (type === EventType.PRESS) {
//           this.handleNotificationAction(detail.notification);
//         }
//       });

//       notifee.onBackgroundEvent(async ({ type, detail }) => {
//         if (type === EventType.PRESS) {
//           console.log('[Notifications] Background notification pressed:', detail);
//         }
//       });
//     } catch (error) {
//       console.warn('[Notifications] Notifee event handler error:', error?.message);
//     }

//     console.log('[Notifications] Service configured');
//   }

//   // ─── Handle Notification Tap ───────────────────────────────────────────────
//   handleNotificationAction(notification) {
//     const data = notification?.data || {};
//     console.log('[Notifications] Action received:', data);
//     // Add navigation logic here when needed:
//     // if (data.screen === 'OrderDetails') navigation.navigate('OrderDetails', { orderId: data.orderId });
//   }

//   // ─── Topic Subscriptions ───────────────────────────────────────────────────
//   async subscribeToTopic(topic) {
//     try {
//       await messaging().subscribeToTopic(topic);
//       console.log(`[Notifications] Subscribed to: ${topic}`);
//     } catch (error) {
//       console.warn(`[Notifications] Subscribe to ${topic} failed:`, error?.message);
//     }
//   }

//   async unsubscribeFromTopic(topic) {
//     try {
//       await messaging().unsubscribeFromTopic(topic);
//       console.log(`[Notifications] Unsubscribed from: ${topic}`);
//     } catch (error) {
//       console.warn(`[Notifications] Unsubscribe from ${topic} failed:`, error?.message);
//     }
//   }

//   async deleteToken() {
//     try {
//       this._tokenCache = null;
//       await messaging().deleteToken();
//       console.log('[Notifications] Token deleted');
//     } catch (error) {
//       console.warn('[Notifications] Delete token failed:', error?.message);
//     }
//   }
// }

// export default new NotificationService();

import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';

class NotificationService {
  constructor() {
    this._tokenCache = null;
    this._configured = false;
    this.configure();
  }

  // ─── Get messaging only on Android ────────────────────────────────────────
  _getMessaging() {
    if (Platform.OS !== 'android') return null;
    try {
      return require('@react-native-firebase/messaging').default;
    } catch {
      return null;
    }
  }

  // ─── Request Permissions ───────────────────────────────────────────────────
  async requestPermission() {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } else {
        // iOS — no Firebase, use notifee directly
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus >= 1;
      }
    } catch (error) {
      console.warn('[Notifications] Permission request failed:', error?.message);
      return false;
    }
  }

  // ─── Get FCM Token (Android only) ─────────────────────────────────────────
  async getToken() {
    if (Platform.OS !== 'android') {
      console.log('[Notifications] iOS — FCM not used');
      return null;
    }

    if (this._tokenCache) return this._tokenCache;

    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('[Notifications] Permission denied — skipping token fetch');
        return null;
      }

      const messaging = this._getMessaging();
      if (!messaging) return null;

      const token = await messaging().getToken();
      this._tokenCache = token;
      console.log('[Notifications] FCM token obtained');
      return token;

    } catch (error) {
      const msg = error?.message || '';
      if (
        msg.includes('SERVICE_NOT_AVAILABLE') ||
        msg.includes('java.io.IOException') ||
        msg.includes('MISSING_INSTANCEID_SERVICE') ||
        msg.includes('[messaging/unknown]')
      ) {
        console.warn('[Notifications] FCM unavailable — no Google Play Services');
        return null;
      }
      console.warn('[Notifications] Unexpected error getting FCM token:', msg);
      return null;
    }
  }

  async getFCMToken() {
    return this.getToken();
  }

  // ─── Create Notification Channels (Android only) ───────────────────────────
  async createNotificationChannel() {
    if (Platform.OS !== 'android') return;

    try {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
      await notifee.createChannel({
        id: 'offers',
        name: 'Offers & Promotions',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
      await notifee.createChannel({
        id: 'orders',
        name: 'Order Updates',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
      console.log('[Notifications] Channels created');
    } catch (error) {
      console.warn('[Notifications] Error creating channels:', error?.message);
    }
  }

  // ─── Display Local Notification ────────────────────────────────────────────
  async displayNotification(title, body, data = {}) {
    try {
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId:
            data.type === 'order'
              ? 'orders'
              : data.type === 'welcome_offer'
              ? 'offers'
              : 'default',
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default', launchActivity: 'default' },
          sound: 'default',
          vibrationPattern: [300, 500],
        },
        ios: {
          sound: 'default',
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
        },
        data,
      });
    } catch (error) {
      console.warn('[Notifications] Error displaying notification:', error?.message);
    }
  }

  // ─── Configure Listeners ───────────────────────────────────────────────────
  configure() {
    if (this._configured) return;
    this._configured = true;

    this.createNotificationChannel();

    // ── Firebase listeners — Android only ─────────────────────────────────
    if (Platform.OS === 'android') {
      try {
        const messaging = this._getMessaging();
        if (messaging) {
          // Foreground messages — handle both notification+data and data-only
          messaging().onMessage(async (remoteMessage) => {
            const { notification, data } = remoteMessage;
            const title = notification?.title || data?.title || 'New Notification';
            const body = notification?.body || data?.body || '';
            if (title || body) {
              await this.displayNotification(title, body, data || {});
            }
          });

          // Notification opened (app in background)
          messaging().onNotificationOpenedApp((remoteMessage) => {
            this.handleNotificationAction(remoteMessage);
          });

          // App opened from quit state
          messaging()
            .getInitialNotification()
            .then((remoteMessage) => {
              if (remoteMessage) this.handleNotificationAction(remoteMessage);
            })
            .catch((err) => {
              console.warn('[Notifications] getInitialNotification error:', err?.message);
            });
        }
      } catch (error) {
        console.warn('[Notifications] Firebase listeners error:', error?.message);
      }
    }

    // ── Notifee event handlers (both platforms) ───────────────────────────
    try {
      notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS) {
          this.handleNotificationAction(detail.notification);
        }
      });
    } catch (error) {
      console.warn('[Notifications] Notifee event handler error:', error?.message);
    }

    console.log('[Notifications] Service configured');
  }

  // ─── Handle Notification Tap ───────────────────────────────────────────────
  handleNotificationAction(notification) {
    const data = notification?.data || {};
    console.log('[Notifications] Action received:', data);

    if (data.screen) {
      // Lazy-require to avoid circular dependency
      const { navigateFromNotification } = require('../navigation/navigationRef');
      navigateFromNotification(data);
    }
  }

  // ─── Topic Subscriptions (Android only) ───────────────────────────────────
  async subscribeToTopic(topic) {
    if (Platform.OS !== 'android') return;
    try {
      const messaging = this._getMessaging();
      if (messaging) await messaging().subscribeToTopic(topic);
      console.log(`[Notifications] Subscribed to: ${topic}`);
    } catch (error) {
      console.warn(`[Notifications] Subscribe to ${topic} failed:`, error?.message);
    }
  }

  async unsubscribeFromTopic(topic) {
    if (Platform.OS !== 'android') return;
    try {
      const messaging = this._getMessaging();
      if (messaging) await messaging().unsubscribeFromTopic(topic);
      console.log(`[Notifications] Unsubscribed from: ${topic}`);
    } catch (error) {
      console.warn(`[Notifications] Unsubscribe from ${topic} failed:`, error?.message);
    }
  }

  async deleteToken() {
    if (Platform.OS !== 'android') return;
    try {
      this._tokenCache = null;
      const messaging = this._getMessaging();
      if (messaging) await messaging().deleteToken();
      console.log('[Notifications] Token deleted');
    } catch (error) {
      console.warn('[Notifications] Delete token failed:', error?.message);
    }
  }
}

export default new NotificationService();