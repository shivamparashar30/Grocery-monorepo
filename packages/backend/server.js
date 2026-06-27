const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const auth = require('./routes/authRoutes');
const deliveries = require('./routes/Deliveryroutes');
const cart= require('./routes/Cartroutes');
// const categories = require('./routes/Categoryroutes'); 
// const products   = require('./routes/Productroutes');
// const cart       = require('./routes/Cartroutes');
const orders     = require('./routes/Orderroutes');
const coupons    = require('./routes/Couponroutes');
const addresses  = require('./routes/Addressroutes');
const wishlist   = require('./routes/Wishlistroutes');
const notifications = require('./routes/Notificationroutes');
const banners    = require('./routes/Bannerroutes');
const payments   = require('./routes/Paymentroutes');
const stores     = require('./routes/Storeroutes');
const inventory  = require('./routes/Inventoryroutes');
const reviews    = require('./routes/Reviewroutes');
const productRoutes = require('./routes/productRoutes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    credentials: true,
  })
);

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/deliveries', deliveries);
app.use('/api/v1/cart', cart);
// app.use('/api/v1/categories', categories);
// app.use('/api/v1/products', products);
// app.use('/api/v1/cart', cart);
app.use('/api/v1/orders', orders);
app.use('/api/v1/coupons', coupons);
app.use('/api/v1/addresses', addresses);
app.use('/api/v1/wishlist', wishlist);
app.use('/api/v1/notifications', notifications);
app.use('/api/v1/banners', banners);
app.use('/api/v1/payments', payments);
app.use('/api/v1/stores', stores);
app.use('/api/v1/inventory', inventory);
app.use('/api/v1/reviews', reviews);
app.use('/api/v1/products', productRoutes);
// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Grocery Store API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      categories: '/api/v1/categories',
      products: '/api/v1/products',
      cart: '/api/v1/cart',
      orders: '/api/v1/orders',
      coupons: '/api/v1/coupons',
      addresses: '/api/v1/addresses',
      wishlist: '/api/v1/wishlist',
      notifications: '/api/v1/notifications',
      banners: '/api/v1/banners',
      deliveries: '/api/v1/deliveries',
      payments: '/api/v1/payments',
      stores: '/api/v1/stores',
      inventory: '/api/v1/inventory',
      reviews: '/api/v1/reviews',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});