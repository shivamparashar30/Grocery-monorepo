const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user cart
// @route   GET /api/v1/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock productKey unit',
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  res.status(200).json({
    success: true,
    data: cart,
  });
});

// @desc    Add item to cart
// @route   POST /api/v1/cart
// @access  Private
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  if (product.stock < quantity) {
    return next(new ErrorResponse('Not enough stock', 400));
  }

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    await Cart.findOneAndUpdate(
      { user: req.user.id, 'items.product': productId },
      { $inc: { 'items.$.quantity': quantity } },
      { new: true }
    );
  } else {
    const price = product.discountPrice > 0 ? product.discountPrice : product.price;
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $push: { items: { product: productId, quantity, price } } },
      { new: true }
    );
  }

  cart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock',
  });

  res.status(200).json({
    success: true,
    data: cart,
  });
});

// @desc    Update cart item
// @route   PUT /api/v1/cart/:itemId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  const item = cart.items.id(req.params.itemId);

  if (!item) {
    return next(new ErrorResponse('Item not found in cart', 404));
  }

  await Cart.findOneAndUpdate(
    { user: req.user.id, 'items._id': req.params.itemId },
    { $set: { 'items.$.quantity': quantity } },
    { new: true }
  );

  const updatedCart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock',
  });

  res.status(200).json({
    success: true,
    data: updatedCart,
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/:itemId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { $pull: { items: { _id: req.params.itemId } } },
    { new: true }
  );

  const updatedCart = await Cart.findOne({ user: req.user.id }).populate({
    path: 'items.product',
    select: 'name price discountPrice images stock',
  });

  res.status(200).json({
    success: true,
    data: updatedCart,
  });
});

// @desc    Clear cart
// @route   DELETE /api/v1/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { $set: { items: [] } },
    { new: true }
  );

  const updatedCart = await Cart.findOne({ user: req.user.id });

  res.status(200).json({
    success: true,
    data: updatedCart,
  });
});