import jwt from 'jsonwebtoken'
import prisma from '../db/prisma.js'

export const authenticate = async (req, res, next) => {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' })
    try {
        const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET)

        if (decoded.role === 'admin') {
            req.user = decoded
            return next()
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.id } })
        if (!user || user.isBlocked) {
            return res.status(401).json({ message: 'Session expired or user not found. Please log in again.' })
        }

        req.user = user // Assign full user to req
        next()
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' })
    }
}

export const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' })
    }
    next()
}
