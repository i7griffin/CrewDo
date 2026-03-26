const Clan = require('../models/Clan')
const Message = require('../models/Message')
const User = require('../models/User')
const { verifyToken } = require('../utils/auth')

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Missing socket token'))
      const payload = verifyToken(token)
      const user = await User.findById(payload.userId)
      if (!user) return next(new Error('Socket user not found'))
      socket.user = user
      return next()
    } catch {
      return next(new Error('Invalid socket token'))
    }
  })

  io.on('connection', async (socket) => {
    await User.findByIdAndUpdate(socket.user._id, { online: true, lastSeenAt: new Date() })
    io.emit('user:online', { userId: socket.user._id.toString(), online: true })

    socket.on('clan:join', ({ clanId }) => {
      if (clanId) socket.join(`clan:${clanId}`)
    })

    socket.on('progress:update', async ({ clanId }) => {
      if (!clanId) return

      const clan = await Clan.findById(clanId)
      if (!clan) return

      clan.dailyProgress = Math.min(100, clan.dailyProgress + 10)
      if (clan.dailyProgress >= 100) {
        clan.streak += 1
        clan.dailyProgress = 0
      }
      await clan.save()

      io.to(`clan:${clanId}`).emit('progress:update', {
        clanId,
        progress: clan.dailyProgress,
        streak: clan.streak,
      })
    })

    socket.on('chat:message', async (payload) => {
      if (!payload?.clanId || !payload?.text) return

      await Message.create({
        clan: payload.clanId,
        author: socket.user._id,
        text: payload.text,
      })

      io.to(`clan:${payload.clanId}`).emit('chat:message', {
        id: payload.id || String(Date.now()),
        author: socket.user.displayName,
        text: payload.text,
        clanId: payload.clanId,
      })
    })

    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(socket.user._id, { online: false, lastSeenAt: new Date() })
      io.emit('user:online', { userId: socket.user._id.toString(), online: false })
    })
  })
}

module.exports = setupSocket
