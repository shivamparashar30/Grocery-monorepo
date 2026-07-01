const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
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
} = require('../controller/Productcontroller');

// Public
router.get('/', getProductsByCategory);
router.get('/inventory/stats', protect, authorize('admin'), getInventoryStats);
router.get('/id/:id', protect, authorize('admin'), getProductById);
router.get('/:productKey', getProductByKey);

// Admin
router.post('/', protect, authorize('admin'), upload.array('images', 10), createProduct);
router.put('/:id', protect, authorize('admin'), upload.array('images', 10), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// Bulk
router.post('/bulk-action', protect, authorize('admin'), bulkAction);
router.post('/bulk-stock', protect, authorize('admin'), bulkStockUpdate);

// Stock
router.post('/:id/stock', protect, authorize('admin'), updateStock);
router.get('/:id/stock-history', protect, authorize('admin'), getStockHistory);

// Duplicate
router.post('/:id/duplicate', protect, authorize('admin'), duplicateProduct);

module.exports = router;
