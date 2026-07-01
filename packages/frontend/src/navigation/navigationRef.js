import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

// Queue for notifications received before navigator is ready
let pendingNavigation = null;

export function navigateFromNotification(data) {
  if (!data?.screen) return;

  if (navigationRef.isReady()) {
    performNavigation(data);
  } else {
    // Store and process once navigation is ready
    pendingNavigation = data;
  }
}

export function processPendingNavigation() {
  if (pendingNavigation && navigationRef.isReady()) {
    performNavigation(pendingNavigation);
    pendingNavigation = null;
  }
}

function performNavigation(data) {
  const { screen, orderId, deliveryId } = data;

  try {
    switch (screen) {
      case 'DriverDeliveryDetail':
        if (deliveryId) {
          navigationRef.navigate('DriverDeliveryDetail', { deliveryId });
        }
        break;
      case 'AvailableOrders':
        navigationRef.navigate('AvailableOrders');
        break;
      case 'OrderDetails':
        if (orderId) {
          // User app — navigate to MyOrders first then OrderDetails will be accessible
          navigationRef.navigate('MyOrders');
        }
        break;
      case 'AdminOrderDetail':
        if (orderId) {
          navigationRef.navigate('AdminOrderDetail', { orderId });
        }
        break;
      default:
        break;
    }
  } catch (err) {
    console.warn('[Navigation] Failed to navigate from notification:', err.message);
  }
}
