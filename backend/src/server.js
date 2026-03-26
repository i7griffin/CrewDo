const dotenv = require('dotenv')
dotenv.config()

const fs = require('fs')
const http = require('http')
const path = require('path')
const { Server } = require('socket.io')
const app = require('./app')
const connectDb = require('./config/db')
const setupSocket = require('./socket')

const start = async () => {
  await connectDb()

  const uploadsDir = path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const server = http.createServer(app)
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  })

  setupSocket(io)

  const port = Number(process.env.PORT || 5000)
  server.listen(port, () => {
    console.log(`CrewDo backend running on http://localhost:${port}`)
  })
}

start().catch((error) => {
  console.error('Failed to start backend:', error.message)
  process.exit(1)
})
