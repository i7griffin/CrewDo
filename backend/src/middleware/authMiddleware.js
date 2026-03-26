const User = require('../models/User')
const { verifyToken } = require('../utils/auth')

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const payload = verifyToken(token)
    const user = await User.findById(payload.userId)
    if (!user) {
      return res.status(401).json({ message: 'Invalid token user' })
    }

    req.user = user
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

module.exports = authMiddleware
