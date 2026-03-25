const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },

    // Clan membership
    clan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clan',
      default: null,
    },
    clanRole: {
      type: String,
      enum: ['member', 'leader'],
      default: 'member',
    },

    // Gamification
    totalPoints: { type: Number, default: 0 },
    badges: [
      {
        name: { type: String },
        description: { type: String },
        icon: { type: String },
        awardedAt: { type: Date, default: Date.now },
      },
    ],
    profilePerks: [{ type: String }], // e.g. 'golden_frame', 'fire_badge'

    // Personal streak (separate from clan streak)
    personalStreak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastCompletedDate: { type: Date, default: null },
    },

    // Today's task status within their clan
    todayStatus: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected'],
      default: 'pending',
    },

    // Notification preferences
    notifications: {
      taskReminder: { type: Boolean, default: true },
      clanAlert: { type: Boolean, default: true },
      streakWarning: { type: Boolean, default: true },
    },

    refreshToken: { type: String, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── Pre-save: hash password ───────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance method: compare password ────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance method: add points + badge check ────────────────
userSchema.methods.addPoints = async function (points) {
  this.totalPoints += points;

  // Award badges based on milestones
  const milestones = [
    { points: 100, name: 'Centurion', description: 'Earned 100 points', icon: '🏅' },
    { points: 500, name: 'Veteran', description: 'Earned 500 points', icon: '🥈' },
    { points: 1000, name: 'Legend', description: 'Earned 1000 points', icon: '🥇' },
  ];

  for (const m of milestones) {
    const alreadyHas = this.badges.some((b) => b.name === m.name);
    if (!alreadyHas && this.totalPoints >= m.points) {
      this.badges.push({ name: m.name, description: m.description, icon: m.icon });
    }
  }

  await this.save();
};

// ─── Virtual: public profile ───────────────────────────────────
userSchema.virtual('profile').get(function () {
  return {
    id: this._id,
    username: this.username,
    avatar: this.avatar,
    totalPoints: this.totalPoints,
    badges: this.badges,
    personalStreak: this.personalStreak,
    clanRole: this.clanRole,
  };
});

module.exports = mongoose.model('User', userSchema);
