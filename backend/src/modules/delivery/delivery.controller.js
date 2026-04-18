import prisma from '../../core/db/prisma.js'

export const getEarnings = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } })

        const deliveredOrders = await prisma.order.count({
            where: { deliveryPartnerId: req.user.id, status: 'delivered' }
        })

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todayAggr = await prisma.order.aggregate({
            where: { deliveryPartnerId: req.user.id, status: 'delivered', updatedAt: { gte: today } },
            _sum: { tipAmount: true }
        })
        const todayTips = todayAggr._sum.tipAmount || 0
        const todayDeliveries = await prisma.order.count({
            where: { deliveryPartnerId: req.user.id, status: 'delivered', updatedAt: { gte: today } }
        })
        const todayEarnings = (todayDeliveries * 50) + todayTips

        res.json({
            totalEarnings: user.earnings,
            todayEarnings: todayEarnings,
            deliveriesCompleted: deliveredOrders
        })
    } catch (err) { res.status(500).json({ message: 'Server error' }) }
}

export const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body
        const activeOrder = await prisma.order.findFirst({
            where: { deliveryPartnerId: req.user.id, status: { in: ['ready_for_pickup', 'picked_up'] } }
        })

        if (activeOrder) {
            await prisma.deliveryTracking.create({
                data: { orderId: activeOrder.id, lat, lng }
            })
            // Emit to customer tracking socket
            req.io?.to(`order:${activeOrder.id}`).emit('LOCATION_UPDATE', { lat, lng })
            req.io?.emit('LOCATION_UPDATE', { lat, lng })
        }
        res.json({ success: true })
    } catch (err) { res.status(500).json({ message: 'Server error' }) }
}
