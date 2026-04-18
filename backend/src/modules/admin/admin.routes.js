import { Router } from 'express'
import { authenticate, requireRole } from '../../core/middlewares/auth.js'
import * as ac from './admin.controller.js'

const router = Router()

// All admin routes require admin role
router.use(authenticate, requireRole('admin'))

router.get('/stats', ac.getStats)

router.get('/users', ac.getUsers)
router.patch('/users/:id', ac.updateUser)

router.get('/restaurants', ac.getRestaurants)
router.patch('/restaurants/:id/approve', ac.approveRestaurant)

router.get('/promos', ac.getPromos)
router.post('/promos', ac.createPromo)
router.delete('/promos/:id', ac.deletePromo)

router.get('/orders', ac.getOrders)

router.get('/disputes', ac.getDisputes)
router.patch('/disputes/:orderId/resolve', ac.resolveDispute)

router.get('/seal-audits', ac.getSealAudits)

export default router
