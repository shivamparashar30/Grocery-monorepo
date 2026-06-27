
// // store/slices/authSlice.js
// // PATCHED: stores user + role from login/signup response for role-based navigation

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { authService } from '../../services/authService';

// // ─── Async Thunks ─────────────────────────────────────────────────────────────

// export const loginUser = createAsyncThunk(
//   'auth/login',
//   async ({ email, password }, { rejectWithValue }) => {
//     try {
//       const response = await authService.login(email, password);
//       // response shape: { success, token, refreshToken, user: { id, name, email, role, ... } }
//       return response;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );


// export const signupUser = createAsyncThunk(
//   'auth/signup',
//   async (
//     { name, email, password, phone, role, fcmToken, vehicleType, vehicleNumber, licenseNumber },
//     { rejectWithValue }
//   ) => {
//     try {
//       // ✅ Pass driverFields as the 7th argument to authService.signup
//       const response = await authService.signup(
//         name,
//         email,
//         password,
//         phone,
//         role,
//         fcmToken,
//         // Driver-specific fields bundled together
//         { vehicleType, vehicleNumber, licenseNumber }
//       );
//       return response;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );
 

// export const loadStoredAuth = createAsyncThunk(
//   'auth/loadStored',
//   async (_, { rejectWithValue }) => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const userJson = await AsyncStorage.getItem('user');

//       console.log('Loading stored auth — token exists:', !!token, '| user exists:', !!userJson);

//       if (token && userJson) {
//         return { token, user: JSON.parse(userJson) };
//       }
//       return null;
//     } catch (error) {
//       console.error('Error loading stored auth:', error);
//       return rejectWithValue(error.message);
//     }
//   }
// );

// export const logoutUser = createAsyncThunk(
//   'auth/logout',
//   async (_, { rejectWithValue }) => {
//     try {
//       await authService.logout();
//       return null;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// // ─── Slice ────────────────────────────────────────────────────────────────────

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     token: null,
//     user: null,        // ← ADDED: store user object (includes role)
//     isAuthenticated: false,
//     loading: false,
//     error: null,
//     isInitialized: false,
//   },
//   reducers: {
//     clearError: (state) => {
//       state.error = null;
//     },
//     setToken: (state, action) => {
//       state.token = action.payload;
//       state.isAuthenticated = !!action.payload;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // ── Login ────────────────────────────────────────────────────────────
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.token = action.payload.token;
//         state.user = action.payload.user ?? null;   // ← store user with role
//         state.isAuthenticated = true;
//         state.error = null;
//         console.log('Auth: login success, role =', action.payload.user?.role);
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.isAuthenticated = false;
//       })

//       // ── Signup ───────────────────────────────────────────────────────────
//       .addCase(signupUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(signupUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.token = action.payload.token;
//         state.user = action.payload.user ?? null;   // ← store user with role
//         state.isAuthenticated = true;
//         state.error = null;
//         console.log('Auth: signup success, role =', action.payload.user?.role);
//       })
//       .addCase(signupUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.isAuthenticated = false;
//       })

//       // ── Load Stored Auth ──────────────────────────────────────────────────
//       .addCase(loadStoredAuth.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(loadStoredAuth.fulfilled, (state, action) => {
//         state.loading = false;
//         state.isInitialized = true;
//         if (action.payload) {
//           state.token = action.payload.token;
//           state.user = action.payload.user ?? null;  // ← restore user with role
//           state.isAuthenticated = true;
//           console.log('Auth: restored session, role =', action.payload.user?.role);
//         } else {
//           console.log('Auth: no stored session');
//         }
//       })
//       .addCase(loadStoredAuth.rejected, (state) => {
//         state.loading = false;
//         state.isInitialized = true;
//         state.isAuthenticated = false;
//       })

//       // ── Logout ───────────────────────────────────────────────────────────
//       .addCase(logoutUser.fulfilled, (state) => {
//         state.token = null;
//         state.user = null;
//         state.isAuthenticated = false;
//         state.error = null;
//         console.log('Auth: logged out');
//       });
//   },
// });

// export const { clearError, setToken } = authSlice.actions;
// export default authSlice.reducer;

// store/slices/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/authService';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password);
      // response shape: { success, token, refreshToken, user: { id, name, email, role, ... } }
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (
    { name, email, password, phone, role, fcmToken, vehicleType, vehicleNumber, licenseNumber },
    { rejectWithValue }
  ) => {
    try {
      // FIX: driverFields are bundled as the 7th argument.
      // authService.signup() now correctly spreads these into the request body
      // so the backend register() controller receives them in req.body.
      const response = await authService.signup(
        name,
        email,
        password,
        phone,
        role,
        fcmToken,
        { vehicleType, vehicleNumber, licenseNumber }
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userJson = await AsyncStorage.getItem('user');

      console.log('Loading stored auth — token exists:', !!token, '| user exists:', !!userJson);

      if (token && userJson) {
        return { token, user: JSON.parse(userJson) };
      }
      return null;
    } catch (error) {
      console.error('Error loading stored auth:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    isInitialized: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    // Allows manual user updates (e.g. after profile edit)
    updateAuthUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder

      // ── Login ──────────────────────────────────────────────────────────────
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user ?? null;
        state.isAuthenticated = true;
        state.error = null;
        console.log('Auth: login success, role =', action.payload.user?.role);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // ── Signup ─────────────────────────────────────────────────────────────
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user ?? null;
        state.isAuthenticated = true;
        state.error = null;
        console.log('Auth: signup success, role =', action.payload.user?.role);
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // ── Load Stored Auth ───────────────────────────────────────────────────
      .addCase(loadStoredAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user ?? null;
          state.isAuthenticated = true;
          console.log('Auth: restored session, role =', action.payload.user?.role);
        } else {
          console.log('Auth: no stored session');
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.loading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
      })

      // ── Logout ─────────────────────────────────────────────────────────────
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        console.log('Auth: logged out');
      });
  },
});

export const { clearError, setToken, updateAuthUser } = authSlice.actions;
export default authSlice.reducer;