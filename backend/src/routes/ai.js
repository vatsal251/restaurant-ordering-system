import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middlewares/auth.js'
import { getAIRecommendations } from '../services/ai.service.js'

const router = Router()
const prisma = new PrismaClient()

// POST /api/ai/assistant — Ask the AI for meal recommendations
router.post('/assistant', authenticate, requireRole('customer'), async (req, res) => {
    try {
        const { query, budget } = req.body

        if (!query) {
            return res.status(400).json({ message: 'A natural language query is required.' })
        }

        const maxPrice = budget ? parseFloat(budget) : 5000 // Default high if no budget

        // 1. Fetch available pool of menu items
        // We only want items from approved, open restaurants that fit the gross budget.
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
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        deliveryFee: true,
                        estimatedDeliveryTime: true
                    }
                }
            },
            // Limit to a reasonable number so we don't blow up the LLM context window
            take: 50
        });

        if (!availableItems.length) {
            return res.status(404).json({ message: `No meals found currently open and under ₹${maxPrice}.` })
        }

        // 2. Pass to AI Service
        // The AI will parse the top 50 available items, match against the user's string,
        // pick the best 3, and inject macro estimations.
        const recommendations = await getAIRecommendations(query, availableItems);

        res.status(200).json({
            message: 'Recommendations generated successfully.',
            recommendations
        })

    } catch (err) {
        console.error('AI Assistant Error:', err)
        res.status(500).json({ message: 'Failed to process AI request. Our AI might be taking a coffee break.' })
    }
})

export default router
