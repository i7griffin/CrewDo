const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Create a standardized API error
 */
const createError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Success response wrapper
 */
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, ...data });
};

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

/**
 * Normalize a date to midnight UTC (for per-day comparisons)
 */
const getTodayUTC = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

/**
 * Check if two dates are the same UTC day
 */
const isSameUTCDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
};

/**
 * Generate a random invite code
 */
const generateInviteCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F9B2C1"
};

/**
 * Paginate a mongoose query
 */
const paginate = (query = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

module.exports = {
  createError,
  sendSuccess,
  generateAccessToken,
  generateRefreshToken,
  getTodayUTC,
  isSameUTCDay,
  generateInviteCode,
  paginate,
};
