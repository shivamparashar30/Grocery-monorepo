const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  getNotification,
  createNotification,
  broadcastNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationStats,
} = require('../controller/Notificationcontroller');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Private routes
router.get('/', protect, getNotifications);
router.get('/unread/count', protect, getUnreadCount);
router.get('/:id', protect, getNotification);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);
router.delete('/', protect, deleteAllNotifications);

// Admin routes
router.post('/', protect, authorize('admin'), createNotification);
router.post('/broadcast', protect, authorize('admin'), broadcastNotification);
router.get('/stats', protect, authorize('admin'), getNotificationStats);

module.exports = router;