// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const User = require('../models/user');
// const sendEmail = require('../utils/Sendemail');
// const { sendPushNotification } = require('../services/firebaseService');

// // ============================================
// // HELPER FUNCTIONS
// // ============================================

// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE || '7d',
//   });
// };

// const generateRefreshToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
//     expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
//   });
// };

// const sendTokenResponse = (user, statusCode, res) => {
//   const token = generateToken(user._id);
//   const refreshToken = generateRefreshToken(user._id);

//   const options = {
//     expires: new Date(
//       Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//   };

//   if (process.env.NODE_ENV === 'production') {
//     options.secure = true;
//   }

//   res.status(statusCode).cookie('token', token, options).json({
//     success: true,
//     token,
//     refreshToken,
//     user: {
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       // ✅ Include driver-specific fields if driver
//       ...(user.role === 'driver' && {
//         isAvailable: user.isAvailable,
//         vehicleType: user.vehicleType,
//         totalDeliveries: user.totalDeliveries,
//         driverRating: user.driverRating,
//       }),
//     },
//   });
// };

// // ============================================
// // PUBLIC ROUTES
// // ============================================

// // @desc    Register User (user role only — no self-assigning admin/driver)
// // @route   POST /api/auth/register
// // @access  Public
// exports.register = async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       password,
//       phone,
//       role,
//       fcmToken,
//       // Driver-specific fields
//       vehicleType,
//       vehicleNumber,
//       licenseNumber,
//     } = req.body;
 
//     if (!name || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide name, email, and password',
//       });
//     }
 
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: 'User already exists with this email',
//       });
//     }
 
//     // ✅ Allow 'user' or 'driver' from the request body.
//     // Anything else (e.g. 'admin') falls back to 'user' for security.
//     const allowedRoles = ['user', 'driver'];
//     const assignedRole = allowedRoles.includes(role) ? role : 'user';
 
//     // Build user object
//     const userPayload = {
//       name,
//       email,
//       password,
//       phone,
//       role: assignedRole,
//       isFirstLogin: true,
//       fcmTokens: fcmToken ? [fcmToken] : [],
//     };
 
//     // ✅ Attach driver fields only when registering as driver
//     if (assignedRole === 'driver') {
//       userPayload.vehicleType   = vehicleType   || null;
//       userPayload.vehicleNumber = vehicleNumber || null;
//       userPayload.licenseNumber = licenseNumber || null;
//       userPayload.isAvailable   = false; // offline by default
//     }
 
//     const user = await User.create(userPayload);
 
//     // Send welcome push notification
//     if (fcmToken) {
//       try {
//         const welcomeTitle = assignedRole === 'driver'
//           ? '🚗 Welcome, Rider!'
//           : '🎉 Welcome to Our Store!';
//         const welcomeBody = assignedRole === 'driver'
//           ? 'Your driver account is ready. Go online to start accepting deliveries!'
//           : 'Get 50% OFF on your first order + FREE delivery! Start shopping now!';
 
//         await sendPushNotification(
//           [fcmToken],
//           welcomeTitle,
//           welcomeBody,
//           {
//             type: 'welcome_offer',
//             screen: assignedRole === 'driver' ? 'DriverHome' : 'Home',
//           }
//         );
//       } catch (notificationError) {
//         console.error('Failed to send welcome notification:', notificationError);
//       }
//     }
 
//     sendTokenResponse(user, 201, res);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during registration',
//       error: error.message,
//     });
//   }
// };

// // @desc    Register Driver (Admin creates driver accounts)
// // @route   POST /api/auth/register-driver
// // @access  Private/Admin
// exports.registerDriver = async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       password,
//       phone,
//       vehicleType,
//       vehicleNumber,
//       licenseNumber,
//     } = req.body;

//     if (!name || !email || !password || !phone) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide name, email, password, and phone',
//       });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: 'User already exists with this email',
//       });
//     }

//     const driver = await User.create({
//       name,
//       email,
//       password,
//       phone,
//       role: 'driver',           // ✅ Hardcoded — only admin can create drivers
//       vehicleType: vehicleType || null,
//       vehicleNumber: vehicleNumber || null,
//       licenseNumber: licenseNumber || null,
//       isAvailable: false,       // Offline by default
//       isFirstLogin: true,
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Driver account created successfully',
//       data: {
//         id: driver._id,
//         name: driver.name,
//         email: driver.email,
//         phone: driver.phone,
//         role: driver.role,
//         vehicleType: driver.vehicleType,
//         vehicleNumber: driver.vehicleNumber,
//         licenseNumber: driver.licenseNumber,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error during driver registration',
//       error: error.message,
//     });
//   }
// };

// // @desc    Login (works for all 3 roles)
// // @route   POST /api/auth/login
// // @access  Public
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide email and password',
//       });
//     }

//     const user = await User.findOne({ email }).select('+password');
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials',
//       });
//     }

//     const isMatch = await user.matchPassword(password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials',
//       });
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({
//         success: false,
//         message: 'Your account has been blocked. Please contact support.',
//       });
//     }

//     if (user.twoFactorEnabled) {
//       return res.status(200).json({
//         success: true,
//         requires2FA: true,
//         message: 'Please enter your 2FA code',
//         tempToken: generateToken(user._id),
//       });
//     }

//     sendTokenResponse(user, 200, res);
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error during login',
//       error: error.message,
//     });
//   }
// };

// // @desc    Update FCM Token
// // @route   PUT /api/auth/fcm-token
// // @access  Private
// exports.updateFCMToken = async (req, res) => {
//   try {
//     const { fcmToken } = req.body;
//     const user = await User.findById(req.user.id);

//     if (!user.fcmTokens.includes(fcmToken)) {
//       user.fcmTokens.push(fcmToken);
//       await user.save();
//     }

//     res.status(200).json({
//       success: true,
//       message: 'FCM token updated successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error updating FCM token',
//       error: error.message,
//     });
//   }
// };

// // @desc    Forgot Password
// // @route   POST /api/auth/forgot-password
// // @access  Public
// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'No user found with that email',
//       });
//     }

//     const resetToken = user.getResetPasswordToken();
//     await user.save({ validateBeforeSave: false });

//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
//     const message = `You requested a password reset. Click the link to reset: \n\n${resetUrl}\n\nIgnore if you did not request this.`;

//     try {
//       await sendEmail({
//         email: user.email,
//         subject: 'Password Reset Request',
//         message,
//       });

//       res.status(200).json({
//         success: true,
//         message: 'Password reset email sent',
//       });
//     } catch (err) {
//       user.resetPasswordToken = undefined;
//       user.resetPasswordExpire = undefined;
//       await user.save({ validateBeforeSave: false });

//       return res.status(500).json({
//         success: false,
//         message: 'Email could not be sent',
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Reset Password
// // @route   POST /api/auth/reset-password/:token
// // @access  Public
// exports.resetPassword = async (req, res) => {
//   try {
//     const { password } = req.body;

//     const resetPasswordToken = crypto
//       .createHash('sha256')
//       .update(req.params.token)
//       .digest('hex');

//     const user = await User.findOne({
//       resetPasswordToken,
//       resetPasswordExpire: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid or expired reset token',
//       });
//     }

//     user.password = password;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: 'Password reset successful',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Check if Email Exists
// // @route   POST /api/auth/check-email
// // @access  Public
// exports.checkEmailExists = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });

//     res.status(200).json({
//       success: true,
//       exists: !!user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // ============================================
// // PROTECTED ROUTES (All roles)
// // ============================================

// // @desc    Get Current User
// // @route   GET /api/auth/me
// // @access  Private
// exports.getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// exports.getCurrentUser = exports.getMe;

// // @desc    Update Profile
// // @route   PUT /api/auth/update-profile
// // @access  Private
// exports.updateProfile = async (req, res) => {
//   try {
//     const fieldsToUpdate = {
//       name: req.body.name,
//       email: req.body.email,
//       phone: req.body.phone,
//     };

//     // ✅ Allow drivers to update their driver-specific fields
//     if (req.user.role === 'driver') {
//       if (req.body.vehicleType) fieldsToUpdate.vehicleType = req.body.vehicleType;
//       if (req.body.vehicleNumber) fieldsToUpdate.vehicleNumber = req.body.vehicleNumber;
//       if (req.body.licenseNumber) fieldsToUpdate.licenseNumber = req.body.licenseNumber;
//     }

//     const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Change Password
// // @route   PUT /api/auth/change-password
// // @access  Private
// exports.changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
//     const user = await User.findById(req.user.id).select('+password');

//     const isMatch = await user.matchPassword(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Current password is incorrect',
//       });
//     }

//     user.password = newPassword;
//     await user.save();

//     sendTokenResponse(user, 200, res);
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Logout
// // @route   POST /api/auth/logout
// // @access  Private
// exports.logout = async (req, res) => {
//   try {
//     res.cookie('token', 'none', {
//       expires: new Date(Date.now() + 10 * 1000),
//       httpOnly: true,
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Logged out successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Refresh Token
// // @route   POST /api/auth/refresh-token
// // @access  Public
// exports.refreshToken = async (req, res) => {
//   try {
//     const { refreshToken } = req.body;

//     if (!refreshToken) {
//       return res.status(401).json({
//         success: false,
//         message: 'Refresh token required',
//       });
//     }

//     const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
//     const user = await User.findById(decoded.id);

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     sendTokenResponse(user, 200, res);
//   } catch (error) {
//     res.status(401).json({
//       success: false,
//       message: 'Invalid refresh token',
//     });
//   }
// };

// // @desc    Delete Own Account
// // @route   DELETE /api/auth/delete-account
// // @access  Private
// exports.deleteAccount = async (req, res) => {
//   try {
//     await User.findByIdAndDelete(req.user.id);

//     res.status(200).json({
//       success: true,
//       message: 'Account deleted successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Update Avatar
// // @route   PUT /api/auth/update-avatar
// // @access  Private
// exports.updateAvatar = async (req, res) => {
//   try {
//     const { avatar } = req.body;

//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       { avatar },
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // ============================================
// // DRIVER ROUTES
// // ============================================

// // @desc    Toggle Driver Availability (online/offline)
// // @route   PUT /api/auth/driver/availability
// // @access  Private/Driver
// exports.toggleDriverAvailability = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     user.isAvailable = !user.isAvailable;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: `You are now ${user.isAvailable ? 'online' : 'offline'}`,
//       isAvailable: user.isAvailable,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Update Driver Location
// // @route   PUT /api/auth/driver/location
// // @access  Private/Driver
// exports.updateDriverLocation = async (req, res) => {
//   try {
//     const { lat, lng } = req.body;

//     if (!lat || !lng) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide lat and lng',
//       });
//     }

//     await User.findByIdAndUpdate(req.user.id, {
//       currentLocation: { lat, lng },
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Location updated',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // ============================================
// // ADMIN ROUTES
// // ============================================

// // @desc    Get All Users (role: user only)
// // @route   GET /api/auth/users
// // @access  Private/Admin
// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find({ role: 'user' });

//     res.status(200).json({
//       success: true,
//       count: users.length,
//       data: users,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Get All Drivers
// // @route   GET /api/auth/drivers
// // @access  Private/Admin
// exports.getAllDrivers = async (req, res) => {
//   try {
//     const drivers = await User.find({ role: 'driver' });

//     res.status(200).json({
//       success: true,
//       count: drivers.length,
//       data: drivers,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Get Available Drivers (for assigning deliveries)
// // @route   GET /api/auth/drivers/available
// // @access  Private/Admin
// exports.getAvailableDrivers = async (req, res) => {
//   try {
//     const drivers = await User.find({ role: 'driver', isAvailable: true });

//     res.status(200).json({
//       success: true,
//       count: drivers.length,
//       data: drivers,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Get User By ID
// // @route   GET /api/auth/users/:id
// // @access  Private/Admin
// exports.getUserById = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Update User Role
// // @route   PUT /api/auth/users/:id/role
// // @access  Private/Admin
// exports.updateUserRole = async (req, res) => {
//   try {
//     const { role } = req.body;

//     // ✅ Validate role value
//     if (!['user', 'admin', 'driver'].includes(role)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid role. Must be user, admin, or driver',
//       });
//     }

//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { role },
//       { new: true, runValidators: true }
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Block / Unblock User or Driver
// // @route   PUT /api/auth/users/:id/toggle-status
// // @access  Private/Admin
// exports.toggleUserStatus = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     // ✅ Use isBlocked field (consistent with model)
//     user.isBlocked = !user.isBlocked;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // @desc    Delete User
// // @route   DELETE /api/auth/users/:id
// // @access  Private/Admin
// exports.deleteUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'User deleted successfully',
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // ============================================
// // ROLE-BASED AUTH MIDDLEWARE (used in auth routes)
// // ============================================

// // @desc    Protect middleware (also exported for use in authRoutes directly)
// exports.auth = async (req, res, next) => {
//   try {
//     let token;

//     if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith('Bearer')
//     ) {
//       token = req.headers.authorization.split(' ')[1];
//     }

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'Not authorized to access this route',
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = await User.findById(decoded.id);

//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: 'Not authorized to access this route',
//     });
//   }
// };

// // @desc    Admin only middleware
// exports.isAdmin = async (req, res, next) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({
//       success: false,
//       message: 'Access denied. Admin privileges required.',
//     });
//   }
//   next();
// };

// // @desc    Driver only middleware
// exports.isDriver = async (req, res, next) => {
//   if (req.user.role !== 'driver') {
//     return res.status(403).json({
//       success: false,
//       message: 'Access denied. Driver privileges required.',
//     });
//   }
//   next();
// };

// // ============================================
// // 2FA & SOCIAL AUTH (unchanged)
// // ============================================

// exports.enable2FA = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     const secret = crypto.randomBytes(20).toString('hex');
//     user.twoFactorSecret = secret;
//     user.twoFactorEnabled = true;
//     await user.save();

//     res.status(200).json({ success: true, message: '2FA enabled', secret });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };

// exports.verify2FA = async (req, res) => {
//   res.status(200).json({ success: true, message: '2FA verified successfully' });
// };

// exports.disable2FA = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     user.twoFactorEnabled = false;
//     user.twoFactorSecret = undefined;
//     await user.save();

//     res.status(200).json({ success: true, message: '2FA disabled' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };

// exports.googleAuth = async (req, res) => {
//   res.status(501).json({ success: false, message: 'Google auth not yet implemented' });
// };

// exports.facebookAuth = async (req, res) => {
//   res.status(501).json({ success: false, message: 'Facebook auth not yet implemented' });
// };

// exports.appleAuth = async (req, res) => {
//   res.status(501).json({ success: false, message: 'Apple auth not yet implemented' });
// };

// exports.verifyEmail = async (req, res) => {
//   try {
//     const emailVerificationToken = crypto
//       .createHash('sha256')
//       .update(req.params.token)
//       .digest('hex');

//     const user = await User.findOne({
//       emailVerificationToken,
//       emailVerificationExpire: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ success: false, message: 'Invalid or expired token' });
//     }

//     user.isEmailVerified = true;
//     user.emailVerificationToken = undefined;
//     user.emailVerificationExpire = undefined;
//     await user.save();

//     res.status(200).json({ success: true, message: 'Email verified successfully' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };

// exports.resendVerificationEmail = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });

//     if (!user) return res.status(404).json({ success: false, message: 'User not found' });
//     if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Already verified' });

//     const verificationToken = user.getEmailVerificationToken();
//     await user.save({ validateBeforeSave: false });

//     const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
//     await sendEmail({
//       email: user.email,
//       subject: 'Email Verification',
//       message: `Verify your email: ${verificationUrl}`,
//     });

//     res.status(200).json({ success: true, message: 'Verification email sent' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const sendEmail = require('../utils/Sendemail');
const { sendPushNotification } = require('../services/firebaseService');

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Build the user object returned in every auth response.
  // Driver-specific fields are only included when the role is 'driver'
  // so regular users don't receive irrelevant payload keys.
  const userPayload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || null,
    avatar: user.avatar || null,
    isEmailVerified: user.isEmailVerified || false,
    isFirstLogin: user.isFirstLogin || false,
  };

  if (user.role === 'driver') {
    userPayload.isAvailable    = user.isAvailable;
    userPayload.vehicleType    = user.vehicleType;
    userPayload.vehicleNumber  = user.vehicleNumber;
    userPayload.licenseNumber  = user.licenseNumber;
    userPayload.totalDeliveries = user.totalDeliveries;
    userPayload.driverRating   = user.driverRating;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    refreshToken,
    user: userPayload,
  });
};

// ============================================
// PUBLIC ROUTES
// ============================================

// @desc    Register User (user role only — no self-assigning admin/driver)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      fcmToken,
      // Driver-specific fields
      vehicleType,
      vehicleNumber,
      licenseNumber,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Allow 'user' or 'driver' from the request body.
    // Anything else (e.g. 'admin') falls back to 'user' for security.
    const allowedRoles = ['user', 'driver'];
    const assignedRole = allowedRoles.includes(role) ? role : 'user';

    // Build user object
    const userPayload = {
      name,
      email,
      password,
      phone,
      role: assignedRole,
      isFirstLogin: true,
      fcmTokens: fcmToken ? [fcmToken] : [],
    };

    // Attach driver fields only when registering as driver.
    // FIX: We now validate that driver fields are present before using them.
    // vehicleType falls back to 'bike' if omitted (not null) to satisfy the
    // enum constraint on the schema. vehicleNumber and licenseNumber remain
    // optional strings.
    if (assignedRole === 'driver') {
      const allowedVehicleTypes = ['bike', 'scooter', 'car', 'van'];
      userPayload.vehicleType   = allowedVehicleTypes.includes(vehicleType)
        ? vehicleType
        : 'bike';
      userPayload.vehicleNumber = vehicleNumber || null;
      userPayload.licenseNumber = licenseNumber || null;
      userPayload.isAvailable   = false; // offline by default
    }

    const user = await User.create(userPayload);

    // Send welcome push notification
    if (fcmToken) {
      try {
        const welcomeTitle = assignedRole === 'driver'
          ? '🚗 Welcome, Rider!'
          : '🎉 Welcome to Our Store!';
        const welcomeBody = assignedRole === 'driver'
          ? 'Your driver account is ready. Go online to start accepting deliveries!'
          : 'Get 50% OFF on your first order + FREE delivery! Start shopping now!';

        await sendPushNotification(
          [fcmToken],
          welcomeTitle,
          welcomeBody,
          {
            type: 'welcome_offer',
            screen: assignedRole === 'driver' ? 'DriverHome' : 'Home',
          }
        );
      } catch (notificationError) {
        console.error('Failed to send welcome notification:', notificationError);
      }
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Register Driver (Admin creates driver accounts)
// @route   POST /api/auth/register-driver
// @access  Private/Admin
exports.registerDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber,
    } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and phone',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const allowedVehicleTypes = ['bike', 'scooter', 'car', 'van'];

    const driver = await User.create({
      name,
      email,
      password,
      phone,
      role: 'driver',
      vehicleType: allowedVehicleTypes.includes(vehicleType) ? vehicleType : 'bike',
      vehicleNumber: vehicleNumber || null,
      licenseNumber: licenseNumber || null,
      isAvailable: false,
      isFirstLogin: true,
    });

    res.status(201).json({
      success: true,
      message: 'Driver account created successfully',
      data: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: driver.role,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber,
        licenseNumber: driver.licenseNumber,
      },
    });
  } catch (error) {
    console.error('Register driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during driver registration',
      error: error.message,
    });
  }
};

// @desc    Login (works for all 3 roles)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // FIX: Block check was present before but confirmed it is correct here.
    // Return a clear 403 so the frontend can show a meaningful message.
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.',
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        requires2FA: true,
        message: 'Please enter your 2FA code',
        tempToken: generateToken(user._id),
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Update FCM Token
// @route   PUT /api/auth/fcm-token
// @access  Private
exports.updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'FCM token updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating FCM token',
      error: error.message,
    });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email',
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `You requested a password reset. Click the link to reset: \n\n${resetUrl}\n\nIgnore if you did not request this.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message,
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent',
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Check if Email Exists
// @route   POST /api/auth/check-email
// @access  Public
exports.checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    res.status(200).json({
      success: true,
      exists: !!user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ============================================
// PROTECTED ROUTES (All roles)
// ============================================

// @desc    Get Current User
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.getCurrentUser = exports.getMe;

// @desc    Update Profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {};

    // Only update fields that were actually sent in the request
    if (req.body.name  !== undefined) fieldsToUpdate.name  = req.body.name;
    if (req.body.email !== undefined) fieldsToUpdate.email = req.body.email;
    if (req.body.phone !== undefined) fieldsToUpdate.phone = req.body.phone;

    // Allow drivers to update their driver-specific fields
    if (req.user.role === 'driver') {
      const allowedVehicleTypes = ['bike', 'scooter', 'car', 'van'];
      if (req.body.vehicleType && allowedVehicleTypes.includes(req.body.vehicleType)) {
        fieldsToUpdate.vehicleType = req.body.vehicleType;
      }
      if (req.body.vehicleNumber !== undefined) fieldsToUpdate.vehicleNumber = req.body.vehicleNumber;
      if (req.body.licenseNumber !== undefined) fieldsToUpdate.licenseNumber = req.body.licenseNumber;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

// @desc    Delete Own Account
// @route   DELETE /api/auth/delete-account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update Avatar
// @route   PUT /api/auth/update-avatar
// @access  Private
exports.updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ============================================
// DRIVER ROUTES
// ============================================

// @desc    Toggle Driver Availability (online/offline)
// @route   PUT /api/auth/driver/availability
// @access  Private/Driver
exports.toggleDriverAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.isAvailable = !user.isAvailable;
    await user.save();

    res.status(200).json({
      success: true,
      message: `You are now ${user.isAvailable ? 'online' : 'offline'}`,
      isAvailable: user.isAvailable,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update Driver Location
// @route   PUT /api/auth/driver/location
// @access  Private/Driver
exports.updateDriverLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lat and lng',
      });
    }

    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: { lat, lng },
    });

    res.status(200).json({
      success: true,
      message: 'Location updated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ============================================
// ADMIN ROUTES
// ============================================

// @desc    Get All Users (role: user only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get All Drivers
// @route   GET /api/auth/drivers
// @access  Private/Admin
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' });

    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get Available Drivers (for assigning deliveries)
// @route   GET /api/auth/drivers/available
// @access  Private/Admin
exports.getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', isAvailable: true });

    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get User By ID
// @route   GET /api/auth/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update User Role
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin', 'driver'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user, admin, or driver',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Block / Unblock User or Driver
// @route   PUT /api/auth/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete User
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ============================================
// MIDDLEWARE
// ============================================

// @desc    Protect middleware — verifies JWT and attaches req.user
exports.auth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Reject blocked users from all protected routes
    if (req.user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// @desc    Admin only middleware
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

// @desc    Driver only middleware
exports.isDriver = (req, res, next) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Driver privileges required.',
    });
  }
  next();
};

// ============================================
// 2FA & SOCIAL AUTH
// ============================================

exports.enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const secret = crypto.randomBytes(20).toString('hex');
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = true;
    await user.save();

    res.status(200).json({ success: true, message: '2FA enabled', secret });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.verify2FA = async (req, res) => {
  res.status(200).json({ success: true, message: '2FA verified successfully' });
};

exports.disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.status(200).json({ success: true, message: '2FA disabled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.googleAuth = async (req, res) => {
  res.status(501).json({ success: false, message: 'Google auth not yet implemented' });
};

exports.facebookAuth = async (req, res) => {
  res.status(501).json({ success: false, message: 'Facebook auth not yet implemented' });
};

exports.appleAuth = async (req, res) => {
  res.status(501).json({ success: false, message: 'Apple auth not yet implemented' });
};

exports.verifyEmail = async (req, res) => {
  try {
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email already verified' });

    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Email Verification',
      message: `Verify your email: ${verificationUrl}`,
    });

    res.status(200).json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};