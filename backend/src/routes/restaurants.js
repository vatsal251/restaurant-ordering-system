import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middlewares/auth.js'

const router = Router()
const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────────
// PROTECTED ROUTES — /api/restaurants/me/...
// MUST be declared BEFORE the /:id routes to avoid Express treating
// the literal string "me" as a restaurant ID parameter.
// ─────────────────────────────────────────────────────────────────

// Helper: get restaurant for authenticated owner, with helpful error
const getOwnerRestaurant = async (ownerId) => {
    const r = await prisma.restaurant.findUnique({ where: { ownerId } })
    if (!r) throw Object.assign(
        new Error('Restaurant profile not found for your account.'), { status: 404 }
    )
    return r
}

// GET /api/restaurants/me/menu
router.get('/me/menu', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const items = await prisma.menuItem.findMany({
            where: { restaurantId: r.id },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        })
        res.json(items)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// POST /api/restaurants/me/menu
router.post('/me/menu', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const { name, description, price, category, isAvailable } = req.body
        if (!name || !price) return res.status(400).json({ message: 'Name and price are required' })
        const item = await prisma.menuItem.create({
            data: {
                restaurantId: r.id,
                name,
                description,
                price: parseFloat(price),
                category: category || null,
                isAvailable: isAvailable ?? true
            }
        })
        res.status(201).json(item)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// PUT /api/restaurants/me/menu/:itemId
router.put('/me/menu/:itemId', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const { name, description, price, category, isAvailable } = req.body
        const existing = await prisma.menuItem.findFirst({ where: { id: req.params.itemId, restaurantId: r.id } })
        if (!existing) return res.status(404).json({ message: 'Item not found' })
        const item = await prisma.menuItem.update({
            where: { id: req.params.itemId },
            data: { name, description, price: parseFloat(price), category: category || null, isAvailable }
        })
        res.json(item)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// DELETE /api/restaurants/me/menu/:itemId
router.delete('/me/menu/:itemId', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const existing = await prisma.menuItem.findFirst({ where: { id: req.params.itemId, restaurantId: r.id } })
        if (!existing) return res.status(404).json({ message: 'Item not found' })
        await prisma.menuItem.delete({ where: { id: req.params.itemId } })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// GET /api/restaurants/me/profile
router.get('/me/profile', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await prisma.restaurant.findUnique({
            where: { ownerId: req.user.id },
            include: { owner: { select: { name: true, email: true, phone: true } } }
        })
        res.json(r)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/restaurants/me/profile
router.patch('/me/profile', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const { name, address, cuisineType, isOpen } = req.body
        const r = await prisma.restaurant.update({
            where: { ownerId: req.user.id },
            data: { name, address, cuisineType, isOpen }
        })
        res.json(r)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/restaurants/me/orders
router.get('/me/orders', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const orders = await prisma.order.findMany({
            where: { restaurantId: r.id },
            include: {
                customer: { select: { name: true, phone: true } },
                orderItems: { include: { menuItem: { select: { name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(orders)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// ─────────────────────────────────────────────────────────────────
// PUBLIC ROUTES — /api/restaurants/:id and /api/restaurants
// These come AFTER the /me/ routes so :id doesn't capture "me"
// ─────────────────────────────────────────────────────────────────

// GET /api/restaurants
router.get('/', async (req, res) => {
    try {
        const { cuisine, search } = req.query
        const restaurants = await prisma.restaurant.findMany({
            where: {
                ...(cuisine && cuisine !== 'All' && { cuisineType: cuisine }),
                ...(search && { name: { contains: search, mode: 'insensitive' } }),
            },
            select: { id: true, name: true, cuisineType: true, rating: true, isOpen: true, imageUrl: true, address: true }
        })
        res.json(restaurants)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/restaurants/:id
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: req.params.id },
            select: { id: true, name: true, cuisineType: true, rating: true, isOpen: true, imageUrl: true, address: true }
        })
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' })
        res.json(restaurant)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/restaurants/:id/menu (public menu for customers)
router.get('/:id/menu', async (req, res) => {
    try {
        const items = await prisma.menuItem.findMany({
            where: { restaurantId: req.params.id, isAvailable: true },
            orderBy: [{ category: 'asc' }, { name: 'asc' }]
        })
        res.json(items)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

export default router
