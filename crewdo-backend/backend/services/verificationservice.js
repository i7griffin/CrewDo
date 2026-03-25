const Proof = require('../models/proof');
const Clan = require('../models/clan');
const User = require('../models/user');
const { createError } = require('../utils/helpers');
const notificationService = require('./notificationservice');
const streakService = require('./streakservice');
const { getIO } = require('../sockets');
const logger = require('../utils/logger');

/**
 * Leader approves a proof submission.
 */
const approveProof = async (proofId, leaderId) => {
  const proof = await Proof.findById(proofId).populate('user', 'username clan');
  if (!proof) throw createError('Proof not found', 404);
  if (proof.status !== 'pending') throw createError('Proof has already been reviewed', 400);

  // Verify the leader belongs to the same clan
  const clan = await Clan.findById(proof.clan);
  if (!clan) throw createError('Clan not found', 404);

  const leaderEntry = clan.members.find(
    (m) => (m.user._id || m.user).toString() === leaderId.toString() && m.role === 'leader'
  );
  if (!leaderEntry) throw createError('Only the clan leader can verify proofs', 403);

  // Check proof is not already overridden by another proof today
  proof.status = 'approved';
  proof.verifiedBy = leaderId;
  proof.verifiedAt = new Date();
  await proof.save();

  // Notify submitter
  await notificationService.notifyProofReviewed(proof.user, clan, 'approved');

  // Emit real-time
  const io = getIO();
  io.to(`user:${proof.user._id}`).emit('proof_reviewed', {
    proofId,
    status: 'approved',
    clanId: clan._id,
  });

  // Trigger streak engine
  await streakService.handleMemberApproval(proof.user._id, clan._id);

  logger.info(`✅ Proof ${proofId} approved by leader ${leaderId}`);
  return proof;
};

/**
 * Leader rejects a proof submission.
 */
const rejectProof = async (proofId, leaderId, reason = '') => {
  const proof = await Proof.findById(proofId).populate('user', 'username');
  if (!proof) throw createError('Proof not found', 404);
  if (proof.status !== 'pending') throw createError('Proof has already been reviewed', 400);

  const clan = await Clan.findById(proof.clan);
  if (!clan) throw createError('Clan not found', 404);

  const leaderEntry = clan.members.find(
    (m) => (m.user._id || m.user).toString() === leaderId.toString() && m.role === 'leader'
  );
  if (!leaderEntry) throw createError('Only the clan leader can verify proofs', 403);

  proof.status = 'rejected';
  proof.verifiedBy = leaderId;
  proof.verifiedAt = new Date();
  proof.rejectionReason = reason;
  await proof.save();

  // Reset user's status to pending so they can resubmit
  const memberEntry = clan.members.find(
    (m) => (m.user._id || m.user).toString() === proof.user._id.toString()
  );
  if (memberEntry) {
    memberEntry.todayStatus = 'pending';
    await clan.save();
  }
  await User.findByIdAndUpdate(proof.user._id, { todayStatus: 'pending' });

  // Notify submitter
  await notificationService.notifyProofReviewed(proof.user, clan, 'rejected', reason);

  const io = getIO();
  io.to(`user:${proof.user._id}`).emit('proof_reviewed', {
    proofId,
    status: 'rejected',
    reason,
    clanId: clan._id,
  });

  logger.info(`❌ Proof ${proofId} rejected by leader ${leaderId}. Reason: ${reason}`);
  return proof;
};

/**
 * Get all pending proofs for a clan (for leader dashboard).
 */
const getPendingProofs = async (clanId, leaderId) => {
  const clan = await Clan.findById(clanId);
  if (!clan) throw createError('Clan not found', 404);

  const isLeader = clan.members.some(
    (m) => (m.user._id || m.user).toString() === leaderId.toString() && m.role === 'leader'
  );
  if (!isLeader) throw createError('Only the clan leader can view pending proofs', 403);

  return Proof.find({ clan: clanId, status: 'pending' })
    .populate('user', 'username avatar')
    .sort({ createdAt: 1 });
};

module.exports = { approveProof, rejectProof, getPendingProofs };
