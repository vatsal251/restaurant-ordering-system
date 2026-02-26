import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middlewares/auth.js'

const router = Router()
const prisma = new PrismaClient()

// POST /api/surprise — Place a mood-based surprise meal order
router.post('/', authenticate, requireRole('customer'), async (req, res) => {
    try {
        const { mood, budget, deliveryAddress, phone } = req.body

        if (!mood || !budget || !deliveryAddress) {
            return res.status(400).json({ message: 'Mood, budget, and deliveryAddress are required.' })
        }

        const maxPrice = parseFloat(budget)

        // 1. Find all available menu items that match the mood and budget, from open restaurants
        // In a real AI implementation, we'd query an LLM to map 'mood' to tags.
        // Here we do a simple partial match on moodTags or category.
        const availableItems = await prisma.menuItem.findMany({
            where: {
                isAvailable: true,
                isArchived: false,
                price: { lte: maxPrice },
                restaurant: {
                    isOpen: true,
                    isApproved: true
                },
            },
            include: {
                restaurant: true
            }
        })

        if (!availableItems.length) {
            return res.status(404).json({ message: `No meals found for mood '${mood}' under ₹${maxPrice}.` })
        }

        // Filter items that loosely match the mood (or just pick a highly rated restaurant's item if random)
        let matchingItems = availableItems.filter(item =>
            item.moodTags.some(tag => tag.toLowerCase().includes(mood.toLowerCase())) ||
            item.category?.toLowerCase().includes(mood.toLowerCase()) ||
            item.name.toLowerCase().includes(mood.toLowerCase())
        )

        // If no strict match, fallback to any item under budget (Surprise factor!)
        if (!matchingItems.length) {
            matchingItems = availableItems
        }

        // 2. Select a random item
        const selectedItem = matchingItems[Math.floor(Math.random() * matchingItems.length)]
        const restaurant = selectedItem.restaurant

        // 3. Place the order
        const order = await prisma.order.create({
            data: {
                customerId: req.user.id,
                restaurantId: restaurant.id,
                deliveryAddress,
                totalAmount: selectedItem.price,
                paymentStatus: 'pending', // Could be COD
                status: 'placed',
                orderItems: {
                    create: [{
                        menuItemId: selectedItem.id,
                        quantity: 1,
                        unitPrice: selectedItem.price,
                    }],
                },
            },
            include: {
                orderItems: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
                restaurant: { select: { name: true } },
            },
        })

        // Create SealVerification placeholder
        await prisma.sealVerification.create({ data: { orderId: order.id } })

        // Notify restaurant
        req.io?.emit('NEW_ORDER', { orderId: order.id, restaurantId: restaurant.id })

        res.status(201).json({
            message: 'Surprise meal ordered successfully!',
            order,
            surpriseItem: selectedItem
        })
    } catch (err) {
        console.error('Surprise order error:', err)
        res.status(500).json({ message: 'Failed to place surprise order' })
    }
})

export default router
