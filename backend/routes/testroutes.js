/**
 * TEST ROUTES — Only available in development/test environments.
 * Never exposed in production.
 */
const router = require('express').Router();
const User = require('../models/user');
const Clan = require('../models/clan');
const Proof = require('../models/proof');
const StreakLog = require('../models/streak');
const { sendSuccess } = require('../utils/helpers');
const { breakStreak, maintainStreak } = require('../services/streakservice');

// GET /api/test/health
router.get('/health', (req, res) => {
  sendSuccess(res, { env: process.env.NODE_ENV, time: new Date() }, 'Test route OK');
});

// DELETE /api/test/wipe — Wipe all data (test only)
router.delete('/wipe', async (req, res, next) => {
  try {
    await Promise.all([
      User.deleteMany({}),
      Clan.deleteMany({}),
      Proof.deleteMany({}),
      StreakLog.deleteMany({}),
    ]);
    sendSuccess(res, {}, 'All data wiped');
  } catch (err) {
    next(err);
  }
});

// POST /api/test/seed — Seed a basic clan with 2 users
router.post('/seed', async (req, res, next) => {
  try {
    const leader = await User.create({
      username: 'seed_leader',
      email: 'leader@crewdo.test',
      password: 'password123',
    });
    const member = await User.create({
      username: 'seed_member',
      email: 'member@crewdo.test',
      password: 'password123',
    });

    const clan = await Clan.create({
      name: 'Seed Clan',
      description: 'Auto-seeded test clan',
      leader: leader._id,
      members: [
        { user: leader._id, role: 'leader', todayStatus: 'pending' },
        { user: member._id, role: 'member', todayStatus: 'pending' },
      ],
      dailyTask: { title: 'Complete 30 push-ups', category: 'fitness' },
      inviteCode: 'SEED0001',
    });

    await User.findByIdAndUpdate(leader._id, { clan: clan._id, clanRole: 'leader' });
    await User.findByIdAndUpdate(member._id, { clan: clan._id, clanRole: 'member' });

    sendSuccess(res, { clan, leader, member }, 'Seeded successfully', 201);
  } catch (err) {
    next(err);
  }
});

// POST /api/test/clans/:id/break-streak — Force break a streak
router.post('/clans/:id/break-streak', async (req, res, next) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan) return res.status(404).json({ success: false, message: 'Clan not found' });
    await breakStreak(clan);
    sendSuccess(res, { streak: clan.streak }, 'Streak broken');
  } catch (err) {
    next(err);
  }
});

// POST /api/test/clans/:id/maintain-streak — Force maintain a streak
router.post('/clans/:id/maintain-streak', async (req, res, next) => {
  try {
    const clan = await Clan.findById(req.params.id).populate('members.user');
    if (!clan) return res.status(404).json({ success: false, message: 'Clan not found' });
    await maintainStreak(clan);
    sendSuccess(res, { streak: clan.streak }, 'Streak maintained');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
