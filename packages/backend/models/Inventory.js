const mongoose = require('mongoose');

const StockHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['add', 'remove', 'reserve', 'release', 'adjust'],
    required: true,
  },
  quantity: { type: Number, required: true },
  reason: { type: String, default: '' },
  reference: { type: String, default: '' },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: { type: Date, default: Date.now },
});

const InventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    currentStock: {
      type: Number,
      default: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
    },
    reorderQuantity: {
      type: Number,
      default: 50,
    },
    costPrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in-stock', 'low-stock', 'out-of-stock'],
      default: 'in-stock',
    },
    stockHistory: [StockHistorySchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: available stock = current - reserved
InventorySchema.virtual('availableStock').get(function () {
  return this.currentStock - this.reservedStock;
});

// Auto-update status based on stock
InventorySchema.pre('save', function (next) {
  if (this.currentStock <= 0) {
    this.status = 'out-of-stock';
  } else if (this.currentStock <= this.reorderLevel) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }
  next();
});

// Add stock method
InventorySchema.methods.addStock = async function (quantity, reason, userId) {
  this.currentStock += quantity;
  this.stockHistory.push({
    action: 'add',
    quantity,
    reason,
    performedBy: userId,
  });
  await this.save();
};

// Remove stock method
InventorySchema.methods.removeStock = async function (quantity, reason, reference, userId) {
  if (this.availableStock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.currentStock -= quantity;
  this.stockHistory.push({
    action: 'remove',
    quantity,
    reason,
    reference,
    performedBy: userId,
  });
  await this.save();
};

// Reserve stock method
InventorySchema.methods.reserveStock = async function (quantity) {
  if (this.availableStock < quantity) {
    throw new Error('Insufficient stock to reserve');
  }
  this.reservedStock += quantity;
  this.stockHistory.push({ action: 'reserve', quantity });
  await this.save();
};

// Release reserved stock method
InventorySchema.methods.releaseStock = async function (quantity) {
  this.reservedStock = Math.max(0, this.reservedStock - quantity);
  this.stockHistory.push({ action: 'release', quantity });
  await this.save();
};

// Needs reorder check
InventorySchema.methods.needsReorder = function () {
  return this.currentStock <= this.reorderLevel;
};

module.exports = mongoose.model('Inventory', InventorySchema);
