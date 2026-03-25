const { validationResult } = require('express-validator');
const Clan = require('../models/clan');
const User = require('../models/user');
const StreakLog = require('../models/streak');
const { createError, sendSuccess, generateInviteCode, paginate } = require('../utils/helpers');
const notificationService = require('../services/notificationservice');
const logger = require('../utils/logger');

/**
 * POST /api/clans — Create a new clan
 */
const createClan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    if (req.user.clan) return next(createError('You are already in a clan. Leave first.', 400));

    const { name, description, dailyTask, maxMembers, isPrivate, category } = req.body;

    const inviteCode = generateInviteCode();

    const clan = await Clan.create({
      name,
      description,
      leader: req.user._id,
      members: [{ user: req.user._id, role: 'leader', todayStatus: 'pending' }],
      dailyTask: {
        title: dailyTask.title,
        description: dailyTask.description || '',
        proofRequired: dailyTask.proofRequired !== false,
        category: category || 'custom',
      },
      maxMembers: maxMembers || 10,
      isPrivate: isPrivate || false,
      inviteCode,
    });

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      clan: clan._id,
      clanRole: 'leader',
      todayStatus: 'pending',
    });

    logger.info(`🏰 Clan created: [${name}] by ${req.user.username}`);
    sendSuccess(res, { clan }, 'Clan created successfully', 201);
  } catch (err) {
    if (err.code === 11000) return next(createError('A clan with this name already exists', 400));
    next(err);
  }
};

/**
 * POST /api/clans/join — Join via invite code
 */
const joinClan = async (req, res, next) => {
  try {
    if (req.user.clan) return next(createError('You are already in a clan. Leave first.', 400));

    const { inviteCode } = req.body;
    if (!inviteCode) return next(createError('Invite code is required', 400));

    const clan = await Clan.findOne({ inviteCode: inviteCode.toUpperCase(), isActive: true });
    if (!clan) return next(createError('Invalid invite code', 404));

    if (clan.members.length >= clan.maxMembers) {
      return next(createError('This clan is full', 400));
    }

    const alreadyMember = clan.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) return next(createError('You are already a member of this clan', 400));

    clan.members.push({ user: req.user._id, role: 'member', todayStatus: 'pending' });
    await clan.save();

    await User.findByIdAndUpdate(req.user._id, {
      clan: clan._id,
      clanRole: 'member',
      todayStatus: 'pending',
    });

    // Notify leader
    await notificationService.notifyLeaderNewProof(clan, `${req.user.username} joined the clan!`);

    logger.info(`➕ ${req.user.username} joined clan [${clan.name}]`);
    sendSuccess(res, { clan }, 'Joined clan successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/clans/leave — Leave current clan
 */
const leaveClan = async (req, res, next) => {
  try {
    if (!req.user.clan) return next(createError('You are not in a clan', 400));

    const clan = await Clan.findById(req.user.clan);
    if (!clan) return next(createError('Clan not found', 404));

    const isLeader = clan.leader.toString() === req.user._id.toString();

    if (isLeader && clan.members.length > 1) {
      return next(createError(
        'As leader, transfer leadership before leaving or disband the clan.',
        400
      ));
    }

    // Remove from clan
    clan.members = clan.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );

    if (clan.members.length === 0) {
      clan.isActive = false;
    }

    await clan.save();

    await User.findByIdAndUpdate(req.user._id, {
      clan: null,
      clanRole: 'member',
      todayStatus: 'pending',
    });

    logger.info(`➖ ${req.user.username} left clan [${clan.name}]`);
    sendSuccess(res, {}, 'Left clan successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/clans/my — Get current user's clan details
 */
const getMyClan = async (req, res, next) => {
  try {
    if (!req.user.clan) return next(createError('You are not in a clan', 404));

    const clan = await Clan.findById(req.user.clan)
      .populate('members.user', 'username avatar totalPoints personalStreak badges')
      .populate('leader', 'username avatar');

    if (!clan) return next(createError('Clan not found', 404));

    sendSuccess(res, { clan });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/clans/:id — Get any clan by ID (public info)
 */
const getClanById = async (req, res, next) => {
  try {
    const clan = await Clan.findById(req.params.id)
      .populate('members.user', 'username avatar totalPoints')
      .populate('leader', 'username avatar');

    if (!clan || !clan.isActive) return next(createError('Clan not found', 404));

    sendSuccess(res, { clan });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/clans/search?q=name — Search public clans
 */
const searchClans = async (req, res, next) => {
  try {
    const { q = '', category } = req.query;
    const { skip, limit, page } = paginate(req.query);

    const filter = {
      isActive: true,
      isPrivate: false,
      ...(q && { $text: { $search: q } }),
      ...(category && { 'dailyTask.category': category }),
    };

    const [clans, total] = await Promise.all([
      Clan.find(filter)
        .select('name description streak members dailyTask maxMembers')
        .populate('leader', 'username avatar')
        .skip(skip)
        .limit(limit)
        .sort({ 'streak.current': -1 }),
      Clan.countDocuments(filter),
    ]);

    sendSuccess(res, {
      clans,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/clans/:id/task — Update daily task (leader only)
 */
const updateDailyTask = async (req, res, next) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan) return next(createError('Clan not found', 404));

    if (clan.leader.toString() !== req.user._id.toString()) {
      return next(createError('Only the clan leader can update the task', 403));
    }

    const { title, description, proofRequired, category } = req.body;
    if (title) clan.dailyTask.title = title;
    if (description !== undefined) clan.dailyTask.description = description;
    if (proofRequired !== undefined) clan.dailyTask.proofRequired = proofRequired;
    if (category) clan.dailyTask.category = category;

    await clan.save();
    logger.info(`📝 Daily task updated for clan [${clan.name}]`);
    sendSuccess(res, { clan }, 'Daily task updated');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/clans/:id/transfer — Transfer leadership
 */
const transferLeadership = async (req, res, next) => {
  try {
    const clan = await Clan.findById(req.params.id);
    if (!clan) return next(createError('Clan not found', 404));

    if (clan.leader.toString() !== req.user._id.toString()) {
      return next(createError('Only the current leader can transfer leadership', 403));
    }

    const { newLeaderId } = req.body;
    const newLeaderEntry = clan.members.find(
      (m) => m.user.toString() === newLeaderId
    );
    if (!newLeaderEntry) return next(createError('New leader must be a clan member', 400));

    // Demote old leader
    const oldLeaderEntry = clan.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (oldLeaderEntry) oldLeaderEntry.role = 'member';

    // Promote new leader
    newLeaderEntry.role = 'leader';
    clan.leader = newLeaderId;
    await clan.save();

    // Update User records
    await User.findByIdAndUpdate(req.user._id, { clanRole: 'member' });
    await User.findByIdAndUpdate(newLeaderId, { clanRole: 'leader' });

    logger.info(`👑 Leadership transferred in clan [${clan.name}] to ${newLeaderId}`);
    sendSuccess(res, { clan }, 'Leadership transferred successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/clans/:id/streak-history — Streak log for a clan
 */
const getStreakHistory = async (req, res, next) => {
  try {
    const { skip, limit, page } = paginate(req.query);
    const logs = await StreakLog.find({ clan: req.params.id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('completedMembers', 'username avatar');

    const total = await StreakLog.countDocuments({ clan: req.params.id });
    sendSuccess(res, { logs, pagination: { total, page, limit } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/clans/leaderboard — Top clans by streak
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const clans = await Clan.find({ isActive: true, isPrivate: false })
      .select('name streak members dailyTask')
      .populate('leader', 'username avatar')
      .sort({ 'streak.current': -1, 'streak.longest': -1 })
      .limit(20);

    sendSuccess(res, { clans });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createClan,
  joinClan,
  leaveClan,
  getMyClan,
  getClanById,
  searchClans,
  updateDailyTask,
  transferLeadership,
  getStreakHistory,
  getLeaderboard,
};
