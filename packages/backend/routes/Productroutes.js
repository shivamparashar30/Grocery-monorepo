const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getProductsByCategory,
    getProductByKey,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controller/Productcontroller');

router.get('/', getProductsByCategory);
router.post('/', protect, authorize('admin'), createProduct);
router.get('/:productKey', getProductByKey);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
