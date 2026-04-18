import prisma from '../../core/db/prisma.js'

export const orderSurpriseMeal = async (req, res) => {
    try {
        const { mood, budget, deliveryAddress, phone } = req.body

        if (!mood || !budget || !deliveryAddress) {
            return res.status(400).json({ message: 'Mood, budget, and deliveryAddress are required.' })
        }

        const maxPrice = parseFloat(budget)

        const availableItems = await prisma.menuItem.findMany({
            where: {
                isAvailable: true,
                isArchived: false,
                price: { lte: maxPrice },
                restaurant: { isOpen: true, isApproved: true },
            },
            include: { restaurant: true }
        })

        if (!availableItems.length) {
            return res.status(404).json({ message: `No meals found for mood '${mood}' under ₹${maxPrice}.` })
        }

        let matchingItems = availableItems.filter(item =>
            item.moodTags.some(tag => tag.toLowerCase().includes(mood.toLowerCase())) ||
            item.category?.toLowerCase().includes(mood.toLowerCase()) ||
            item.name.toLowerCase().includes(mood.toLowerCase())
        )

        if (!matchingItems.length) {
            matchingItems = availableItems
        }

        const selectedItem = matchingItems[Math.floor(Math.random() * matchingItems.length)]
        const restaurant = selectedItem.restaurant

        const order = await prisma.order.create({
            data: {
                customerId: req.user.id,
                restaurantId: restaurant.id,
                deliveryAddress,
                totalAmount: selectedItem.price,
                paymentStatus: 'pending',
                status: 'placed',
                orderItems: { create: [{ menuItemId: selectedItem.id, quantity: 1, unitPrice: selectedItem.price }] },
            },
            include: {
                orderItems: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
                restaurant: { select: { name: true } },
            },
        })

        await prisma.sealVerification.create({ data: { orderId: order.id } })
        req.io?.emit('NEW_ORDER', { orderId: order.id, restaurantId: restaurant.id })

        res.status(201).json({
            message: 'Surprise meal ordered successfully!', order, surpriseItem: selectedItem
        })
    } catch (err) { res.status(500).json({ message: 'Failed to place surprise order' }) }
}
