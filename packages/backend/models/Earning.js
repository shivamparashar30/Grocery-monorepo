const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema(
  {
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      required: true,
      unique: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    basePayout: { type: Number, required: true },
    distanceKm: { type: Number, default: 0 },
    distanceBonus: { type: Number, default: 0 },
    incentives: [
      {
        type: {
          type: String,
          enum: ['peak_hour', 'rain', 'surge', 'milestone', 'high_value', 'tip'],
        },
        amount: { type: Number },
        description: { type: String },
      },
    ],
    totalIncentive: { type: Number, default: 0 },
    totalEarning: { type: Number, required: true },
    orderValue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'processed', 'paid'],
      default: 'pending',
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

// Index for efficient date-range queries
earningSchema.index({ driver: 1, createdAt: -1 });

module.exports = mongoose.model('Earning', earningSchema);
