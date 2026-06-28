const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getActiveSections,
  getAllSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  toggleSection,
  getDashboardStats,
} = require('../controller/homeSectionController');

// Public
router.get('/', getActiveSections);

// Admin
router.get('/admin', protect, authorize('admin'), getAllSections);
router.get('/admin/stats', protect, authorize('admin'), getDashboardStats);
router.post('/', protect, authorize('admin'), createSection);
router.put('/reorder', protect, authorize('admin'), reorderSections);
router.get('/:id', protect, authorize('admin'), getSection);
router.put('/:id', protect, authorize('admin'), updateSection);
router.put('/:id/toggle', protect, authorize('admin'), toggleSection);
router.delete('/:id', protect, authorize('admin'), deleteSection);

module.exports = router;
