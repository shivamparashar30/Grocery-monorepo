const Earning = require('../models/Earning');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// ─── Get today's earnings summary (driver) ───────────────────────

exports.getTodayEarnings = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const earnings = await Earning.find({
    driver: req.user.id,
    createdAt: { $gte: startOfDay },
  }).sort('-createdAt');

  const total = earnings.reduce((sum, e) => sum + e.totalEarning, 0);
  const deliveryCount = earnings.length;

  res.status(200).json({
    success: true,
    data: {
      todayTotal: Math.round(total),
      deliveryCount,
      earnings,
    },
  });
});

// ─── Get earnings summary with period filter (driver) ────────────

exports.getMyEarnings = asyncHandler(async (req, res) => {
  const { period = 'today' } = req.query;

  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setDate(startDate.getDate() - 30);
  } else if (period === 'all') {
    startDate = new Date(0);
  }

  const earnings = await Earning.find({
    driver: req.user.id,
    createdAt: { $gte: startDate },
  })
    .populate('order', 'totalPrice orderItems')
    .sort('-createdAt');

  const total = earnings.reduce((sum, e) => sum + e.totalEarning, 0);
  const totalBase = earnings.reduce((sum, e) => sum + e.basePayout, 0);
  const totalDistance = earnings.reduce((sum, e) => sum + e.distanceBonus, 0);
  const totalIncentives = earnings.reduce((sum, e) => sum + e.totalIncentive, 0);
  const avgPerDelivery = earnings.length > 0 ? total / earnings.length : 0;

  res.status(200).json({
    success: true,
    data: {
      period,
      totalEarnings: Math.round(total),
      totalBase: Math.round(totalBase),
      totalDistanceBonus: Math.round(totalDistance),
      totalIncentives: Math.round(totalIncentives),
      deliveryCount: earnings.length,
      avgPerDelivery: Math.round(avgPerDelivery),
      earnings,
    },
  });
});

// ─── Admin: get all earnings (with optional driver filter) ───────

exports.getAllEarnings = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.driverId) query.driver = req.query.driverId;

  const earnings = await Earning.find(query)
    .populate('driver', 'name phone')
    .populate('order', 'totalPrice')
    .sort('-createdAt')
    .limit(parseInt(req.query.limit) || 100);

  const total = earnings.reduce((sum, e) => sum + e.totalEarning, 0);

  res.status(200).json({
    success: true,
    count: earnings.length,
    totalPayout: Math.round(total),
    data: earnings,
  });
});
