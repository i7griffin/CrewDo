const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// ✅ FIXED PATHS
const User = require('../models/user');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ─── Auth Middleware ─────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select(
        'username clan clanRole'
      );

      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection Handler ──────────────────────────────────────
  io.on('connection', (socket) => {
    const { user } = socket;

    logger.info(`🔌 Socket connected: ${user.username} (${socket.id})`);

    // Join personal notification room
    socket.join(`user:${user._id}`);

    // Join clan room if member
    if (user.clan) {
      socket.join(`clan:${user.clan}`);
      logger.info(`  → Joined clan room: ${user.clan}`);
    }

    // ── Client joins a clan room explicitly ───────────────────
    socket.on('join_clan', (clanId) => {
      socket.join(`clan:${clanId}`);
      logger.debug(`${user.username} joined room clan:${clanId}`);
    });

    socket.on('leave_clan', (clanId) => {
      socket.leave(`clan:${clanId}`);
    });

    // ── Peer Activity: user started task ─────────────────────
    socket.on('activity:started', (data) => {
      if (user.clan) {
        socket.to(`clan:${user.clan}`).emit('peer_activity', {
          type: 'started',
          userId: user._id,
          username: user.username,
          timestamp: new Date(),
          ...data,
        });
      }
    });

    // ── Ping / heartbeat ─────────────────────────────────────
    socket.on('ping', () => socket.emit('pong', { time: Date.now() }));

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${user.username} — ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${user.username}: ${err.message}`);
    });
  });

  logger.info('🔗 Socket.IO initialized');
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };