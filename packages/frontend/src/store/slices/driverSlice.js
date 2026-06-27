// store/slices/driverSlice.js
// Manages the DRIVER's own session state:
//   - online/offline availability toggle  → PUT /api/auth/driver/availability
//   - live GPS location updates           → PUT /api/auth/driver/location
//
// Note: This is separate from driversSlice.js (plural) which is used by
// the ADMIN panel to view and manage all drivers.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_URL } from '../../config/apiconfig';

// ─── helpers ──────────────────────────────────────────────────────────────────
const getToken = async (getState) => {
  const { auth } = getState();
  return auth.token || (await AsyncStorage.getItem('token'));
};

const authHeader = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// ─── thunks ───────────────────────────────────────────────────────────────────

// PUT /api/auth/driver/availability
// Backend toggles isAvailable and returns { success, message, isAvailable }
export const toggleAvailability = createAsyncThunk(
  'driver/toggleAvailability',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = await getToken(getState);
      if (!token) throw new Error('No auth token');

      const res = await fetch(`${AUTH_URL}/driver/availability`, {
        method: 'PUT',
        headers: authHeader(token),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to toggle availability');
      }

      return data.isAvailable; // boolean
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// PUT /api/auth/driver/location
// Sends current GPS coords; backend stores them on the user document
export const updateLocation = createAsyncThunk(
  'driver/updateLocation',
  async ({ lat, lng }, { getState, rejectWithValue }) => {
    try {
      const token = await getToken(getState);
      if (!token) throw new Error('No auth token');

      const res = await fetch(`${AUTH_URL}/driver/location`, {
        method: 'PUT',
        headers: authHeader(token),
        body: JSON.stringify({ lat, lng }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update location');
      }

      return { lat, lng };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── slice ────────────────────────────────────────────────────────────────────
const driverSlice = createSlice({
  name: 'driver',
  initialState: {
    // Availability — seeded from user.data.isAvailable in the screen via
    // useEffect so the toggle reflects the persisted server value on re-login
    isAvailable: false,
    availabilityLoading: false,

    // Location
    currentLocation: null, // { lat, lng }
    locationLoading: false,

    error: null,
  },
  reducers: {
    // Called once on mount to sync initial state from the stored user object
    seedAvailability: (state, action) => {
      state.isAvailable = !!action.payload;
    },
    clearDriverError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // toggleAvailability
      .addCase(toggleAvailability.pending, (state) => {
        state.availabilityLoading = true;
        state.error = null;
      })
      .addCase(toggleAvailability.fulfilled, (state, action) => {
        state.availabilityLoading = false;
        // Use the value returned by the server (source of truth)
        state.isAvailable = action.payload;
      })
      .addCase(toggleAvailability.rejected, (state, action) => {
        state.availabilityLoading = false;
        state.error = action.payload;
        // Do NOT optimistically flip — keep current value so UI stays consistent
      })

      // updateLocation
      .addCase(updateLocation.pending, (state) => {
        state.locationLoading = true;
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.locationLoading = false;
        state.currentLocation = action.payload;
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.locationLoading = false;
        state.error = action.payload;
      });
  },
});

export const { seedAvailability, clearDriverError } = driverSlice.actions;
export default driverSlice.reducer;