// store/index.js
// Complete Redux store — merge this with your existing store file.
// Three slices are now registered:
//
//   auth    — login / signup / session (authSlice.js)
//   user    — current user profile     (userSlice.js)
//   driver  — driver's OWN availability + location (driverSlice.js)   ← NEW (singular)
//   drivers — admin view of ALL drivers             (driversSlice.js) ← NEW (plural)

import { configureStore } from '@reduxjs/toolkit';

import authReducer    from './slices/authSlice';
import userReducer    from './slices/userSlice';
import driverReducer  from './slices/driverSlice';   // singular — driver's own state
import driversReducer from './slices/driversSlice';  // plural  — admin's driver list

const store = configureStore({
  reducer: {
    auth:    authReducer,
    user:    userReducer,
    driver:  driverReducer,   // state.driver.isAvailable, state.driver.currentLocation
    drivers: driversReducer,  // state.drivers.all, state.drivers.available
    // Add your other reducers here (orders, products, cart, etc.)
  },
});

export default store;