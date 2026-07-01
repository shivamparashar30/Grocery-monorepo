const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Delivery = require('../models/deliverySchema');
const Product = require('../models/Product');
const Notification = require('../models/notificationSchema');
const User = require('../models/user');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { sendPushNotification } = require('../services/firebaseService');
const {
  emitToUser, emitToAdmins, emitToDrivers, emitToOrder,
} = require('../services/socketService');

// ─── Notification helpers ───────────────────────────────────────

const notifyUser = async (userId, { type, title, message, relatedOrder, priority, extraData }) => {
  try {
    await Notification.create({ user: userId, type, title, message, relatedOrder, priority });
    const user = await User.findById(userId).select('fcmTokens');
    if (user?.fcmTokens?.length > 0) {
      await sendPushNotification(user.fcmTokens, title, message, {
        type: type || 'order',
        orderId: relatedOrder?.toString() || '',
        ...extraData,
      });
    }
  } catch (err) {
    console.error('notifyUser error:', err.message);
  }
};

const notifyAdmins = async ({ type, title, message, relatedOrder, priority, extraData }) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id fcmTokens');
    const notifications = admins.map((a) => ({
      user: a._id, type, title, message, relatedOrder, priority,
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
    const tokens = admins.reduce((acc, a) => {
      if (a.fcmTokens?.length > 0) acc.push(...a.fcmTokens);
      return acc;
    }, []);
    if (tokens.length > 0) {
      await sendPushNotification(tokens, title, message, {
        type: type || 'order',
        orderId: relatedOrder?.toString() || '',
        sound: 'order_alert',
        ...extraData,
      });
    }
  } catch (err) {
    console.error('notifyAdmins error:', err.message);
  }
};

// ─── Create order ───────────────────────────────────────────────

exports.createOrder = asyncHandler(async (req, res, next) => {
  const {
    orderItems, shippingAddress, paymentMethod,
    itemsPrice, taxPrice, shippingPrice, totalPrice, orderNotes,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return next(new ErrorResponse('No order items', 400));
  }

  const order = await Order.create({
    orderItems, user: req.user.id, shippingAddress, paymentMethod,
    itemsPrice, taxPrice, shippingPrice, totalPrice, orderNotes,
  });

  // Populate user info for the socket event
  const populatedOrder = await Order.findById(order._id)
    .populate('user', 'name email phone');

  // Clear cart
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [], totalPrice: 0 }
  );

  // Auto-create delivery record
  await Delivery.create({
    order: order._id,
    status: 'pending',
    statusHistory: [{ status: 'pending', timestamp: new Date(), remarks: 'Order placed' }],
  });

  // Notify admins via push + in-app
  notifyAdmins({
    type: 'order',
    title: 'New Order Received!',
    message: `Order #${order._id.toString().slice(-8).toUpperCase()} — Rs. ${totalPrice} (${orderItems.length} items)`,
    relatedOrder: order._id,
    priority: 'high',
    extraData: { screen: 'AdminOrderDetail' },
  });

  // Real-time: push to admin dashboard
  try {
    emitToAdmins('order:new', {
      order: populatedOrder,
      timestamp: new Date(),
    });
  } catch {}

  res.status(201).json({ success: true, data: order });
});

// ─── Get order by ID ────────────────────────────────────────────

exports.getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('orderItems.product', 'name price images stock isOutOfStock');

  if (!order) return next(new ErrorResponse('Order not found', 404));

  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this order', 401));
  }

  res.status(200).json({ success: true, data: order });
});

// ─── Get my orders ──────────────────────────────────────────────

exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id })
    .populate('orderItems.product', 'name price productKey')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: orders.length, data: orders });
});

// ─── Get all orders (Admin) ─────────────────────────────────────

exports.getOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find()
    .populate('user', 'name email phone')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: orders.length, data: orders });
});

// ─── Update order to paid ───────────────────────────────────────

exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorResponse('Order not found', 404));

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = req.body;
  const updatedOrder = await order.save();

  res.status(200).json({ success: true, data: updatedOrder });
});

// ─── Update order status (Admin) ────────────────────────────────

exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorResponse('Order not found', 404));

  const prevStatus = order.status;
  order.status = req.body.status;

  if (req.body.status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  // Deduct stock on confirm
  if (req.body.status === 'confirmed' && prevStatus === 'pending') {
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    // Generate pickup OTP when admin confirms
    const delivery = await Delivery.findOne({ order: order._id });
    if (delivery) {
      const otpCode = delivery.generatePickupOtp();
      await delivery.save();

      // Send OTP to admin (they display it to the rider)
      try {
        emitToAdmins('order:otp-generated', {
          orderId: order._id,
          deliveryId: delivery._id,
          otp: otpCode,
        });
      } catch {}
    }

    // Broadcast to available drivers
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name phone')
      .populate('orderItems.product', 'name price');

    try {
      emitToDrivers('delivery:available', {
        orderId: order._id,
        order: populatedOrder,
        timestamp: new Date(),
      });
    } catch {}

    // Push notification to all available drivers
    const availableDrivers = await User.find({
      role: 'driver', isAvailable: true, isBlocked: { $ne: true },
    }).select('_id fcmTokens');

    const driverTokens = availableDrivers.reduce((acc, d) => {
      if (d.fcmTokens?.length > 0) acc.push(...d.fcmTokens);
      return acc;
    }, []);

    if (driverTokens.length > 0) {
      try {
        await sendPushNotification(driverTokens, 'New Delivery Available!',
          `Order #${order._id.toString().slice(-8).toUpperCase()} — Rs. ${order.totalPrice}`,
          { type: 'delivery', orderId: order._id.toString(), screen: 'AvailableOrders', sound: 'order_alert' });
      } catch {}
    }
  }

  const updatedOrder = await order.save();

  // Notify customer
  const STATUS_MESSAGES = {
    confirmed: 'Your order has been accepted and is being prepared!',
    processing: 'Your order is being processed and packed.',
    shipped: 'Your order has been shipped and is on the way!',
    delivered: 'Your order has been delivered. Enjoy!',
    cancelled: 'Your order has been cancelled.',
  };

  const statusMsg = STATUS_MESSAGES[req.body.status];
  if (statusMsg) {
    notifyUser(order.user, {
      type: 'order',
      title: `Order ${req.body.status.charAt(0).toUpperCase() + req.body.status.slice(1)}`,
      message: statusMsg,
      relatedOrder: order._id,
      priority: req.body.status === 'cancelled' ? 'high' : 'medium',
      extraData: { screen: 'OrderDetails' },
    });
  }

  // Real-time: broadcast status change
  try {
    emitToOrder(order._id.toString(), 'order:status-updated', {
      orderId: order._id,
      status: req.body.status,
      previousStatus: prevStatus,
      timestamp: new Date(),
    });
    emitToUser(order.user.toString(), 'order:status-updated', {
      orderId: order._id,
      status: req.body.status,
    });
  } catch {}

  res.status(200).json({ success: true, data: updatedOrder });
});

// ─── Cancel order ───────────────────────────────────────────────

exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorResponse('Order not found', 404));

  if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to cancel this order', 401));
  }

  if (order.isDelivered) {
    return next(new ErrorResponse('Cannot cancel delivered order', 400));
  }

  order.status = 'cancelled';
  await order.save();

  // Cancel associated delivery
  const delivery = await Delivery.findOne({ order: order._id });
  if (delivery && delivery.status !== 'delivered') {
    delivery.status = 'cancelled';
    delivery.statusHistory.push({ status: 'cancelled', timestamp: new Date(), remarks: 'Order cancelled' });
    await delivery.save();
  }

  notifyUser(order.user, {
    type: 'order',
    title: 'Order Cancelled',
    message: `Your order #${order._id.toString().slice(-8).toUpperCase()} has been cancelled.`,
    relatedOrder: order._id,
    priority: 'high',
  });

  try {
    emitToOrder(order._id.toString(), 'order:status-updated', {
      orderId: order._id, status: 'cancelled',
    });
    emitToAdmins('order:status-updated', {
      orderId: order._id, status: 'cancelled',
    });
  } catch {}

  res.status(200).json({ success: true, data: order });
});

// ─── Modify order items (Admin) ─────────────────────────────────

exports.modifyOrderItems = asyncHandler(async (req, res, next) => {
  const { items } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorResponse('Order not found', 404));
  if (order.status !== 'pending') {
    return next(new ErrorResponse('Can only modify items of pending orders', 400));
  }

  let removedItems = [];

  for (const mod of items) {
    const idx = order.orderItems.findIndex(
      (oi) => oi.product.toString() === mod.productId
    );
    if (idx === -1) continue;

    if (mod.removed) {
      removedItems.push(order.orderItems[idx].name);
      order.orderItems.splice(idx, 1);
    } else if (mod.quantity > 0) {
      order.orderItems[idx].quantity = mod.quantity;
    }
  }

  const itemsPrice = order.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  order.itemsPrice = itemsPrice;
  order.totalPrice = itemsPrice + (order.taxPrice || 0) + (order.shippingPrice || 0);

  if (order.orderItems.length === 0) order.status = 'cancelled';
  await order.save();

  const modCount = items.filter((m) => m.removed || m.quantity).length;
  if (modCount > 0 && order.user) {
    const msg = removedItems.length > 0
      ? `Some items (${removedItems.join(', ')}) were unavailable. Your order total is now Rs. ${order.totalPrice.toFixed(0)}.`
      : `Your order items have been adjusted. New total: Rs. ${order.totalPrice.toFixed(0)}.`;

    notifyUser(order.user, {
      type: 'order', title: 'Order Updated', message: msg,
      relatedOrder: order._id, priority: 'medium',
    });
  }

  const updatedOrder = await Order.findById(order._id)
    .populate('user', 'name email phone')
    .populate('orderItems.product', 'name price images stock isOutOfStock');

  res.status(200).json({ success: true, data: updatedOrder });
});
