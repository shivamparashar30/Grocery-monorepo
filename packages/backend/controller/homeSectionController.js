const HomeSection = require('../models/HomeSection');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all active home sections (public — for customer app)
// @route   GET /api/v1/home-sections
// @access  Public
exports.getActiveSections = asyncHandler(async (req, res) => {
  const sections = await HomeSection.find({ isActive: true })
    .sort({ sortOrder: 1 })
    .populate({
      path: 'products',
      select: 'name price discountPrice discountPercentage unit badge productKey imageUrl images stock isOutOfStock description brand weight',
      populate: { path: 'category', select: 'name' },
    });

  res.status(200).json({ success: true, count: sections.length, data: sections });
});

// @desc    Get ALL home sections (admin — includes inactive)
// @route   GET /api/v1/home-sections/admin
// @access  Private/Admin
exports.getAllSections = asyncHandler(async (req, res) => {
  const sections = await HomeSection.find()
    .sort({ sortOrder: 1 })
    .populate({
      path: 'products',
      select: 'name price unit badge productKey imageUrl',
    });

  res.status(200).json({ success: true, count: sections.length, data: sections });
});

// @desc    Get single section
// @route   GET /api/v1/home-sections/:id
// @access  Private/Admin
exports.getSection = asyncHandler(async (req, res, next) => {
  const section = await HomeSection.findById(req.params.id).populate({
    path: 'products',
    select: 'name price unit badge productKey imageUrl',
  });

  if (!section) {
    return next(new ErrorResponse('Section not found', 404));
  }

  res.status(200).json({ success: true, data: section });
});

// @desc    Create home section
// @route   POST /api/v1/home-sections
// @access  Private/Admin
exports.createSection = asyncHandler(async (req, res) => {
  // Auto-assign sortOrder to end
  if (req.body.sortOrder === undefined) {
    const count = await HomeSection.countDocuments();
    req.body.sortOrder = count;
  }

  const section = await HomeSection.create(req.body);

  res.status(201).json({ success: true, data: section });
});

// @desc    Update home section
// @route   PUT /api/v1/home-sections/:id
// @access  Private/Admin
exports.updateSection = asyncHandler(async (req, res, next) => {
  const section = await HomeSection.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate({
    path: 'products',
    select: 'name price unit badge productKey imageUrl',
  });

  if (!section) {
    return next(new ErrorResponse('Section not found', 404));
  }

  res.status(200).json({ success: true, data: section });
});

// @desc    Delete home section
// @route   DELETE /api/v1/home-sections/:id
// @access  Private/Admin
exports.deleteSection = asyncHandler(async (req, res, next) => {
  const section = await HomeSection.findById(req.params.id);

  if (!section) {
    return next(new ErrorResponse('Section not found', 404));
  }

  await section.deleteOne();

  res.status(200).json({ success: true, data: {} });
});

// @desc    Reorder sections
// @route   PUT /api/v1/home-sections/reorder
// @access  Private/Admin
exports.reorderSections = asyncHandler(async (req, res) => {
  const { order } = req.body; // [{ id: '...', sortOrder: 0 }, ...]

  if (!Array.isArray(order)) {
    return res.status(400).json({ success: false, message: 'order must be an array' });
  }

  const ops = order.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { sortOrder: item.sortOrder },
    },
  }));

  await HomeSection.bulkWrite(ops);

  const sections = await HomeSection.find().sort({ sortOrder: 1 });

  res.status(200).json({ success: true, data: sections });
});

// @desc    Toggle section active status
// @route   PUT /api/v1/home-sections/:id/toggle
// @access  Private/Admin
exports.toggleSection = asyncHandler(async (req, res, next) => {
  const section = await HomeSection.findById(req.params.id);

  if (!section) {
    return next(new ErrorResponse('Section not found', 404));
  }

  section.isActive = !section.isActive;
  await section.save();

  res.status(200).json({ success: true, data: section });
});

// @desc    Get admin dashboard stats
// @route   GET /api/v1/home-sections/admin/stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const User = require('../models/user');
  const Product = require('../models/Product');
  const Order = require('../models/Order');

  const [userCount, productCount, orderCount, sectionCount, recentOrders, lowStockProducts] =
    await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.countDocuments(),
      HomeSection.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
      Product.find({ stock: { $lte: 10 } })
        .sort({ stock: 1 })
        .limit(10)
        .select('name stock productKey price'),
    ]);

  // Revenue (sum of all completed orders)
  const revenueAgg = await Order.aggregate([
    { $match: { status: { $in: ['delivered', 'completed'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const revenue = revenueAgg[0]?.total ?? 0;

  // Orders by status
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      userCount,
      productCount,
      orderCount,
      sectionCount,
      revenue,
      ordersByStatus,
      recentOrders,
      lowStockProducts,
    },
  });
});
