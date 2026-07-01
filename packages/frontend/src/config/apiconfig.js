import { Platform } from 'react-native';

const DEV_CONFIG = {
  android: 'http://192.168.1.12:8080/api/v1',
  ios: 'http://192.168.1.12:8080/api/v1',
};

const PROD_URL = 'https://your-production-api.com/api/v1';

export const BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? DEV_CONFIG.android
    : DEV_CONFIG.ios
  : PROD_URL;

export const SERVER_URL = BASE_URL.replace('/api/v1', '');

export const AUTH_URL = `${BASE_URL}/auth`;

/**
 * Convert a relative image path (e.g. /uploads/products/img.jpg) to a full URL.
 * Passes through URLs that are already absolute or require() references.
 */
export const resolveImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_URL}${path}`;
};