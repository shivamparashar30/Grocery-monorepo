// services/firebaseService.js
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    // Try service account file first (works in any environment)
    try {
      const serviceAccount = require('../config/firebase-service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (fileError) {
      // Fallback to environment variables (production/Vercel)
      if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        console.warn('Firebase credentials not configured. Push notifications will be disabled.');
        return;
      }
    }

    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
};

// Initialize on module load
initializeFirebase();

/**
 * Send push notification to multiple devices
 * Uses DATA-ONLY messages so the app's background handler always fires
 * and notifee displays the notification properly in all states.
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    const validTokens = tokens.filter(token => token && token.length > 0);

    if (validTokens.length === 0) {
      console.log('No valid FCM tokens provided');
      return { success: false, message: 'No valid tokens' };
    }

    console.log(`Sending notification to ${validTokens.length} device(s)`);
    console.log('Notification title:', title);
    console.log('Notification body:', body);

    // Convert all data values to strings (FCM requirement)
    const stringifiedData = {};
    Object.keys(data).forEach(key => {
      stringifiedData[key] = String(data[key]);
    });

    // DATA-ONLY message — no "notification" field
    // This ensures the background handler ALWAYS fires on Android,
    // giving notifee full control to display the notification.
    const message = {
      data: {
        ...stringifiedData,
        title,
        body,
        notifee: JSON.stringify({
          title,
          body,
          android: {
            channelId: stringifiedData.type === 'order' ? 'orders' : stringifiedData.type === 'offer' ? 'offers' : 'default',
            importance: 4, // AndroidImportance.HIGH
            pressAction: { id: 'default', launchActivity: 'default' },
            sound: 'default',
            vibrationPattern: [300, 500],
            smallIcon: 'ic_notification',
          },
        }),
      },
      android: {
        priority: 'high',
        ttl: 86400000, // 24 hours
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'content-available': 1,
          },
        },
      },
      tokens: validTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log('Successfully sent notifications:', response.successCount);
    console.log('Failed notifications:', response.failureCount);

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${validTokens[idx]}:`, resp.error?.message);
        }
      });
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

/**
 * Send notification to a single device
 */
const sendSingleNotification = async (token, title, body, data = {}) => {
  return sendPushNotification([token], title, body, data);
};

/**
 * Send notification to topic subscribers
 */
const sendToTopic = async (topic, title, body, data = {}) => {
  try {
    if (!firebaseInitialized) {
      initializeFirebase();
    }

    const stringifiedData = {};
    Object.keys(data).forEach(key => {
      stringifiedData[key] = String(data[key]);
    });

    const message = {
      data: {
        ...stringifiedData,
        title,
        body,
      },
      topic,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent to topic:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending to topic:', error);
    throw error;
  }
};

module.exports = {
  sendPushNotification,
  sendSingleNotification,
  sendToTopic,
};
