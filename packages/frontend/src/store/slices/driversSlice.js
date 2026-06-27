// store/slices/driversSlice.js
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

// GET /api/auth/drivers  — all drivers regardless of status
export const fetchAllDrivers = createAsyncThunk(
  'drivers/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = await getToken(getState);
      if (!token) throw new Error('No auth token');

      const res = await fetch(`${AUTH_URL}/drivers`, {
        headers: authHeader(token),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch drivers');
      return data.data; // array of driver objects
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// GET /api/auth/drivers/available  — only online drivers
export const fetchAvailableDrivers = createAsyncThunk(
  'drivers/fetchAvailable',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = await getToken(getState);
      if (!token) throw new Error('No auth token');

      const res = await fetch(`${AUTH_URL}/drivers/available`, {
        headers: authHeader(token),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch available drivers');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// PUT /api/auth/users/:id/toggle-status  — block / unblock a driver
export const toggleDriverBlockStatus = createAsyncThunk(
  'drivers/toggleBlock',
  async (driverId, { getState, rejectWithValue }) => {
    try {
      const token = await getToken(getState);
      if (!token) throw new Error('No auth token');

      const res = await fetch(`${AUTH_URL}/users/${driverId}/toggle-status`, {
        method: 'PUT',
        headers: authHeader(token),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update driver status');
      return data.data; // updated driver object
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── slice ────────────────────────────────────────────────────────────────────
const driversSlice = createSlice({
  name: 'drivers',
  initialState: {
    all: [],          // every driver
    available: [],    // only isAvailable === true
    loading: false,
    refreshing: false,
    error: null,
    actionLoading: null, // driver id currently being acted on
  },
  reducers: {
    clearDriversError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllDrivers
      .addCase(fetchAllDrivers.pending, (state, action) => {
        // distinguish initial load vs pull-to-refresh via meta arg
        if (action.meta.arg?.refresh) {
          state.refreshing = true;
        } else {
          state.loading = state.all.length === 0;
        }
        state.error = null;
      })
      .addCase(fetchAllDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.all = action.payload;
        // Derive available from the same payload to avoid a second round-trip
        state.available = action.payload.filter((d) => d.isAvailable);
      })
      .addCase(fetchAllDrivers.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload;
      })

      // fetchAvailableDrivers (used when we only need online count)
      .addCase(fetchAvailableDrivers.fulfilled, (state, action) => {
        state.available = action.payload;
      })

      // toggleDriverBlockStatus
      .addCase(toggleDriverBlockStatus.pending, (state, action) => {
        state.actionLoading = action.meta.arg;
      })
      .addCase(toggleDriverBlockStatus.fulfilled, (state, action) => {
        state.actionLoading = null;
        // Patch the driver in the all[] array in-place
        const updated = action.payload;
        const idx = state.all.findIndex((d) => d._id === updated._id);
        if (idx !== -1) state.all[idx] = updated;
      })
      .addCase(toggleDriverBlockStatus.rejected, (state, action) => {
        state.actionLoading = null;
        state.error = action.payload;
      });
  },
});

export const { clearDriversError } = driversSlice.actions;
export default driversSlice.reducer;