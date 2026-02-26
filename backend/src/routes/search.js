import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /api/search?q=...
// Returns { restaurants: [...], items: [...] }
router.get('/', async (req, res) => {
    try {
        const { q } = req.query
        if (!q || typeof q !== 'string') {
            return res.json({ restaurants: [], items: [] })
        }

        // Search for restaurants matching the query (name or cuisine)
        const restaurants = await prisma.restaurant.findMany({
            where: {
                isApproved: true,
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { cuisineType: { contains: q, mode: 'insensitive' } }
                ]
            },
            select: { id: true, name: true, cuisineType: true, rating: true, isOpen: true, imageUrl: true }
        })

        // Search for menu items matching the query, including their restaurant details
        const items = await prisma.menuItem.findMany({
            where: {
                name: { contains: q, mode: 'insensitive' },
                isAvailable: true,
                isArchived: false,
                restaurant: { isApproved: true }
            },
            include: {
                restaurant: {
                    select: { id: true, name: true, rating: true, isOpen: true, imageUrl: true }
                }
            }
        })

        res.json({ restaurants, items })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Search failed' })
    }
})

export default router
