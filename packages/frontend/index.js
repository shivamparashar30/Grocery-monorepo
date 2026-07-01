import { AppRegistry, Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Helper to display notification via notifee
async function displayFromData(data) {
  const title = data?.title || 'New Notification';
  const body = data?.body || '';
  const type = data?.type || 'general';

  const channelId = type === 'order' ? 'orders' : type === 'offer' || type === 'welcome_offer' ? 'offers' : 'default';

  // Ensure channel exists
  await notifee.createChannel({
    id: channelId,
    name: channelId === 'orders' ? 'Order Updates' : channelId === 'offers' ? 'Offers & Promotions' : 'Default',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default', launchActivity: 'default' },
      sound: 'default',
      vibrationPattern: [300, 500],
      smallIcon: 'ic_notification',
    },
    data: data || {},
  });
}

// Background handler — Android only
if (Platform.OS === 'android') {
  const messaging = require('@react-native-firebase/messaging').default;

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message received:', remoteMessage);
    const { data } = remoteMessage;

    if (data?.title || data?.body) {
      await displayFromData(data);
    }
  });
}

// Notifee background event handler (required by notifee)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('[Notifee] Background event:', type, detail?.notification?.id);
});

AppRegistry.registerComponent(appName, () => App);
