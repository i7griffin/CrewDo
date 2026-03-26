const mongoose = require('mongoose')

const clanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    habit: { type: String, required: true, default: 'Workout' },
    teamCode: { type: String, required: true, unique: true, uppercase: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDefault: { type: Boolean, default: false },
    streak: { type: Number, default: 0 },
    dailyProgress: { type: Number, default: 0 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Clan', clanSchema)
