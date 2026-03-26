const bcrypt = require('bcryptjs')
const express = require('express')
const User = require('../models/User')
const Clan = require('../models/Clan')
const { signToken } = require('../utils/auth')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/signup', async (req, res) => {
  try {
    const { username, password, displayName } = req.body
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const normalized = String(username).trim().toLowerCase()
    const existing = await User.findOne({ username: normalized })
    if (existing) {
      return res.status(409).json({ message: 'Username already taken' })
    }

    const safeDisplayName = String(displayName || username).trim()
    const passwordHash = await bcrypt.hash(String(password), 10)
    const user = await User.create({
      username: normalized,
      displayName: safeDisplayName,
      passwordHash,
    })

    // Add user to all default groups
    const defaultClans = await Clan.find({ isDefault: true })
    for (const clan of defaultClans) {
      if (!clan.members.includes(user._id)) {
        clan.members.push(user._id)
        await clan.save()
      }
    }

    const token = signToken(user._id.toString())
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.displayName,
        username: user.username,
        avatar: user.avatar || '',
        points: user.points,
      },
    })
  } catch (err) {
    console.error('[signup]', err)
    return res.status(500).json({ message: 'Server error during signup. Please try again.' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

    const normalized = String(username).trim().toLowerCase()

    const user = await User.findOne({ username: normalized })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken(user._id.toString())
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.displayName,
        username: user.username,
        avatar: user.avatar || '',
        points: user.points,
      },
    })
  } catch (err) {
    console.error('[login]', err)
    return res.status(500).json({ message: 'Server error during login. Please try again.' })
  }
})

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      online: false,
      lastSeenAt: new Date(),
    })
    return res.json({ message: 'Logged out successfully' })
  } catch (err) {
    console.error('[logout]', err)
    // Return success even if database update fails (fail-safe approach)
    return res.json({ message: 'Logged out successfully' })
  }
})

router.put('/profile/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body
    
    if (!avatar || typeof avatar !== 'string') {
      return res.status(400).json({ message: 'Avatar emoji is required' })
    }

    // Simple validation: check if it's a reasonable length (emojis are typically 1-4 characters)
    if (avatar.length > 10) {
      return res.status(400).json({ message: 'Avatar must be a valid emoji' })
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatar.trim() },
      { new: true }
    )

    return res.json({
      user: {
        id: user._id,
        name: user.displayName,
        username: user.username,
        avatar: user.avatar,
        points: user.points,
      },
    })
  } catch (err) {
    console.error('[update avatar]', err)
    return res.status(500).json({ message: 'Failed to update avatar' })
  }
})

module.exports = router
