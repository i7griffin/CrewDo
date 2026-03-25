const mongoose = require('mongoose');

// Historical log of each clan's streak day
const streakLogSchema = new mongoose.Schema(
  {
    clan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clan',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // Snapshot of who completed on this date
    completedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    totalMembers: { type: Number, required: true },
    allCompleted: { type: Boolean, required: true },
    streakCountAtDate: { type: Number, required: true },
    // Was the streak maintained or broken?
    event: {
      type: String,
      enum: ['maintained', 'broken', 'started'],
      required: true,
    },
  },
  { timestamps: true }
);

streakLogSchema.index({ clan: 1, date: -1 });

module.exports = mongoose.model('StreakLog', streakLogSchema);
