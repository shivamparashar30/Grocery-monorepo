const Notification = require('../models/notificationSchema');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { sendPushNotification } = require('../services/firebaseService');

// @desc    Get all notifications for logged in user
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const { type, isRead } = req.query;

  const query = { user: req.user.id };

  if (type) {
    query.type = type;
  }

  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }

  const notifications = await Notification.find(query)
    .populate('relatedOrder', 'orderItems totalPrice status')
    .populate('relatedProduct', 'name price images')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
});

// @desc    Get unread notifications count
// @route   GET /api/v1/notifications/unread/count
// @access  Private
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.countDocuments({
    user: req.user.id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    count,
  });
});

// @desc    Get single notification
// @route   GET /api/v1/notifications/:id
// @access  Private
exports.getNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id)
    .populate('relatedOrder', 'orderItems totalPrice status')
    .populate('relatedProduct', 'name price images');

  if (!notification) {
    return next(
      new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure notification belongs to user
  if (notification.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this notification', 401));
  }

  res.status(200).json({
    success: true,
    data: notification,
  });
});

// @desc    Create notification (Admin)
// @route   POST /api/v1/notifications
// @access  Private/Admin
exports.createNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.create(req.body);

  res.status(201).json({
    success: true,
    data: notification,
  });
});

// @desc    Send notification to all users (Admin)
// @route   POST /api/v1/notifications/broadcast
// @access  Private/Admin
exports.broadcastNotification = asyncHandler(async (req, res, next) => {
  const { type, title, message, image, actionUrl, priority } = req.body;

  // Get all users with their FCM tokens
  const User = require('../models/user');
  const users = await User.find({ isBlocked: { $ne: true } }).select('_id fcmTokens');

  // Create in-app notification for each user
  const notifications = users.map((user) => ({
    user: user._id,
    type,
    title,
    message,
    image,
    actionUrl,
    priority,
  }));

  await Notification.insertMany(notifications);

  // Send FCM push notifications
  const allTokens = users.reduce((tokens, user) => {
    if (user.fcmTokens && user.fcmTokens.length > 0) {
      tokens.push(...user.fcmTokens);
    }
    return tokens;
  }, []);

  if (allTokens.length > 0) {
    try {
      await sendPushNotification(allTokens, title, message, {
        type: type || 'general',
        priority: priority || 'medium',
      });
    } catch (err) {
      console.error('FCM broadcast error (notifications still saved):', err.message);
    }
  }

  res.status(201).json({
    success: true,
    message: `Notification sent to ${users.length} users`,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  let notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure notification belongs to user
  if (notification.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this notification', 401));
  }

  notification = await notification.markAsRead();

  res.status(200).json({
    success: true,
    data: notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { user: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure notification belongs to user
  if (notification.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this notification', 401));
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

// @desc    Delete all notifications for user
// @route   DELETE /api/v1/notifications
// @access  Private
exports.deleteAllNotifications = asyncHandler(async (req, res, next) => {
  await Notification.deleteMany({ user: req.user.id });

  res.status(200).json({
    success: true,
    message: 'All notifications deleted successfully',
  });
});

// @desc    Get all notifications (Admin)
// @route   GET /api/v1/notifications/admin/all
// @access  Private/Admin
exports.getAllNotifications = asyncHandler(async (req, res, next) => {
  const { type, page = 1, limit = 50 } = req.query;
  const query = {};
  if (type) query.type = type;

  const total = await Notification.countDocuments(query);
  const notifications = await Notification.find(query)
    .populate('user', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    pages: Math.ceil(total / limit),
    data: notifications,
  });
});

// @desc    Get notification statistics (Admin)
// @route   GET /api/v1/notifications/stats
// @access  Private/Admin
exports.getNotificationStats = asyncHandler(async (req, res, next) => {
  const stats = await Notification.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        unreadCount: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] },
        },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  const totalNotifications = await Notification.countDocuments();
  const totalUnread = await Notification.countDocuments({ isRead: false });

  res.status(200).json({
    success: true,
    data: {
      byType: stats,
      total: totalNotifications,
      totalUnread,
    },
  });
});