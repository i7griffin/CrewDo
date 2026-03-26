const path = require('path')
const express = require('express')
const multer = require('multer')
const authMiddleware = require('../middleware/authMiddleware')
const Clan = require('../models/Clan')
const Proof = require('../models/Proof')
const User = require('../models/User')

const router = express.Router()

const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: { fileSize: 30 * 1024 * 1024 },
})

// Helper function to get start of today in UTC
const getStartOfToday = () => {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
}

// GET /proof/my/today/:clanId - Get user's completed tasks for today
router.get('/my/today/:clanId', authMiddleware, async (req, res) => {
  const { clanId } = req.params

  try {
    const clan = await Clan.findById(clanId)
    if (!clan) return res.status(404).json({ message: 'Clan not found' })

    const isMember = clan.members.some((memberId) => memberId.equals(req.user._id))
    if (!isMember) return res.status(403).json({ message: 'You are not a member of this clan' })

    const startOfToday = getStartOfToday()
    const proofs = await Proof.find({
      submittedBy: req.user._id,
      clan: clanId,
      createdAt: { $gte: startOfToday }
    })

    const completedTaskIds = proofs.map(proof => proof.taskId)
    return res.status(200).json({ completedTaskIds })
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message })
  }
})

router.post('/:clanId', authMiddleware, upload.single('proof'), async (req, res) => {
  const { clanId } = req.params
  const { habitType = 'Workout', taskId } = req.body
  
  if (!req.file) {
    return res.status(400).json({ message: 'Proof file is required' })
  }

  if (!taskId) {
    return res.status(400).json({ message: 'Task ID is required' })
  }

  const clan = await Clan.findById(clanId)
  if (!clan) return res.status(404).json({ message: 'Clan not found' })

  const isMember = clan.members.some((memberId) => memberId.equals(req.user._id))
  if (!isMember) return res.status(403).json({ message: 'You are not a member of this clan' })

  // Check for duplicate completion today
  const startOfToday = getStartOfToday()
  const existingProof = await Proof.findOne({
    submittedBy: req.user._id,
    taskId,
    createdAt: { $gte: startOfToday }
  })

  if (existingProof) {
    return res.status(409).json({ message: 'You have already completed this task today. Try again tomorrow!' })
  }

  const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image'
  const mediaUrl = `/uploads/${req.file.filename}`

  const proof = await Proof.create({
    clan: clan._id,
    submittedBy: req.user._id,
    taskId,
    habitType,
    mediaUrl,
    mediaType,
    verified: true,
  })

  await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } })

  return res.status(201).json({
    proof: {
      id: proof._id,
      clanId,
      habitType,
      mediaUrl,
      mediaType,
      verified: proof.verified,
    },
  })
})

module.exports = router
