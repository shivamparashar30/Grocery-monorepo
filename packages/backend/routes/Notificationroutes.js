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
  getAllNotifications,
} = require('../controller/Notificationcontroller');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Admin routes (must be before /:id)
router.get('/admin/all', protect, authorize('admin'), getAllNotifications);
router.get('/stats', protect, authorize('admin'), getNotificationStats);
router.post('/', protect, authorize('admin'), createNotification);
router.post('/broadcast', protect, authorize('admin'), broadcastNotification);

// Private routes
router.get('/', protect, getNotifications);
router.get('/unread/count', protect, getUnreadCount);
router.put('/read-all', protect, markAllAsRead);
router.delete('/', protect, deleteAllNotifications);
router.get('/:id', protect, getNotification);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
