import { Router } from 'express'
import { authenticate, requireRole } from '../../core/middlewares/auth.js'
import * as ac from './ai.controller.js'

const router = Router()

router.post('/assistant', authenticate, requireRole('customer'), ac.askAssistant)

export default router
