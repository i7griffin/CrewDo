const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { createError } = require('../utils/helpers');

/**
 * Protect routes — verifies Bearer JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(createError('Authentication required. Please log in.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user || !user.isActive) {
      return next(createError('User no longer exists or is inactive.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(createError('Invalid token. Please log in again.', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(createError('Token expired. Please log in again.', 401));
    }
    next(err);
  }
};

/**
 * Restrict to specific roles: restrictTo('leader')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.clanRole)) {
      return next(createError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

/**
 * Ensure user is a member of a clan
 */
const requireClan = (req, res, next) => {
  if (!req.user.clan) {
    return next(createError('You must be part of a clan to perform this action.', 403));
  }
  next();
};

module.exports = { protect, restrictTo, requireClan };
