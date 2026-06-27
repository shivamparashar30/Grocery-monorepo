const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'grid',
    },
    iconType: {
      type: String,
      default: 'Ionicons',
    },
    gradientColors: {
      type: [String],
      default: ['#DBF3F7', '#BDE8EF'],
    },
    accentColor: {
      type: String,
      default: '#1A8A9A',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Category', CategorySchema);
