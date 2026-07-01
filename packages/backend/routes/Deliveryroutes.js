const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

const {
  getDeliveries,
  getMyDeliveries,
  getAvailableOrders,
  acceptDelivery,
  getDelivery,
  getDeliveryByOrder,
  trackDelivery,
  createDelivery,
  updateDeliveryStatus,
  updateLocation,
  assignDeliveryBoy,
  verifyPickupOtp,
  updateProofOfDelivery,
  rateDelivery,
  getDeliveryStats,
} = require('../controller/Deliverycontroller');

// PUBLIC
router.get('/track/:trackingNumber', trackDelivery);

// ADMIN
router.get('/stats', protect, authorize('admin'), getDeliveryStats);
router.get('/', protect, authorize('admin'), getDeliveries);
router.post('/', protect, authorize('admin'), createDelivery);
router.put('/:id/assign', protect, authorize('admin'), assignDeliveryBoy);

// DRIVER
router.get('/my-deliveries', protect, authorize('driver'), getMyDeliveries);
router.get('/available', protect, authorize('driver'), getAvailableOrders);
router.put('/:id/accept', protect, authorize('driver'), acceptDelivery);
router.put('/:id/verify-otp', protect, authorize('driver', 'admin'), verifyPickupOtp);
router.put('/:id/status', protect, authorize('admin', 'driver'), updateDeliveryStatus);
router.put('/:id/location', protect, authorize('admin', 'driver'), updateLocation);
router.put('/:id/proof', protect, authorize('admin', 'driver'), updateProofOfDelivery);

// DYNAMIC — must be last
router.get('/order/:orderId', protect, authorize('user', 'admin'), getDeliveryByOrder);
router.get('/:id', protect, getDelivery);
router.put('/:id/rate', protect, authorize('user'), rateDelivery);

module.exports = router;
