import express from 'express'
import cors from 'cors'

import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import marketplaceRoutes from './routes/marketplaceRoutes.js'

const app = express()

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://freelance-hub-sooty-three.vercel.app'
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/v1/auth', authRoutes)

app.use('/api/v1/admin', adminRoutes)

// API Health check endpoint stays public.
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'FreelanceHub Server Scaffold Active',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/v1', marketplaceRoutes)

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack)

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

export default app