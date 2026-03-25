const cron = require('node-cron');
const Clan = require('../models/clan');
const User = require('../models/user');
const StreakLog = require('../models/streak');
const { getTodayUTC, isSameUTCDay } = require('../utils/helpers');
const notificationService = require('./notificationservice');
const logger = require('../utils/logger');
const { getIO } = require('../sockets');

/**
 * Called when a member's proof is approved.
 * Updates their todayStatus, then checks if ALL clan members are done.
 */
const handleMemberApproval = async (userId, clanId) => {
  const clan = await Clan.findById(clanId).populate('members.user', 'username');
  if (!clan) throw new Error('Clan not found');

  // Update the member's status in the clan document
  const memberEntry = clan.members.find((m) => m.user._id.toString() === userId.toString());
  if (!memberEntry) throw new Error('User is not a member of this clan');
  memberEntry.todayStatus = 'approved';

  await clan.save();

  // Update the user's personal todayStatus
  await User.findByIdAndUpdate(userId, { todayStatus: 'approved' });

  // Notify clan of member completion
  const user = await User.findById(userId).select('username');
  await notificationService.notifyMemberCompleted(clan, user);

  // Emit real-time update
  const io = getIO();
  io.to(`clan:${clanId}`).emit('member_status_update', {
    userId,
    status: 'approved',
    username: user.username,
  });

  // Check if ALL members are now done
  if (clan.allMembersCompleted()) {
    await maintainStreak(clan);
  }

  return clan;
};

/**
 * Maintain (increment) the clan streak — called when all members complete.
 */
const maintainStreak = async (clan) => {
  const today = getTodayUTC();

  // Guard: already counted today
  if (clan.streak.lastSuccessDate && isSameUTCDay(clan.streak.lastSuccessDate, today)) {
    return;
  }

  const wasZero = clan.streak.current === 0;
  clan.streak.current += 1;
  clan.streak.lastSuccessDate = today;
  clan.streak.isBroken = false;

  if (clan.streak.current > clan.streak.longest) {
    clan.streak.longest = clan.streak.current;
  }

  clan.totalTasksCompleted += 1;
  await clan.save();

  // Log streak event
  const completedMembers = clan.members
    .filter((m) => m.todayStatus === 'approved')
    .map((m) => m.user._id || m.user);

  await StreakLog.create({
    clan: clan._id,
    date: today,
    completedMembers,
    totalMembers: clan.members.length,
    allCompleted: true,
    streakCountAtDate: clan.streak.current,
    event: wasZero ? 'started' : 'maintained',
  });

  // Award points to all members
  for (const member of clan.members) {
    const uid = member.user._id || member.user;
    const user = await User.findById(uid);
    if (user) {
      const bonus = clan.streak.current % 7 === 0 ? 20 : 10; // weekly bonus
      await user.addPoints(bonus);
    }
  }

  // Notify all members — streak maintained!
  await notificationService.notifyStreakMaintained(clan);

  // Real-time update
  const io = getIO();
  io.to(`clan:${clan._id}`).emit('streak_updated', {
    clanId: clan._id,
    streak: clan.streak,
    event: 'maintained',
  });

  logger.info(`✅ Clan [${clan.name}] streak maintained: Day ${clan.streak.current}`);
};

/**
 * Break the streak for a clan — called by daily cron if not all completed.
 */
const breakStreak = async (clan) => {
  const today = getTodayUTC();
  const prevStreak = clan.streak.current;

  // Log who failed
  const completedMembers = clan.members
    .filter((m) => m.todayStatus === 'approved')
    .map((m) => m.user._id || m.user);

  if (prevStreak > 0) {
    await StreakLog.create({
      clan: clan._id,
      date: today,
      completedMembers,
      totalMembers: clan.members.length,
      allCompleted: false,
      streakCountAtDate: prevStreak,
      event: 'broken',
    });
  }

  clan.streak.current = 0;
  clan.streak.isBroken = true;
  clan.streak.resetDailyStatuses
    ? clan.resetDailyStatuses()
    : clan.members.forEach((m) => (m.todayStatus = 'pending'));

  await clan.save();

  // Reset each member's todayStatus in User model
  const memberIds = clan.members.map((m) => m.user._id || m.user);
  await User.updateMany({ _id: { $in: memberIds } }, { todayStatus: 'pending' });

  if (prevStreak > 0) {
    await notificationService.notifyStreakBroken(clan, prevStreak);
  }

  const io = getIO();
  io.to(`clan:${clan._id}`).emit('streak_updated', {
    clanId: clan._id,
    streak: clan.streak,
    event: 'broken',
    prevStreak,
  });

  logger.info(`💔 Clan [${clan.name}] streak broken at Day ${prevStreak}`);
};

/**
 * Daily cron job — runs at midnight UTC.
 * Evaluates every active clan: maintain or break streak.
 */
const scheduleDailyStreakReset = () => {
  const hour = process.env.STREAK_RESET_HOUR || 0;
  const minute = process.env.STREAK_RESET_MINUTE || 0;

  cron.schedule(`${minute} ${hour} * * *`, async () => {
    logger.info('⏰ Running daily streak evaluation...');
    try {
      const clans = await Clan.find({ isActive: true }).populate('members.user', 'username email');

      let maintained = 0;
      let broken = 0;

      for (const clan of clans) {
        if (clan.members.length === 0) continue;

        if (clan.allMembersCompleted()) {
          // Already handled by handleMemberApproval, but double-check
          const today = getTodayUTC();
          if (!clan.streak.lastSuccessDate || !isSameUTCDay(clan.streak.lastSuccessDate, today)) {
            await maintainStreak(clan);
            maintained++;
          }
        } else {
          await breakStreak(clan);
          broken++;
        }
      }

      logger.info(`Daily streak eval done. Maintained: ${maintained}, Broken: ${broken}`);
    } catch (err) {
      logger.error(`Daily streak eval failed: ${err.message}`);
    }
  }, { timezone: 'UTC' });

  logger.info(`📅 Daily streak reset scheduled at ${hour}:${String(minute).padStart(2, '0')} UTC`);
};

module.exports = {
  handleMemberApproval,
  maintainStreak,
  breakStreak,
  scheduleDailyStreakReset,
};
