import { Router } from 'express'
import { authenticate, requireRole } from '../../core/middlewares/auth.js'
import * as sc from './surprise.controller.js'

const router = Router()

router.post('/', authenticate, requireRole('customer'), sc.orderSurpriseMeal)

export default router
