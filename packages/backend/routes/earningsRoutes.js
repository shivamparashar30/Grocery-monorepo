const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTodayEarnings,
  getMyEarnings,
  getAllEarnings,
} = require('../controller/EarningsController');

// Driver
router.get('/today', protect, authorize('driver'), getTodayEarnings);
router.get('/my', protect, authorize('driver'), getMyEarnings);

// Admin
router.get('/', protect, authorize('admin'), getAllEarnings);

module.exports = router;
