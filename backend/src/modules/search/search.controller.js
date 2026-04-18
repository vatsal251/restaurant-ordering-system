import prisma from '../../core/db/prisma.js'

export const globalSearch = async (req, res) => {
    try {
        const { q } = req.query
        if (!q || typeof q !== 'string') {
            return res.json({ restaurants: [], items: [] })
        }

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
}
