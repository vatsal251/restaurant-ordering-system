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
            where: { restaurantId: r.id, isArchived: false },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        })
        res.json(items)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// POST /api/restaurants/me/menu
router.post('/me/menu', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const { name, description, price, category, isAvailable, isVeg, imageUrl } = req.body
        if (!name || !price) return res.status(400).json({ message: 'Name and price are required' })
        const item = await prisma.menuItem.create({
            data: {
                restaurantId: r.id,
                name,
                description,
                price: parseFloat(price),
                category: category || null,
                isAvailable: isAvailable ?? true,
                isVeg: isVeg ?? true,
                imageUrl
            }
        })
        res.status(201).json(item)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// PUT /api/restaurants/me/menu/:itemId
router.put('/me/menu/:itemId', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const { name, description, price, category, isAvailable, isVeg, imageUrl } = req.body
        const existing = await prisma.menuItem.findFirst({ where: { id: req.params.itemId, restaurantId: r.id, isArchived: false } })
        if (!existing) return res.status(404).json({ message: 'Item not found' })
        const item = await prisma.menuItem.update({
            where: { id: req.params.itemId },
            data: { name, description, price: parseFloat(price), category: category || null, isAvailable, isVeg, imageUrl }
        })
        res.json(item)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// DELETE /api/restaurants/me/menu/:itemId
router.delete('/me/menu/:itemId', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const existing = await prisma.menuItem.findFirst({ where: { id: req.params.itemId, restaurantId: r.id, isArchived: false } })
        if (!existing) return res.status(404).json({ message: 'Item not found' })
        await prisma.menuItem.delete({ where: { id: req.params.itemId } })
        res.json({ message: 'Deleted' })
    } catch (err) {
        if (err.code === 'P2003') {
            // Soft delete
            await prisma.menuItem.update({
                where: { id: req.params.itemId },
                data: { isArchived: true, isAvailable: false }
            })
            return res.json({ message: 'Item archived because it has past orders.' })
        }
        res.status(err.status || 500).json({ message: err.message })
    }
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
        const { name, address, cuisineType, isOpen, costForTwo, deliveryTime, isVegOnly, fssaiLicense, imageUrl } = req.body
        const r = await prisma.restaurant.update({
            where: { ownerId: req.user.id },
            data: {
                name, address, cuisineType, isOpen, imageUrl,
                costForTwo: costForTwo ? parseInt(costForTwo) : undefined,
                deliveryTime: deliveryTime ? parseInt(deliveryTime) : undefined,
                isVegOnly: isVegOnly !== undefined ? isVegOnly : undefined,
                fssaiLicense
            }
        })
        res.json(r)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/restaurants/me/analytics
router.get('/me/analytics', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)

        const totalOrders = await prisma.order.count({ where: { restaurantId: r.id } })
        const revenueAgg = await prisma.order.aggregate({
            where: { restaurantId: r.id, status: 'delivered' },
            _sum: { totalAmount: true }
        })
        const totalRevenue = revenueAgg._sum.totalAmount || 0

        res.json({ totalOrders, totalRevenue })
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// GET /api/restaurants/me/promos
router.get('/me/promos', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const promos = await prisma.promoCode.findMany({ where: { restaurantId: r.id }, orderBy: { createdAt: 'desc' } })
        res.json(promos)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// GET /api/restaurants/me/reviews
router.get('/me/reviews', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const reviews = await prisma.review.findMany({
            where: { restaurantId: r.id },
            include: {
                customer: { select: { name: true } },
                order: { select: { id: true, createdAt: true, totalAmount: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(reviews)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// POST /api/restaurants/me/promos
router.post('/me/promos', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const { code, discount, type, validTo, maxUses } = req.body
        const promo = await prisma.promoCode.create({
            data: {
                code: code.toUpperCase(),
                discount: parseFloat(discount),
                type: type || 'percentage',
                validTo: new Date(validTo),
                maxUses: maxUses ? parseInt(maxUses) : null,
                restaurantId: r.id
            }
        })
        res.status(201).json(promo)
    } catch (err) {
        if (err.code === 'P2002') return res.status(400).json({ message: 'Promo code already exists' })
        res.status(err.status || 500).json({ message: err.message })
    }
})

// DELETE /api/restaurants/me/promos/:id
router.delete('/me/promos/:id', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const existing = await prisma.promoCode.findFirst({ where: { id: req.params.id, restaurantId: r.id } })
        if (!existing) return res.status(404).json({ message: 'Promo not found' })
        await prisma.promoCode.delete({ where: { id: req.params.id } })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
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
        const { cuisine, search, filterVeg, minRating, sort } = req.query

        let orderByList = []
        if (sort === 'rating') orderByList.push({ rating: 'desc' })
        else if (sort === 'price_asc') orderByList.push({ costForTwo: 'asc' })
        else if (sort === 'price_desc') orderByList.push({ costForTwo: 'desc' })
        else orderByList.push({ isPromoted: 'desc' }) // Default: Promoted on top

        const restaurants = await prisma.restaurant.findMany({
            where: {
                isApproved: true,
                ...(cuisine && cuisine !== 'All' && { cuisineType: cuisine }),
                ...(search && { name: { contains: search, mode: 'insensitive' } }),
                ...(filterVeg === 'true' && { isVegOnly: true }),
                ...(minRating && { rating: { gte: parseFloat(minRating) } }),
            },
            select: {
                id: true, name: true, cuisineType: true, rating: true, isOpen: true, imageUrl: true, address: true,
                isPromoted: true, costForTwo: true, deliveryTime: true, isVegOnly: true, fssaiLicense: true
            },
            orderBy: orderByList.length ? orderByList : undefined
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
            select: {
                id: true, name: true, cuisineType: true, rating: true, isOpen: true, isApproved: true, imageUrl: true, address: true,
                isPromoted: true, costForTwo: true, deliveryTime: true, isVegOnly: true, fssaiLicense: true,
                reviews: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true, rating: true, comment: true, createdAt: true,
                        customer: { select: { name: true } }
                    }
                }
            }
        })
        if (!restaurant || !restaurant.isApproved) return res.status(404).json({ message: 'Restaurant not found or is suspended' })
        res.json(restaurant)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/restaurants/:id/menu (public menu for customers)
router.get('/:id/menu', async (req, res) => {
    try {
        const items = await prisma.menuItem.findMany({
            where: { restaurantId: req.params.id, isAvailable: true, isArchived: false },
            orderBy: [{ category: 'asc' }, { name: 'asc' }]
        })
        res.json(items)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

export default router
