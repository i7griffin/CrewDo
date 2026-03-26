const jwt = require('jsonwebtoken')

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return jwt.verify(token, secret)
}

module.exports = { signToken, verifyToken }
