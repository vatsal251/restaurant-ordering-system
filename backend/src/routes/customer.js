import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middlewares/auth.js'

const router = Router()
const prisma = new PrismaClient()

// PUT /api/customer/profile
router.put('/profile', authenticate, requireRole('customer'), async (req, res) => {
    try {
        const { name, phone } = req.body
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { name, phone }
        })
        const safeUser = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
        res.json(safeUser)
    } catch (err) {
        res.status(500).json({ message: 'Failed to update profile' })
    }
})

// GET /api/customer/favorites
router.get('/favorites', authenticate, requireRole('customer'), async (req, res) => {
    try {
        const favorites = await prisma.favorite.findMany({
            where: { userId: req.user.id },
            include: {
                restaurant: {
                    select: { id: true, name: true, cuisineType: true, rating: true, isOpen: true, imageUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(favorites)
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch favorites' })
    }
})

// POST /api/customer/favorites
router.post('/favorites', authenticate, requireRole('customer'), async (req, res) => {
    try {
        const { restaurantId } = req.body
        const fav = await prisma.favorite.create({
            data: { userId: req.user.id, restaurantId }
        })
        res.status(201).json(fav)
    } catch (err) {
        if (err.code === 'P2002') return res.status(400).json({ message: 'Already favorited' })
        res.status(500).json({ message: 'Failed to add favorite' })
    }
})

// DELETE /api/customer/favorites/:restaurantId
router.delete('/favorites/:restaurantId', authenticate, requireRole('customer'), async (req, res) => {
    try {
        await prisma.favorite.delete({
            where: {
                userId_restaurantId: {
                    userId: req.user.id,
                    restaurantId: req.params.restaurantId
                }
            }
        })
        res.json({ message: 'Removed from favorites' })
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove favorite' })
    }
})

export default router
