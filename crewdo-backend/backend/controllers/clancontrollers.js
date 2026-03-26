const { validationResult } = require('express-validator');
const { createError, sendSuccess, generateInviteCode, paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

// Global In-Memory Array for Mocking MongoDB
let memoryClans = [];

const createClan = async (req, res, next) => {
  try {
    const { name, dailyTask, password, tasks } = req.body;
    const inviteCode = generateInviteCode();

    const parsedTasks = (Array.isArray(tasks) && tasks.length > 0) 
                         ? tasks 
                         : (typeof tasks === 'string' ? tasks.split(',').map(t=>t.trim()).filter(Boolean) : ['Focus Session']);

    const newClan = {
      _id: `clan_${Date.now()}`,
      name: name || 'New Clan',
      leader: req.user._id,
      members: [{ user: req.user, role: 'leader' }],
      password: password || '',
      tasks: parsedTasks.length > 0 ? parsedTasks : ['Focus Session'],
      streak: { current: 3, longest: 14 },
      dailyTask: {
        title: dailyTask ? dailyTask.title : 'Focus Session',
      },
      inviteCode,
      isActive: true,
    };

    memoryClans.unshift(newClan);
    logger.info(`🏰 Clan mocked created: [${name}] by ${req.user.username}`);
    sendSuccess(res, { clan: newClan }, 'Clan created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const joinClan = async (req, res, next) => {
  try {
    const { inviteCode, password } = req.body;
    if (!inviteCode) return next(createError('Invite code is required', 400));

    const cleanCode = inviteCode.toUpperCase();
    const clan = memoryClans.find(c => c.inviteCode === cleanCode);
    
    if (!clan) return next(createError('Invalid invite code', 404));

    if (clan.password && clan.password !== password) {
       return next(createError('Invalid Clan Password', 401));
    }

    const alreadyMember = clan.members.some(
      (m) => m.user.username === req.user.username
    );
    if (alreadyMember) return next(createError('You are already a member of this clan', 400));

    clan.members.push({ user: req.user, role: 'member' });

    logger.info(`➕ ${req.user.username} joined clan [${clan.name}]`);
    sendSuccess(res, { clan }, 'Joined clan successfully');
  } catch (err) {
    next(err);
  }
};

const leaveClan = async (req, res, next) => {
  sendSuccess(res, {}, 'Left clan successfully');
};

const getMyClan = async (req, res, next) => {
  try {
      const clan = memoryClans.find(c => c.members.some(m => m.user.username === req.user.username));
      if (!clan) return next(createError('You are not in a clan', 404));
      sendSuccess(res, { clan });
  } catch(e) { next(e); }
};

const getClanById = async (req, res, next) => {
  try {
    const clan = memoryClans.find(c => c._id === req.params.id);
    if (!clan) return next(createError('Clan not found', 404));
    sendSuccess(res, { clan });
  } catch (err) {
    next(err);
  }
};

const searchClans = async (req, res, next) => {
   sendSuccess(res, { clans: memoryClans, pagination: { total: memoryClans.length, page: 1, limit: 10, pages: 1 } });
};

const updateDailyTask = async (req, res, next) => {
  sendSuccess(res, { clan: memoryClans[0] }, 'Daily task updated');
};

const transferLeadership = async (req, res, next) => {
  sendSuccess(res, { clan: memoryClans[0] }, 'Leadership transferred successfully');
};

const getStreakHistory = async (req, res, next) => {
  sendSuccess(res, { logs: [], pagination: { total: 0, page: 1, limit: 10 } });
};

const getLeaderboard = async (req, res, next) => {
  sendSuccess(res, { clans: memoryClans.slice(0,20) });
};

module.exports = {
  createClan, joinClan, leaveClan, getMyClan, getClanById,
  searchClans, updateDailyTask, transferLeadership,
  getStreakHistory, getLeaderboard,
};
