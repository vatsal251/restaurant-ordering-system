import prisma from '../../core/db/prisma.js'

export const getAddresses = async (req, res) => {
    try {
        const addresses = await prisma.address.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        })
        res.json(addresses)
    } catch (err) { res.status(500).json({ message: 'Server error' }) }
}

export const createAddress = async (req, res) => {
    try {
        const { type, street, city, state, zip, lat, lng, isDefault } = req.body
        const address = await prisma.address.create({
            data: {
                userId: req.user.id, type: type || 'other', street, city, state, zip, lat, lng, isDefault: isDefault || false
            }
        })

        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: req.user.id, id: { not: address.id } },
                data: { isDefault: false }
            })
        }
        res.status(201).json(address)
    } catch (err) { res.status(500).json({ message: 'Server error' }) }
}

export const deleteAddress = async (req, res) => {
    try {
        const address = await prisma.address.findUnique({ where: { id: req.params.id } })
        if (!address) return res.status(404).json({ message: 'Address not found' })
        if (address.userId !== req.user.id) return res.status(403).json({ message: 'Unauthorized' })

        await prisma.address.delete({ where: { id: req.params.id } })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(500).json({ message: 'Server error' }) }
}
