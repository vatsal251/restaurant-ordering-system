import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/ping', (req, res) => res.json({ message: 'group-orders router is working' }))

// POST /api/group-orders
// Create a new group order session
router.post('/', authenticate, async (req, res) => {
    try {
        const groupOrder = await prisma.groupOrder.create({
            data: {
                hostId: req.user.id,
                status: 'active'
            },
            include: {
                host: { select: { name: true } }
            }
        })
        res.status(201).json(groupOrder)
    } catch (error) {
        console.error('Group order creation error:', error)
        res.status(500).json({ message: 'Failed to create group order' })
    }
})

// GET /api/group-orders/:id
// Get details of a group order
router.get('/:id', async (req, res) => {
    try {
        const groupOrder = await prisma.groupOrder.findUnique({
            where: { id: req.params.id },
            include: {
                host: { select: { name: true } },
                items: { include: { menuItem: { select: { name: true, price: true, restaurant: { select: { id: true, name: true, costForTwo: true } } } } } }
            }
        })
        if (!groupOrder) return res.status(404).json({ message: 'Group order not found' })
        res.json(groupOrder)
    } catch (error) {
        console.error('Group order details fetch error:', error)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/group-orders/:id/items
// Add an item to the group order
router.post('/:id/items', async (req, res) => {
    try {
        const { menuItemId, participantName, quantity, price } = req.body
        const groupOrderId = req.params.id

        // Lock check
        const groupOrder = await prisma.groupOrder.findUnique({ where: { id: groupOrderId } })
        if (!groupOrder || groupOrder.status !== 'active') {
            return res.status(400).json({ message: 'This group order is no longer accepting items' })
        }

        const item = await prisma.groupOrderItem.create({
            data: {
                groupOrderId,
                menuItemId,
                participantName,
                quantity,
                price
            },
            include: {
                menuItem: { select: { name: true, price: true } }
            }
        })

        // Broadcast to all participants using Socket.io
        req.io?.to(`group_order:${groupOrderId}`).emit('GROUP_CART_UPDATED', { type: 'ADD', item })

        res.status(201).json(item)
    } catch (error) {
        res.status(500).json({ message: 'Failed to add item' })
    }
})

// DELETE /api/group-orders/:id/items/:itemId
// Remove an item
router.delete('/:id/items/:itemId', async (req, res) => {
    try {
        const groupOrderId = req.params.id
        const itemId = req.params.itemId

        const groupOrder = await prisma.groupOrder.findUnique({ where: { id: groupOrderId } })
        if (!groupOrder || groupOrder.status !== 'active') {
            return res.status(400).json({ message: 'This group order is locked' })
        }

        await prisma.groupOrderItem.delete({ where: { id: itemId } })

        req.io?.to(`group_order:${groupOrderId}`).emit('GROUP_CART_UPDATED', { type: 'REMOVE', itemId })

        res.json({ message: 'Item removed' })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/group-orders/:id/lock
// Host locks the order to prevent new items
router.post('/:id/lock', authenticate, async (req, res) => {
    try {
        const groupOrderId = req.params.id

        const existing = await prisma.groupOrder.findUnique({ where: { id: groupOrderId } })
        if (existing.hostId !== req.user.id) return res.status(403).json({ message: 'Only the host can lock the order' })

        const groupOrder = await prisma.groupOrder.update({
            where: { id: groupOrderId },
            data: { status: 'locked' }
        })

        req.io?.to(`group_order:${groupOrderId}`).emit('GROUP_ORDER_LOCKED')
        res.json(groupOrder)
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/group-orders/:id/checkout
// Convert GroupOrder into standard Order
router.post('/:id/checkout', authenticate, async (req, res) => {
    try {
        const groupOrderId = req.params.id
        const { deliveryAddress, totalAmount, paymentMethod } = req.body

        const groupOrder = await prisma.groupOrder.findUnique({
            where: { id: groupOrderId },
            include: { items: { include: { menuItem: true } } }
        })

        if (!groupOrder) return res.status(404).json({ message: 'Group order not found' })
        if (groupOrder.hostId !== req.user.id) return res.status(403).json({ message: 'Only host can checkout' })

        // Group items by restaurant
        const itemsByRestaurant = {}
        for (const item of groupOrder.items) {
            const rId = item.menuItem.restaurantId
            if (!itemsByRestaurant[rId]) itemsByRestaurant[rId] = []
            itemsByRestaurant[rId].push(item)
        }

        const createdOrders = []

        // Create standard orders for each restaurant
        for (const [rId, items] of Object.entries(itemsByRestaurant)) {
            const itemsSubtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0)
            const orderTotal = (itemsSubtotal * 1.05) + 40 // Simulated 5% tax + $40 delivery

            const order = await prisma.order.create({
                data: {
                    customerId: groupOrder.hostId,
                    restaurantId: rId,
                    deliveryAddress,
                    totalAmount: orderTotal,
                    paymentStatus: 'pending',
                    status: 'placed',
                    orderItems: {
                        create: items.map(item => ({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            unitPrice: item.price
                        }))
                    }
                }
            })

            // Placeholder seal
            await prisma.sealVerification.create({ data: { orderId: order.id } })

            createdOrders.push(order)
            req.io?.emit('NEW_ORDER', { orderId: order.id, restaurantId: rId })
        }

        // Mark group order as completed
        await prisma.groupOrder.update({
            where: { id: groupOrderId },
            data: { status: 'completed' }
        })

        req.io?.to(`group_order:${groupOrderId}`).emit('GROUP_ORDER_COMPLETED', { orderIds: createdOrders.map(o => o.id) })

        res.status(201).json({ orders: createdOrders })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Checkout failed' })
    }
})

export default router
