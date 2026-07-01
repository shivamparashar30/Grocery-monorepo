const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderToPaid,
  updateOrderStatus,
  cancelOrder,
  modifyOrderItems,
} = require('../controller/Ordercontroller');

// Specific routes first
router.get('/myorders', protect, getMyOrders);
router.get('/', protect, authorize('admin'), getOrders);
router.post('/', protect, createOrder);

// Dynamic routes last
router.get('/:id', protect, getOrderById);
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.put('/:id/modify-items', protect, authorize('admin'), modifyOrderItems);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
