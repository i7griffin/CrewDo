const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['leader', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    todayStatus: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { _id: false }
);

const clanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Clan name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Clan name must be at least 3 chars'],
      maxlength: [30, 'Clan name cannot exceed 30 chars'],
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 chars'],
      default: '',
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],

    // Daily task definition
    dailyTask: {
      title: { type: String, required: true, maxlength: 100 },
      description: { type: String, maxlength: 300 },
      proofRequired: { type: Boolean, default: true },
      category: {
        type: String,
        enum: ['fitness', 'study', 'productivity', 'wellness', 'custom'],
        default: 'custom',
      },
    },

    // Clan streak
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastSuccessDate: { type: Date, default: null },
      isBroken: { type: Boolean, default: false },
    },

    // Stats
    totalTasksCompleted: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }, // % average over all time

    // Settings
    maxMembers: { type: Number, default: 10, min: 2, max: 50 },
    isPrivate: { type: Boolean, default: false },
    inviteCode: { type: String, unique: true, sparse: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── Indexes ───────────────────────────────────────────────────
clanSchema.index({ name: 'text', description: 'text' });
clanSchema.index({ inviteCode: 1 });

// ─── Virtual: member count ─────────────────────────────────────
clanSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// ─── Method: check if all members completed today ──────────────
clanSchema.methods.allMembersCompleted = function () {
  if (this.members.length === 0) return false;
  return this.members.every((m) => m.todayStatus === 'approved');
};

// ─── Method: get pending members ──────────────────────────────
clanSchema.methods.getPendingMembers = function () {
  return this.members.filter((m) => m.todayStatus === 'pending');
};

// ─── Method: reset daily statuses ─────────────────────────────
clanSchema.methods.resetDailyStatuses = function () {
  this.members.forEach((m) => {
    m.todayStatus = 'pending';
  });
};

module.exports = mongoose.model('Clan', clanSchema);
