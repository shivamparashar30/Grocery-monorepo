const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productKey:  { type: String, unique: true, sparse: true }, // 'v1', 'f3', 'm2' etc.
    name:        { type: String, required: true },
    price:       { type: Number, required: true },
    unit:        { type: String, required: true },
    stock:       { type: Number, default: 100 },
    badge:       { type: String, default: null },
    description: { type: String, default: '' },
    imageUrl:    { type: String, default: '' },
    category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);