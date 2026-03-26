const cors = require('cors')
const express = require('express')
const path = require('path')
const authRoutes = require('./routes/authRoutes')
const clanRoutes = require('./routes/clanRoutes')
const proofRoutes = require('./routes/proofRoutes')

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/clans', clanRoutes)
app.use('/api/proof', proofRoutes)

app.use((err, req, res, next) => {
  // Minimal centralized error response for MVP.
  if (!res.headersSent) {
    res.status(500).json({ message: err.message || 'Internal server error' })
  } else {
    next(err)
  }
})

module.exports = app
