// // // authService.js

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { AUTH_URL } from '../screens/config/apiconfig'; //

// class AuthService {

//   // ─── Helper: parse response safely ────────────────────────────────────────
//   async _parseResponse(response) {
//     const text = await response.text();

//     // If server returns HTML (wrong URL / server error), give a clear message
//     if (text.trim().startsWith('<')) {
//       const status = response.status;
//       if (status === 404) throw new Error('API endpoint not found. Check your server URL.');
//       if (status === 500) throw new Error('Server error. Check your backend logs.');
//       throw new Error(`Server returned HTML instead of JSON (status ${status}). Check BASE_URL.`);
//     }

//     try {
//       return JSON.parse(text);
//     } catch {
//       throw new Error(`Invalid JSON response: ${text.slice(0, 100)}`);
//     }
//   }

//   // ─── Login ────────────────────────────────────────────────────────────────
//   async login(email, password) {
//     try {
//       const response = await fetch(`${AUTH_URL}/login`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await this._parseResponse(response);

//       if (!response.ok || !data.success) {
//         throw new Error(data.message || 'Login failed');
//       }

//       // Persist token + user to AsyncStorage
//       await AsyncStorage.setItem('token', data.token);
//       await AsyncStorage.setItem('user', JSON.stringify(data.user));
//       if (data.refreshToken) {
//         await AsyncStorage.setItem('refreshToken', data.refreshToken);
//       }

//       return data; // { success, token, refreshToken, user: { id, name, email, role } }

//     } catch (error) {
//       if (error.message === 'Network request failed') {
//         throw new Error(
//           'Cannot reach server. Check:\n' +
//           '• Backend running? (npm start)\n' +
//           '• Android emulator → use 10.0.2.2 not localhost\n' +
//           '• Physical device → use your Mac IP (ipconfig getifaddr en0)'
//         );
//       }
//       throw error;
//     }
//   }

//   // ─── Signup ───────────────────────────────────────────────────────────────
//   async signup(name, email, password, phone, role = 'user', fcmToken = null, driverFields = {}) {
//     try {
//       const body = {
//         name,
//         email,
//         password,
//         phone,
//         role,
//         fcmToken,
//         ...(role === 'driver' && {
//           vehicleType:   driverFields.vehicleType   || null,
//           vehicleNumber: driverFields.vehicleNumber || null,
//           licenseNumber: driverFields.licenseNumber || null,
//         }),
//       };

//       const response = await fetch(`${AUTH_URL}/register`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(body),
//       });

//       const data = await this._parseResponse(response);

//       if (!response.ok || !data.success) {
//         throw new Error(data.message || 'Registration failed');
//       }

//       await AsyncStorage.setItem('token', data.token);
//       await AsyncStorage.setItem('user', JSON.stringify(data.user));
//       if (data.refreshToken) {
//         await AsyncStorage.setItem('refreshToken', data.refreshToken);
//       }

//       return data;

//     } catch (error) {
//       if (error.message === 'Network request failed') {
//         throw new Error(
//           'Cannot reach server. Check:\n' +
//           '• Backend running? (npm start)\n' +
//           '• Android emulator → use 10.0.2.2 not localhost\n' +
//           '• Physical device → use your Mac IP (ipconfig getifaddr en0)'
//         );
//       }
//       throw error;
//     }
//   }

//   // ─── Logout ───────────────────────────────────────────────────────────────
//   async logout() {
//     await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
//   }

//   // ─── Get stored token ─────────────────────────────────────────────────────
//   async getToken() {
//     return AsyncStorage.getItem('token');
//   }

//   // ─── Get stored user ──────────────────────────────────────────────────────
//   async getStoredUser() {
//     const user = await AsyncStorage.getItem('user');
//     return user ? JSON.parse(user) : null;
//   }

//   // ─── Get current user from API ────────────────────────────────────────────
//   async getCurrentUser(token) {
//     try {
//       const response = await fetch(`${AUTH_URL}/me`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       return this._parseResponse(response);
//     } catch (error) {
//       throw new Error('Failed to fetch user profile: ' + error.message);
//     }
//   }
// }

// export const authService = new AuthService();
// authService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_URL } from '../config/apiconfig';

class AuthService {

  // ─── Helper: parse response safely ────────────────────────────────────────
  async _parseResponse(response) {
    const text = await response.text();

    // If server returns HTML (wrong URL / server error), give a clear message
    if (text.trim().startsWith('<')) {
      const status = response.status;
      if (status === 404) throw new Error('API endpoint not found. Check your server URL.');
      if (status === 500) throw new Error('Server error. Check your backend logs.');
      throw new Error(`Server returned HTML instead of JSON (status ${status}). Check BASE_URL.`);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response: ${text.slice(0, 100)}`);
    }
  }

  // ─── Helper: network error message ────────────────────────────────────────
  _networkErrorMessage() {
    return (
      'Cannot reach server. Check:\n' +
      '• Backend running? (npm start)\n' +
      '• Android emulator → use 10.0.2.2 not localhost\n' +
      '• Physical device → use your machine IP (ipconfig getifaddr en0)'
    );
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(email, password) {
    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await this._parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Persist token + user to AsyncStorage
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      if (data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
      }

      return data; // { success, token, refreshToken, user: { id, name, email, role, ... } }

    } catch (error) {
      if (error.message === 'Network request failed') {
        throw new Error(this._networkErrorMessage());
      }
      throw error;
    }
  }

  // ─── Signup ───────────────────────────────────────────────────────────────
  // FIX 1: vehicleType now falls back to 'bike' instead of null.
  //         The UserSchema enum ['bike','scooter','car','van'] rejects null,
  //         which was causing a Mongoose validation error and silently
  //         preventing driver accounts from being saved.
  //
  // FIX 2: driverFields are only spread when role === 'driver', which is
  //         correct — but we now guard vehicleType with a valid fallback so
  //         the backend never receives an invalid enum value.
  async signup(name, email, password, phone, role = 'user', fcmToken = null, driverFields = {}) {
    try {
      const allowedVehicleTypes = ['bike', 'scooter', 'car', 'van'];

      const body = {
        name,
        email,
        password,
        phone,
        role,
        fcmToken,
        ...(role === 'driver' && {
          // Use provided vehicleType if valid, otherwise default to 'bike'
          vehicleType: allowedVehicleTypes.includes(driverFields.vehicleType)
            ? driverFields.vehicleType
            : 'bike',
          vehicleNumber: driverFields.vehicleNumber || null,
          licenseNumber: driverFields.licenseNumber || null,
        }),
      };

      const response = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await this._parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      if (data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
      }

      return data;

    } catch (error) {
      if (error.message === 'Network request failed') {
        throw new Error(this._networkErrorMessage());
      }
      throw error;
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  // Calls the server endpoint to clear the cookie, then wipes local storage.
  // The server call is best-effort — local storage is always cleared even if
  // the request fails (e.g. no network).
  async logout() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await fetch(`${AUTH_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {
          // Ignore — local logout proceeds regardless
        });
      }
    } finally {
      await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
    }
  }

  // ─── Get stored token ─────────────────────────────────────────────────────
  async getToken() {
    return AsyncStorage.getItem('token');
  }

  // ─── Get stored user ──────────────────────────────────────────────────────
  async getStoredUser() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // ─── Get current user from API ────────────────────────────────────────────
  async getCurrentUser(token) {
    try {
      const response = await fetch(`${AUTH_URL}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return this._parseResponse(response);
    } catch (error) {
      throw new Error('Failed to fetch user profile: ' + error.message);
    }
  }

  // ─── Update profile ───────────────────────────────────────────────────────
  // Accepts any profile fields. For drivers, pass vehicleType / vehicleNumber
  // / licenseNumber inside profileData and the backend will handle them.
  async updateProfile(token, profileData) {
    try {
      const response = await fetch(`${AUTH_URL}/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await this._parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Profile update failed');
      }

      // Keep AsyncStorage in sync
      const updatedUser = data.data || data.user;
      if (updatedUser) {
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }

      return data;
    } catch (error) {
      throw new Error('Failed to update profile: ' + error.message);
    }
  }

  // ─── Update FCM token ─────────────────────────────────────────────────────
  async updateFCMToken(token, fcmToken) {
    try {
      const response = await fetch(`${AUTH_URL}/update-fcm-token`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fcmToken }),
      });

      const data = await this._parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'FCM token update failed');
      }

      return data;
    } catch (error) {
      throw new Error('Failed to update FCM token: ' + error.message);
    }
  }

  // ─── Refresh token ────────────────────────────────────────────────────────
  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token found');

      const response = await fetch(`${AUTH_URL}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await this._parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Token refresh failed');
      }

      await AsyncStorage.setItem('token', data.token);
      if (data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
      }

      return data;
    } catch (error) {
      throw new Error('Failed to refresh token: ' + error.message);
    }
  }

  // ─── Driver: toggle availability ──────────────────────────────────────────
  async toggleDriverAvailability(token) {
    try {
      const response = await fetch(`${AUTH_URL}/driver/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await this._parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to toggle availability');
      }

      return data; // { success, message, isAvailable }
    } catch (error) {
      throw new Error('Failed to toggle driver availability: ' + error.message);
    }
  }

  // ─── Driver: update GPS location ──────────────────────────────────────────
  async updateDriverLocation(token, lat, lng) {
    try {
      const response = await fetch(`${AUTH_URL}/driver/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lat, lng }),
      });

      const data = await this._parseResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update location');
      }

      return data;
    } catch (error) {
      throw new Error('Failed to update driver location: ' + error.message);
    }
  }
}

export const authService = new AuthService();