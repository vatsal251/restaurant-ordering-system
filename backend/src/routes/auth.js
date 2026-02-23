import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

const generateToken = (user) =>
    jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, role, restaurantName, restaurantAddress } = req.body
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Missing required fields' })
        }
        const exists = await prisma.user.findUnique({ where: { email } })
        if (exists) return res.status(409).json({ message: 'Email already registered' })

        const passwordHash = await bcrypt.hash(password, 12)

        // Start a transaction if it's a restaurant owner so we create the Restaurant record too
        let user
        if (role === 'restaurant_owner') {
            if (!restaurantName || !restaurantAddress) {
                return res.status(400).json({ message: 'Restaurant name and address required' })
            }
            user = await prisma.$transaction(async (tx) => {
                const u = await tx.user.create({
                    data: { name, email, phone, passwordHash, role }
                })
                await tx.restaurant.create({
                    data: { ownerId: u.id, name: restaurantName, address: restaurantAddress }
                })
                return u
            })
        } else {
            user = await prisma.user.create({
                data: { name, email, phone, passwordHash, role }
            })
        }

        const token = generateToken(user)
        const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role }
        res.status(201).json({ user: safeUser, token })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }
        if (user.isBlocked) return res.status(403).json({ message: 'Account has been blocked' })
        if (role && user.role !== role) {
            return res.status(403).json({ message: 'Access denied for this portal' })
        }
        const token = generateToken(user)
        const { passwordHash: _, ...safeUser } = user
        res.json({ user: safeUser, token })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/auth/admin-login
router.post('/admin-login', (req, res) => {
    const { adminId, secretKey } = req.body
    const envAdminId = process.env.ADMIN_ID
    const envAdminSecret = process.env.ADMIN_SECRET

    if (!envAdminId || !envAdminSecret) {
        return res.status(500).json({ message: 'Admin credentials not configured' })
    }
    if (adminId !== envAdminId || secretKey !== envAdminSecret) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
        { id: 'admin', role: 'admin', name: 'Admin' },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    )
    res.json({ user: { id: 'admin', name: 'Admin', role: 'admin' }, token })
})

export default router
