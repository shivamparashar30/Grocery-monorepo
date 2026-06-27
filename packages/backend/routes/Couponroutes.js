const express = require('express');
const {
  getCoupons,
  getCoupon,
  validateCoupon,
  applyCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponStats,
} = require('../controller/Couponcontroller');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getCoupons);
router.get('/:id', getCoupon);

// Private routes
router.post('/validate', protect, validateCoupon);
router.post('/apply', protect, applyCoupon);

// Admin routes
router.post('/', protect, authorize('admin'), createCoupon);
router.put('/:id', protect, authorize('admin'), updateCoupon);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);
router.get('/:id/stats', protect, authorize('admin'), getCouponStats);

module.exports = router;