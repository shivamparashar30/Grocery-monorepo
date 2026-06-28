import { Platform } from 'react-native';

const DEV_CONFIG = {
  android: 'http://192.168.1.6:8080/api/v1',
  ios: 'http://192.168.1.6:8080/api/v1',

};

const PROD_URL = 'https://your-production-api.com/api/v1'; 

export const BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? DEV_CONFIG.android
    : DEV_CONFIG.ios
  : PROD_URL;

export const AUTH_URL = `${BASE_URL}/auth`;