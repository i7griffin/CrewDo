require('dotenv').config({ path: __dirname + '/.env' });

console.log("ENV CHECK:", process.env.MONGO_URI);
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { initSocket } = require('./sockets');
const { scheduleDailyStreakReset } = require('./services/streakservice');

// Routes
const authRoutes = require('./routes/authroutes');
const clanRoutes = require('./routes/clanroutes');
const proofRoutes = require('./routes/proofroutes');
const userRoutes = require('./routes/userroutes');
const testRoutes = require('./routes/testroutes');

const app = express();
const server = http.createServer(app);

// ─── Connect DB ────────────────────────────────────────────────
connectDB();

// ─── Init WebSocket ────────────────────────────────────────────
initSocket(server);

// ─── Global Middleware ─────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// ─── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/clans', clanRoutes);
app.use('/api/proofs', proofRoutes);
app.use('/api/users', userRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ─── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ─── Scheduled Jobs ────────────────────────────────────────────
scheduleDailyStreakReset();

// ─── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  logger.info(`🚀 CrewDo server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = { app, server };
