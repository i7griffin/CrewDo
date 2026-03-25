const { validationResult } = require('express-validator');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
  createError,
  sendSuccess,
} = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    // 🔍 Debug incoming data
    console.log("REQ BODY:", req.body);

    // ✅ Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { username, email, password } = req.body;

    // ✅ Extra safety check (prevents silent crashes)
    if (!username || !email || !password) {
      return next(createError('All fields are required', 400));
    }

    // ✅ Check duplicates
    const existing = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      return next(createError(`This ${field} is already registered`, 400));
    }

    // ✅ Create user safely
    const user = new User({
      username,
      email,
      password,
    });

    await user.save(); // important: triggers schema hooks (like bcrypt)

    // ✅ Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    logger.info(`👤 New user registered: ${username}`);

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          totalPoints: user.totalPoints,
          badges: user.badges,
        },
      },
      'Registration successful',
      201
    );
  } catch (err) {
    console.error("REGISTER ERROR:", err); // 🔥 critical debug
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError('Email and password required', 400));
    }

    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user) {
      return next(createError('User not found', 404));
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(createError('Invalid email or password', 401));
    }

    if (!user.isActive) {
      return next(createError('Account is deactivated', 403));
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          clan: user.clan,
          clanRole: user.clanRole,
          totalPoints: user.totalPoints,
          badges: user.badges,
          personalStreak: user.personalStreak,
          todayStatus: user.todayStatus,
        },
      },
      'Login successful'
    );
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) return next(createError('Refresh token required', 400));

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return next(createError('Invalid refresh token', 401));
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(
      res,
      { accessToken: newAccessToken, refreshToken: newRefreshToken },
      'Token refreshed'
    );
  } catch (err) {
    console.error("REFRESH ERROR:", err);

    if (
      err.name === 'JsonWebTokenError' ||
      err.name === 'TokenExpiredError'
    ) {
      return next(createError('Invalid or expired refresh token', 401));
    }

    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'clan',
      'name streak dailyTask'
    );

    return sendSuccess(res, { user }, 'User fetched');
  } catch (err) {
    console.error("GETME ERROR:", err);
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getMe };