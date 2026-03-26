const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    clan: { type: mongoose.Schema.Types.ObjectId, ref: 'Clan', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Message', messageSchema)
