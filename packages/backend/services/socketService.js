const jwt = require('jsonwebtoken');
const User = require('../models/user');

let io = null;

// Map userId -> Set of socketIds
const userSockets = new Map();
// Map role -> Set of userIds (for room broadcasting)
const roleUsers = new Map();

const initializeSocket = (server) => {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Auth middleware — verify JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name role isAvailable currentLocation');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, userRole, userName } = socket;
    console.log(`[Socket] ${userRole}:${userName} connected (${socket.id})`);

    // Track user sockets
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Track role membership
    if (!roleUsers.has(userRole)) roleUsers.set(userRole, new Set());
    roleUsers.get(userRole).add(userId);

    // Join role-based room
    socket.join(`role:${userRole}`);
    // Join personal room
    socket.join(`user:${userId}`);

    // Driver joins driver room + sends availability
    if (userRole === 'driver') {
      socket.join('drivers:available');
    }

    // Driver location updates
    socket.on('driver:location', (data) => {
      if (userRole !== 'driver') return;
      // Broadcast to admin and relevant user
      if (data.deliveryId) {
        io.to(`delivery:${data.deliveryId}`).emit('delivery:location-update', {
          deliveryId: data.deliveryId,
          driverId: userId,
          location: data.location,
          timestamp: new Date(),
        });
      }
    });

    // Join delivery room (for live tracking)
    socket.on('join:delivery', (deliveryId) => {
      socket.join(`delivery:${deliveryId}`);
    });

    socket.on('leave:delivery', (deliveryId) => {
      socket.leave(`delivery:${deliveryId}`);
    });

    // Join order room
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('leave:order', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] ${userRole}:${userName} disconnected`);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          roleUsers.get(userRole)?.delete(userId);
        }
      }
    });
  });

  console.log('[Socket] Socket.IO initialized');
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

// ─── Emit helpers ──────────────────────────────────────────────

// Emit to a specific user (all their connected sockets)
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

// Emit to all users with a specific role
const emitToRole = (role, event, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
};

// Emit to all admins
const emitToAdmins = (event, data) => emitToRole('admin', event, data);

// Emit to all online drivers
const emitToDrivers = (event, data) => emitToRole('driver', event, data);

// Emit to everyone in a delivery room
const emitToDelivery = (deliveryId, event, data) => {
  if (!io) return;
  io.to(`delivery:${deliveryId}`).emit(event, data);
};

// Emit to everyone in an order room
const emitToOrder = (orderId, event, data) => {
  if (!io) return;
  io.to(`order:${orderId}`).emit(event, data);
};

// Check if a user is currently connected
const isUserOnline = (userId) => {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToAdmins,
  emitToDrivers,
  emitToDelivery,
  emitToOrder,
  isUserOnline,
};
