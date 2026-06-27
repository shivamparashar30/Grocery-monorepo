const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

const {
  getDeliveries,
  getMyDeliveries,
  getDelivery,
  getDeliveryByOrder,
  trackDelivery,
  createDelivery,
  updateDeliveryStatus,
  updateLocation,
  assignDeliveryBoy,
  updateProofOfDelivery,
  rateDelivery,
  getDeliveryStats,
} = require('../controller/Deliverycontroller');

// ============================================
// PUBLIC (no login needed)
// ============================================
router.get('/track/:trackingNumber', trackDelivery);

// ============================================
// ADMIN ROUTES
// ✅ These must come BEFORE /:id
// ============================================
router.get('/stats', protect, authorize('admin'), getDeliveryStats);
router.get('/', protect, authorize('admin'), getDeliveries);
router.post('/', protect, authorize('admin'), createDelivery);
router.put('/:id/assign', protect, authorize('admin'), assignDeliveryBoy);

// ============================================
// DRIVER ROUTES
// ✅ /my-deliveries must come BEFORE /:id
// ============================================
router.get('/my-deliveries', protect, authorize('driver'), getMyDeliveries);
router.put('/:id/status', protect, authorize('admin', 'driver'), updateDeliveryStatus);
router.put('/:id/location', protect, authorize('admin', 'driver'), updateLocation);
router.put('/:id/proof', protect, authorize('admin', 'driver'), updateProofOfDelivery);

// ============================================
// DYNAMIC ROUTES — always last
// ✅ /:id goes here at the BOTTOM
// because it would swallow /stats and /my-deliveries
// if placed higher up
// ============================================
router.get('/order/:orderId', protect, getDeliveryByOrder);
router.get('/:id', protect, getDelivery);
router.put('/:id/rate', protect, authorize('user'), rateDelivery);

module.exports = router;