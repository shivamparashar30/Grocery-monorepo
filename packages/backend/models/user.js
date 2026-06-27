// const mongoose = require('mongoose');
// const crypto = require('crypto');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const UserSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     unique: true,
//     sparse: true,
//   },
//   name: {
//     type: String,
//     required: [true, 'Please enter your name'],
//   },
//   email: {
//     type: String,
//     match: [
//       /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
//       'Please use a valid email address',
//     ],
//     required: [true, 'Please enter your email address'],
//     unique: true,
//   },
//   phone: {
//     type: String,
//   },
//   Description: {
//     type: String,
//   },
//   address: {
//     type: String,
//   },
//   Address: {
//     type: String,
//   },
//   avatar: {
//     type: String,
//     default: 'no-photo.png',
//   },
//   ImageUrl: {
//     type: String,
//     default: 'no-photo.png',
//   },

//   // ✅ UPDATED: Added 'driver' to enum
//   role: {
//     type: String,
//     enum: ['user', 'admin', 'driver'],
//     default: 'user',
//   },

//   // ===== DRIVER-SPECIFIC FIELDS =====
//   driverName: {
//     type: String,
//   },
//   driverPhone: {
//     type: String,
//   },
//   vehicleType: {
//     type: String,
//     enum: ['bike', 'scooter', 'car', 'van', null],
//     default: null,
//   },
//   vehicleNumber: {
//     type: String,
//     default: null,
//   },
//   licenseNumber: {
//     type: String,
//     default: null,
//   },
//   isAvailable: {
//     // ✅ Driver online/offline toggle
//     type: Boolean,
//     default: false,
//   },
//   currentLocation: {
//     // ✅ For real-time driver tracking
//     lat: { type: Number, default: null },
//     lng: { type: Number, default: null },
//   },
//   totalDeliveries: {
//     // ✅ Driver stats
//     type: Number,
//     default: 0,
//   },
//   driverRating: {
//     type: Number,
//     default: 0,
//   },
//   // ===== END DRIVER FIELDS =====

//   ngoRegistrationNo: {
//     type: String,
//     default: '0',
//   },
//   isVerified: {
//     type: Boolean,
//     default: false,
//   },
//   isBlocked: {
//     type: Boolean,
//     default: false,
//   },
//   isDenied: {
//     type: Boolean,
//     default: false,
//   },
//   password: {
//     type: String,
//     required: [true, 'Please add a password'],
//     minlength: 6,
//     select: false,
//   },
//   verificationToken: String,
//   resetPasswordToken: String,
//   resetPasswordExpire: Date,
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   donationCount: {
//     type: Number,
//     default: 0,
//   },
//   fcmTokens: [
//     {
//       type: String,
//     },
//   ],
//   isFirstLogin: {
//     type: Boolean,
//     default: true,
//   },
//   twoFactorEnabled: {
//   type: Boolean,
//   default: false,
// },
// twoFactorSecret: {
//   type: String,
//   select: false,
// },
// emailVerificationToken: String,
// emailVerificationExpire: Date,
// isEmailVerified: {
//   type: Boolean,
//   default: false,
// },
// });

// // Encrypt password using bcrypt
// UserSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     return next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Sign JWT Token
// UserSchema.methods.getSignedJwtToken = function () {
//   return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE || '7d',
//   });
// };

// // Match entered password to hashed password
// UserSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// // Generate and hash password reset token
// UserSchema.methods.getResetPasswordToken = function () {
//   const resetToken = crypto.randomBytes(20).toString('hex');
//   this.resetPasswordToken = crypto
//     .createHash('sha256')
//     .update(resetToken)
//     .digest('hex');
//   this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
//   return resetToken;
// };

// module.exports = mongoose.model('User', UserSchema);

const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: [true, 'Please enter your name'],
  },
  email: {
    type: String,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please use a valid email address',
    ],
    required: [true, 'Please enter your email address'],
    unique: true,
  },
  phone: {
    type: String,
  },
  Description: {
    type: String,
  },
  address: {
    type: String,
  },
  Address: {
    type: String,
  },
  avatar: {
    type: String,
    default: 'no-photo.png',
  },
  ImageUrl: {
    type: String,
    default: 'no-photo.png',
  },

  role: {
    type: String,
    enum: ['user', 'admin', 'driver'],
    default: 'user',
  },

  // ===== DRIVER-SPECIFIC FIELDS =====
  driverName: {
    type: String,
  },
  driverPhone: {
    type: String,
  },

  // FIX: Removed `null` from enum array — Mongoose String enum does not
  // accept null as a member. Keeping `default: null` and `required: false`
  // is sufficient to allow null/undefined values to pass validation.
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'car', 'van'],
    default: null,
    required: false,
  },
  vehicleNumber: {
    type: String,
    default: null,
  },
  licenseNumber: {
    type: String,
    default: null,
  },
  isAvailable: {
    type: Boolean,
    default: false,
  },
  currentLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  totalDeliveries: {
    type: Number,
    default: 0,
  },
  driverRating: {
    type: Number,
    default: 0,
  },
  // ===== END DRIVER FIELDS =====

  ngoRegistrationNo: {
    type: String,
    default: '0',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isDenied: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  donationCount: {
    type: Number,
    default: 0,
  },
  fcmTokens: [
    {
      type: String,
    },
  ],
  isFirstLogin: {
    type: Boolean,
    default: true,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
});

// ============================================
// MIDDLEWARE
// ============================================

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

// Sign JWT Token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Match entered password to hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// FIX: Added missing getEmailVerificationToken method.
// The resendVerificationEmail controller calls this method but it was
// never defined, causing a runtime crash.
UserSchema.methods.getEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verificationToken;
};

module.exports = mongoose.model('User', UserSchema);