import prisma from '../../core/db/prisma.js'
import { getAIRecommendations } from '../../core/services/ai.service.js'

export const askAssistant = async (req, res) => {
    try {
        const { query, budget } = req.body
        if (!query) return res.status(400).json({ message: 'A natural language query is required.' })

        const maxPrice = budget ? parseFloat(budget) : 5000

        const availableItems = await prisma.menuItem.findMany({
            where: {
                isAvailable: true,
                isArchived: false,
                price: { lte: maxPrice },
                restaurant: { isOpen: true, isApproved: true },
            },
            include: {
                restaurant: { select: { id: true, name: true, deliveryFee: true, estimatedDeliveryTime: true } }
            },
            take: 50
        })

        if (!availableItems.length) return res.status(404).json({ message: `No meals found currently open and under ₹${maxPrice}.` })

        const recommendations = await getAIRecommendations(query, availableItems)
        res.status(200).json({ message: 'Recommendations generated successfully.', recommendations })
    } catch (err) { res.status(500).json({ message: 'Failed to process AI request. Our AI might be taking a coffee break.' }) }
}
