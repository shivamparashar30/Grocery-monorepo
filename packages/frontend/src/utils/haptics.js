import { Platform } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const opts = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };

const fire = (type) => {
  try {
    ReactNativeHapticFeedback.trigger(type, opts);
  } catch (_) {
    // native module not yet linked — silent no-op until rebuild
  }
};

/** Add to Cart — light impact */
export const hapticAddToCart = () => fire('impactLight');

/** Quantity (+) — selection tick */
export const hapticIncrement = () => fire('selection');

/** Quantity (−) — soft impact */
export const hapticDecrement = () => fire('soft');

/** Last item removed — success notification */
export const hapticRemoved = () => fire('notificationSuccess');

/** Carousel page change — clock-wheel tick */
export const hapticTick = () =>
  fire(Platform.OS === 'android' ? 'clockTick' : 'selection');
