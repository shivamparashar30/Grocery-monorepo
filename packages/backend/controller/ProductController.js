const Product = require('../models/Product');

// GET /api/products?category=Munchies
const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category
            ? { category: (await require('../models/Category').findOne({ name: category })?._id) }
            : {};

        // Simpler: populate category name and filter by name
        const products = await Product.find()
            .populate('category', 'name')
            .lean();

        const filtered = category
            ? products.filter(p => p.category?.name === category)
            : products;

        // Return only what frontend needs
        const result = filtered.map(p => ({
            _id:         p._id,
            productKey:  p.productKey,
            name:        p.name,
            price:       p.price,
            unit:        p.unit,
            badge:       p.badge ?? null,
            description: p.description ?? '',
            imageUrl:    p.imageUrl ?? '',
            stock:       p.stock,
            category:    p.category?.name,
        }));

        res.json({ success: true, products: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/products/:productKey  →  /api/products/v1
const getProductByKey = async (req, res) => {
    try {
        const product = await Product.findOne({ productKey: req.params.productKey })
            .populate('category', 'name')
            .lean();

        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        res.json({
            success: true,
            product: {
                _id:         product._id,
                productKey:  product.productKey,
                name:        product.name,
                price:       product.price,
                unit:        product.unit,
                badge:       product.badge ?? null,
                description: product.description ?? '',
                imageUrl:    product.imageUrl ?? '',
                stock:       product.stock,
                category:    product.category?.name,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getProductsByCategory, getProductByKey };