const router = require('express').Router();
const { protect } = require('../middleware/authmiddleware');
const User = require('../models/user');
const { sendSuccess, createError, paginate } = require('../utils/helpers');

router.use(protect);

// GET /api/users/leaderboard — Top users by points
router.get('/leaderboard', async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true })
      .select('username avatar totalPoints badges personalStreak clan')
      .populate('clan', 'name')
      .sort({ totalPoints: -1 })
      .limit(50);
    sendSuccess(res, { users });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id — Public profile
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username avatar totalPoints badges personalStreak clan clanRole createdAt')
      .populate('clan', 'name streak');
    if (!user || !user.isActive) return next(createError('User not found', 404));
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/profile — Update own profile
router.patch('/profile', async (req, res, next) => {
  try {
    const allowed = ['username', 'avatar', 'notifications'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Check username uniqueness
    if (updates.username) {
      const exists = await User.findOne({ username: updates.username, _id: { $ne: req.user._id } });
      if (exists) return next(createError('Username already taken', 400));
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select('-password -refreshToken');

    sendSuccess(res, { user }, 'Profile updated');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
