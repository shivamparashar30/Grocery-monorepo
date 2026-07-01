const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productKey:  { type: String, unique: true, sparse: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    brand:       { type: String, default: '' },
    category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: String, default: '' },

    // Images
    images: [{
        url:      { type: String, required: true },
        filename: { type: String },
        order:    { type: Number, default: 0 },
    }],
    imageUrl: { type: String, default: '' }, // legacy / cover image shortcut

    // Pricing
    price:              { type: Number, required: true },
    discountPrice:      { type: Number, default: null },
    discountPercentage: { type: Number, default: 0 },

    // Units & quantities
    unit:            { type: String, required: true },
    weight:          { type: String, default: '' },
    packSize:        { type: String, default: '' },
    minOrderQty:     { type: Number, default: 1 },
    maxOrderQty:     { type: Number, default: 50 },

    // Stock
    stock:       { type: Number, default: 100 },
    isOutOfStock:{ type: Boolean, default: false },

    // Identifiers
    sku:     { type: String, default: '', sparse: true },
    barcode: { type: String, default: '' },
    hsnCode: { type: String, default: '' },

    // Dates
    expiryDate:        { type: Date, default: null },
    manufacturingDate: { type: Date, default: null },

    // Flags
    badge:        { type: String, default: null },
    isFeatured:   { type: Boolean, default: false },
    isTrending:   { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    isReturnable: { type: Boolean, default: false },
    isCODAvailable:{ type: Boolean, default: true },
}, { timestamps: true });

// Virtual: cover image
productSchema.virtual('coverImage').get(function() {
    if (this.images && this.images.length > 0) {
        const sorted = [...this.images].sort((a, b) => a.order - b.order);
        return sorted[0].url;
    }
    return this.imageUrl || '';
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Index for search
productSchema.index({ name: 'text', brand: 'text', sku: 'text' });

module.exports = mongoose.model('Product', productSchema);
