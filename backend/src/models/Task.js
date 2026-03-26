const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    value: { type: Number, required: true, default: 10 },
    clanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

// Index for efficient querying of tasks by clan
taskSchema.index({ clanId: 1 })

module.exports = mongoose.model('Task', taskSchema)
