const mongoose = require('mongoose')

const proofSchema = new mongoose.Schema(
  {
    clan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: String, required: true },
    habitType: { type: String, required: true },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    verified: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Compound index for efficient duplicate checking
proofSchema.index({ submittedBy: 1, taskId: 1, createdAt: -1 })

module.exports = mongoose.model('Proof', proofSchema)
