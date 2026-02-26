import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middlewares/auth.js'

const router = Router()
const prisma = new PrismaClient()

// All admin routes require admin role
router.use(authenticate, requireRole('admin'))

// GET /api/admin/stats
router.get('/stats', async (_req, res) => {
    try {
        const [totalOrders, totalUsers, openDisputes] = await Promise.all([
            prisma.order.count(),
            prisma.user.count({ where: { isBlocked: false } }),
            prisma.sealVerification.count({ where: { disputeRaised: true, resolvedByAdmin: false } }),
        ])
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const revenueToday = await prisma.order.aggregate({
            where: { createdAt: { gte: today }, paymentStatus: 'paid' },
            _sum: { totalAmount: true },
        })
        res.json({
            totalOrders,
            activeUsers: totalUsers,
            openDisputes,
            revenueToday: revenueToday._sum?.totalAmount ?? 0,
        })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/users
router.get('/users', async (_req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { role: { not: 'admin' } },
            select: { id: true, name: true, email: true, phone: true, role: true, isBlocked: true, isVerified: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        })
        res.json(users)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/restaurants
router.get('/restaurants', async (_req, res) => {
    try {
        const restaurants = await prisma.restaurant.findMany({
            include: { owner: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        })
        res.json(restaurants)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/admin/restaurants/:id/approve
router.patch('/restaurants/:id/approve', async (req, res) => {
    try {
        const { isApproved } = req.body
        const restaurant = await prisma.restaurant.update({
            where: { id: req.params.id },
            data: { isApproved },
        })
        res.json(restaurant)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/admin/users/:id — block/unblock
router.patch('/users/:id', async (req, res) => {
    try {
        const { isBlocked, isVerified } = req.body
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { ...(isBlocked !== undefined && { isBlocked }), ...(isVerified !== undefined && { isVerified }) },
            select: { id: true, name: true, isBlocked: true, isVerified: true },
        })
        res.json(user)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/promos
router.get('/promos', async (_req, res) => {
    try {
        const promos = await prisma.promoCode.findMany({
            where: { restaurantId: null },
            orderBy: { createdAt: 'desc' },
        })
        res.json(promos)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/admin/promos
router.post('/promos', async (req, res) => {
    try {
        const { code, discount, type, validTo, maxUses } = req.body
        const promo = await prisma.promoCode.create({
            data: {
                code: code.toUpperCase(),
                discount: parseFloat(discount),
                type: type || 'percentage',
                validTo: new Date(validTo),
                maxUses: maxUses ? parseInt(maxUses) : null,
                restaurantId: null, // Global promo
            },
        })
        res.status(201).json(promo)
    } catch (err) {
        if (err.code === 'P2002') return res.status(400).json({ message: 'Promo code already exists' })
        res.status(500).json({ message: err.message })
    }
})

// DELETE /api/admin/promos/:id
router.delete('/promos/:id', async (req, res) => {
    try {
        const existing = await prisma.promoCode.findFirst({ where: { id: req.params.id, restaurantId: null } })
        if (!existing) return res.status(404).json({ message: 'Promo not found' })
        await prisma.promoCode.delete({ where: { id: req.params.id } })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/orders
router.get('/orders', async (_req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                restaurant: { select: { name: true } },
                customer: { select: { name: true, phone: true } },
                deliveryPartner: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        })
        res.json(orders)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/disputes — open disputes
router.get('/disputes', async (_req, res) => {
    try {
        const disputes = await prisma.sealVerification.findMany({
            where: { disputeRaised: true, resolvedByAdmin: false },
            include: { order: { include: { customer: { select: { name: true } }, restaurant: { select: { name: true } } } } },
            orderBy: { createdAt: 'desc' },
        })
        res.json(disputes)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/admin/disputes/:orderId/resolve
router.patch('/disputes/:orderId/resolve', async (req, res) => {
    try {
        const { adminNotes, resolvedByAdmin } = req.body
        const record = await prisma.sealVerification.update({
            where: { orderId: req.params.orderId },
            data: { adminNotes, resolvedByAdmin: true },
        })
        res.json(record)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/seal-audits — all seal verification records
router.get('/seal-audits', async (_req, res) => {
    try {
        const records = await prisma.sealVerification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        })
        res.json(records)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

export default router
