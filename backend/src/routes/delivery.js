import { Router } from 'express'
const router = Router()

// Stub routes — to be implemented in Phase 2
router.get('/available-orders', (_req, res) => res.json({ message: 'Available orders — coming soon' }))
router.post('/orders/:id/accept', (_req, res) => res.json({ message: 'Accept order — coming soon' }))
router.patch('/orders/:id/status', (_req, res) => res.json({ message: 'Update status — coming soon' }))
router.post('/location', (_req, res) => res.json({ message: 'Location update — coming soon' }))

export default router
