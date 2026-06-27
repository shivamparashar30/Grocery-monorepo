const express = require('express');
const router = express.Router();

const {
  // Middleware
  auth,
  isAdmin,
  isDriver,

  // Public routes
  register,
  login,
  updateFCMToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  checkEmailExists,

  // Protected routes
  getMe,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  refreshToken,
  deleteAccount,
  updateAvatar,
  enable2FA,
  verify2FA,
  disable2FA,

  // Social auth
  googleAuth,
  facebookAuth,
  appleAuth,

  // Driver routes
  registerDriver,
  toggleDriverAvailability,
  updateDriverLocation,

  // Admin routes
  getAllUsers,
  getAllDrivers,
  getAvailableDrivers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} = require('../controller/auth');

// ============================================
// PUBLIC ROUTES
// ============================================

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/check-email', checkEmailExists);

// Social Auth
router.post('/google', googleAuth);
router.post('/facebook', facebookAuth);
router.post('/apple', appleAuth);

// ============================================
// PROTECTED ROUTES (All roles)
// ============================================

router.get('/me', auth, getMe);
router.get('/current-user', auth, getCurrentUser);
router.put('/update-profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);
router.post('/logout', auth, logout);
router.post('/refresh-token', refreshToken);
router.delete('/delete-account', auth, deleteAccount);
router.put('/update-avatar', auth, updateAvatar);
router.put('/update-fcm-token', auth, updateFCMToken);

// 2FA
router.post('/enable-2fa', auth, enable2FA);
router.post('/verify-2fa', auth, verify2FA);
router.post('/disable-2fa', auth, disable2FA);

// ============================================
// DRIVER ROUTES
// ============================================

// Toggle online/offline status
router.put('/driver/availability', auth, isDriver, toggleDriverAvailability);

// Update live GPS location
router.put('/driver/location', auth, isDriver, updateDriverLocation);

// ============================================
// ADMIN ROUTES
// ============================================

// Create a driver account (admin only)
router.post('/register-driver', auth, isAdmin, registerDriver);

// Get all regular users
router.get('/users', auth, isAdmin, getAllUsers);

// Get all drivers
router.get('/drivers/available', auth, isAdmin, getAvailableDrivers);
router.get('/drivers', auth, isAdmin, getAllDrivers);

// Single user/driver management
router.get('/users/:id', auth, isAdmin, getUserById);
router.put('/users/:id/role', auth, isAdmin, updateUserRole);
router.put('/users/:id/toggle-status', auth, isAdmin, toggleUserStatus);
router.delete('/users/:id', auth, isAdmin, deleteUser);

module.exports = router;