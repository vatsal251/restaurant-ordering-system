import jwt from 'jsonwebtoken'

export const authenticate = (req, res, next) => {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' })
    try {
        const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET)
        req.user = decoded
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
