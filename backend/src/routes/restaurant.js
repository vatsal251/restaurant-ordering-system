import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middlewares/auth.js'

const router = Router()
const prisma = new PrismaClient()

// Helper: get restaurant for authenticated owner
const getRestaurant = async (ownerId) => {
    const r = await prisma.restaurant.findUnique({ where: { ownerId } })
    if (!r) throw Object.assign(new Error('Restaurant not found'), { status: 404 })
    return r
}

// GET /api/restaurant/menu — get own restaurant's menu
router.get('/menu', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const restaurant = await getRestaurant(req.user.id)
        const items = await prisma.menuItem.findMany({
            where: { restaurantId: restaurant.id },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        })
        res.json(items)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// POST /api/restaurant/menu — add menu item
router.post('/menu', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const restaurant = await getRestaurant(req.user.id)
        const { name, description, price, category, isAvailable } = req.body
        if (!name || !price) return res.status(400).json({ message: 'Name and price are required' })
        const item = await prisma.menuItem.create({
            data: { restaurantId: restaurant.id, name, description, price: parseFloat(price), category, isAvailable: isAvailable ?? true }
        })
        res.status(201).json(item)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// PUT /api/restaurant/menu/:id — update menu item
router.put('/menu/:id', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const restaurant = await getRestaurant(req.user.id)
        const { name, description, price, category, isAvailable } = req.body
        // Verify item belongs to this restaurant
        const existing = await prisma.menuItem.findFirst({ where: { id: req.params.id, restaurantId: restaurant.id } })
        if (!existing) return res.status(404).json({ message: 'Item not found' })
        const item = await prisma.menuItem.update({
            where: { id: req.params.id },
            data: { name, description, price: parseFloat(price), category, isAvailable }
        })
        res.json(item)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// DELETE /api/restaurant/menu/:id — delete menu item
router.delete('/menu/:id', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const restaurant = await getRestaurant(req.user.id)
        const existing = await prisma.menuItem.findFirst({ where: { id: req.params.id, restaurantId: restaurant.id } })
        if (!existing) return res.status(404).json({ message: 'Item not found' })
        await prisma.menuItem.delete({ where: { id: req.params.id } })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
})

// GET /api/restaurant/profile — get restaurant profile
router.get('/profile', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { ownerId: req.user.id },
            include: { owner: { select: { name: true, email: true, phone: true } } }
        })
        res.json(restaurant)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/restaurant/profile — update restaurant info
router.patch('/profile', authenticate, requireRole('restaurant_owner'), async (req, res) => {
    try {
        const { name, address, cuisineType, isOpen } = req.body
        const restaurant = await prisma.restaurant.update({
            where: { ownerId: req.user.id },
            data: { name, address, cuisineType, isOpen }
        })
        res.json(restaurant)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

export default router
