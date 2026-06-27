const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controller/Cartcontroller');

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/:itemId', protect, updateCartItem);
router.delete('/:itemId', protect, removeFromCart);
router.delete('/', protect, clearCart);

module.exports = router;
