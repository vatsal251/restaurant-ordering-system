import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { authenticate, requireRole } from '../middlewares/auth.js'

const router = Router()
const prisma = new PrismaClient()

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// POST /api/orders — Place a new order
router.post('/', authenticate, requireRole('customer'), async (req, res) => {
    try {
        const { restaurantId, deliveryAddress, phone, instructions, items, totalAmount, paymentMethod } = req.body

        // Create order in DB
        const order = await prisma.order.create({
            data: {
                customerId: req.user.id,
                restaurantId,
                deliveryAddress,
                totalAmount,
                paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
                status: 'placed',
                orderItems: {
                    create: items.map(i => ({
                        menuItemId: i.menuItemId,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                    })),
                },
            },
            include: { orderItems: true },
        })

        // Create SealVerification record placeholder
        await prisma.sealVerification.create({ data: { orderId: order.id } })

        let razorpayOrder = null
        if (paymentMethod !== 'cod') {
            razorpayOrder = await razorpay.orders.create({
                amount: Math.round(totalAmount * 100), // paise
                currency: 'INR',
                receipt: order.id,
            })
            // Create payment record
            await prisma.payment.create({
                data: { orderId: order.id, amount: totalAmount, status: 'pending', razorpayPaymentId: razorpayOrder.id }
            })
        }

        // Notify restaurant via socket
        req.io?.to(`restaurant:${restaurantId}`).emit('NEW_ORDER', { orderId: order.id })

        res.status(201).json({ order, razorpayOrder })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Failed to place order' })
    }
})

// POST /api/orders/verify-payment — Verify Razorpay signature
router.post('/verify-payment', authenticate, async (req, res) => {
    try {
        const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`)
        const digest = hmac.digest('hex')

        if (digest !== razorpaySignature) {
            return res.status(400).json({ message: 'Payment verification failed' })
        }

        await prisma.payment.update({
            where: { orderId },
            data: { status: 'paid', razorpayPaymentId },
        })
        await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'paid' },
        })
        res.json({ message: 'Payment verified', orderId })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/orders — My orders (customer)
router.get('/', authenticate, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { customerId: req.user.id },
            include: {
                restaurant: { select: { name: true } },
                orderItems: { include: { menuItem: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        })
        res.json(orders)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/orders/:id — Single order detail
router.get('/:id', authenticate, async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                restaurant: { select: { name: true, address: true, phone: true } },
                orderItems: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
                deliveryPartner: { select: { name: true, phone: true } },
                sealVerification: true,
                payment: true,
            },
        })
        if (!order) return res.status(404).json({ message: 'Order not found' })
        res.json(order)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// PATCH /api/orders/:id/status — Update order status (restaurant/delivery)
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { status } = req.body
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status },
        })
        // Broadcast to customer
        req.io?.to(`order:${order.id}`).emit('ORDER_STATUS_UPDATE', { orderId: order.id, status })
        res.json(order)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/orders/restaurant/pending — Pending orders for a restaurant
router.get('/restaurant/pending', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user.id } })
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' })
        const orders = await prisma.order.findMany({
            where: { restaurantId: restaurant.id, status: { in: ['placed', 'confirmed', 'preparing'] } },
            include: {
                customer: { select: { name: true, phone: true } },
                orderItems: { include: { menuItem: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'asc' },
        })
        res.json(orders)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/orders/delivery/available — Orders ready for pickup (for delivery partners)
router.get('/delivery/available', authenticate, requireRole('delivery_partner'), async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { status: 'ready_for_pickup', deliveryPartnerId: null },
            include: {
                restaurant: { select: { name: true, address: true } },
                customer: { select: { name: true, phone: true } },
            },
            orderBy: { createdAt: 'asc' },
        })
        res.json(orders)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/orders/:id/assign-delivery — Delivery partner accepts an order
router.post('/:id/assign-delivery', authenticate, requireRole('delivery_partner'), async (req, res) => {
    try {
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { deliveryPartnerId: req.user.id, status: 'picked_up' },
        })
        req.io?.to(`order:${order.id}`).emit('ORDER_STATUS_UPDATE', { orderId: order.id, status: 'picked_up' })
        res.json(order)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

export default router
