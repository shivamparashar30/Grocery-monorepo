
// // store/slices/userSlice.js

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { authService } from '../../services/authService';
// import { AUTH_URL } from '../../screens/config/apiconfig'; // ✅ centralized URL — no more localhost

// // ─── Fetch User Profile ───────────────────────────────────────────────────────
// export const fetchUserProfile = createAsyncThunk(
//   'user/fetchProfile',
//   async (_, { getState, rejectWithValue }) => {
//     try {
//       const { auth } = getState();
//       let token = auth.token;

//       if (!token) token = await authService.getToken();
//       if (!token) throw new Error('No authentication token found');

//       const response = await authService.getCurrentUser(token);

//       if (response.success) {
//         const userData = response.data || response.user;
//         await AsyncStorage.setItem('user', JSON.stringify(userData));
//         return userData;
//       }

//       throw new Error(response.message || 'Failed to fetch profile');
//     } catch (error) {
//       console.error('Fetch profile error:', error.message);
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // ─── Update User Profile ──────────────────────────────────────────────────────
// export const updateUserProfile = createAsyncThunk(
//   'user/updateProfile',
//   async ({ name, email, phone }, { getState, rejectWithValue }) => {
//     try {
//       const { auth } = getState();
//       let token = auth.token;

//       if (!token) token = await authService.getToken();
//       if (!token) throw new Error('No authentication token found');

//       const response = await fetch(`${AUTH_URL}/update-profile`, { // ✅ uses correct URL
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ name, email, phone }),
//       });

//       const text = await response.text();

//       // Guard against HTML error pages
//       if (text.trim().startsWith('<')) {
//         throw new Error(`Server error (status ${response.status}). Check backend logs.`);
//       }

//       let data;
//       try {
//         data = JSON.parse(text);
//       } catch {
//         throw new Error('Server returned invalid JSON');
//       }

//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to update profile');
//       }

//       if (data.success) {
//         const updatedUser = data.data || data.user;
//         await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
//         return updatedUser;
//       }

//       throw new Error(data.message || 'Update failed');
//     } catch (error) {
//       console.error('Update profile error:', error.message);
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // ─── Load Stored User ─────────────────────────────────────────────────────────
// export const loadStoredUser = createAsyncThunk(
//   'user/loadStored',
//   async (_, { rejectWithValue }) => {
//     try {
//       const storedUser = await authService.getStoredUser();
//       if (storedUser) {
//         console.log('Stored user loaded — role:', storedUser.role);
//       }
//       return storedUser;
//     } catch (error) {
//       console.error('Error loading stored user:', error.message);
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // ─── Slice ────────────────────────────────────────────────────────────────────
// const userSlice = createSlice({
//   name: 'user',
//   initialState: {
//     data: null,
//     loading: false,
//     updating: false,
//     error: null,
//     updateSuccess: false,
//   },
//   reducers: {
//     clearError: (state) => { state.error = null; },
//     clearUpdateSuccess: (state) => { state.updateSuccess = false; },
//     setUserData: (state, action) => {
//       state.data = action.payload;
//       console.log('User data set in Redux — role:', action.payload?.role);
//     },
//     clearUserData: (state) => {
//       state.data = null;
//       state.error = null;
//       state.updateSuccess = false;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Fetch profile
//       .addCase(fetchUserProfile.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchUserProfile.fulfilled, (state, action) => {
//         state.loading = false;
//         state.data = action.payload;
//         state.error = null;
//       })
//       .addCase(fetchUserProfile.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Update profile
//       .addCase(updateUserProfile.pending, (state) => {
//         state.updating = true;
//         state.error = null;
//         state.updateSuccess = false;
//       })
//       .addCase(updateUserProfile.fulfilled, (state, action) => {
//         state.updating = false;
//         state.data = action.payload;
//         state.error = null;
//         state.updateSuccess = true;
//       })
//       .addCase(updateUserProfile.rejected, (state, action) => {
//         state.updating = false;
//         state.error = action.payload;
//         state.updateSuccess = false;
//       })
//       // Load stored user
//       .addCase(loadStoredUser.fulfilled, (state, action) => {
//         if (action.payload) {
//           state.data = action.payload;
//         }
//       });
//   },
// });

// export const { clearError, clearUpdateSuccess, setUserData, clearUserData } = userSlice.actions;
// export default userSlice.reducer;

// store/slices/userSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/authService';
import { AUTH_URL } from '../../config/apiconfig';

// ─── Fetch User Profile ───────────────────────────────────────────────────────
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      let token = auth.token;

      if (!token) token = await authService.getToken();
      if (!token) throw new Error('No authentication token found');

      const response = await authService.getCurrentUser(token);

      if (response.success) {
        const userData = response.data || response.user;
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }

      throw new Error(response.message || 'Failed to fetch profile');
    } catch (error) {
      console.error('Fetch profile error:', error.message);
      return rejectWithValue(error.message);
    }
  }
);

// ─── Update User Profile ──────────────────────────────────────────────────────
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      let token = auth.token;

      if (!token) token = await authService.getToken();
      if (!token) throw new Error('No authentication token found');

      // Use the shared authService method which centralises error handling.
      // This also handles driver-specific fields (vehicleType, vehicleNumber,
      // licenseNumber) since authService.updateProfile passes profileData as-is.
      const data = await authService.updateProfile(token, profileData);

      const updatedUser = data.data || data.user;
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error.message);
      return rejectWithValue(error.message);
    }
  }
);

// ─── Load Stored User ─────────────────────────────────────────────────────────
export const loadStoredUser = createAsyncThunk(
  'user/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      const storedUser = await authService.getStoredUser();
      if (storedUser) {
        console.log('Stored user loaded — role:', storedUser.role);
      }
      return storedUser;
    } catch (error) {
      console.error('Error loading stored user:', error.message);
      return rejectWithValue(error.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const userSlice = createSlice({
  name: 'user',
  initialState: {
    data: null,
    loading: false,
    updating: false,
    error: null,
    updateSuccess: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUpdateSuccess: (state) => {
      state.updateSuccess = false;
    },
    setUserData: (state, action) => {
      state.data = action.payload;
      console.log('User data set in Redux — role:', action.payload?.role);
    },
    clearUserData: (state) => {
      state.data = null;
      state.error = null;
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updating = false;
        state.data = action.payload;
        state.error = null;
        state.updateSuccess = true;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
        state.updateSuccess = false;
      })

      // Load stored user
      .addCase(loadStoredUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.data = action.payload;
        }
      });
  },
});

export const { clearError, clearUpdateSuccess, setUserData, clearUserData } = userSlice.actions;
export default userSlice.reducer;