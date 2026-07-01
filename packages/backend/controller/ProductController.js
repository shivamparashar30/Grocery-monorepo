const Product = require('../models/Product');
const Category = require('../models/Category');
const HomeSection = require('../models/HomeSection');
const InventoryLog = require('../models/InventoryLog');
const fs = require('fs');
const path = require('path');

// GET /api/v1/products?category=Munchies
const getProductsByCategory = async (req, res) => {
    try {
        const { category, page, limit: lim, search, status, featured, sort } = req.query;

        const query = {};
        if (category) {
            const cat = await Category.findOne({ name: category });
            if (cat) query.category = cat._id;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } },
            ];
        }
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;
        if (status === 'outofstock') query.$or = [{ stock: 0 }, { isOutOfStock: true }];
        if (status === 'lowstock') { query.stock = { $gt: 0, $lte: 10 }; query.isOutOfStock = { $ne: true }; }
        if (featured === 'true') query.isFeatured = true;

        let sortObj = { createdAt: -1 };
        if (sort === 'name') sortObj = { name: 1 };
        if (sort === 'price_asc') sortObj = { price: 1 };
        if (sort === 'price_desc') sortObj = { price: -1 };
        if (sort === 'stock_asc') sortObj = { stock: 1 };
        if (sort === 'stock_desc') sortObj = { stock: -1 };
        if (sort === 'newest') sortObj = { createdAt: -1 };
        if (sort === 'oldest') sortObj = { createdAt: 1 };

        const pageNum = parseInt(page) || 1;
        const limit = parseInt(lim) || 0;
        const skip = limit ? (pageNum - 1) * limit : 0;

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('category', 'name')
                .sort(sortObj)
                .skip(skip)
                .limit(limit || 0)
                .lean(),
            Product.countDocuments(query),
        ]);

        const result = products.map(p => ({
            _id:         p._id,
            productKey:  p.productKey,
            name:        p.name,
            price:       p.price,
            discountPrice: p.discountPrice,
            discountPercentage: p.discountPercentage,
            unit:        p.unit,
            badge:       p.badge ?? null,
            description: p.description ?? '',
            imageUrl:    p.images?.length ? p.images.sort((a,b) => a.order - b.order)[0].url : (p.imageUrl || ''),
            images:      p.images || [],
            stock:       p.stock,
            isOutOfStock: p.isOutOfStock,
            category:    p.category?.name,
            categoryId:  p.category?._id,
            brand:       p.brand,
            subcategory: p.subcategory,
            sku:         p.sku,
            barcode:     p.barcode,
            hsnCode:     p.hsnCode,
            weight:      p.weight,
            packSize:    p.packSize,
            minOrderQty: p.minOrderQty,
            maxOrderQty: p.maxOrderQty,
            expiryDate:  p.expiryDate,
            manufacturingDate: p.manufacturingDate,
            isFeatured:  p.isFeatured,
            isTrending:  p.isTrending,
            isBestSeller: p.isBestSeller,
            isNewArrival: p.isNewArrival,
            isActive:    p.isActive,
            isReturnable: p.isReturnable,
            isCODAvailable: p.isCODAvailable,
            createdAt:   p.createdAt,
            updatedAt:   p.updatedAt,
        }));

        res.json({
            success: true,
            products: result,
            total,
            page: pageNum,
            pages: limit ? Math.ceil(total / limit) : 1,
        });
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
                ...product,
                imageUrl: product.images?.length ? product.images.sort((a,b) => a.order - b.order)[0].url : (product.imageUrl || ''),
                category: product.category?.name,
                categoryId: product.category?._id,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/v1/products/id/:id
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .lean();
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, data: {
            ...product,
            category: product.category?.name,
            categoryId: product.category?._id,
        }});
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/v1/products  (admin)
const createProduct = async (req, res) => {
    try {
        const { name, price, unit, category } = req.body;
        if (!name || !price || !unit || !category) {
            return res.status(400).json({ success: false, message: 'Name, price, unit and category are required' });
        }

        const cat = await Category.findById(category);
        if (!cat) return res.status(400).json({ success: false, message: 'Invalid category' });

        const productData = { ...req.body };

        // Handle uploaded images
        if (req.files && req.files.length > 0) {
            productData.images = req.files.map((file, i) => ({
                url: `/uploads/products/${file.filename}`,
                filename: file.filename,
                order: i,
            }));
        }

        // Parse boolean/number fields from form-data
        if (productData.price) productData.price = parseFloat(productData.price);
        if (productData.discountPrice) productData.discountPrice = parseFloat(productData.discountPrice);
        if (productData.discountPercentage) productData.discountPercentage = parseFloat(productData.discountPercentage);
        if (productData.stock) productData.stock = parseInt(productData.stock);
        if (productData.minOrderQty) productData.minOrderQty = parseInt(productData.minOrderQty);
        if (productData.maxOrderQty) productData.maxOrderQty = parseInt(productData.maxOrderQty);
        ['isFeatured','isTrending','isBestSeller','isNewArrival','isActive','isReturnable','isCODAvailable','isOutOfStock'].forEach(f => {
            if (productData[f] !== undefined) productData[f] = productData[f] === 'true' || productData[f] === true;
        });

        if (!productData.productKey) delete productData.productKey;

        const product = await Product.create(productData);
        const populated = await Product.findById(product._id).populate('category', 'name').lean();

        res.status(201).json({ success: true, data: {
            ...populated,
            category: populated.category?.name,
            categoryId: populated.category?._id,
        }});
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Product key or SKU already exists' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/v1/products/:id  (admin)
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const updates = { ...req.body };

        // Handle new uploaded images
        if (req.files && req.files.length > 0) {
            const existingImages = product.images || [];
            const maxOrder = existingImages.length > 0 ? Math.max(...existingImages.map(i => i.order)) + 1 : 0;
            const newImages = req.files.map((file, i) => ({
                url: `/uploads/products/${file.filename}`,
                filename: file.filename,
                order: maxOrder + i,
            }));
            updates.images = [...existingImages, ...newImages];
        }

        // Handle image ordering from request body
        if (updates.imageOrder) {
            try {
                const order = JSON.parse(updates.imageOrder);
                const imgs = updates.images || product.images || [];
                updates.images = imgs.map(img => {
                    const idx = order.indexOf(img.url || img.filename);
                    return { ...img.toObject ? img.toObject() : img, order: idx >= 0 ? idx : 999 };
                });
            } catch(e) {}
            delete updates.imageOrder;
        }

        // Handle image deletions
        if (updates.deleteImages) {
            try {
                const toDelete = JSON.parse(updates.deleteImages);
                const imgs = updates.images || product.images || [];
                updates.images = imgs.filter(img => {
                    if (toDelete.includes(img.filename) || toDelete.includes(img.url)) {
                        // Delete file from disk
                        const filepath = path.join(__dirname, '..', 'uploads', 'products', img.filename);
                        fs.unlink(filepath, () => {});
                        return false;
                    }
                    return true;
                });
            } catch(e) {}
            delete updates.deleteImages;
        }

        // Parse fields
        if (updates.price) updates.price = parseFloat(updates.price);
        if (updates.discountPrice) updates.discountPrice = parseFloat(updates.discountPrice) || null;
        if (updates.discountPercentage) updates.discountPercentage = parseFloat(updates.discountPercentage);
        if (updates.stock !== undefined) updates.stock = parseInt(updates.stock);
        if (updates.minOrderQty) updates.minOrderQty = parseInt(updates.minOrderQty);
        if (updates.maxOrderQty) updates.maxOrderQty = parseInt(updates.maxOrderQty);
        ['isFeatured','isTrending','isBestSeller','isNewArrival','isActive','isReturnable','isCODAvailable','isOutOfStock'].forEach(f => {
            if (updates[f] !== undefined) updates[f] = updates[f] === 'true' || updates[f] === true;
        });

        // Track stock changes
        if (updates.stock !== undefined && updates.stock !== product.stock) {
            await InventoryLog.create({
                product: product._id,
                action: updates.stock > product.stock ? 'increase' : 'decrease',
                quantity: Math.abs(updates.stock - product.stock),
                previousStock: product.stock,
                newStock: updates.stock,
                reason: updates.stockReason || 'Manual update',
                user: req.user?.id,
            });
        }
        delete updates.stockReason;

        Object.keys(updates).forEach(k => { product[k] = updates[k]; });

        // Keep legacy imageUrl in sync with primary image (order 0)
        const sortedImgs = (product.images || []).slice().sort((a, b) => a.order - b.order);
        if (sortedImgs.length > 0) {
            product.imageUrl = sortedImgs[0].url;
        }

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

        // Delete images from disk
        (product.images || []).forEach(img => {
            const filepath = path.join(__dirname, '..', 'uploads', 'products', img.filename);
            fs.unlink(filepath, () => {});
        });

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

// POST /api/v1/products/bulk-action  (admin)
const bulkAction = async (req, res) => {
    try {
        const { ids, action, value } = req.body;
        if (!ids || !ids.length || !action) {
            return res.status(400).json({ success: false, message: 'ids and action required' });
        }

        let result;
        switch (action) {
            case 'delete':
                const products = await Product.find({ _id: { $in: ids } });
                products.forEach(p => {
                    (p.images || []).forEach(img => {
                        const filepath = path.join(__dirname, '..', 'uploads', 'products', img.filename);
                        fs.unlink(filepath, () => {});
                    });
                });
                await HomeSection.updateMany(
                    { products: { $in: ids } },
                    { $pull: { products: { $in: ids } } }
                );
                result = await Product.deleteMany({ _id: { $in: ids } });
                break;
            case 'enable':
                result = await Product.updateMany({ _id: { $in: ids } }, { isActive: true });
                break;
            case 'disable':
                result = await Product.updateMany({ _id: { $in: ids } }, { isActive: false });
                break;
            case 'updatePrice':
                result = await Product.updateMany({ _id: { $in: ids } }, { price: parseFloat(value) });
                break;
            case 'updateDiscount':
                result = await Product.updateMany({ _id: { $in: ids } }, { discountPercentage: parseFloat(value) });
                break;
            case 'updateStock':
                result = await Product.updateMany({ _id: { $in: ids } }, { stock: parseInt(value) });
                break;
            case 'updateCategory':
                result = await Product.updateMany({ _id: { $in: ids } }, { category: value });
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        res.json({ success: true, message: `${action} applied to ${ids.length} products`, result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/v1/products/:id/stock  (admin) - inventory adjustment
const updateStock = async (req, res) => {
    try {
        const { action, quantity, reason } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const prevStock = product.stock;
        let newStock = prevStock;

        if (action === 'increase') newStock = prevStock + parseInt(quantity);
        else if (action === 'decrease') newStock = Math.max(0, prevStock - parseInt(quantity));
        else if (action === 'set') newStock = parseInt(quantity);
        else return res.status(400).json({ success: false, message: 'Invalid action (increase/decrease/set)' });

        product.stock = newStock;
        product.isOutOfStock = newStock === 0;
        await product.save();

        await InventoryLog.create({
            product: product._id,
            action,
            quantity: parseInt(quantity),
            previousStock: prevStock,
            newStock,
            reason: reason || '',
            user: req.user?.id,
        });

        res.json({ success: true, data: { stock: newStock, previousStock: prevStock } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/v1/products/:id/stock-history  (admin)
const getStockHistory = async (req, res) => {
    try {
        const logs = await InventoryLog.find({ product: req.params.id })
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/v1/products/bulk-stock  (admin)
const bulkStockUpdate = async (req, res) => {
    try {
        const { updates } = req.body; // [{ productId, stock }]
        if (!updates || !updates.length) {
            return res.status(400).json({ success: false, message: 'updates array required' });
        }

        const results = [];
        for (const u of updates) {
            const product = await Product.findById(u.productId);
            if (!product) continue;
            const prev = product.stock;
            product.stock = parseInt(u.stock);
            product.isOutOfStock = product.stock === 0;
            await product.save();
            await InventoryLog.create({
                product: product._id,
                action: 'set',
                quantity: parseInt(u.stock),
                previousStock: prev,
                newStock: product.stock,
                reason: 'Bulk update',
                user: req.user?.id,
            });
            results.push({ id: product._id, prev, new: product.stock });
        }

        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/v1/products/inventory/stats  (admin)
const getInventoryStats = async (req, res) => {
    try {
        const [total, outOfStock, lowStock, expiringSoon, recentLogs] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ $or: [{ stock: 0 }, { isOutOfStock: true }] }),
            Product.countDocuments({ stock: { $gt: 0, $lte: 10 }, isOutOfStock: { $ne: true } }),
            Product.countDocuments({
                expiryDate: {
                    $gte: new Date(),
                    $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            }),
            InventoryLog.find().sort({ createdAt: -1 }).limit(20)
                .populate('product', 'name productKey')
                .populate('user', 'name')
                .lean(),
        ]);

        const expired = await Product.countDocuments({
            expiryDate: { $lt: new Date(), $ne: null }
        });

        res.json({
            success: true,
            data: { total, outOfStock, lowStock, expiringSoon, expired, recentLogs }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/v1/products/:id/duplicate  (admin)
const duplicateProduct = async (req, res) => {
    try {
        const original = await Product.findById(req.params.id).lean();
        if (!original) return res.status(404).json({ success: false, message: 'Product not found' });

        delete original._id;
        delete original.__v;
        delete original.createdAt;
        delete original.updatedAt;
        original.name = `${original.name} (Copy)`;
        original.productKey = original.productKey ? `${original.productKey}-copy` : undefined;
        original.sku = original.sku ? `${original.sku}-copy` : '';
        original.images = [];

        const product = await Product.create(original);
        const populated = await Product.findById(product._id).populate('category', 'name').lean();

        res.status(201).json({ success: true, data: {
            ...populated,
            category: populated.category?.name,
            categoryId: populated.category?._id,
        }});
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getProductsByCategory,
    getProductByKey,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkAction,
    updateStock,
    getStockHistory,
    bulkStockUpdate,
    getInventoryStats,
    duplicateProduct,
};
