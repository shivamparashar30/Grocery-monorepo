const Product = require('../models/Product');
const Category = require('../models/Category');
const HomeSection = require('../models/HomeSection');

// GET /api/v1/products?category=Munchies
const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.query;

        const products = await Product.find()
            .populate('category', 'name')
            .lean();

        const filtered = category
            ? products.filter(p => p.category?.name === category)
            : products;

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
            categoryId:  p.category?._id,
        }));

        res.json({ success: true, products: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/v1/products/:productKey
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
                categoryId:  product.category?._id,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/v1/products  (admin)
const createProduct = async (req, res) => {
    try {
        const { name, price, unit, stock, badge, description, imageUrl, category, productKey } = req.body;

        if (!name || !price || !unit || !category) {
            return res.status(400).json({ success: false, message: 'Name, price, unit and category are required' });
        }

        // Verify category exists
        const cat = await Category.findById(category);
        if (!cat) return res.status(400).json({ success: false, message: 'Invalid category' });

        const product = await Product.create({
            name, price, unit,
            stock: stock ?? 100,
            badge: badge || null,
            description: description || '',
            imageUrl: imageUrl || '',
            category,
            productKey: productKey || undefined,
        });

        const populated = await Product.findById(product._id).populate('category', 'name').lean();

        res.status(201).json({ success: true, data: {
            ...populated,
            category: populated.category?.name,
            categoryId: populated.category?._id,
        }});
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Product key already exists' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/v1/products/:id  (admin)
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const fields = ['name', 'price', 'unit', 'stock', 'badge', 'description', 'imageUrl', 'category', 'productKey'];
        fields.forEach(f => {
            if (req.body[f] !== undefined) product[f] = req.body[f];
        });

        await product.save();

        const populated = await Product.findById(product._id).populate('category', 'name').lean();

        res.json({ success: true, data: {
            ...populated,
            category: populated.category?.name,
            categoryId: populated.category?._id,
        }});
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/v1/products/:id  (admin)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        // Remove from all home sections
        await HomeSection.updateMany(
            { products: product._id },
            { $pull: { products: product._id } }
        );

        await product.deleteOne();

        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getProductsByCategory, getProductByKey, createProduct, updateProduct, deleteProduct };
