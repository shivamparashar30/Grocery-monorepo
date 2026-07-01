const mongoose = require('mongoose');
const crypto = require('crypto');

const ALL_STATUSES = [
  'pending',
  'assigned',
  'collecting',
  'picked-up',
  'in-transit',
  'out-for-delivery',
  'arrived',
  'delivered',
  'failed',
  'cancelled',
  'returned',
];

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    trackingNumber: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ALL_STATUSES,
      default: 'pending',
    },
    // OTP for rider to verify before collecting order
    pickupOtp: {
      code: { type: String },
      expiresAt: { type: Date },
      verified: { type: Boolean, default: false },
    },
    pickupTime: { type: Date },
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      updatedAt: Date,
    },
    statusHistory: [
      {
        status: { type: String, enum: ALL_STATUSES },
        timestamp: { type: Date, default: Date.now },
        remarks: String,
        location: {
          latitude: Number,
          longitude: Number,
        },
      },
    ],
    deliveryNotes: { type: String },
    proofOfDelivery: {
      signature: String,
      photo: String,
      receivedBy: String,
    },
    failureReason: { type: String },
    returnReason: { type: String },
    deliveryAttempts: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
  },
  { timestamps: true }
);

// Update status and add to history
deliverySchema.methods.updateStatus = function (newStatus, remarks, location) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    remarks,
    location,
  });

  if (newStatus === 'picked-up') {
    this.pickupTime = new Date();
  } else if (newStatus === 'delivered') {
    this.actualDeliveryTime = new Date();
  }

  return this.save();
};

// Update current location
deliverySchema.methods.updateLocation = function (latitude, longitude, address) {
  this.currentLocation = {
    latitude,
    longitude,
    address,
    updatedAt: new Date(),
  };
  return this.save();
};

// Generate pickup OTP (4 digits)
deliverySchema.methods.generatePickupOtp = function () {
  const code = crypto.randomInt(1000, 9999).toString();
  this.pickupOtp = {
    code,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    verified: false,
  };
  return code;
};

// Verify pickup OTP
deliverySchema.methods.verifyPickupOtp = function (code) {
  if (!this.pickupOtp?.code) return false;
  if (this.pickupOtp.verified) return true;
  if (new Date() > this.pickupOtp.expiresAt) return false;
  if (this.pickupOtp.code !== code) return false;
  this.pickupOtp.verified = true;
  return true;
};

// Generate tracking number
deliverySchema.pre('save', function (next) {
  if (!this.trackingNumber) {
    this.trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);
