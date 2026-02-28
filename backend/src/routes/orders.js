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

// ─────────────────────────────────────────────────────────────────
// NAMED ROUTES — must come BEFORE /:id to avoid param capture
// ─────────────────────────────────────────────────────────────────

// GET /api/orders/restaurant/pending — Pending orders for a restaurant owner
router.get('/restaurant/pending', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user.id } })
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' })
        const orders = await prisma.order.findMany({
            where: {
                restaurantId: restaurant.id,
                status: { notIn: ['delivered', 'cancelled'] }
            },
            include: {
                customer: { select: { name: true, phone: true } },
                orderItems: { include: { menuItem: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'asc' },
        })
        res.json(orders)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/orders/restaurant/all — All orders for a restaurant owner (analytics etc)
router.get('/restaurant/all', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user.id } })
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' })
        const orders = await prisma.order.findMany({
            where: { restaurantId: restaurant.id },
            include: {
                customer: { select: { name: true, phone: true } },
                orderItems: { include: { menuItem: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
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
                orderItems: { include: { menuItem: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'asc' },
        })
        res.json(orders)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
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

        const ids = Array.isArray(orderId) ? orderId : [orderId]

        for (const id of ids) {
            await prisma.payment.updateMany({
                where: { orderId: id },
                data: { status: 'paid', razorpayPaymentId },
            })
            await prisma.order.update({
                where: { id: id },
                data: { paymentStatus: 'paid' },
            })
        }
        res.json({ message: 'Payment verified', orderIds: ids })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// ─────────────────────────────────────────────────────────────────
// MAIN CRUD ROUTES
// ─────────────────────────────────────────────────────────────────

// POST /api/orders/validate-promo — Validate a discount code
router.post('/validate-promo', authenticate, async (req, res) => {
    try {
        const { code, restaurantId } = req.body
        const promo = await prisma.promoCode.findFirst({
            where: {
                code: code.toUpperCase(),
                isActive: true,
                validTo: { gte: new Date() },
                OR: [{ restaurantId: null }, { restaurantId }]
            }
        })
        if (!promo) return res.status(404).json({ message: 'Invalid or expired promo code' })
        if (promo.maxUses && promo.usedCount >= promo.maxUses) {
            return res.status(400).json({ message: 'Promo code usage limit reached' })
        }
        res.json(promo)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/orders — Place a new order
router.post('/', authenticate, requireRole('customer'), async (req, res) => {
    try {
        const { deliveryAddress, phone, instructions, items, totalAmount, paymentMethod, tipAmount, cookingInstructions, deliveryInstructions, promoCodeId } = req.body

        if (!deliveryAddress || !items?.length) {
            return res.status(400).json({ message: 'deliveryAddress and items are required' })
        }

        // Group items by restaurant
        const itemsByRestaurant = {}
        for (const i of items) {
            if (!itemsByRestaurant[i.restaurantId]) itemsByRestaurant[i.restaurantId] = []
            itemsByRestaurant[i.restaurantId].push(i)
        }

        const numRestaurants = Object.keys(itemsByRestaurant).length
        const createdOrders = []

        const combinedSubtotal = items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0)
        const extraFees = totalAmount - combinedSubtotal
        let isFirstOrder = true

        // Create an order for each restaurant
        for (const [rId, rItems] of Object.entries(itemsByRestaurant)) {
            const rSubtotal = rItems.reduce((s, i) => s + (i.unitPrice * i.quantity), 0)
            const rTotal = isFirstOrder ? rSubtotal + extraFees : rSubtotal
            isFirstOrder = false

            const order = await prisma.order.create({
                data: {
                    customerId: req.user.id,
                    restaurantId: rId,
                    deliveryAddress,
                    totalAmount: rTotal,
                    tipAmount: tipAmount ? parseFloat(tipAmount) / numRestaurants : 0.0,
                    cookingInstructions,
                    deliveryInstructions: deliveryInstructions || instructions,
                    promoCodeId,
                    paymentStatus: 'pending',
                    status: 'placed',
                    orderItems: {
                        create: rItems.map(i => ({
                            menuItemId: i.menuItemId,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                        })),
                    },
                },
                include: {
                    orderItems: { include: { menuItem: { select: { name: true } } } },
                    restaurant: { select: { name: true } },
                },
            })

            await prisma.sealVerification.create({ data: { orderId: order.id } })
            createdOrders.push(order)
            req.io?.emit('NEW_ORDER', { orderId: order.id, restaurantId: rId })
        }

        // Increment promo code usage if applicable
        if (promoCodeId) {
            await prisma.promoCode.update({
                where: { id: promoCodeId },
                data: { usedCount: { increment: 1 } },
            }).catch(e => console.error('Failed to update promo code uses:', e))
        }

        let razorpayOrder = null
        if (paymentMethod !== 'cod') {
            razorpayOrder = await razorpay.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                receipt: createdOrders[0].id,
            })
            for (const o of createdOrders) {
                await prisma.payment.create({
                    data: { orderId: o.id, amount: o.totalAmount, status: 'pending', razorpayPaymentId: razorpayOrder.id }
                })
            }
        }

        res.status(201).json({ orders: createdOrders, razorpayOrder })
    } catch (err) {
        console.error('Order creation error:', err)
        res.status(500).json({ message: err.message || 'Failed to place order' })
    }
})

// GET /api/orders — My orders (customer view, or all orders for admin/delivery)
router.get('/', authenticate, async (req, res) => {
    try {
        const where = req.user.role === 'customer'
            ? { customerId: req.user.id }
            : req.user.role === 'delivery_partner'
                ? {} // delivery can see all for dashboard
                : { customerId: req.user.id }

        const orders = await prisma.order.findMany({
            where,
            include: {
                restaurant: { select: { name: true, address: true } },
                customer: { select: { name: true, phone: true } },
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
                restaurant: { select: { name: true, address: true } },
                customer: { select: { name: true, phone: true } },
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

// PATCH /api/orders/:id/status — Update order status
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { status } = req.body
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status },
        })

        // Add earnings if it's delivered
        if (status === 'delivered' && order.deliveryPartnerId) {
            const earningsToAdd = 50 + (order.tipAmount || 0); // Flat fee 50 + tip
            await prisma.user.update({
                where: { id: order.deliveryPartnerId },
                data: { earnings: { increment: earningsToAdd } }
            }).catch(e => console.error('Failed to update earnings:', e))
        }

        req.io?.emit('ORDER_STATUS_UPDATE', { orderId: order.id, status })
        req.io?.to(`order:${order.id}`).emit('ORDER_STATUS_UPDATE', { orderId: order.id, status })
        res.json(order)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/orders/:id/cancel — Customer cancels an order before confirmation
router.post('/:id/cancel', authenticate, async (req, res) => {
    try {
        const order = await prisma.order.findUnique({ where: { id: req.params.id } })

        if (!order) return res.status(404).json({ message: 'Order not found' })
        if (order.customerId !== req.user.id) return res.status(403).json({ message: 'Unauthorized' })
        if (order.status !== 'placed') return res.status(400).json({ message: 'Order cannot be cancelled at this stage' })

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: { status: 'cancelled' }
        })

        req.io?.emit('ORDER_STATUS_UPDATE', { orderId: order.id, status: 'cancelled' })
        req.io?.to(`order:${order.id}`).emit('ORDER_STATUS_UPDATE', { orderId: order.id, status: 'cancelled' })

        res.json({ message: 'Order cancelled successfully', order: updatedOrder })
    } catch (err) {
        console.error('Cancel order error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/orders/:id/assign-delivery — Delivery partner accepts an order
router.post('/:id/assign-delivery', authenticate, requireRole('delivery_partner'), async (req, res) => {
    try {
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: {
                deliveryPartnerId: req.user.id,
                status: 'picked_up'  // delivery partner has picked up the order
            },
            include: {
                restaurant: { select: { name: true, address: true } },
                customer: { select: { name: true, phone: true } },
            }
        })
        req.io?.emit('ORDER_STATUS_UPDATE', { orderId: order.id, status: 'picked_up' })
        req.io?.to(`order:${order.id}`).emit('ORDER_STATUS_UPDATE', { orderId: order.id, status: 'picked_up' })
        res.json(order)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/orders/:id/review — Submit a rating and review for an order
router.post('/:id/review', authenticate, async (req, res) => {
    try {
        const { rating, review: comment } = req.body
        const orderId = req.params.id
        const order = await prisma.order.findUnique({ where: { id: orderId } })

        if (!order) return res.status(404).json({ message: 'Order not found' })

        // Ensure no duplicate review
        const existing = await prisma.review.findFirst({ where: { orderId } })
        if (existing) return res.status(400).json({ message: 'Review already submitted' })

        await prisma.review.create({
            data: {
                userId: req.user.id,
                restaurantId: order.restaurantId,
                orderId: order.id,
                rating: Number(rating),
                comment: comment || null
            }
        })

        // Update restaurant average rating
        const allReviews = await prisma.review.findMany({ where: { restaurantId: order.restaurantId } })
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

        await prisma.restaurant.update({
            where: { id: order.restaurantId },
            data: { rating: Number(avg.toFixed(1)) }
        })

        res.json({ message: 'Review submitted successfully' })
    } catch (err) {
        console.error('Review error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

export default router
