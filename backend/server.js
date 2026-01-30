import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server } from 'socket.io'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skill-exchange', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err))

// Socket.io Setup
const onlineUsers = new Set()

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id)

  // User comes online
  socket.on('user:online', (userId) => {
    onlineUsers.add(userId)
    io.emit('user:online', { userId, status: 'online' })
  })

  // User goes offline
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    io.emit('user:offline', { userId: socket.id, status: 'offline' })
  })

  // Real-time search
  socket.on('search:query', (query) => {
    // Mock search results
    const results = [
      { id: 1, name: 'React', type: 'skill' },
      { id: 2, name: 'JavaScript', type: 'skill' },
      { id: 3, name: 'Web Development', type: 'skill' },
    ]
    socket.emit('search:results', results)
  })

  // New message
  socket.on('message:send', (data) => {
    io.emit('message:new', data)
  })

  // Typing indicator
  socket.on('message:typing', (data) => {
    socket.broadcast.emit('message:typing', data)
  })

  // Exchange request
  socket.on('exchange:request', (data) => {
    io.emit('exchange:request', data)
  })
})

// Routes
app.use('/api/auth', (req, res) => {
  // Auth routes will be implemented
  res.json({ message: 'Auth API' })
})

app.use('/api/users', (req, res) => {
  // User routes will be implemented
  res.json({ message: 'Users API' })
})

app.use('/api/skills', (req, res) => {
  // Skills routes will be implemented
  res.json({ message: 'Skills API' })
})

app.use('/api/messages', (req, res) => {
  // Messages routes will be implemented
  res.json({ message: 'Messages API' })
})

app.use('/api/exchanges', (req, res) => {
  // Exchange routes will be implemented
  res.json({ message: 'Exchanges API' })
})

app.use('/api/groups', (req, res) => {
  // Groups routes will be implemented
  res.json({ message: 'Groups API' })
})

app.use('/api/posts', (req, res) => {
  // Posts routes will be implemented
  res.json({ message: 'Posts API' })
})

app.use('/api/coins', (req, res) => {
  // Coins routes will be implemented
  res.json({ message: 'Coins API' })
})

app.use('/api/certificates', (req, res) => {
  // Certificates routes will be implemented
  res.json({ message: 'Certificates API' })
})

app.use('/api/notifications', (req, res) => {
  // Notifications routes will be implemented
  res.json({ message: 'Notifications API' })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  })
})

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { io, app }
