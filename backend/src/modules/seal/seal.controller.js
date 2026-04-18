import prisma from '../../core/db/prisma.js'

const getFileUrl = (filename) => {
    return `http://localhost:${process.env.PORT || 3000}/uploads/${filename}`
}

const ensureSealRecord = async (orderId) => {
    let record = await prisma.sealVerification.findUnique({ where: { orderId } })
    if (!record) {
        record = await prisma.sealVerification.create({ data: { orderId } })
    }
    return record
}

export const dispatchSeal = async (req, res) => {
    try {
        const { orderId } = req.params
        if (!req.file) return res.status(400).json({ message: 'No photo uploaded' })

        const photoUrl = getFileUrl(req.file.filename)
        await ensureSealRecord(orderId)
        const record = await prisma.sealVerification.update({
            where: { orderId }, data: { dispatchPhotoUrl: photoUrl },
        })

        req.io?.emit('SEAL_DISPATCHED', { orderId, photoUrl })
        res.json({ message: 'Dispatch photo saved', photoUrl, record })
    } catch (err) { res.status(500).json({ message: 'Upload failed' }) }
}

export const pickupSeal = async (req, res) => {
    try {
        const { orderId } = req.params
        if (!req.file) return res.status(400).json({ message: 'No photo uploaded' })

        const photoUrl = getFileUrl(req.file.filename)
        await ensureSealRecord(orderId)
        const record = await prisma.sealVerification.update({
            where: { orderId }, data: { pickupPhotoUrl: photoUrl },
        })

        req.io?.emit('SEAL_PICKUP_PHOTO', { orderId, photoUrl })
        res.json({ message: 'Pickup photo saved', photoUrl, record })
    } catch (err) { res.status(500).json({ message: 'Upload failed' }) }
}

export const customerSeal = async (req, res) => {
    try {
        const { orderId } = req.params
        if (!req.file) return res.status(400).json({ message: 'No photo uploaded' })

        const photoUrl = getFileUrl(req.file.filename)
        await ensureSealRecord(orderId)
        const record = await prisma.sealVerification.update({
            where: { orderId }, data: { customerPhotoUrl: photoUrl },
        })

        res.json({ message: 'Customer photo saved', photoUrl, record })
    } catch (err) { res.status(500).json({ message: 'Upload failed' }) }
}

export const compareSeal = async (req, res) => {
    try {
        const { orderId } = req.params
        const record = await prisma.sealVerification.findUnique({ where: { orderId } })
        if (!record) return res.status(404).json({ message: 'No seal record found' })
        res.json({
            dispatch_photo_url: record.dispatchPhotoUrl, pickup_photo_url: record.pickupPhotoUrl,
            customer_photo_url: record.customerPhotoUrl, verdict: record.customerVerdict, dispute_raised: record.disputeRaised,
        })
    } catch (err) { res.status(500).json({ message: 'Server error' }) }
}

export const disputeSeal = async (req, res) => {
    try {
        const { orderId } = req.params
        const { verdict } = req.body

        const disputeRaised = verdict === 'suspicious' || verdict === 'tampered'
        const record = await prisma.sealVerification.update({
            where: { orderId }, data: { customerVerdict: verdict, disputeRaised },
        })

        if (disputeRaised) req.io?.emit('SEAL_DISPUTE', { orderId, verdict })
        else req.io?.emit('SEAL_VERDICT', { orderId, verdict })

        res.json({ message: 'Verdict recorded', record })
    } catch (err) { res.status(500).json({ message: 'Server error' }) }
}
