const { validationResult } = require('express-validator');
const Proof = require('../models/proof');
const Clan = require('../models/clan');
const User = require('../models/user');
const { createError, sendSuccess, getTodayUTC, paginate } = require('../utils/helpers');
const verificationService = require('../services/verificationservice');
const notificationService = require('../services/notificationservice');
const { cloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * POST /api/proofs/submit
 * Multipart: file + optional caption
 */
const submitProof = async (req, res, next) => {
  try {
    if (!req.user.clan) return next(createError('You must be in a clan to submit proof', 400));

    const clan = await Clan.findById(req.user.clan);
    if (!clan) return next(createError('Clan not found', 404));

    const today = getTodayUTC();

    // Check for existing submission today
    const existing = await Proof.findOne({
      user: req.user._id,
      clan: clan._id,
      taskDate: today,
    });

    if (existing && existing.status === 'pending') {
      return next(createError('You have already submitted proof today. Await leader review.', 400));
    }
    if (existing && existing.status === 'approved') {
      return next(createError('Your proof for today has already been approved!', 400));
    }

    // If rejected, allow resubmission — delete old rejected proof
    if (existing && existing.status === 'rejected') {
      if (existing.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(existing.cloudinaryPublicId);
      }
      await existing.deleteOne();
    }

    if (!req.file) return next(createError('Proof file is required', 400));

    const isVideo = req.file.mimetype.startsWith('video/');

    const proof = await Proof.create({
      user: req.user._id,
      clan: clan._id,
      mediaUrl: req.file.path,
      mediaType: isVideo ? 'video' : 'image',
      cloudinaryPublicId: req.file.filename,
      caption: req.body.caption || '',
      taskDate: today,
      status: 'pending',
    });

    // Update member todayStatus in clan
    const memberEntry = clan.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (memberEntry) {
      memberEntry.todayStatus = 'submitted';
      await clan.save();
    }

    // Update user's todayStatus
    await User.findByIdAndUpdate(req.user._id, { todayStatus: 'submitted' });

    // Notify leader
    await notificationService.notifyLeaderNewProof(clan, req.user.username);

    logger.info(`📤 Proof submitted by ${req.user.username} for clan [${clan.name}]`);
    sendSuccess(res, { proof }, 'Proof submitted. Awaiting leader verification.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/proofs/:id/approve — Leader approves proof
 */
const approveProof = async (req, res, next) => {
  try {
    const proof = await verificationService.approveProof(req.params.id, req.user._id);
    sendSuccess(res, { proof }, 'Proof approved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/proofs/:id/reject — Leader rejects proof
 */
const rejectProof = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const proof = await verificationService.rejectProof(req.params.id, req.user._id, reason);
    sendSuccess(res, { proof }, 'Proof rejected');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proofs/pending — Get pending proofs for leader
 */
const getPendingProofs = async (req, res, next) => {
  try {
    if (!req.user.clan) return next(createError('You are not in a clan', 400));
    const proofs = await verificationService.getPendingProofs(req.user.clan, req.user._id);
    sendSuccess(res, { proofs });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proofs/clan/:clanId — All proofs for a clan (paginated)
 */
const getClanProofs = async (req, res, next) => {
  try {
    const { skip, limit, page } = paginate(req.query);
    const { status, date } = req.query;

    const filter = { clan: req.params.clanId };
    if (status) filter.status = status;
    if (date) filter.taskDate = new Date(date);

    const [proofs, total] = await Promise.all([
      Proof.find(filter)
        .populate('user', 'username avatar')
        .populate('verifiedBy', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Proof.countDocuments(filter),
    ]);

    sendSuccess(res, { proofs, pagination: { total, page, limit } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proofs/my — Current user's own proof history
 */
const getMyProofs = async (req, res, next) => {
  try {
    const { skip, limit, page } = paginate(req.query);

    const [proofs, total] = await Promise.all([
      Proof.find({ user: req.user._id })
        .populate('clan', 'name')
        .sort({ taskDate: -1 })
        .skip(skip)
        .limit(limit),
      Proof.countDocuments({ user: req.user._id }),
    ]);

    sendSuccess(res, { proofs, pagination: { total, page, limit } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proofs/today — Today's proof feed for the clan (peer activity)
 */
const getTodayFeed = async (req, res, next) => {
  try {
    if (!req.user.clan) return next(createError('You are not in a clan', 400));

    const today = getTodayUTC();
    const proofs = await Proof.find({
      clan: req.user.clan,
      taskDate: today,
    })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    sendSuccess(res, { proofs, date: today });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/proofs/:id — Delete own pending proof (before review)
 */
const deleteProof = async (req, res, next) => {
  try {
    const proof = await Proof.findById(req.params.id);
    if (!proof) return next(createError('Proof not found', 404));

    if (proof.user.toString() !== req.user._id.toString()) {
      return next(createError('Not authorized to delete this proof', 403));
    }

    if (proof.status === 'approved') {
      return next(createError('Cannot delete an approved proof', 400));
    }

    if (proof.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(proof.cloudinaryPublicId, {
        resource_type: proof.mediaType === 'video' ? 'video' : 'image',
      });
    }

    await proof.deleteOne();

    // Reset member status back to pending
    await User.findByIdAndUpdate(req.user._id, { todayStatus: 'pending' });
    await Clan.updateOne(
      { _id: req.user.clan, 'members.user': req.user._id },
      { $set: { 'members.$.todayStatus': 'pending' } }
    );

    sendSuccess(res, {}, 'Proof deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitProof,
  approveProof,
  rejectProof,
  getPendingProofs,
  getClanProofs,
  getMyProofs,
  getTodayFeed,
  deleteProof,
};
