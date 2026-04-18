import prisma from '../../core/db/prisma.js'

// Helper
const getOwnerRestaurant = async (ownerId) => {
    const r = await prisma.restaurant.findUnique({ where: { ownerId } })
    if (!r) throw Object.assign(
        new Error('Restaurant profile not found for your account.'), { status: 404 }
    )
    return r
}

// ─────────────────────────────────────────────────────────────────
// OWNER ROUTES
// ─────────────────────────────────────────────────────────────────

export const getOwnerMenu = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const items = await prisma.menuItem.findMany({
            where: { restaurantId: r.id, isArchived: false },
            include: { addOns: true },
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        })
        res.json(items)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const createOwnerMenu = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const { name, description, price, category, isAvailable, isVeg, imageUrl } = req.body
        if (!name || !price) return res.status(400).json({ message: 'Name and price are required' })
        const item = await prisma.menuItem.create({
            data: {
                restaurantId: r.id,
                name,
                description,
                price: parseFloat(price),
                category: category || null,
                isAvailable: isAvailable ?? true,
                isVeg: isVeg ?? true,
                imageUrl
            }
        })
        res.status(201).json(item)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const updateOwnerMenu = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const { name, description, price, category, isAvailable, isVeg, imageUrl } = req.body
        const existing = await prisma.menuItem.findFirst({ where: { id: req.params.itemId, restaurantId: r.id, isArchived: false } })
        if (!existing) return res.status(404).json({ message: 'Item not found' })
        const item = await prisma.menuItem.update({
            where: { id: req.params.itemId },
            data: { name, description, price: parseFloat(price), category: category || null, isAvailable, isVeg, imageUrl }
        })
        res.json(item)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const getOwnerAddons = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const addons = await prisma.menuItemAddon.findMany({
            where: { menuItem: { restaurantId: r.id } },
            orderBy: { createdAt: 'desc' }
        })
        res.json(addons)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const createOwnerAddon = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const { menuItemId, name, price, isAvailable } = req.body
        const item = await prisma.menuItem.findFirst({ where: { id: menuItemId, restaurantId: r.id } })
        if (!item) return res.status(404).json({ message: 'Menu item not found' })

        const addon = await prisma.menuItemAddon.create({
            data: {
                menuItemId,
                name,
                price: parseFloat(price) || 0,
                isAvailable: isAvailable ?? true
            }
        })
        res.status(201).json(addon)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const removeOwnerAddon = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const addon = await prisma.menuItemAddon.findFirst({
            where: { id: req.params.addonId, menuItem: { restaurantId: r.id } }
        })
        if (!addon) return res.status(404).json({ message: 'Addon not found' })
        
        await prisma.menuItemAddon.delete({ where: { id: addon.id } })
        res.json({ message: 'Addon removed' })
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const deleteOwnerMenu = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const existing = await prisma.menuItem.findFirst({ where: { id: req.params.itemId, restaurantId: r.id, isArchived: false } })
        if (!existing) return res.status(404).json({ message: 'Item not found' })
        await prisma.menuItem.delete({ where: { id: req.params.itemId } })
        res.json({ message: 'Deleted' })
    } catch (err) {
        if (err.code === 'P2003') {
            await prisma.menuItem.update({
                where: { id: req.params.itemId },
                data: { isArchived: true, isAvailable: false }
            })
            return res.json({ message: 'Item archived because it has past orders.' })
        }
        res.status(err.status || 500).json({ message: err.message })
    }
}

export const getOwnerProfile = async (req, res) => {
    try {
        const r = await prisma.restaurant.findUnique({
            where: { ownerId: req.user.id },
            include: { owner: { select: { name: true, email: true, phone: true } } }
        })
        res.json(r)
    } catch (err) { res.status(500).json({ message: err.message }) }
}

export const updateOwnerProfile = async (req, res) => {
    try {
        const { name, address, cuisineType, isOpen, costForTwo, deliveryTime, isVegOnly, fssaiLicense, imageUrl } = req.body
        const r = await prisma.restaurant.update({
            where: { ownerId: req.user.id },
            data: {
                name, address, cuisineType, isOpen, imageUrl,
                costForTwo: costForTwo ? parseInt(costForTwo) : undefined,
                deliveryTime: deliveryTime ? parseInt(deliveryTime) : undefined,
                isVegOnly: isVegOnly !== undefined ? isVegOnly : undefined,
                fssaiLicense
            }
        })
        res.json(r)
    } catch (err) { res.status(500).json({ message: err.message }) }
}

export const updateOwnerInventory = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const { menuItemId, change, reason, setUnlimited } = req.body
        
        const item = await prisma.menuItem.findFirst({ where: { id: menuItemId, restaurantId: r.id } })
        if (!item) return res.status(404).json({ message: 'Menu item not found' })

        let newStock = null
        if (!setUnlimited) {
            newStock = (item.stockCount || 0) + parseInt(change)
            if (newStock < 0) newStock = 0
        }

        await prisma.$transaction([
            prisma.menuItem.update({
                where: { id: item.id },
                data: { stockCount: newStock }
            }),
            prisma.inventoryLog.create({
                data: {
                    menuItemId,
                    change: setUnlimited ? 0 : parseInt(change),
                    reason: setUnlimited ? 'Set to Unlimited' : reason || 'Manual Adjustment'
                }
            })
        ])

        res.json({ message: 'Inventory updated successfully', newStock })
    } catch (err) { res.status(500).json({ message: err.message }) }
}

export const getOwnerInventoryLogs = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const logs = await prisma.inventoryLog.findMany({
            where: { menuItem: { restaurantId: r.id } },
            include: { menuItem: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50
        })
        res.json(logs)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const getOwnerAnalytics = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const totalOrders = await prisma.order.count({ where: { restaurantId: r.id } })
        const revenueAgg = await prisma.order.aggregate({
            where: { restaurantId: r.id, status: 'delivered' },
            _sum: { totalAmount: true }
        })
        const totalRevenue = revenueAgg._sum.totalAmount || 0
        res.json({ totalOrders, totalRevenue })
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const getOwnerPromos = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const promos = await prisma.promoCode.findMany({ where: { restaurantId: r.id }, orderBy: { createdAt: 'desc' } })
        res.json(promos)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const getOwnerCampaigns = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const campaigns = await prisma.campaign.findMany({ where: { restaurantId: r.id }, orderBy: { createdAt: 'desc' } })
        res.json(campaigns)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const createOwnerCampaign = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const { title, message, targetAudience } = req.body
        const campaign = await prisma.campaign.create({
            data: {
                restaurantId: r.id,
                title,
                message,
                targetAudience: targetAudience || 'all_past_customers',
                status: 'sent', // Simulating instant send
                sentAt: new Date()
            }
        })

        // Simulate sending in-app notifications to past customers
        const pastOrders = await prisma.order.findMany({
            where: { restaurantId: r.id },
            select: { customerId: true },
            distinct: ['customerId']
        })

        const notifications = pastOrders.map(order => ({
            userId: order.customerId,
            type: 'campaign',
            message: `From ${r.name}: ${title} - ${message}`
        }))

        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications })
            req.io?.emit('CAMPAIGN_BROADCAST', { restaurantId: r.id, count: notifications.length })
        }

        res.status(201).json(campaign)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const createOwnerPromo = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const { code, discount, type, validTo, maxUses } = req.body
        const promo = await prisma.promoCode.create({
            data: {
                code: code.toUpperCase(),
                discount: parseFloat(discount),
                type: type || 'percentage',
                validTo: new Date(validTo),
                maxUses: maxUses ? parseInt(maxUses) : null,
                restaurantId: r.id
            }
        })
        res.status(201).json(promo)
    } catch (err) {
        if (err.code === 'P2002') return res.status(400).json({ message: 'Promo code already exists' })
        res.status(err.status || 500).json({ message: err.message })
    }
}

export const deleteOwnerPromo = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const existing = await prisma.promoCode.findFirst({ where: { id: req.params.id, restaurantId: r.id } })
        if (!existing) return res.status(404).json({ message: 'Promo not found' })
        await prisma.promoCode.delete({ where: { id: req.params.id } })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const getOwnerReviews = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const reviews = await prisma.review.findMany({
            where: { restaurantId: r.id },
            include: {
                customer: { select: { name: true } },
                order: { select: { id: true, createdAt: true, totalAmount: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(reviews)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

export const getOwnerOrders = async (req, res) => {
    try {
        const r = await getOwnerRestaurant(req.user.id)
        const orders = await prisma.order.findMany({
            where: { restaurantId: r.id },
            include: {
                customer: { select: { name: true, phone: true } },
                orderItems: { include: { menuItem: { select: { name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(orders)
    } catch (err) { res.status(err.status || 500).json({ message: err.message }) }
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────

export const getRestaurants = async (req, res) => {
    try {
        const { cuisine, search, filterVeg, minRating, sort } = req.query
        let orderByList = []
        if (sort === 'rating') orderByList.push({ rating: 'desc' })
        else if (sort === 'price_asc') orderByList.push({ costForTwo: 'asc' })
        else if (sort === 'price_desc') orderByList.push({ costForTwo: 'desc' })
        else orderByList.push({ isPromoted: 'desc' }) // Default

        const restaurants = await prisma.restaurant.findMany({
            where: {
                isApproved: true,
                ...(cuisine && cuisine !== 'All' && { cuisineType: cuisine }),
                ...(search && { name: { contains: search, mode: 'insensitive' } }),
                ...(filterVeg === 'true' && { isVegOnly: true }),
                ...(minRating && { rating: { gte: parseFloat(minRating) } }),
            },
            select: {
                id: true, name: true, cuisineType: true, rating: true, isOpen: true, imageUrl: true, address: true,
                isPromoted: true, costForTwo: true, deliveryTime: true, isVegOnly: true, fssaiLicense: true
            },
            orderBy: orderByList.length ? orderByList : undefined
        })
        res.json(restaurants)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
}

export const getRestaurantById = async (req, res) => {
    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, name: true, cuisineType: true, rating: true, isOpen: true, isApproved: true, imageUrl: true, address: true,
                isPromoted: true, costForTwo: true, deliveryTime: true, isVegOnly: true, fssaiLicense: true,
                reviews: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true, rating: true, comment: true, createdAt: true,
                        customer: { select: { name: true } }
                    }
                }
            }
        })
        if (!restaurant || !restaurant.isApproved) return res.status(404).json({ message: 'Restaurant not found or is suspended' })
        res.json(restaurant)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
}

export const getRestaurantMenu = async (req, res) => {
    try {
        const items = await prisma.menuItem.findMany({
            where: { restaurantId: req.params.id, isAvailable: true, isArchived: false },
            orderBy: [{ category: 'asc' }, { name: 'asc' }]
        })
        res.json(items)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
}
