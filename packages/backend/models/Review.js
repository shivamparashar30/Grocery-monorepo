const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    reviewType: {
      type: String,
      enum: ['product', 'delivery', 'store'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      default: null,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Please add a rating'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      default: '',
    },
    comment: {
      type: String,
      default: '',
    },
    images: [
      {
        type: String,
      },
    ],
    pros: {
      type: String,
      default: '',
    },
    cons: {
      type: String,
      default: '',
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
      default: '',
    },
    helpfulVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    notHelpfulVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    adminResponse: {
      message: { type: String, default: '' },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      respondedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Mark helpful
ReviewSchema.methods.markHelpful = async function (userId) {
  if (!this.helpfulVotes.includes(userId)) {
    this.helpfulVotes.push(userId);
    this.notHelpfulVotes = this.notHelpfulVotes.filter(
      (id) => id.toString() !== userId.toString()
    );
    await this.save();
  }
};

// Mark not helpful
ReviewSchema.methods.markNotHelpful = async function (userId) {
  if (!this.notHelpfulVotes.includes(userId)) {
    this.notHelpfulVotes.push(userId);
    this.helpfulVotes = this.helpfulVotes.filter(
      (id) => id.toString() !== userId.toString()
    );
    await this.save();
  }
};

// Add admin response
ReviewSchema.methods.addAdminResponse = async function (message, adminId) {
  this.adminResponse = {
    message,
    respondedBy: adminId,
    respondedAt: new Date(),
  };
  await this.save();
};

module.exports = mongoose.model('Review', ReviewSchema);
