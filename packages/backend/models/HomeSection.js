const mongoose = require('mongoose');

const HomeSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['products', 'banner', 'categories', 'deals'],
      default: 'products',
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    bannerImage: {
      type: String,
      default: '',
    },
    bannerGradient: {
      type: [String],
      default: ['#1D8A7A', '#0D5D53'],
    },
    icon: {
      type: String,
      default: '',
    },
    iconType: {
      type: String,
      default: 'Ionicons',
    },
    backgroundColor: {
      type: String,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    season: {
      type: String,
      enum: ['all', 'summer', 'winter', 'monsoon', 'festive'],
      default: 'all',
    },
    maxProducts: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true }
);

HomeSectionSchema.index({ sortOrder: 1 });
HomeSectionSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('HomeSection', HomeSectionSchema);
