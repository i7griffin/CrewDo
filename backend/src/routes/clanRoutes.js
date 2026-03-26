const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const Clan = require('../models/Clan')
const Task = require('../models/Task')

const router = express.Router()

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase()

// Validate team code format (6-8 alphanumeric characters, uppercase)
const isValidTeamCode = (code) => {
  return /^[A-Z0-9]{6,8}$/.test(code)
}

// Generate unique team code with exponential backoff retry logic
const generateUniqueTeamCode = async (maxRetries = 5) => {
  let attempt = 0
  
  while (attempt < maxRetries) {
    const teamCode = randomCode()
    
    // Validate format
    if (!isValidTeamCode(teamCode)) {
      attempt++
      continue
    }
    
    // Check uniqueness
    const exists = await Clan.exists({ teamCode })
    if (!exists) {
      return teamCode
    }
    
    // Exponential backoff: wait 2^attempt * 10ms before retry
    const backoffMs = Math.pow(2, attempt) * 10
    await new Promise(resolve => setTimeout(resolve, backoffMs))
    attempt++
  }
  
  throw new Error('Failed to generate unique team code after maximum retries')
}

router.get('/my', authMiddleware, async (req, res) => {
  const clans = await Clan.find({ members: req.user._id }).sort({ updatedAt: -1 })

  return res.json({
    clans: clans.map((clan) => ({
      id: clan._id,
      name: clan.name,
      teamCode: clan.teamCode,
      habit: clan.habit,
      streak: clan.streak,
      progress: clan.dailyProgress,
      avatar: clan.name.slice(0, 2).toUpperCase(),
      color: '#3cf86e',
      creator: clan.creator,
    })),
  })
})

router.post('/', authMiddleware, async (req, res) => {
  const name = (req.body.name || '').trim()
  const habit = (req.body.habit || 'Workout').trim()
  const tasks = req.body.tasks || []
  
  if (!name) {
    return res.status(400).json({ message: 'Clan name is required' })
  }

  try {
    const teamCode = await generateUniqueTeamCode()

    const clan = await Clan.create({
      name,
      habit,
      teamCode,
      members: [req.user._id],
      creator: req.user._id,
      streak: 1,
      dailyProgress: 0,
    })

    // Create tasks if provided
    if (tasks.length > 0) {
      const taskDocs = tasks.map(task => ({
        title: (task.title || '').trim(),
        value: task.value || 10,
        clanId: clan._id,
        createdBy: req.user._id,
      })).filter(task => task.title)

      if (taskDocs.length > 0) {
        await Task.insertMany(taskDocs)
      }
    }

    return res.status(201).json({
      clan: {
        id: clan._id,
        name: clan.name,
        habit: clan.habit,
        teamCode: clan.teamCode,
        streak: clan.streak,
      },
    })
  } catch (error) {
    if (error.message.includes('Failed to generate unique team code')) {
      return res.status(500).json({ message: 'Unable to generate unique team code. Please try again.' })
    }
    throw error
  }
})

router.post('/join', authMiddleware, async (req, res) => {
  const teamCode = String(req.body.teamCode || '').trim().toUpperCase()
  if (!teamCode) return res.status(400).json({ message: 'teamCode is required' })

  const clan = await Clan.findOne({ teamCode })
  if (!clan) {
    return res.status(404).json({ message: 'Clan not found for that team code' })
  }

  if (!clan.members.some((memberId) => memberId.equals(req.user._id))) {
    clan.members.push(req.user._id)
    await clan.save()
  }

  return res.json({ message: 'Joined clan', clanId: clan._id })
})

router.get('/:clanId', authMiddleware, async (req, res) => {
  const clan = await Clan.findById(req.params.clanId).populate('members', 'displayName username points online')
  if (!clan) return res.status(404).json({ message: 'Clan not found' })

  const Message = require('../models/Message')
  const messages = await Message.find({ clan: clan._id })
    .populate('author', 'displayName')
    .sort({ createdAt: 1 })
    .limit(50)

  return res.json({
    clan: {
      id: clan._id,
      name: clan.name,
      habit: clan.habit,
      teamCode: clan.teamCode,
      creator: clan.creator,
      streak: clan.streak,
      progress: clan.dailyProgress,
      members: clan.members.map(member => ({
        id: member._id,
        name: member.displayName,
        avatar: member.displayName.slice(0, 2).toUpperCase(),
        points: member.points || 0,
        online: member.online || false,
      })),
      messages: messages.map(msg => ({
        id: msg._id,
        author: msg.author?.displayName || 'Unknown',
        text: msg.text,
      })),
    },
  })
})

router.get('/:clanId/streak', authMiddleware, async (req, res) => {
  const clan = await Clan.findById(req.params.clanId)
  if (!clan) return res.status(404).json({ message: 'Clan not found' })

  return res.json({ streak: clan.streak, progress: clan.dailyProgress })
})

router.get('/:clanId/tasks', authMiddleware, async (req, res) => {
  const { clanId } = req.params

  // Find the clan to verify it exists
  const clan = await Clan.findById(clanId)
  if (!clan) {
    return res.status(404).json({ message: 'Clan not found' })
  }

  // Get all tasks for this clan
  const tasks = await Task.find({ clanId }).sort({ createdAt: 1 })

  return res.json({
    tasks: tasks.map((task) => ({
      id: task._id,
      title: task.title,
      value: task.value,
    })),
  })
})

router.post('/:clanId/tasks', authMiddleware, async (req, res) => {
  const { clanId } = req.params
  const { title, value } = req.body

  // Validate required fields
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Task title is required' })
  }

  if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
    return res.status(400).json({ message: 'Task value must be a positive number' })
  }

  // Find the clan
  const clan = await Clan.findById(clanId)
  if (!clan) {
    return res.status(404).json({ message: 'Clan not found' })
  }

  // Check if user is the creator
  if (!clan.creator || !clan.creator.equals(req.user._id)) {
    return res.status(403).json({ message: 'Only the group creator can add tasks' })
  }

  // Create the task
  const task = await Task.create({
    title: title.trim(),
    value: value || 10,
    clanId: clan._id,
    createdBy: req.user._id,
  })

  return res.status(201).json({
    task: {
      id: task._id,
      title: task.title,
      value: task.value,
      clanId: task.clanId,
      createdBy: task.createdBy,
    },
  })
})

router.post('/:clanId/leave', authMiddleware, async (req, res) => {
  const { clanId } = req.params

  const clan = await Clan.findById(clanId)
  if (!clan) {
    return res.status(404).json({ message: 'Clan not found' })
  }

  // Check if user is a member
  const memberIndex = clan.members.findIndex((memberId) => memberId.equals(req.user._id))
  if (memberIndex === -1) {
    return res.status(400).json({ message: 'You are not a member of this clan' })
  }

  // Prevent creator from leaving if there are other members
  if (clan.creator && clan.creator.equals(req.user._id) && clan.members.length > 1) {
    return res.status(400).json({ message: 'Group creator cannot leave while there are other members. Transfer ownership first.' })
  }

  // Remove user from members
  clan.members.splice(memberIndex, 1)
  
  // If clan is now empty, delete it
  if (clan.members.length === 0) {
    await Clan.findByIdAndDelete(clanId)
    return res.json({ message: 'Left clan successfully. Clan was deleted as it had no members.' })
  }

  await clan.save()
  return res.json({ message: 'Left clan successfully' })
})

router.post('/:clanId/transfer-ownership', authMiddleware, async (req, res) => {
  const { clanId } = req.params
  const { newOwnerId } = req.body

  if (!newOwnerId) {
    return res.status(400).json({ message: 'New owner ID is required' })
  }

  const clan = await Clan.findById(clanId)
  if (!clan) {
    return res.status(404).json({ message: 'Clan not found' })
  }

  // Check if current user is the creator
  if (!clan.creator || !clan.creator.equals(req.user._id)) {
    return res.status(403).json({ message: 'Only the group creator can transfer ownership' })
  }

  // Check if new owner is a member
  const isMember = clan.members.some((memberId) => memberId.toString() === newOwnerId)
  if (!isMember) {
    return res.status(400).json({ message: 'New owner must be a member of the group' })
  }

  // Transfer ownership
  clan.creator = newOwnerId
  await clan.save()

  return res.json({ message: 'Ownership transferred successfully', newOwnerId })
})

module.exports = router
