const Delivery = require('../models/deliverySchema');
const Order = require('../models/Order');
const User = require('../models/user');
const Earning = require('../models/Earning');
const Notification = require('../models/notificationSchema');
const earningsConfig = require('../config/earningsConfig');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { sendPushNotification } = require('../services/firebaseService');
const {
  emitToUser, emitToAdmins, emitToDrivers, emitToDelivery, emitToOrder,
} = require('../services/socketService');

// ─── Notification helper ────────────────────────────────────────

const notifyUser = async (userId, { type, title, message, relatedOrder, priority, extraData }) => {
  try {
    await Notification.create({ user: userId, type, title, message, relatedOrder, priority });
    const user = await User.findById(userId).select('fcmTokens');
    if (user?.fcmTokens?.length > 0) {
      await sendPushNotification(user.fcmTokens, title, message, {
        type: type || 'delivery',
        orderId: relatedOrder?.toString() || '',
        ...extraData,
      });
    }
  } catch (err) {
    console.error('notifyUser error:', err.message);
  }
};

// ─── Haversine distance (km) ────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Calculate & save earnings for a completed delivery ─────────

async function createEarningForDelivery(delivery, order) {
  try {
    const existing = await Earning.findOne({ delivery: delivery._id });
    if (existing) return existing;

    const cfg = earningsConfig;
    const basePayout = cfg.BASE_PAYOUT;

    // Distance calculation
    let distanceKm = cfg.DEFAULT_DISTANCE_KM;
    const customerLoc = order.shippingAddress?.location;
    const driverPickupLoc = delivery.statusHistory?.find(h => h.status === 'picked-up')?.location;

    if (customerLoc?.lat && customerLoc?.lng && driverPickupLoc?.latitude && driverPickupLoc?.longitude) {
      distanceKm = haversineKm(driverPickupLoc.latitude, driverPickupLoc.longitude, customerLoc.lat, customerLoc.lng);
    } else if (customerLoc?.lat && customerLoc?.lng && delivery.currentLocation?.latitude) {
      // Fallback: use last known driver location
      distanceKm = haversineKm(delivery.currentLocation.latitude, delivery.currentLocation.longitude, customerLoc.lat, customerLoc.lng);
    }

    let distanceBonus = Math.max(0, (distanceKm - cfg.MIN_DISTANCE_KM) * cfg.DISTANCE_RATE_PER_KM);
    distanceBonus = Math.min(distanceBonus, cfg.MAX_DISTANCE_BONUS);

    // Incentives
    const incentives = [];
    const hour = new Date().getHours();
    const isPeak = cfg.PEAK_HOURS.some(([start, end]) => hour >= start && hour < end);
    if (isPeak) {
      incentives.push({ type: 'peak_hour', amount: cfg.PEAK_HOUR_BONUS, description: 'Peak hour delivery bonus' });
    }

    if (order.totalPrice >= cfg.ORDER_VALUE_THRESHOLD) {
      incentives.push({ type: 'high_value', amount: cfg.ORDER_VALUE_BONUS, description: 'High-value order bonus' });
    }

    const totalIncentive = incentives.reduce((sum, i) => sum + i.amount, 0);
    let totalEarning = basePayout + distanceBonus + totalIncentive;
    totalEarning = Math.max(totalEarning, cfg.MINIMUM_GUARANTEE);

    const earning = await Earning.create({
      delivery: delivery._id,
      driver: delivery.driver,
      order: order._id,
      basePayout,
      distanceKm: Math.round(distanceKm * 10) / 10,
      distanceBonus: Math.round(distanceBonus),
      incentives,
      totalIncentive: Math.round(totalIncentive),
      totalEarning: Math.round(totalEarning),
      orderValue: order.totalPrice || 0,
    });

    return earning;
  } catch (err) {
    console.error('createEarningForDelivery error:', err.message);
    return null;
  }
}

// ─── Get all deliveries (Admin) ─────────────────────────────────

exports.getDeliveries = asyncHandler(async (req, res, next) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;

  const deliveries = await Delivery.find(query)
    .populate('order', 'orderItems totalPrice user')
    .populate('driver', 'name phone vehicleType vehicleNumber currentLocation isAvailable')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
});

// ─── Get driver's own deliveries ────────────────────────────────

exports.getMyDeliveries = asyncHandler(async (req, res, next) => {
  const deliveries = await Delivery.find({ driver: req.user.id })
    .populate({
      path: 'order',
      select: 'orderItems totalPrice shippingAddress user status orderNotes',
      populate: { path: 'user', select: 'name email phone' },
    })
    .sort('-createdAt');

  res.status(200).json({ success: true, count: deliveries.length, data: deliveries });
});

// ─── Get available orders for drivers ───────────────────────────

exports.getAvailableOrders = asyncHandler(async (req, res, next) => {
  const deliveries = await Delivery.find({
    status: 'pending',
    driver: { $exists: false },
  }).populate({
    path: 'order',
    select: 'orderItems totalPrice shippingAddress user status createdAt orderNotes',
    populate: { path: 'user', select: 'name phone' },
    match: { status: 'confirmed' },
  }).sort('-createdAt');

  const available = deliveries.filter((d) => d.order !== null);

  res.status(200).json({ success: true, count: available.length, data: available });
});

// ─── Rider accepts an available order ───────────────────────────

exports.acceptDelivery = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) {
    return next(new ErrorResponse('Delivery not found', 404));
  }

  if (delivery.driver) {
    return next(new ErrorResponse('This delivery has already been assigned to another rider', 409));
  }

  // Atomically claim it
  const claimed = await Delivery.findOneAndUpdate(
    { _id: delivery._id, driver: { $exists: false } },
    {
      driver: req.user.id,
      status: 'assigned',
      $push: {
        statusHistory: {
          status: 'assigned',
          timestamp: new Date(),
          remarks: `Accepted by rider: ${req.user.name}`,
        },
      },
    },
    { new: true }
  );

  if (!claimed) {
    return next(new ErrorResponse('This delivery was just claimed by another rider', 409));
  }

  // Populate for response
  const populated = await Delivery.findById(claimed._id)
    .populate({
      path: 'order',
      select: 'orderItems totalPrice shippingAddress user status orderNotes',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate('driver', 'name phone vehicleType vehicleNumber driverRating currentLocation');

  // Estimate delivery time
  claimed.estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000);
  await claimed.save();

  // Real-time: remove from all other drivers' screens
  try {
    emitToDrivers('delivery:assigned', {
      deliveryId: delivery._id,
      driverId: req.user.id,
      driverName: req.user.name,
      orderId: delivery.order,
    });

    emitToAdmins('delivery:assigned', {
      deliveryId: delivery._id,
      orderId: delivery.order,
      status: 'assigned',
      driver: {
        _id: req.user.id,
        name: req.user.name,
        phone: req.user.phone,
      },
    });

    const order = await Order.findById(delivery.order);
    if (order) {
      emitToUser(order.user.toString(), 'delivery:status-updated', {
        deliveryId: delivery._id,
        orderId: order._id,
        status: 'assigned',
        driver: {
          name: req.user.name,
          phone: req.user.phone,
          vehicleType: req.user.vehicleType,
        },
        estimatedDeliveryTime: claimed.estimatedDeliveryTime,
      });

      notifyUser(order.user, {
        type: 'delivery',
        title: 'Rider Assigned!',
        message: `${req.user.name} has been assigned to deliver your order.`,
        relatedOrder: order._id,
        priority: 'high',
        extraData: { screen: 'OrderDetails', deliveryId: delivery._id.toString() },
      });
    }
  } catch {}

  res.status(200).json({
    success: true,
    message: 'Delivery accepted successfully',
    data: populated,
  });
});

// ─── Get single delivery ────────────────────────────────────────

exports.getDelivery = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findById(req.params.id)
    .populate({
      path: 'order',
      select: 'orderItems totalPrice shippingAddress user status orderNotes createdAt',
      populate: { path: 'user', select: 'name email phone' },
    })
    .populate('driver', 'name phone vehicleType vehicleNumber currentLocation driverRating totalDeliveries');

  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  if (req.user.role === 'driver' && delivery.driver?._id?.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to view this delivery', 403));
  }

  res.status(200).json({ success: true, data: delivery });
});

// ─── Get delivery by order ID ───────────────────────────────────

exports.getDeliveryByOrder = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findOne({ order: req.params.orderId })
    .populate({
      path: 'order',
      select: 'orderItems totalPrice shippingAddress user status createdAt orderNotes',
    })
    .populate('driver', 'name phone vehicleType vehicleNumber driverRating currentLocation totalDeliveries');

  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found for order ${req.params.orderId}`, 404));
  }

  if (req.user.role === 'user' && delivery.order?.user?.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to view this delivery', 403));
  }

  res.status(200).json({ success: true, data: delivery });
});

// ─── Track delivery (public) ────────────────────────────────────

exports.trackDelivery = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findOne({ trackingNumber: req.params.trackingNumber })
    .populate('order', 'orderItems totalPrice shippingAddress')
    .populate('driver', 'name phone currentLocation');

  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with tracking number ${req.params.trackingNumber}`, 404));
  }

  res.status(200).json({
    success: true,
    data: {
      trackingNumber: delivery.trackingNumber,
      status: delivery.status,
      currentLocation: delivery.currentLocation,
      estimatedDeliveryTime: delivery.estimatedDeliveryTime,
      actualDeliveryTime: delivery.actualDeliveryTime,
      driver: delivery.driver ? {
        name: delivery.driver.name,
        phone: delivery.driver.phone,
        currentLocation: delivery.driver.currentLocation,
      } : null,
      statusHistory: delivery.statusHistory,
    },
  });
});

// ─── Create delivery (Admin) ────────────────────────────────────

exports.createDelivery = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return next(new ErrorResponse(`Order not found with id of ${orderId}`, 404));

  const existingDelivery = await Delivery.findOne({ order: orderId });
  if (existingDelivery) return next(new ErrorResponse('Delivery already exists for this order', 400));

  req.body.order = orderId;
  const delivery = await Delivery.create(req.body);

  res.status(201).json({ success: true, data: delivery });
});

// ─── Verify pickup OTP ──────────────────────────────────────────

exports.verifyPickupOtp = asyncHandler(async (req, res, next) => {
  const { otp } = req.body;

  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) return next(new ErrorResponse('Delivery not found', 404));

  if (req.user.role === 'driver' && delivery.driver?.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const isValid = delivery.verifyPickupOtp(otp);
  if (!isValid) {
    return next(new ErrorResponse('Invalid or expired OTP', 400));
  }

  await delivery.updateStatus('collecting', 'OTP verified, rider collecting order');

  const order = await Order.findById(delivery.order);
  if (order && order.status === 'confirmed') {
    order.status = 'processing';
    await order.save();
  }

  try {
    const eventData = {
      deliveryId: delivery._id,
      orderId: delivery.order,
      status: 'collecting',
    };
    emitToDelivery(delivery._id.toString(), 'delivery:status-updated', eventData);
    emitToAdmins('delivery:status-updated', eventData);
    if (order) {
      emitToUser(order.user.toString(), 'delivery:status-updated', eventData);
    }
  } catch {}

  res.status(200).json({ success: true, message: 'OTP verified successfully', data: delivery });
});

// ─── Update delivery status ─────────────────────────────────────

exports.updateDeliveryStatus = asyncHandler(async (req, res, next) => {
  const { status, remarks, location } = req.body;

  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) {
    return next(new ErrorResponse(`Delivery not found with id of ${req.params.id}`, 404));
  }

  if (req.user.role === 'driver' && delivery.driver?.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this delivery', 403));
  }

  if (status === 'picked-up' && !delivery.pickupOtp?.verified) {
    return next(new ErrorResponse('Pickup OTP must be verified before collecting the order', 400));
  }

  await delivery.updateStatus(status, remarks, location);

  // Sync order status + earnings
  const order = await Order.findById(delivery.order);
  if (order) {
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      order.status = 'delivered';
      if (delivery.driver) {
        await User.findByIdAndUpdate(delivery.driver, { $inc: { totalDeliveries: 1 } });
      }
      // Calculate and save earnings
      const earning = await createEarningForDelivery(delivery, order);
      if (earning) {
        try {
          emitToUser(delivery.driver.toString(), 'earnings:new', {
            deliveryId: delivery._id,
            earning: {
              totalEarning: earning.totalEarning,
              basePayout: earning.basePayout,
              distanceBonus: earning.distanceBonus,
              totalIncentive: earning.totalIncentive,
            },
          });
        } catch {}
      }
    } else if (status === 'out-for-delivery') {
      order.status = 'shipped';
    }
    await order.save();
  }

  // Status-specific notifications to customer
  const STATUS_NOTIFICATIONS = {
    'picked-up': { title: 'Order Picked Up', message: 'Your rider has picked up your order from the store.' },
    'out-for-delivery': { title: 'On The Way!', message: 'Your order is on the way. Get ready!' },
    'arrived': { title: 'Rider Arrived', message: 'Your rider has arrived at your location.' },
    'delivered': { title: 'Delivered!', message: 'Your order has been delivered. Enjoy!' },
  };

  const notif = STATUS_NOTIFICATIONS[status];
  if (notif && order) {
    notifyUser(order.user, {
      type: 'delivery',
      title: notif.title,
      message: notif.message,
      relatedOrder: order._id,
      priority: status === 'delivered' ? 'medium' : 'high',
      extraData: { screen: 'OrderDetails', deliveryId: delivery._id.toString() },
    });
  }

  // Real-time broadcast
  try {
    const eventData = {
      deliveryId: delivery._id,
      orderId: delivery.order,
      status,
      driverId: delivery.driver,
      timestamp: new Date(),
      estimatedDeliveryTime: delivery.estimatedDeliveryTime,
    };
    emitToDelivery(delivery._id.toString(), 'delivery:status-updated', eventData);
    emitToAdmins('delivery:status-updated', eventData);
    if (order) {
      emitToUser(order.user.toString(), 'delivery:status-updated', eventData);
      emitToOrder(order._id.toString(), 'order:status-updated', {
        orderId: order._id, status: order.status,
      });
    }
  } catch {}

  res.status(200).json({ success: true, data: delivery });
});

// ─── Update delivery location ───────────────────────────────────

exports.updateLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, address } = req.body;

  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) return next(new ErrorResponse(`Delivery not found`, 404));

  if (req.user.role === 'driver' && delivery.driver?.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  await delivery.updateLocation(latitude, longitude, address);

  if (req.user.role === 'driver') {
    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: { lat: latitude, lng: longitude },
    });
  }

  try {
    emitToDelivery(delivery._id.toString(), 'delivery:location-update', {
      deliveryId: delivery._id,
      location: { latitude, longitude, address },
      timestamp: new Date(),
    });
  } catch {}

  res.status(200).json({ success: true, data: delivery });
});

// ─── Admin assigns driver ───────────────────────────────────────

exports.assignDeliveryBoy = asyncHandler(async (req, res, next) => {
  const { driverId } = req.body;

  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) return next(new ErrorResponse(`Delivery not found`, 404));

  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'driver') {
    return next(new ErrorResponse('Invalid driver ID or user is not a driver', 400));
  }

  delivery.driver = driverId;
  delivery.status = 'assigned';
  delivery.estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000);
  delivery.statusHistory.push({
    status: 'assigned',
    timestamp: new Date(),
    remarks: `Assigned to driver: ${driver.name}`,
  });

  await delivery.save();

  // Notify driver
  notifyUser(driverId, {
    type: 'delivery',
    title: 'New Delivery Assigned',
    message: `You have been assigned a new delivery order.`,
    relatedOrder: delivery.order,
    priority: 'high',
    extraData: { screen: 'DriverDeliveryDetail', deliveryId: delivery._id.toString() },
  });

  // Notify customer
  const order = await Order.findById(delivery.order);
  if (order) {
    notifyUser(order.user, {
      type: 'delivery',
      title: 'Rider Assigned!',
      message: `${driver.name} has been assigned to deliver your order.`,
      relatedOrder: order._id,
      priority: 'high',
      extraData: { screen: 'OrderDetails', deliveryId: delivery._id.toString() },
    });

    try {
      emitToUser(order.user.toString(), 'delivery:status-updated', {
        deliveryId: delivery._id,
        orderId: order._id,
        status: 'assigned',
        driver: { name: driver.name, phone: driver.phone, vehicleType: driver.vehicleType },
        estimatedDeliveryTime: delivery.estimatedDeliveryTime,
      });
    } catch {}
  }

  try {
    emitToUser(driverId, 'delivery:assigned-to-you', {
      deliveryId: delivery._id,
      orderId: delivery.order,
    });
    emitToDrivers('delivery:assigned', {
      deliveryId: delivery._id,
      driverId,
      orderId: delivery.order,
    });
    emitToAdmins('delivery:assigned', {
      deliveryId: delivery._id,
      orderId: delivery.order,
      status: 'assigned',
      driver: { _id: driverId, name: driver.name, phone: driver.phone },
    });
  } catch {}

  res.status(200).json({
    success: true,
    message: `Delivery assigned to ${driver.name}`,
    data: delivery,
  });
});

// ─── Update proof of delivery ───────────────────────────────────

exports.updateProofOfDelivery = asyncHandler(async (req, res, next) => {
  const { signature, photo, receivedBy } = req.body;

  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) return next(new ErrorResponse('Delivery not found', 404));

  if (req.user.role === 'driver' && delivery.driver?.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  delivery.proofOfDelivery = { signature, photo, receivedBy };
  await delivery.save();

  res.status(200).json({ success: true, data: delivery });
});

// ─── Rate delivery ──────────────────────────────────────────────

exports.rateDelivery = asyncHandler(async (req, res, next) => {
  const { rating, feedback } = req.body;

  const delivery = await Delivery.findById(req.params.id).populate('order');
  if (!delivery) return next(new ErrorResponse('Delivery not found', 404));

  if (delivery.order.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to rate this delivery', 401));
  }

  if (delivery.status !== 'delivered') {
    return next(new ErrorResponse('Can only rate completed deliveries', 400));
  }

  delivery.rating = rating;
  delivery.feedback = feedback;
  await delivery.save();

  if (delivery.driver) {
    const driverDeliveries = await Delivery.find({
      driver: delivery.driver,
      rating: { $exists: true, $gt: 0 },
    });
    const avgRating = driverDeliveries.reduce((sum, d) => sum + d.rating, 0) / driverDeliveries.length;
    await User.findByIdAndUpdate(delivery.driver, {
      driverRating: Math.round(avgRating * 10) / 10,
    });
  }

  res.status(200).json({ success: true, data: delivery });
});

// ─── Get delivery stats (Admin) ─────────────────────────────────

exports.getDeliveryStats = asyncHandler(async (req, res, next) => {
  const stats = await Delivery.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
  ]);

  const totalDeliveries = await Delivery.countDocuments();

  const avgDeliveryTime = await Delivery.aggregate([
    { $match: { actualDeliveryTime: { $exists: true }, pickupTime: { $exists: true } } },
    { $project: { deliveryTime: { $divide: [{ $subtract: ['$actualDeliveryTime', '$pickupTime'] }, 60000] } } },
    { $group: { _id: null, avgTime: { $avg: '$deliveryTime' } } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      byStatus: stats,
      total: totalDeliveries,
      avgDeliveryTimeMins: avgDeliveryTime[0]?.avgTime || 0,
    },
  });
});
