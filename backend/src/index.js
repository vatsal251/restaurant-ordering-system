import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'
import 'dotenv/config'

import authRoutes from './routes/auth.js'
import restaurantRoutes from './routes/restaurants.js'
import orderRoutes from './routes/orders.js'
import deliveryRoutes from './routes/delivery.js'
import adminRoutes from './routes/admin.js'
import sealRoutes from './routes/seal.js'
import { setupSocketHandlers } from './sockets/index.js'

const app = express()
const httpServer = createServer(app)

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:5173', // customer
            'http://localhost:5174', // delivery
            'http://localhost:5175', // restaurant
            'http://localhost:5176', // admin
        ],
        methods: ['GET', 'POST'],
    },
})

// Middleware
app.use(helmet())
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
    ],
    credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Make io accessible to routes
app.use((req, _res, next) => { req.io = io; next() })

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/delivery', deliveryRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/seal', sealRoutes)

// Socket handlers
setupSocketHandlers(io)

// 404 handler
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }))

// Error handler
app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
    console.log(`🚀 FoodRush API running on http://localhost:${PORT}`)
})
