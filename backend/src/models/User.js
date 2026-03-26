const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    points: { type: Number, default: 0 },
    online: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
