import { Router } from 'express'
import { authenticate, requireRole } from '../../core/middlewares/auth.js'
import * as usersController from './users.controller.js'

const router = Router()

router.put('/profile', authenticate, requireRole('customer'), usersController.updateProfile)
router.get('/favorites', authenticate, requireRole('customer'), usersController.getFavorites)
router.post('/favorites', authenticate, requireRole('customer'), usersController.addFavorite)
router.delete('/favorites/:restaurantId', authenticate, requireRole('customer'), usersController.removeFavorite)

export default router
