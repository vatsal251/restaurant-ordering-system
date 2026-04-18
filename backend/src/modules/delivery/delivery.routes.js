import { Router } from 'express'
import { authenticate, requireRole } from '../../core/middlewares/auth.js'
import * as dc from './delivery.controller.js'

const router = Router()

router.use(authenticate, requireRole('delivery_partner'))

router.get('/earnings', dc.getEarnings)
router.post('/location', dc.updateLocation)

export default router
