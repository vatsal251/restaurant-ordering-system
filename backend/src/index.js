import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'
import rateLimit from 'express-rate-limit'
import 'dotenv/config'

import authRoutes from './modules/auth/auth.routes.js'
import customerRoutes from './modules/users/users.routes.js'
import restaurantRoutes from './modules/restaurants/restaurants.routes.js'
import deliveryRoutes from './modules/delivery/delivery.routes.js'
import adminRoutes from './modules/admin/admin.routes.js'
import orderRoutes from './modules/orders/orders.routes.js'
import sealRoutes from './modules/seal/seal.routes.js'
import searchRoutes from './modules/search/search.routes.js'
import surpriseRoutes from './modules/surprise/surprise.routes.js'
import addressRoutes from './modules/addresses/addresses.routes.js'
import uploadRoutes from './modules/upload/upload.routes.js'
import aiRoutes from './modules/ai/ai.routes.js'
import groupOrderRoutes from './modules/groupOrder/groupOrder.routes.js'
import { setupSocketHandlers } from './sockets/index.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}))
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

// Enable trust proxy if deploying behind a reverse proxy (Heroku, AWS ELB, Nginx)
app.set('trust proxy', 1)

// Rate Limiting (Prevent DDoS/Brute Force on API endpoints)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 150, // Limit each IP to 150 requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: 'Too many requests originating from this IP, please try again after 15 minutes' }
})

app.use('/api', apiLimiter)

// Make io accessible to routes
app.use((req, _res, next) => { req.io = io; next() })

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/delivery', deliveryRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/seal', sealRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/surprise', surpriseRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/group-orders', groupOrderRoutes)

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

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

// trigger restart
