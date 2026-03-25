const { getIO } = require('../sockets');
const logger = require('../utils/logger');

/**
 * Central notification dispatcher.
 * Emits Socket.IO events. Can be extended to push email / FCM later.
 */

const emit = (room, event, payload) => {
  try {
    const io = getIO();
    io.to(room).emit(event, payload);
  } catch (err) {
    logger.warn(`Notification emit failed [${event}]: ${err.message}`);
  }
};

/**
 * Notify all clan members that one member completed their task.
 */
const notifyMemberCompleted = async (clan, completedUser) => {
  const memberIds = clan.members.map((m) => m.user._id?.toString() || m.user.toString());

  for (const uid of memberIds) {
    if (uid === completedUser._id.toString()) continue; // skip self
    emit(`user:${uid}`, 'notification', {
      type: 'member_completed',
      title: '🎯 Teammate Done!',
      message: `${completedUser.username} completed today's task in ${clan.name}!`,
      clanId: clan._id,
      timestamp: new Date(),
    });
  }
};

/**
 * Notify all members that the clan streak was maintained.
 */
const notifyStreakMaintained = async (clan) => {
  const memberIds = clan.members.map((m) => m.user._id?.toString() || m.user.toString());
  const streakDay = clan.streak.current;
  const isWeekly = streakDay % 7 === 0;

  for (const uid of memberIds) {
    emit(`user:${uid}`, 'notification', {
      type: 'streak_maintained',
      title: isWeekly ? `🔥 ${streakDay} Day Streak!` : '🔥 Streak Maintained!',
      message: isWeekly
        ? `Amazing! ${clan.name} hit a ${streakDay}-day streak! +20 bonus points!`
        : `Every member completed today's task. ${clan.name} is on Day ${streakDay}!`,
      clanId: clan._id,
      streak: streakDay,
      timestamp: new Date(),
    });
  }
};

/**
 * Notify all members that the clan streak was broken.
 */
const notifyStreakBroken = async (clan, prevStreak) => {
  const memberIds = clan.members.map((m) => m.user._id?.toString() || m.user.toString());
  const pendingMembers = clan.getPendingMembers
    ? clan.getPendingMembers()
    : clan.members.filter((m) => m.todayStatus === 'pending');

  for (const uid of memberIds) {
    emit(`user:${uid}`, 'notification', {
      type: 'streak_broken',
      title: '💔 Streak Broken',
      message: `${clan.name}'s ${prevStreak}-day streak was broken. ${pendingMembers.length} member(s) did not complete today's task.`,
      clanId: clan._id,
      prevStreak,
      timestamp: new Date(),
    });
  }
};

/**
 * Notify a user their proof was approved or rejected.
 */
const notifyProofReviewed = async (user, clan, status, reason = '') => {
  const uid = user._id?.toString() || user.toString();

  emit(`user:${uid}`, 'notification', {
    type: 'proof_reviewed',
    title: status === 'approved' ? '✅ Proof Approved!' : '❌ Proof Rejected',
    message:
      status === 'approved'
        ? `Your proof for ${clan.name} was approved. Keep it up!`
        : `Your proof for ${clan.name} was rejected. Reason: ${reason || 'No reason given'}. You can resubmit.`,
    clanId: clan._id,
    status,
    reason,
    timestamp: new Date(),
  });
};

/**
 * Notify pending members to submit proof (can be called manually or via scheduler).
 */
const remindPendingMembers = async (clan) => {
  const pending = clan.members.filter((m) => m.todayStatus === 'pending');

  for (const member of pending) {
    const uid = member.user._id?.toString() || member.user.toString();
    emit(`user:${uid}`, 'notification', {
      type: 'task_reminder',
      title: '⏰ Don\'t break the streak!',
      message: `You haven\'t submitted today\'s proof for ${clan.name} yet. Don\'t let your crew down!`,
      clanId: clan._id,
      timestamp: new Date(),
    });
  }
};

/**
 * Notify clan leader of a new proof submission.
 */
const notifyLeaderNewProof = async (clan, submitterUsername) => {
  const leaderId = clan.leader?.toString() || clan.leader;
  emit(`user:${leaderId}`, 'notification', {
    type: 'new_proof_submitted',
    title: '📋 New Proof Submitted',
    message: `${submitterUsername} submitted proof for ${clan.name}. Please review it.`,
    clanId: clan._id,
    timestamp: new Date(),
  });
};

module.exports = {
  notifyMemberCompleted,
  notifyStreakMaintained,
  notifyStreakBroken,
  notifyProofReviewed,
  remindPendingMembers,
  notifyLeaderNewProof,
};
