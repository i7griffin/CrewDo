const mongoose = require('mongoose');

const proofSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clan',
      required: true,
    },

    // Media
    mediaUrl: {
      type: String,
      required: [true, 'Proof media is required'],
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    cloudinaryPublicId: { type: String }, // for deletion

    // Caption / note from the user
    caption: {
      type: String,
      maxlength: [300, 'Caption cannot exceed 300 characters'],
      default: '',
    },

    // Verification
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },

    // Date this proof counts for (normalized to midnight UTC)
    taskDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// ─── Indexes ───────────────────────────────────────────────────
// Prevent duplicate submissions per user per day per clan
proofSchema.index({ user: 1, clan: 1, taskDate: 1 }, { unique: true });
proofSchema.index({ clan: 1, status: 1 });
proofSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Proof', proofSchema);
