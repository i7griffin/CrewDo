import { io } from 'socket.io-client'

let socket = null

export const connectSocket = (token) => {
  if (socket?.connected) return socket

  socket = io('/', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => console.log('🔌 Socket connected:', socket.id))
  socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason))
  socket.on('connect_error', (err) => console.error('Socket error:', err.message))

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => socket

// Helper to emit with optional ack
export const emit = (event, data) => {
  if (socket?.connected) socket.emit(event, data)
}

export const joinClanRoom = (clanId) => emit('join_clan', clanId)
export const leaveClanRoom = (clanId) => emit('leave_clan', clanId)
export const startActivity = (data) => emit('activity:started', data)