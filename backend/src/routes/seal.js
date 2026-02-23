import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { authenticate } from '../middlewares/auth.js'

const router = Router()
const prisma = new PrismaClient()
const upload = multer({ storage: multer.memoryStorage() })

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (err, result) => err ? reject(err) : resolve(result.secure_url)
        ).end(buffer)
    })
}

// Ensure SealVerification record exists for an order
const ensureSealRecord = async (orderId) => {
    let record = await prisma.sealVerification.findUnique({ where: { orderId } })
    if (!record) {
        record = await prisma.sealVerification.create({ data: { orderId } })
    }
    return record
}

// POST /api/seal/:orderId/dispatch  — Restaurant uploads dispatch photo
router.post('/:orderId/dispatch', authenticate, upload.single('photo'), async (req, res) => {
    try {
        const { orderId } = req.params
        if (!req.file) return res.status(400).json({ message: 'No photo uploaded' })

        const photoUrl = await uploadToCloudinary(req.file.buffer, `seal/${orderId}`)
        await ensureSealRecord(orderId)
        const record = await prisma.sealVerification.update({
            where: { orderId },
            data: { dispatchPhotoUrl: photoUrl },
        })

        // Emit socket event for admin audit log
        req.io?.emit('SEAL_DISPATCHED', { orderId, photoUrl })

        res.json({ message: 'Dispatch photo saved', photoUrl, record })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Upload failed' })
    }
})

// POST /api/seal/:orderId/pickup  — Delivery partner uploads pickup photo
router.post('/:orderId/pickup', authenticate, upload.single('photo'), async (req, res) => {
    try {
        const { orderId } = req.params
        if (!req.file) return res.status(400).json({ message: 'No photo uploaded' })

        const photoUrl = await uploadToCloudinary(req.file.buffer, `seal/${orderId}`)
        await ensureSealRecord(orderId)
        const record = await prisma.sealVerification.update({
            where: { orderId },
            data: { pickupPhotoUrl: photoUrl },
        })

        req.io?.emit('SEAL_PICKUP_PHOTO', { orderId, photoUrl })
        res.json({ message: 'Pickup photo saved', photoUrl, record })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Upload failed' })
    }
})

// POST /api/seal/:orderId/customer  — Customer uploads received photo
router.post('/:orderId/customer', authenticate, upload.single('photo'), async (req, res) => {
    try {
        const { orderId } = req.params
        if (!req.file) return res.status(400).json({ message: 'No photo uploaded' })

        const photoUrl = await uploadToCloudinary(req.file.buffer, `seal/${orderId}`)
        await ensureSealRecord(orderId)
        const record = await prisma.sealVerification.update({
            where: { orderId },
            data: { customerPhotoUrl: photoUrl },
        })

        res.json({ message: 'Customer photo saved', photoUrl, record })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Upload failed' })
    }
})

// GET /api/seal/:orderId/compare  — Returns all photos for side-by-side display
router.get('/:orderId/compare', authenticate, async (req, res) => {
    try {
        const { orderId } = req.params
        const record = await prisma.sealVerification.findUnique({ where: { orderId } })
        if (!record) return res.status(404).json({ message: 'No seal record found' })
        res.json({
            dispatch_photo_url: record.dispatchPhotoUrl,
            pickup_photo_url: record.pickupPhotoUrl,
            customer_photo_url: record.customerPhotoUrl,
            verdict: record.customerVerdict,
            dispute_raised: record.disputeRaised,
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/seal/:orderId/dispute  — Customer submits verdict and raises dispute if needed
router.post('/:orderId/dispute', authenticate, async (req, res) => {
    try {
        const { orderId } = req.params
        const { verdict } = req.body // 'intact' | 'suspicious' | 'tampered'

        const disputeRaised = verdict === 'suspicious' || verdict === 'tampered'
        const record = await prisma.sealVerification.update({
            where: { orderId },
            data: {
                customerVerdict: verdict,
                disputeRaised,
            },
        })

        // Socket event
        if (disputeRaised) {
            req.io?.emit('SEAL_DISPUTE', { orderId, verdict })
        } else {
            req.io?.emit('SEAL_VERDICT', { orderId, verdict })
        }

        res.json({ message: 'Verdict recorded', record })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

export default router
