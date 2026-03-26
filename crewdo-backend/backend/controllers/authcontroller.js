const { validationResult } = require('express-validator');
const { createError, sendSuccess } = require('../utils/helpers');
const jwt = require('jsonwebtoken');

const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '7d',
  });
};

const register = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    const userPayload = {
      _id: `guest_${Date.now()}`,
      username: username || 'Guest User',
      email: email || 'guest@example.com',
      totalPoints: 0,
      badges: [],
    };
    return sendSuccess(res, {
        accessToken: signToken(userPayload),
        refreshToken: 'mocked_refresh_token',
        user: userPayload,
      }, 'Registration mocked successful', 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, username } = req.body;
    const nameToUse = username || email || 'Guest User';
    const userPayload = {
      _id: `guest_${Date.now()}`,
      username: nameToUse,
      email: email || 'guest@example.com',
      clanRole: 'member',
      totalPoints: 100,
      badges: [],
      personalStreak: 0,
    };
    return sendSuccess(res, {
        accessToken: signToken(userPayload),
        refreshToken: 'mocked_refresh_token',
        user: userPayload,
      }, 'Login mocked successful');
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    return sendSuccess(res, { accessToken: 'mocked_access_token', refreshToken: 'mocked_refresh_token' }, 'Token refreshed mocked');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    return sendSuccess(res, {}, 'Logged out mocked successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, { user: req.user }, 'User fetched mocked');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getMe };