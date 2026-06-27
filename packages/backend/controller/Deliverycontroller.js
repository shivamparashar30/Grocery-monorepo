const Delivery = require('../models/deliverySchema');
const Order = require('../models/Order');
const User = require('../models/user');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all deliveries
// @route   GET /api/v1/deliveries
// @access  Private/Admin
exports.getDeliveries = asyncHandler(async (req, res, next) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;

  const deliveries = await Delivery.find(query)
    .populate('order', 'orderItems totalPrice user')
    .populate('driver', 'name phone vehicleType vehicleNumber currentLocation isAvailable')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: deliveries.length,
    data: deliveries,
  });
});

// @desc    Get deliveries assigned to the logged-in driver
// @route   GET /api/v1/deliveries/my-deliveries
// @access  Private/Driver
exports.getMyDeliveries = asyncHandler(async (req, res, next) => {
  const deliveries = await Delivery.find({ driver: req.user.id })
    .populate('order', 'orderItems totalPrice shippingAddress user')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: deliveries.length,
    data: deliveries,
  });
});

// @desc    Get single delivery
// @route   GET /api/v1/deliveries/:id
// @access  Private
exports.getDelivery = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findById(req.params.id)
    .populate({
      path: 'order',
      select: 'orderItems totalPrice shippingAddress user',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate('driver', 'name phone vehicleType vehicleNumber currentLocation');

  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  // ✅ Driver can only see their own assigned deliveries
  if (
    req.user.role === 'driver' &&
    delivery.driver?.toString() !== req.user.id
  ) {
    return next(new ErrorResponse('Not authorized to view this delivery', 403));
  }

  res.status(200).json({ success: true, data: delivery });
});

// @desc    Get delivery by order ID
// @route   GET /api/v1/deliveries/order/:orderId
// @access  Private
exports.getDeliveryByOrder = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findOne({ order: req.params.orderId })
    .populate('order', 'orderItems totalPrice shippingAddress')
    .populate('driver', 'name phone vehicleType vehicleNumber');

  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found for order ${req.params.orderId}`, 404));
  }

  res.status(200).json({ success: true, data: delivery });
});

// @desc    Track delivery by tracking number
// @route   GET /api/v1/deliveries/track/:trackingNumber
// @access  Public
exports.trackDelivery = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findOne({
    trackingNumber: req.params.trackingNumber,
  })
    .populate('order', 'orderItems totalPrice shippingAddress')
    .populate('driver', 'name phone currentLocation');

  if (!delivery) {
    return next(
      new ErrorResponse(`Delivery not found with tracking number ${req.params.trackingNumber}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      trackingNumber: delivery.trackingNumber,
      status: delivery.status,
      currentLocation: delivery.currentLocation,
      estimatedDeliveryTime: delivery.estimatedDeliveryTime,
      actualDeliveryTime: delivery.actualDeliveryTime,
      // ✅ Show driver info from User model
      driver: delivery.driver
        ? {
            name: delivery.driver.name,
            phone: delivery.driver.phone,
            currentLocation: delivery.driver.currentLocation,
          }
        : null,
      statusHistory: delivery.statusHistory,
    },
  });
});

// @desc    Create delivery
// @route   POST /api/v1/deliveries
// @access  Private/Admin
exports.createDelivery = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ErrorResponse(`Order not found with id of ${orderId}`, 404));
  }

  const existingDelivery = await Delivery.findOne({ order: orderId });
  if (existingDelivery) {
    return next(new ErrorResponse('Delivery already exists for this order', 400));
  }

  req.body.order = orderId;
  const delivery = await Delivery.create(req.body);

  res.status(201).json({ success: true, data: delivery });
});

// @desc    Update delivery status
// @route   PUT /api/v1/deliveries/:id/status
// @access  Private/Admin or Driver (own delivery)
exports.updateDeliveryStatus = asyncHandler(async (req, res, next) => {
  const { status, remarks, location } = req.body;

  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  // ✅ Driver can only update their own assigned delivery
  if (
    req.user.role === 'driver' &&
    delivery.driver?.toString() !== req.user.id
  ) {
    return next(new ErrorResponse('Not authorized to update this delivery', 403));
  }

  await delivery.updateStatus(status, remarks, location);

  // Sync order status
  const order = await Order.findById(delivery.order);
  if (order) {
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      order.status = 'delivered';

      // ✅ Increment driver's total deliveries
      if (delivery.driver) {
        await User.findByIdAndUpdate(delivery.driver, {
          $inc: { totalDeliveries: 1 },
        });
      }
    } else if (status === 'out-for-delivery') {
      order.status = 'shipped';
    }
    await order.save();
  }

  res.status(200).json({ success: true, data: delivery });
});

// @desc    Update delivery location
// @route   PUT /api/v1/deliveries/:id/location
// @access  Private/Admin or Driver (own delivery)
exports.updateLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, address } = req.body;

  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  // ✅ Driver can only update location of their own delivery
  if (
    req.user.role === 'driver' &&
    delivery.driver?.toString() !== req.user.id
  ) {
    return next(new ErrorResponse('Not authorized to update this delivery', 403));
  }

  await delivery.updateLocation(latitude, longitude, address);

  // ✅ Also update driver's currentLocation in User model
  if (req.user.role === 'driver') {
    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: { lat: latitude, lng: longitude },
    });
  }

  res.status(200).json({ success: true, data: delivery });
});

// @desc    Assign driver to delivery
// @route   PUT /api/v1/deliveries/:id/assign
// @access  Private/Admin
exports.assignDeliveryBoy = asyncHandler(async (req, res, next) => {
  const { driverId } = req.body;

  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  // ✅ Validate driver exists and has driver role
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'driver') {
    return next(new ErrorResponse('Invalid driver ID or user is not a driver', 400));
  }

  if (!driver.isAvailable) {
    return next(new ErrorResponse('Driver is currently offline/unavailable', 400));
  }

  // ✅ Store driver reference (User ID) instead of plain text
  delivery.driver = driverId;
  delivery.status = 'assigned';
  delivery.statusHistory.push({
    status: 'assigned',
    timestamp: new Date(),
    remarks: `Assigned to driver: ${driver.name}`,
  });

  await delivery.save();

  res.status(200).json({
    success: true,
    message: `Delivery assigned to ${driver.name}`,
    data: delivery,
  });
});

// @desc    Update proof of delivery
// @route   PUT /api/v1/deliveries/:id/proof
// @access  Private/Admin or Driver
exports.updateProofOfDelivery = asyncHandler(async (req, res, next) => {
  const { signature, photo, receivedBy } = req.body;

  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  // ✅ Driver can only update proof for their own delivery
  if (
    req.user.role === 'driver' &&
    delivery.driver?.toString() !== req.user.id
  ) {
    return next(new ErrorResponse('Not authorized to update this delivery', 403));
  }

  delivery.proofOfDelivery = { signature, photo, receivedBy };
  await delivery.save();

  res.status(200).json({ success: true, data: delivery });
});

// @desc    Rate delivery (Customer only)
// @route   PUT /api/v1/deliveries/:id/rate
// @access  Private/User
exports.rateDelivery = asyncHandler(async (req, res, next) => {
  const { rating, feedback } = req.body;

  const delivery = await Delivery.findById(req.params.id).populate('order');
  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  if (delivery.order.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to rate this delivery', 401));
  }

  if (delivery.status !== 'delivered') {
    return next(new ErrorResponse('Can only rate completed deliveries', 400));
  }

  delivery.rating = rating;
  delivery.feedback = feedback;
  await delivery.save();

  // ✅ Update driver's average rating
  if (delivery.driver) {
    const driverDeliveries = await Delivery.find({
      driver: delivery.driver,
      rating: { $exists: true, $gt: 0 },
    });

    const avgRating =
      driverDeliveries.reduce((sum, d) => sum + d.rating, 0) /
      driverDeliveries.length;

    await User.findByIdAndUpdate(delivery.driver, {
      driverRating: Math.round(avgRating * 10) / 10,
    });
  }

  res.status(200).json({ success: true, data: delivery });
});

// @desc    Get delivery statistics
// @route   GET /api/v1/deliveries/stats
// @access  Private/Admin
exports.getDeliveryStats = asyncHandler(async (req, res, next) => {
  const stats = await Delivery.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const totalDeliveries = await Delivery.countDocuments();

  const avgDeliveryTime = await Delivery.aggregate([
    {
      $match: {
        actualDeliveryTime: { $exists: true },
        pickupTime: { $exists: true },
      },
    },
    {
      $project: {
        deliveryTime: {
          $divide: [
            { $subtract: ['$actualDeliveryTime', '$pickupTime'] },
            1000 * 60 * 60,
          ],
        },
      },
    },
    {
      $group: { _id: null, avgTime: { $avg: '$deliveryTime' } },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      byStatus: stats,
      total: totalDeliveries,
      avgDeliveryTimeHours: avgDeliveryTime[0]?.avgTime || 0,
    },
  });
});